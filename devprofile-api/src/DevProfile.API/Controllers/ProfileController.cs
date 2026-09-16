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

    /// <summary>
    /// Sonda do Render (healthCheckPath no render.yaml). Precisa existir e ser
    /// literal: sem ela a sonda cai na rota curinga {username} e cada verificação
    /// vira uma busca pelo usuário "health" na API do GitHub, queimando o limite
    /// de requisições do serviço em produção sem ninguém usar o app.
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Health() => Ok(new { status = "ok" });

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

    /// <summary>
    /// O resumo não repete o placar, que a interface já mostra em destaque: ele
    /// aponta em qual competência a distância entre os dois é maior, que é a
    /// informação que o número sozinho não dá.
    /// </summary>
    private static string BuildComparisonSummary(ProfileResponseDto left, ProfileResponseDto right)
    {
        var eixos = new (string Nome, int Esquerda, int Direita)[]
        {
            ("consistência", left.Analysis.Radar.Consistency, right.Analysis.Radar.Consistency),
            ("diversidade de linguagens", left.Analysis.Radar.Diversity, right.Analysis.Radar.Diversity),
            ("popularidade", left.Analysis.Radar.Popularity, right.Analysis.Radar.Popularity),
            ("estrutura", left.Analysis.Radar.Structure, right.Analysis.Radar.Structure),
            ("colaboração", left.Analysis.Radar.Collaboration, right.Analysis.Radar.Collaboration),
            ("velocidade", left.Analysis.Radar.Velocity, right.Analysis.Radar.Velocity)
        };

        var maiorDiferenca = eixos
            .OrderByDescending(eixo => Math.Abs(eixo.Esquerda - eixo.Direita))
            .First();

        if (Math.Abs(maiorDiferenca.Esquerda - maiorDiferenca.Direita) == 0)
        {
            return "Os dois perfis pontuam igual em todas as competências.";
        }

        var lider = maiorDiferenca.Esquerda > maiorDiferenca.Direita ? left : right;
        var maior = Math.Max(maiorDiferenca.Esquerda, maiorDiferenca.Direita);
        var menor = Math.Min(maiorDiferenca.Esquerda, maiorDiferenca.Direita);

        return $"A maior distância está em {maiorDiferenca.Nome}: {maior} contra {menor}, a favor de {lider.Username}.";
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
