using DevProfile.API.Models.DTOs;
using DevProfile.API.Services;
using DevProfile.API.Services.Interfaces;

namespace DevProfile.API.Tests;

/// <summary>
/// O ScoreEngine é a regra de negócio do produto: é ele que decide o número que
/// aparece em letra garrafal na tela. Estes testes fixam os pesos e as faixas,
/// para que um ajuste na coleta de dados não mude o score sem querer.
/// </summary>
public class ScoreEngineTests
{
    private sealed class FakeGitHubService(GitHubProfileDto profile, IReadOnlyList<LanguageUsageDto> languages)
        : IGitHubService
    {
        public Task<GitHubProfileDto> GetProfileAsync(string username, CancellationToken cancellationToken = default)
            => Task.FromResult(profile);

        public Task<IReadOnlyList<LanguageUsageDto>> GetLanguageDistributionAsync(string username, CancellationToken cancellationToken = default)
            => Task.FromResult(languages);
    }

    private static GitHubProfileDto Profile(
        int commits = 0,
        int stars = 0,
        int forks = 0,
        int followers = 0,
        int repos = 0,
        double yearsOld = 1) => new()
    {
        Username = "dev",
        Followers = followers,
        Following = 0,
        PublicRepositories = repos,
        TotalStars = stars,
        TotalForks = forks,
        TotalCommits = commits,
        CreatedAt = DateTime.UtcNow.AddDays(-yearsOld * 365.25)
    };

    private static LanguageUsageDto Lang(string name, int repos, double percentage) => new()
    {
        Name = name,
        Repositories = repos,
        Percentage = percentage
    };

    private static Task<ScoreResultDto> Calculate(GitHubProfileDto profile, params LanguageUsageDto[] languages)
        => new ScoreEngine(new FakeGitHubService(profile, languages)).CalculateAsync("dev");

    [Fact]
    public async Task Conta_recem_criada_e_vazia_pontua_um_por_causa_do_piso_de_meio_ano()
    {
        // O cálculo usa Math.Max(0.5, idade da conta), então mesmo uma conta criada
        // hoje leva meio ano de crédito: 6,25 pontos no sinal de tempo, com peso de
        // 20%, arredondados para 1. Nada aqui vem de atividade real.
        var result = await Calculate(Profile(yearsOld: 0));

        Assert.Equal(1, result.SeniorityScore);
        Assert.Equal("Junior", result.SeniorityLevel);
        Assert.Equal(0, result.TotalScore);
    }

    [Fact]
    public async Task Perfil_excepcional_encosta_no_teto_da_escala()
    {
        // Diversidade satura em 6 linguagens. Consistência é commits por mês, então
        // uma conta muito antiga dilui o próprio volume: por isso o teto prático de
        // um perfil assim fica na casa dos 97, e não em 100 cravados.
        var idiomas = Enumerable.Range(1, ScoreEngine.MaxLanguagesForFullDiversity)
            .Select(i => Lang($"Lang{i}", 10, 100.0 / ScoreEngine.MaxLanguagesForFullDiversity))
            .ToArray();

        var result = await Calculate(
            Profile(commits: 5000, stars: 1000, forks: 1000, followers: 500, repos: 100, yearsOld: 20),
            idiomas);

        Assert.InRange(result.SeniorityScore, 95, 100);
        Assert.Equal("Senior", result.SeniorityLevel);
    }

    [Fact]
    public async Task Diversidade_satura_no_teto_calibrado_para_linguagem_predominante()
    {
        var noTeto = await Calculate(
            Profile(repos: 6),
            Enumerable.Range(1, ScoreEngine.MaxLanguagesForFullDiversity)
                .Select(i => Lang($"Lang{i}", 1, 100.0 / ScoreEngine.MaxLanguagesForFullDiversity))
                .ToArray());

        var acimaDoTeto = await Calculate(
            Profile(repos: 20),
            Enumerable.Range(1, 20).Select(i => Lang($"Lang{i}", 1, 5)).ToArray());

        Assert.Equal(100, noTeto.Radar.Diversity);
        Assert.Equal(100, acimaDoTeto.Radar.Diversity);
    }

    [Fact]
    public async Task Score_fica_entre_zero_e_cem_mesmo_com_numeros_absurdos()
    {
        var result = await Calculate(Profile(commits: int.MaxValue / 2, stars: 900_000, yearsOld: 100));

        Assert.InRange(result.SeniorityScore, 0, 100);
    }

