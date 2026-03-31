namespace DevProfile.API.Models.DTOs;

public sealed class GitHubProfileDto
{
    public required string Username { get; init; }
    public string? Name { get; init; }
    public string? AvatarUrl { get; init; }
    public string? Bio { get; init; }
    public int Followers { get; init; }
    public int Following { get; init; }
    public int PublicRepositories { get; init; }
    public int TotalStars { get; init; }
    public int TotalForks { get; init; }
    public int TotalCommits { get; init; }
    public string? Company { get; init; }
    public string? Location { get; init; }
    public DateTime CreatedAt { get; init; }
}
