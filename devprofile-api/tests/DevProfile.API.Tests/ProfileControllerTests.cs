using DevProfile.API.Controllers;
using DevProfile.API.Models.DTOs;
using DevProfile.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DevProfile.API.Tests;

public class ProfileControllerTests
{
    private sealed class NeverCalledScoreEngine : IScoreEngine
    {
        public Task<ScoreResultDto> CalculateAsync(string username, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("A sonda de saúde não pode tocar na API do GitHub.");

        public Task<ProfileResponseDto> BuildProfileResponseAsync(string username, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("A sonda de saúde não pode tocar na API do GitHub.");
    }

    [Fact]
    public void Health_responde_ok_sem_consultar_o_github()
    {
        var controller = new ProfileController(new NeverCalledScoreEngine());

        var result = controller.Health();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void Rota_de_health_e_literal_e_nao_cai_no_curinga_de_username()
    {
        // Se alguém remover o [HttpGet("health")], a sonda do Render volta a cair em
        // GetFullProfile("health") e cada verificação gasta requisições do GitHub.
        var health = typeof(ProfileController).GetMethod(nameof(ProfileController.Health));
        var attribute = health!
            .GetCustomAttributes(typeof(HttpGetAttribute), inherit: false)
            .Cast<HttpGetAttribute>()
            .Single();

        Assert.Equal("health", attribute.Template);
    }
}
