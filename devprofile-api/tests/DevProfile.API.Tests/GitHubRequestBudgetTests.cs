using System.Net;
using System.Text;
using DevProfile.API.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;

namespace DevProfile.API.Tests;

/// <summary>
/// O orçamento de requisições é uma característica do produto, não um detalhe: a
/// API pública do GitHub dá 60 chamadas por hora a quem não usa token, e a versão
/// anterior gastava mais de cinquenta por perfil, o que deixava o app inutilizável
/// a partir da segunda análise. Estes testes falham se alguém reintroduzir uma
/// chamada por repositório.
/// </summary>
public class GitHubRequestBudgetTests
{
    private sealed class CountingHandler : HttpMessageHandler
    {
        public List<string> Paths { get; } = [];
        public bool FailSearch { get; init; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var path = request.RequestUri!.PathAndQuery;
            lock (Paths)
            {
                Paths.Add(path);
            }

            if (path.StartsWith("/search/commits", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(FailSearch
                    ? new HttpResponseMessage(HttpStatusCode.Forbidden)
                    : Json("""{"total_count": 1060}"""));
            }

            if (path.Contains("/repos?", StringComparison.OrdinalIgnoreCase))
            {
                // Segunda página vazia encerra a paginação.
                // page=1 exato: "page=1" solto também casaria com page=10.
                var isFirstPage = path.Contains("page=1&", StringComparison.OrdinalIgnoreCase);
                return Task.FromResult(Json(isFirstPage ? ReposPayload(25) : "[]"));
            }

            if (path.Contains("/commits?", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(Json("[{}]"));
            }

            return Task.FromResult(Json("""
                {"login":"dev","name":"Dev","followers":24,"following":2,"public_repos":25,"created_at":"2020-01-01T00:00:00Z"}
                """));
        }

        private static HttpResponseMessage Json(string body) => new(HttpStatusCode.OK)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        private static string ReposPayload(int count)
        {
            var languages = new[] { "C#", "TypeScript", "SCSS", "Go", null };
            var repos = Enumerable.Range(0, count).Select(i =>
            {
                var language = languages[i % languages.Length];
                var languageJson = language is null ? "null" : $"\"{language}\"";
                return "{\"name\":\"repo" + i + "\",\"fork\":false,\"stargazers_count\":1,\"forks_count\":0,\"language\":"
                     + languageJson + ",\"owner\":{\"login\":\"dev\"}}";
            });

            return "[" + string.Join(",", repos) + "]";
        }
    }

    private static (GitHubService service, CountingHandler handler) Build(bool failSearch = false)
    {
        var handler = new CountingHandler { FailSearch = failSearch };
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://api.github.com/") };
        var service = new GitHubService(client, new MemoryCache(new MemoryCacheOptions()), NullLogger<GitHubService>.Instance);
        return (service, handler);
    }

    [Fact]
    public async Task Perfil_com_25_repositorios_cabe_em_tres_requisicoes()
    {
        var (service, handler) = Build();

        await service.GetProfileAsync("dev");
        await service.GetLanguageDistributionAsync("dev");

        // usuário + página de repositórios + busca de commits. A página vazia que
        // encerra a paginação entra no total, então o teto prático é 4.
        Assert.True(handler.Paths.Count is >= 3 and <= 4, string.Join(" | ", handler.Paths));
        Assert.DoesNotContain(handler.Paths, p => p.Contains("/languages", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Commits_vem_do_total_real_da_busca()
    {
        var (service, _) = Build();

        var profile = await service.GetProfileAsync("dev");

        Assert.Equal(1060, profile.TotalCommits);
    }

    [Fact]
    public async Task Busca_de_commits_restringe_aos_repositorios_do_proprio_perfil()
    {
        var (service, handler) = Build();

        await service.GetProfileAsync("dev");

        var search = handler.Paths.Single(p => p.StartsWith("/search/commits", StringComparison.OrdinalIgnoreCase));
        var decoded = Uri.UnescapeDataString(search);

        // Sem o "user:", a busca conta commits do autor em qualquer repositório
        // indexado do GitHub, inclusive forks de terceiros, e o total explode.
        Assert.Contains("author:dev", decoded);
        Assert.Contains("user:dev", decoded);
    }

    [Fact]
    public async Task Busca_indisponivel_cai_para_amostragem_curta_sem_estourar_o_orcamento()
    {
        var (service, handler) = Build(failSearch: true);

        var profile = await service.GetProfileAsync("dev");

        // Plano B amostra no máximo 5 repositórios, então o pior caso continua barato.
        var commitCalls = handler.Paths.Count(p =>
            p.Contains("/commits?", StringComparison.OrdinalIgnoreCase) &&
            !p.StartsWith("/search/", StringComparison.OrdinalIgnoreCase));
        Assert.InRange(commitCalls, 1, 5);
        Assert.InRange(handler.Paths.Count, 3, 9);
        Assert.True(profile.TotalCommits > 0);
    }

    [Fact]
    public async Task Distribuicao_de_linguagens_ignora_repositorio_sem_linguagem()
    {
        var (service, _) = Build();

        var languages = await service.GetLanguageDistributionAsync("dev");

        // O payload tem 5 repos sem linguagem em 25; sobram 4 linguagens distintas.
        Assert.Equal(4, languages.Count);
        Assert.Equal(100, languages.Sum(l => l.Percentage));
    }

    [Fact]
    public async Task Segunda_analise_do_mesmo_perfil_nao_gasta_requisicao()
    {
        var (service, handler) = Build();

        await service.GetProfileAsync("dev");
        var afterFirst = handler.Paths.Count;
        await service.GetProfileAsync("dev");

        Assert.Equal(afterFirst, handler.Paths.Count);
    }
}
