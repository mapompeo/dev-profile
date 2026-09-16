namespace DevProfile.API.Models.DTOs;

public sealed class ContributionDayDto
{
    public DateOnly Date { get; init; }

    /// <summary>Intensidade de 0 a 4, a mesma escala de verdes da grade do GitHub.</summary>
    public int Level { get; init; }
}

public sealed class ContributionCalendarDto
{
    public required string Username { get; init; }
    public IReadOnlyList<ContributionDayDto> Days { get; init; } = [];
    public int ActiveDays { get; init; }
}
