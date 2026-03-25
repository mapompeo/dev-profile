namespace DevProfile.API.Models.DTOs;

public sealed class ProfileComparisonDto
{
    public required ProfileResponseDto Left { get; init; }
    public required ProfileResponseDto Right { get; init; }
    public required string WinnerByScore { get; init; }
    public int ScoreDifference { get; init; }
    public required string Summary { get; init; }
}