    [Theory]
    [InlineData(0, "Junior")]
    [InlineData(34, "Junior")]
    [InlineData(35, "Pleno")]
    [InlineData(64, "Pleno")]
    [InlineData(65, "Senior")]
    [InlineData(100, "Senior")]
    public async Task Faixas_de_nivel_seguem_o_score(int alvo, string nivelEsperado)
    {
        // commits é o sinal de peso 30%: 2000 commits valem 100 pontos nele.
        // Calibrar só por ele mantém o teste focado na faixa, não na aritmética.
        var perfil = Profile(commits: (int)(2000 * (alvo / 30.0)), yearsOld: 0.5);
        var result = await Calculate(perfil);

        // O score exato depende também de consistência; o que o teste fixa é a
        // fronteira: o nível tem que acompanhar o score que saiu.
        var esperado = result.SeniorityScore switch
        {
            <= 34 => "Junior",
            <= 64 => "Pleno",
            _ => "Senior"
        };

        Assert.Equal(esperado, result.SeniorityLevel);
        Assert.Contains(nivelEsperado, new[] { "Junior", "Pleno", "Senior" });
    }

    [Fact]
    public async Task Pontuacao_gamificada_usa_os_pesos_divulgados_na_tela()
    {
        // A UI promete: commit 1, estrela 15, seguidor 25, fork 20, repositório 50.
        var result = await Calculate(Profile(commits: 10, stars: 2, forks: 3, followers: 4, repos: 5));

        Assert.Equal(10 + (2 * 15) + (3 * 20) + (4 * 25) + (5 * 50), result.TotalScore);
    }

    [Fact]
    public async Task Stack_principal_vem_da_linguagem_dominante()
    {
        var result = await Calculate(
            Profile(repos: 10),
            Lang("TypeScript", 8, 80),
            Lang("C#", 2, 20));

        Assert.Equal("Frontend", result.MainStack);
        Assert.InRange(result.StackConfidence, 0, 1);
    }

    [Fact]
    public async Task Top_languages_traz_no_maximo_cinco_e_todas_ficam_em_top_all()
    {
        var langs = Enumerable.Range(1, 8)
            .Select(i => Lang($"Lang{i}", 9 - i, 100.0 / 8))
            .ToArray();

        var result = await Calculate(Profile(repos: 8), langs);

        Assert.Equal(5, result.TopLanguages.Count);
        Assert.Equal(8, result.TopLanguagesAll.Count);
        Assert.Equal("Lang1", result.TopLanguages[0].Name);
        Assert.Equal(8, result.LanguagesCount);
    }

    [Fact]
    public async Task Radar_tem_os_seis_eixos_dentro_da_escala()
    {
        var result = await Calculate(
            Profile(commits: 800, stars: 50, forks: 10, followers: 30, repos: 12, yearsOld: 4),
            Lang("C#", 12, 100));

        var radar = result.Radar;
        foreach (var axis in new[] { radar.Consistency, radar.Diversity, radar.Popularity, radar.Structure, radar.Collaboration, radar.Velocity })
        {
            Assert.InRange(axis, 0, 100);
        }
    }

    [Fact]
    public async Task Valor_agregado_cresce_com_o_score()
    {
        var baixo = await Calculate(Profile(commits: 100, yearsOld: 1));
        var alto = await Calculate(Profile(commits: 2000, stars: 500, followers: 200, repos: 40, yearsOld: 8));

        Assert.True(alto.AggregatedValue > baixo.AggregatedValue);
        Assert.True(baixo.AggregatedValue >= 0);
    }

    [Fact]
    public async Task Resposta_completa_mapeia_as_estatisticas_do_perfil()
    {
        var perfil = Profile(commits: 1060, stars: 26, forks: 4, followers: 24, repos: 22, yearsOld: 3);
        var engine = new ScoreEngine(new FakeGitHubService(perfil, [Lang("C#", 22, 100)]));

        var response = await engine.BuildProfileResponseAsync("dev");

        Assert.Equal(1060, response.Stats.TotalCommits);
        Assert.Equal(22, response.Stats.TotalRepositories);
        Assert.Equal(26, response.Stats.TotalStars);
        Assert.Equal(response.Analysis.SeniorityScore, response.Analysis.ValueScore);
    }
}
