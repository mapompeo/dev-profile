namespace DevProfile.API.Models.DTOs;

public sealed class ProfileLookupHistoryItemDto
{
    public required string Username { get; init; }
    public required string Endpoint { get; init; }
    public DateTime QueriedAtUtc { get; init; }
}
