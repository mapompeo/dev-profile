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
    public IReadOnlyList<LanguageUsageDto> TopLanguages { get; init; } = [];
}
