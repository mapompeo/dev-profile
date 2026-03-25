using System.Collections.Concurrent;
using DevProfile.API.Models.DTOs;
using DevProfile.API.Services.Interfaces;

namespace DevProfile.API.Services;

public sealed class ProfileHistoryService : IProfileHistoryService
{
    private const int MaxItems = 200;
    private readonly ConcurrentQueue<ProfileLookupHistoryItemDto> _entries = new();

    public void AddLookup(string username, string endpoint)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return;
        }

        _entries.Enqueue(new ProfileLookupHistoryItemDto
        {
            Username = username.Trim(),
            Endpoint = endpoint,
            QueriedAtUtc = DateTime.UtcNow
        });

        while (_entries.Count > MaxItems)
        {
            _entries.TryDequeue(out _);
        }
    }

    public IReadOnlyList<ProfileLookupHistoryItemDto> GetRecent(int take = 20)
    {
        var safeTake = Math.Clamp(take, 1, 100);

        return _entries
            .Reverse()
            .Take(safeTake)
            .ToList();
    }
}
