using DevProfile.API.Services.Internal;

namespace DevProfile.API.Tests;

/// <summary>
/// A distribuição de linguagens sai do campo "language" que já vem no payload de
/// repositórios, sem uma chamada por repo. Estes testes fixam esse contrato.
/// </summary>
public class LanguageAggregatorTests
{
    private static GitHubRepoResponse Repo(string? language, bool isFork = false) => new()
    {
        Name = language ?? "sem-linguagem",
        PrimaryLanguage = language,
        IsFork = isFork
    };

    [Fact]
    public void Conta_repositorios_por_linguagem()
    {
        var result = LanguageAggregator.Aggregate([
            Repo("C#"),
            Repo("C#"),
            Repo("TypeScript")
        ]);

        Assert.Equal(2, result.Count);
        Assert.Equal("C#", result[0].Name);
        Assert.Equal(2, result[0].Repositories);
        Assert.Equal(1, result[1].Repositories);
    }

    [Fact]
    public void Percentual_e_a_fatia_de_repositorios_e_soma_100()
    {
        var result = LanguageAggregator.Aggregate([
            Repo("C#"),
            Repo("C#"),
            Repo("TypeScript"),
            Repo("Go")
        ]);

        Assert.Equal(50, result.Single(l => l.Name == "C#").Percentage);
        Assert.Equal(25, result.Single(l => l.Name == "TypeScript").Percentage);
        Assert.Equal(100, result.Sum(l => l.Percentage));
    }

    [Fact]
    public void Ordena_da_linguagem_mais_usada_para_a_menos_usada()
    {
        var result = LanguageAggregator.Aggregate([
            Repo("Go"),
            Repo("C#"),
            Repo("C#"),
            Repo("C#"),
            Repo("TypeScript"),
            Repo("TypeScript")
        ]);

        Assert.Equal(["C#", "TypeScript", "Go"], result.Select(l => l.Name));
    }

    [Fact]
    public void Ignora_forks_porque_o_codigo_nao_e_do_usuario()
    {
        var result = LanguageAggregator.Aggregate([
            Repo("C#"),
            Repo("Rust", isFork: true)
        ]);

        Assert.Equal(["C#"], result.Select(l => l.Name));
    }

    [Fact]
    public void Ignora_repositorio_sem_linguagem_detectada()
    {
        var result = LanguageAggregator.Aggregate([
            Repo("C#"),
            Repo(null)
        ]);

        Assert.Equal(["C#"], result.Select(l => l.Name));
        Assert.Equal(100, result[0].Percentage);
    }

    [Fact]
    public void Sem_repositorio_devolve_lista_vazia_em_vez_de_dividir_por_zero()
    {
        Assert.Empty(LanguageAggregator.Aggregate([]));
        Assert.Empty(LanguageAggregator.Aggregate([Repo(null), Repo("Go", isFork: true)]));
    }
}
