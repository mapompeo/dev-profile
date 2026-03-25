namespace DevProfile.API.Models.DTOs;

public sealed class LanguageUsageDto
{
    public required string Name { get; init; }
    public double Percentage { get; init; }
    public int Repositories { get; init; }
}
