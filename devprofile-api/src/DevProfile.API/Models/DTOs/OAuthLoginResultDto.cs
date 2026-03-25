namespace DevProfile.API.Models.DTOs;

public sealed class OAuthLoginResultDto
{
    public required string AccessToken { get; init; }
    public required string TokenType { get; init; }
    public string Scope { get; init; } = string.Empty;
    public required string Username { get; init; }
    public string? Name { get; init; }
    public string? AvatarUrl { get; init; }
}
