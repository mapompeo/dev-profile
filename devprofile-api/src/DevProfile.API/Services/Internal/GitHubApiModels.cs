using System.Text.Json.Serialization;

namespace DevProfile.API.Services.Internal;

internal sealed class GitHubUserResponse
{
    [JsonPropertyName("login")]
    public string Login { get; init; } = string.Empty;

    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("avatar_url")]
    public string? AvatarUrl { get; init; }

    [JsonPropertyName("bio")]
    public string? Bio { get; init; }

    [JsonPropertyName("followers")]
    public int Followers { get; init; }

    [JsonPropertyName("following")]
    public int Following { get; init; }

    [JsonPropertyName("public_repos")]
    public int PublicRepos { get; init; }
    
    [JsonPropertyName("company")]
    public string? Company { get; init; }

    [JsonPropertyName("location")]
    public string? Location { get; init; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; init; }
}

internal sealed class GitHubRepoResponse
{
    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("fork")]
    public bool IsFork { get; init; }

    [JsonPropertyName("stargazers_count")]
    public int StargazersCount { get; init; }

    [JsonPropertyName("forks_count")]
    public int ForksCount { get; init; }

    [JsonPropertyName("language")]
    public string? PrimaryLanguage { get; init; }

    [JsonPropertyName("owner")]
    public GitHubRepoOwnerResponse Owner { get; init; } = new();
}

internal sealed class GitHubRepoOwnerResponse
{
    [JsonPropertyName("login")]
    public string Login { get; init; } = string.Empty;
}
