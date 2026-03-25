using DevProfile.API.Models.DTOs;

namespace DevProfile.API.Services.Interfaces;

public interface IAuthService
{
    string BuildGitHubAuthorizeUrl(string redirectUri, string state);
    Task<OAuthLoginResultDto> ExchangeCodeAsync(string code, string redirectUri, CancellationToken cancellationToken = default);
}
