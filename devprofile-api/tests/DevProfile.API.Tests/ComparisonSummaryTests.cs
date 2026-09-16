using System.Reflection;
using DevProfile.API.Controllers;
using DevProfile.API.Models.DTOs;

namespace DevProfile.API.Tests;

/// <summary>
/// O resumo da comparação aparece logo abaixo do placar, então repetir o placar
/// ali é desperdício de espaço. Ele existe para dizer onde está a diferença.
/// </summary>
public class ComparisonSummaryTests
{
    private static string Summary(ProfileResponseDto left, ProfileResponseDto right)
    {
        var method = typeof(ProfileController)
            .GetMethod("BuildComparisonSummary", BindingFlags.NonPublic | BindingFlags.Static)!;
        return (string)method.Invoke(null, [left, right])!;
    }

    private static ProfileResponseDto Perfil(string username, CompetenceRadarDto radar) => new()
    {
        Username = username,
        CreatedAt = DateTime.UtcNow.AddYears(-3),
        Stats = new ProfileStatsDto(),
        Analysis = new ScoreResultDto
        {
            SeniorityLevel = "Pleno",
            ExperienceYears = "3-5",
            MainStack = "Backend",
            Radar = radar
        }
    };

    [Fact]
    public void Aponta_o_eixo_com_maior_distancia_e_quem_lidera_nele()
    {
        var esquerda = Perfil("mapompeo", new CompetenceRadarDto { Consistency = 60, Popularity = 7, Velocity = 50 });
        var direita = Perfil("gaearon", new CompetenceRadarDto { Consistency = 65, Popularity = 92, Velocity = 55 });

        var resumo = Summary(esquerda, direita);

        Assert.Contains("popularidade", resumo);
        Assert.Contains("92", resumo);
        Assert.Contains("7", resumo);
        Assert.Contains("gaearon", resumo);
    }

    [Fact]
    public void Nao_repete_o_placar_que_a_interface_ja_mostra()
    {
        var esquerda = Perfil("a", new CompetenceRadarDto { Consistency = 10 });
        var direita = Perfil("b", new CompetenceRadarDto { Consistency = 90 });

        var resumo = Summary(esquerda, direita);

        Assert.DoesNotContain("pontos de score", resumo);
        Assert.DoesNotContain("leads by", resumo);
    }

    [Fact]
    public void Empate_total_tem_frase_propria()
    {
        var radar = new CompetenceRadarDto { Consistency = 50, Diversity = 50, Popularity = 50, Structure = 50, Collaboration = 50, Velocity = 50 };

        var resumo = Summary(Perfil("a", radar), Perfil("b", radar));

        Assert.Contains("igual", resumo);
    }
}
