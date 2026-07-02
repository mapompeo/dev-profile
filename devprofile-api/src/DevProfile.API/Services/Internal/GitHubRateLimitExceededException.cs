namespace DevProfile.API.Services.Internal;

public sealed class GitHubRateLimitExceededException : Exception
{
    public GitHubRateLimitExceededException()
        : base("GitHub API rate limit exceeded. Try again later or configure a GitHub token.")
    {
    }
}
