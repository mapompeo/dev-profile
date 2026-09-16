using DevProfile.API.Models.DTOs;

namespace DevProfile.API.Services.Internal;

/// <summary>
/// Monta a distribuição de linguagens a partir do que a listagem de repositórios
/// já devolve, sem uma chamada extra por repositório.
///
/// A API do GitHub expõe duas visões de linguagem: o campo "language" do repo (a
/// linguagem predominante, grátis no payload que já buscamos) e o endpoint
/// /languages (bytes por linguagem, uma requisição por repositório). O segundo
/// custava dezenas de requisições por perfil e estourava o limite de 60/h; como a
/// interface exibe "por número de repositórios", o campo "language" é a fonte
/// certa para o que está na tela.
/// </summary>
internal static class LanguageAggregator
{
    public static IReadOnlyList<LanguageUsageDto> Aggregate(IReadOnlyList<GitHubRepoResponse> repos)
    {
        var reposByLanguage = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var repo in repos)
        {
            // Fork não é código do usuário, e repositório sem linguagem detectada
            // (só markdown, só configuração) não representa stack nenhuma.
            if (repo.IsFork || string.IsNullOrWhiteSpace(repo.PrimaryLanguage))
            {
                continue;
            }

            var language = repo.PrimaryLanguage!;
            if (!reposByLanguage.TryAdd(language, 1))
            {
                reposByLanguage[language] += 1;
            }
        }

        var totalRepos = reposByLanguage.Values.Sum();
        if (totalRepos == 0)
        {
            return [];
        }

        return reposByLanguage
            .OrderByDescending(entry => entry.Value)
            .ThenBy(entry => entry.Key, StringComparer.OrdinalIgnoreCase)
            .Select(entry => new LanguageUsageDto
            {
                Name = entry.Key,
                Percentage = Math.Round(entry.Value / (double)totalRepos * 100, 2),
                Repositories = entry.Value
            })
            .ToList();
    }
}
