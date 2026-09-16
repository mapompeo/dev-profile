using System.Text.RegularExpressions;
using DevProfile.API.Models.DTOs;
using DevProfile.API.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace DevProfile.API.Services;

/// <summary>
/// Lê o calendário de contribuições do perfil.
///
/// Esta é a única parte do app que não fala com api.github.com: o calendário não
/// existe na REST pública, só no HTML da página de perfil e na GraphQL, que exige
/// token. Como é uma página pública, ler o HTML é uma requisição que não consome
/// a cota de 60/h da API, e o app continua funcionando sem autenticação.
///
/// Se o formato do HTML mudar ou a página ficar indisponível, o calendário volta
/// vazio e quem consome simplesmente não mostra nada. Nenhuma análise quebra.
/// </summary>
public sealed partial class ContributionCalendarService : IContributionCalendarService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ContributionCalendarService> _logger;

    public ContributionCalendarService(HttpClient httpClient, IMemoryCache cache, ILogger<ContributionCalendarService> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
    }

    [GeneratedRegex("data-date=\"(?<date>\\d{4}-\\d{2}-\\d{2})\"[^>]*?data-level=\"(?<level>\\d)\"", RegexOptions.IgnoreCase)]
    private static partial Regex DayPattern();

    public async Task<ContributionCalendarDto> GetCalendarAsync(string username, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"github:contributions:{username.ToLowerInvariant()}";
        if (_cache.TryGetValue(cacheKey, out ContributionCalendarDto? cached) && cached is not null)
        {
            return cached;
        }

        var calendar = await FetchAsync(username, cancellationToken);
        _cache.Set(cacheKey, calendar, TimeSpan.FromMinutes(30));
        return calendar;
    }

    private async Task<ContributionCalendarDto> FetchAsync(string username, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await _httpClient.GetAsync($"users/{Uri.EscapeDataString(username)}/contributions", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogInformation(
                    "Contribution calendar unavailable for {Username} (status {StatusCode}).",
                    username,
                    response.StatusCode);
                return Empty(username);
            }

            var html = await response.Content.ReadAsStringAsync(cancellationToken);
            return Parse(username, html);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogInformation(ex, "Contribution calendar failed for {Username}.", username);
            return Empty(username);
        }
    }

    internal static ContributionCalendarDto Parse(string username, string html)
    {
        var days = new List<ContributionDayDto>();

        foreach (Match match in DayPattern().Matches(html))
        {
            if (!DateOnly.TryParse(match.Groups["date"].Value, out var date))
            {
                continue;
            }

            var level = int.TryParse(match.Groups["level"].Value, out var parsed) ? Math.Clamp(parsed, 0, 4) : 0;
            days.Add(new ContributionDayDto { Date = date, Level = level });
        }

        return new ContributionCalendarDto
        {
            Username = username,
            Days = days.OrderBy(d => d.Date).ToList(),
            ActiveDays = days.Count(d => d.Level > 0)
        };
    }

    private static ContributionCalendarDto Empty(string username) => new()
    {
        Username = username,
        Days = [],
        ActiveDays = 0
    };
}
