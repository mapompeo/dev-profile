namespace DevProfile.API.Models.DTOs;

public sealed class ScoreResultDto
{
    public required string SeniorityLevel { get; init; }
    public int SeniorityScore { get; init; }
    public required string ExperienceYears { get; init; }
    public required string MainStack { get; init; }
    public double StackConfidence { get; init; }
    public int LanguagesCount { get; init; }
    public int ValueScore { get; init; }
    public int TotalScore { get; init; }
    public IReadOnlyList<LanguageUsageDto> TopLanguages { get; init; } = [];

    // All languages (not only top 5) for the donut chart
    public IReadOnlyList<LanguageUsageDto> TopLanguagesAll { get; init; } = [];

    // Pre-calculated 6-axis radar data
    public CompetenceRadarDto Radar { get; init; } = new();

    // Stack breakdown by category
    public StackBreakdownDto StackBreakdown { get; init; } = new();

    // Estimated monthly salary in BRL
    public double AggregatedValue { get; init; }
}

public sealed class CompetenceRadarDto
{
    /// Commits consistency (commits/month normalized)
    public int Consistency { get; init; }
    /// Language diversity (# languages normalized to 15)
    public int Diversity { get; init; }
    /// Community impact: stars + followers
    public int Popularity { get; init; }
    /// Estimated structure score
    public int Structure { get; init; }
    /// Collaboration: followers/following ratio
    public int Collaboration { get; init; }
    /// Commit velocity: commits per year
    public int Velocity { get; init; }
}

public sealed class StackBreakdownDto
{
    public double Frontend { get; init; }
    public double Backend { get; init; }
    public double DevOps { get; init; }
    public double Mobile { get; init; }
    public double Data { get; init; }
    public double Scripts { get; init; }
}
