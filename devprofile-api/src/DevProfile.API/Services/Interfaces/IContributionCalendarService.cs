using DevProfile.API.Models.DTOs;

namespace DevProfile.API.Services.Interfaces;

public interface IContributionCalendarService
{
    Task<ContributionCalendarDto> GetCalendarAsync(string username, CancellationToken cancellationToken = default);
}
