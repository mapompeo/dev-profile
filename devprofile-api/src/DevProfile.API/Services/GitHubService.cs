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
        var totalCommits = await EstimateTotalCommitsAsync(username, repos, cancellationToken);

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
        var cacheKey = $"github:v4:languages:{username.ToLowerInvariant()}";
        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<LanguageUsageDto>? cachedLanguages) && cachedLanguages is not null)
        {
            return cachedLanguages;
        }

        var repos = await GetReposAsync(username, cancellationToken);
        var languageBytes = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
        var reposByLanguage = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var repo in repos.Where(r => !r.IsFork))
        {
            using var response = await _httpClient.GetAsync($"repos/{repo.Owner.Login}/{repo.Name}/languages", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch languages for repo {Owner}/{Repo}. Status: {StatusCode}",
                    repo.Owner.Login,
                    repo.Name,
                    response.StatusCode);
                continue;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var map = await JsonSerializer.DeserializeAsync<Dictionary<string, long>>(stream, JsonOptions, cancellationToken)
                      ?? new Dictionary<string, long>();

            foreach (var entry in map)
            {
                var language = entry.Key;
                var bytes = entry.Value;

                if (!languageBytes.TryAdd(language, bytes))
                {
                    languageBytes[language] += bytes;
                }

                if (!reposByLanguage.TryAdd(language, 1))
                {
                    reposByLanguage[language] += 1;
                }
            }
        }

        var totalBytes = Math.Max(1L, languageBytes.Values.Sum());
        var result = languageBytes
            .OrderByDescending(x => reposByLanguage.GetValueOrDefault(x.Key))
            .Select(x => new LanguageUsageDto
            {
                Name = x.Key,
                Percentage = Math.Round((x.Value / (double)totalBytes) * 100, 2),
                Repositories = reposByLanguage.GetValueOrDefault(x.Key)
            })
            .ToList();

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

        var repos = new List<GitHubRepoResponse>();
        var page = 1;

        while (true)
        {
            using var response = await _httpClient.GetAsync($"users/{username}/repos?per_page=100&page={page}&sort=updated", cancellationToken);
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

    private async Task<int> EstimateTotalCommitsAsync(string username, IReadOnlyList<GitHubRepoResponse> repos, CancellationToken cancellationToken)
    {
        var candidateRepos = repos.Where(r => !r.IsFork).Take(20).ToList();
        if (candidateRepos.Count == 0)
        {
            return 0;
        }

        var totalCommits = 0;
        foreach (var repo in candidateRepos)
        {
            using var response = await _httpClient.GetAsync(
                $"repos/{repo.Owner.Login}/{repo.Name}/commits?author={username}&per_page=1",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                continue;
            }

            if (response.Headers.TryGetValues("Link", out var values))
            {
                var link = values.FirstOrDefault() ?? string.Empty;
                var lastPage = TryReadLastPage(link);
                if (lastPage > 0)
                {
                    totalCommits += lastPage;
                    continue;
                }
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var commits = await JsonSerializer.DeserializeAsync<List<object>>(stream, JsonOptions, cancellationToken)
                          ?? new List<object>();
            totalCommits += commits.Count;
        }

        if (repos.Count > candidateRepos.Count && totalCommits > 0)
        {
            var scaleFactor = repos.Count / (double)candidateRepos.Count;
            totalCommits = (int)Math.Round(totalCommits * scaleFactor);
        }

        return totalCommits;
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
