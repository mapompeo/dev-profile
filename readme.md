# DevProfile

Projeto simples para analisar perfis públicos do GitHub e gerar um resumo técnico com score.

![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat-square&logo=dotnet)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## Sobre

O DevProfile consulta a API do GitHub e retorna:

- métricas básicas (repositórios, stars, commits)
- linguagens mais usadas
- stack principal estimada
- score de 0 a 100

Foco do projeto: aprendizado e portfólio júnior.

## Status atual

- Backend Web API funcionando
- MVP de endpoints implementado
- Score Engine v1 implementado
- Cache em memória ativo
- Comparação entre perfis implementada
- Frontend ainda não iniciado neste repositório

## Stack atual

### Backend

- .NET 10
- ASP.NET Core 10
- HttpClient
- Swagger (OpenAPI)
- Cache em memória (`IMemoryCache`)

### Frontend (planejado)

- A definir

## Endpoints

- `GET /api/profile/{username}`
- `GET /api/profile/compare?left=user1&right=user2`

## Exemplos de uso

Perfil completo:

```bash
curl "http://localhost:5176/api/profile/octocat"
```

Comparacao entre dois perfis:

```bash
curl "http://localhost:5176/api/profile/compare?left=octocat&right=torvalds"
```

Resposta (resumo) do compare:

- `left`: perfil analisado da esquerda
- `right`: perfil analisado da direita
- `winnerByScore`: usuario com melhor score (ou `Tie`)
- `scoreDifference`: diferenca de pontos
- `summary`: texto explicando o resultado

## Como rodar (rápido)

```bash
cd devprofile-api/src/DevProfile.API
dotnet restore
dotnet run
```

API local:

- `http://localhost:5176`

## Como funciona o score (resumo)

O score combina atividade, tempo de conta, diversidade de linguagens e impacto (stars/forks). Resultado final entre 0 e 100.

## Roadmap curto

- Comparação entre perfis (ok)
- Evoluir API com novos endpoints somente se o produto exigir

## Contribuição

PRs são bem-vindos.

1. Crie uma branch: `git checkout -b feat/minha-feature`
2. Faça commit: `git commit -m "feat: minha feature"`
3. Abra o Pull Request

## Licença

MIT
