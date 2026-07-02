using DevProfile.API.Models.DTOs;
using DevProfile.API.Services.Internal;
using DevProfile.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DevProfile.API.Controllers;

[ApiController]
[Route("api/profile")]
public sealed class ProfileController : ControllerBase
{
    private readonly IScoreEngine _scoreEngine;

    public ProfileController(IScoreEngine scoreEngine)
    {
        _scoreEngine = scoreEngine;
    }

    [HttpGet("{username}")]
    [ProducesResponseType(typeof(ProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFullProfile(string username, CancellationToken cancellationToken)
    {
        if (!TryNormalizeUsername(username, out var normalizedUsername))
        {
            return BadRequest(new { message = "Invalid username." });
        }

        try
        {
            var response = await _scoreEngine.BuildProfileResponseAsync(normalizedUsername, cancellationToken);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (GitHubRateLimitExceededException ex)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { message = ex.Message });
        }
    }

    [HttpGet("compare")]
    [ProducesResponseType(typeof(ProfileComparisonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Compare(
        [FromQuery] string left,
        [FromQuery] string right,
        CancellationToken cancellationToken)
    {
        if (!TryNormalizeUsername(left, out var leftUsername) || !TryNormalizeUsername(right, out var rightUsername))
        {
            return BadRequest(new { message = "Provide valid query params 'left' and 'right'." });
        }

        if (string.Equals(leftUsername, rightUsername, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "'left' and 'right' must be different usernames." });
        }

        try
        {
            var leftTask = _scoreEngine.BuildProfileResponseAsync(leftUsername, cancellationToken);
            var rightTask = _scoreEngine.BuildProfileResponseAsync(rightUsername, cancellationToken);
            await Task.WhenAll(leftTask, rightTask);

            var leftProfile = leftTask.Result;
            var rightProfile = rightTask.Result;

            var leftScore = leftProfile.Analysis.ValueScore;
            var rightScore = rightProfile.Analysis.ValueScore;
            var winner = leftScore == rightScore ? "Tie" : (leftScore > rightScore ? leftProfile.Username : rightProfile.Username);

            var result = new ProfileComparisonDto
            {
                Left = leftProfile,
                Right = rightProfile,
                WinnerByScore = winner,
                ScoreDifference = Math.Abs(leftScore - rightScore),
                Summary = BuildComparisonSummary(leftProfile, rightProfile)
            };

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (GitHubRateLimitExceededException ex)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { message = ex.Message });
        }
    }

    private static string BuildComparisonSummary(ProfileResponseDto left, ProfileResponseDto right)
    {
        var leftScore = left.Analysis.ValueScore;
        var rightScore = right.Analysis.ValueScore;

        if (leftScore == rightScore)
        {
            return $"{left.Username} and {right.Username} are tied with score {leftScore}.";
        }

        var winner = leftScore > rightScore ? left : right;
        var loser = leftScore > rightScore ? right : left;
        var gap = Math.Abs(leftScore - rightScore);
        return $"{winner.Username} leads by {gap} points against {loser.Username}.";
    }

    private static bool TryNormalizeUsername(string? username, out string normalizedUsername)
    {
        normalizedUsername = string.Empty;

        if (string.IsNullOrWhiteSpace(username))
        {
            return false;
        }

        var trimmed = username.Trim();
        if (trimmed.Length < 1 || trimmed.Length > 39)
        {
            return false;
        }

        normalizedUsername = trimmed;
        return true;
    }

}
