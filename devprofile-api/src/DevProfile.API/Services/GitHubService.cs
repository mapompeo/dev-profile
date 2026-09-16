using System.Net;
using System.Text.Json;
using DevProfile.API.Models.DTOs;
using DevProfile.API.Services.Internal;
using DevProfile.API.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace DevProfile.API.Services;

public sealed class GitHubService : IGitHubService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<GitHubService> _logger;

    public GitHubService(HttpClient httpClient, IMemoryCache cache, ILogger<GitHubService> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<GitHubProfileDto> GetProfileAsync(string username, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"github:profile:{username.ToLowerInvariant()}";
        if (_cache.TryGetValue(cacheKey, out GitHubProfileDto? cachedProfile) && cachedProfile is not null)
        {
            return cachedProfile;
        }

        var user = await GetUserAsync(username, cancellationToken);
        var repos = await GetReposAsync(username, cancellationToken);

        var totalStars = repos.Sum(r => r.StargazersCount);
        var totalForks = repos.Sum(r => r.ForksCount);
        var totalCommits = await GetTotalCommitsAsync(username, repos, cancellationToken);

        var profile = new GitHubProfileDto
        {
            Username = user.Login,
            Name = user.Name,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio,
            Followers = user.Followers,
            Following = user.Following,
            PublicRepositories = repos.Count,
            TotalStars = totalStars,
            TotalForks = totalForks,
            TotalCommits = totalCommits,
            Company = user.Company,
            Location = user.Location,
            CreatedAt = user.CreatedAt
        };

        _cache.Set(cacheKey, profile, TimeSpan.FromMinutes(10));
        return profile;
    }

    public async Task<IReadOnlyList<LanguageUsageDto>> GetLanguageDistributionAsync(string username, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"github:v5:languages:{username.ToLowerInvariant()}";
        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<LanguageUsageDto>? cachedLanguages) && cachedLanguages is not null)
        {
            return cachedLanguages;
        }

        // A listagem de repositórios já traz a linguagem predominante de cada um, e
        // ela é o que a interface exibe ("por número de repositórios"). Antes havia
        // uma chamada a /languages por repositório: dezenas de requisições por
        // perfil, o que sozinho estourava o limite de 60/h de quem não usa token.
        var repos = await GetReposAsync(username, cancellationToken);
        var result = LanguageAggregator.Aggregate(repos);

        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
        return result;
    }

    private async Task<GitHubUserResponse> GetUserAsync(string username, CancellationToken cancellationToken)
    {
        using var response = await _httpClient.GetAsync($"users/{username}", cancellationToken);
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            throw new KeyNotFoundException($"GitHub user '{username}' not found.");
        }

        ThrowIfRateLimited(response);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var user = await JsonSerializer.DeserializeAsync<GitHubUserResponse>(stream, JsonOptions, cancellationToken);
        return user ?? throw new InvalidOperationException("Unable to deserialize GitHub user payload.");
    }

    private async Task<List<GitHubRepoResponse>> GetReposAsync(string username, CancellationToken cancellationToken)
    {
        var cacheKey = $"github:repos:{username.ToLowerInvariant()}";
        if (_cache.TryGetValue(cacheKey, out List<GitHubRepoResponse>? cachedRepos) && cachedRepos is not null)
        {
            return cachedRepos;
        }

        const int maxPages = 10; // caps at 1000 repos; protects against pathological accounts/bots
        var repos = new List<GitHubRepoResponse>();
        var page = 1;

        while (page <= maxPages)
        {
            using var response = await _httpClient.GetAsync($"users/{username}/repos?per_page=100&page={page}&sort=updated", cancellationToken);
            ThrowIfRateLimited(response);
            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var pageRepos = await JsonSerializer.DeserializeAsync<List<GitHubRepoResponse>>(stream, JsonOptions, cancellationToken)
                            ?? new List<GitHubRepoResponse>();

            if (pageRepos.Count == 0)
            {
                break;
            }

            repos.AddRange(pageRepos);
            page++;
        }

        _cache.Set(cacheKey, repos, TimeSpan.FromMinutes(10));
        return repos;
    }

    /// <summary>
    /// Total de commits do autor. A busca devolve o número real em uma requisição;
    /// se ela falhar (a Search API tem limite próprio, bem mais apertado), cai para
    /// uma amostragem curta em vez de devolver zero.
    /// </summary>
    private async Task<int> GetTotalCommitsAsync(string username, IReadOnlyList<GitHubRepoResponse> repos, CancellationToken cancellationToken)
    {
        var searched = await TrySearchCommitCountAsync(username, cancellationToken);
        if (searched is not null)
        {
            return searched.Value;
        }

        return await EstimateTotalCommitsAsync(username, repos, cancellationToken);
    }

    private async Task<int?> TrySearchCommitCountAsync(string username, CancellationToken cancellationToken)
    {
        try
        {
            // "user:" restringe aos repositórios do próprio perfil, que é o que o app
            // mede. Sem isso a busca conta todo commit do autor espalhado pelo GitHub,
            // inclusive em forks de terceiros: gaearon aparece com 1.121.664 commits no
            // escopo aberto e 1.959 no escopo certo.
            var query = Uri.EscapeDataString($"author:{username} user:{username}");
            using var response = await _httpClient.GetAsync(
                $"search/commits?q={query}&per_page=1",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                // Inclui o 403 de limite da busca: não derruba a análise inteira,
                // porque o plano B ainda consegue um número aproximado.
                _logger.LogInformation(
                    "Commit search unavailable for {Username} (status {StatusCode}); falling back to sampling.",
                    username,
                    response.StatusCode);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var payload = await JsonSerializer.DeserializeAsync<GitHubSearchCountResponse>(stream, JsonOptions, cancellationToken);
            return payload?.TotalCount;
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or TaskCanceledException)
        {
            _logger.LogInformation(ex, "Commit search failed for {Username}; falling back to sampling.", username);
            return null;
        }
    }

    private async Task<int> EstimateTotalCommitsAsync(string username, IReadOnlyList<GitHubRepoResponse> repos, CancellationToken cancellationToken)
    {
        var nonForkRepos = repos.Where(r => !r.IsFork).ToList();
        // Amostra curta de propósito: este caminho só roda quando a busca falhou, e
        // gastar trinta requisições aqui recriaria o problema que acabamos de tirar.
        var candidateRepos = nonForkRepos.Take(5).ToList();
        if (candidateRepos.Count == 0)
        {
            return 0;
        }

        var commitTasks = candidateRepos.Select(async repo =>
        {
            using var response = await _httpClient.GetAsync(
                $"repos/{repo.Owner.Login}/{repo.Name}/commits?author={username}&per_page=1",
                cancellationToken);

            ThrowIfRateLimited(response);
            if (!response.IsSuccessStatusCode)
                return 0;

            if (response.Headers.TryGetValues("Link", out var values))
            {
                var link = values.FirstOrDefault() ?? string.Empty;
                var lastPage = TryReadLastPage(link);
                if (lastPage > 0)
                    return lastPage;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var commits = await JsonSerializer.DeserializeAsync<List<object>>(stream, JsonOptions, cancellationToken)
                          ?? new List<object>();
            return commits.Count;
        });

        var commitCounts = await Task.WhenAll(commitTasks);
        var totalCommits = commitCounts.Sum();

        if (nonForkRepos.Count > candidateRepos.Count && totalCommits > 0)
        {
            // Cap the extrapolation: sampled repos are the most recently updated ones and tend to be
            // the most active, so scaling unbounded overestimates accounts with many small repos.
            var scaleFactor = Math.Min(3.0, nonForkRepos.Count / (double)candidateRepos.Count);
            totalCommits = (int)Math.Round(totalCommits * scaleFactor);
        }

        return totalCommits;
    }

    private static void ThrowIfRateLimited(HttpResponseMessage response)
    {
        // Primary rate limit: X-RateLimit-Remaining hits 0. Secondary/abuse rate limit: 403 with
        // a Retry-After header instead. Both surface as 403 or 429 depending on the endpoint.
        var isRateLimit = response.StatusCode == HttpStatusCode.TooManyRequests ||
            (response.StatusCode == HttpStatusCode.Forbidden &&
             (response.Headers.RetryAfter is not null ||
              (response.Headers.TryGetValues("X-RateLimit-Remaining", out var remaining) &&
               remaining.FirstOrDefault() == "0")));

        if (isRateLimit)
        {
            throw new GitHubRateLimitExceededException();
        }
    }

    private static int TryReadLastPage(string linkHeader)
    {
        const string marker = "&page=";
        var lastIndex = linkHeader.IndexOf("rel=\"last\"", StringComparison.OrdinalIgnoreCase);
        if (lastIndex < 0)
        {
            return 0;
        }

        var markerIndex = linkHeader.LastIndexOf(marker, lastIndex, StringComparison.OrdinalIgnoreCase);
        if (markerIndex < 0)
        {
            return 0;
        }

        markerIndex += marker.Length;
        var endIndex = linkHeader.IndexOf('>', markerIndex);
        if (endIndex < 0)
        {
            return 0;
        }

        var pageText = linkHeader[markerIndex..endIndex];
        return int.TryParse(pageText, out var page) ? page : 0;
    }
}
