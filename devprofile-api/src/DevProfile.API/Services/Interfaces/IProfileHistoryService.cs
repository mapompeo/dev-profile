using DevProfile.API.Models.DTOs;

namespace DevProfile.API.Services.Interfaces;

public interface IProfileHistoryService
{
    void AddLookup(string username, string endpoint);
    IReadOnlyList<ProfileLookupHistoryItemDto> GetRecent(int take = 20);
}
