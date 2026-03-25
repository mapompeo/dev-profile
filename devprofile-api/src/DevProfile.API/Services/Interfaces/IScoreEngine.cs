using DevProfile.API.Models.DTOs;

namespace DevProfile.API.Services.Interfaces;

public interface IScoreEngine
{
    Task<ScoreResultDto> CalculateAsync(string username, CancellationToken cancellationToken = default);
    Task<ProfileResponseDto> BuildProfileResponseAsync(string username, CancellationToken cancellationToken = default);
}
