using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using DevProfile.API.Models.DTOs;
using DevProfile.API.Services.Interfaces;

namespace DevProfile.API.Services;

public sealed class AuthService : IAuthService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public AuthService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public string BuildGitHubAuthorizeUrl(string redirectUri, string state)
    {
        var clientId = _configuration["GitHub:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
        {
            throw new InvalidOperationException("GitHub:ClientId is not configured.");
        }

        var scope = Uri.EscapeDataString("read:user user:email");
        var redirect = Uri.EscapeDataString(redirectUri);
        var safeState = Uri.EscapeDataString(state);

        return $"https://github.com/login/oauth/authorize?client_id={clientId}&redirect_uri={redirect}&scope={scope}&state={safeState}";
    }

    public async Task<OAuthLoginResultDto> ExchangeCodeAsync(string code, string redirectUri, CancellationToken cancellationToken = default)
    {
        var clientId = _configuration["GitHub:ClientId"];
        var clientSecret = _configuration["GitHub:ClientSecret"];

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            throw new InvalidOperationException("GitHub OAuth credentials are not configured. Set GitHub:ClientId and GitHub:ClientSecret.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Content = new StringContent(
            $"client_id={Uri.EscapeDataString(clientId)}&client_secret={Uri.EscapeDataString(clientSecret)}&code={Uri.EscapeDataString(code)}&redirect_uri={Uri.EscapeDataString(redirectUri)}",
            Encoding.UTF8,
            "application/x-www-form-urlencoded");

        using var tokenResponse = await _httpClient.SendAsync(request, cancellationToken);
        tokenResponse.EnsureSuccessStatusCode();

        await using var tokenStream = await tokenResponse.Content.ReadAsStreamAsync(cancellationToken);
        var tokenPayload = await JsonSerializer.DeserializeAsync<GitHubAccessTokenResponse>(tokenStream, JsonOptions, cancellationToken)
            ?? throw new InvalidOperationException("Unable to read GitHub OAuth token response.");

        if (string.IsNullOrWhiteSpace(tokenPayload.AccessToken))
        {
            throw new InvalidOperationException("GitHub OAuth token response did not include access_token.");
        }

        using var meRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
        meRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenPayload.AccessToken);
        meRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

        using var meResponse = await _httpClient.SendAsync(meRequest, cancellationToken);
        meResponse.EnsureSuccessStatusCode();

        await using var meStream = await meResponse.Content.ReadAsStreamAsync(cancellationToken);
        var mePayload = await JsonSerializer.DeserializeAsync<GitHubAuthenticatedUserResponse>(meStream, JsonOptions, cancellationToken)
            ?? throw new InvalidOperationException("Unable to read GitHub user profile from OAuth token.");

        return new OAuthLoginResultDto
        {
            AccessToken = tokenPayload.AccessToken,
            TokenType = tokenPayload.TokenType,
            Scope = tokenPayload.Scope,
            Username = mePayload.Login,
            Name = mePayload.Name,
            AvatarUrl = mePayload.AvatarUrl
        };
    }

    private sealed class GitHubAccessTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; init; } = string.Empty;

        [JsonPropertyName("token_type")]
        public string TokenType { get; init; } = "bearer";

        [JsonPropertyName("scope")]
        public string Scope { get; init; } = string.Empty;
    }

    private sealed class GitHubAuthenticatedUserResponse
    {
        [JsonPropertyName("login")]
        public string Login { get; init; } = string.Empty;

        [JsonPropertyName("name")]
        public string? Name { get; init; }

        [JsonPropertyName("avatar_url")]
        public string? AvatarUrl { get; init; }
    }
}
