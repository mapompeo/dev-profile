using DevProfile.API.Models.DTOs;

namespace DevProfile.API.Services.Interfaces;

public interface IGitHubService
{
    Task<GitHubProfileDto> GetProfileAsync(string username, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LanguageUsageDto>> GetLanguageDistributionAsync(string username, CancellationToken cancellationToken = default);
}
