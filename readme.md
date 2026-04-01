# 🚀 DevProfile

**DevProfile** é uma plataforma de análise de performance e senioridade para desenvolvedores, baseadamente em dados reais do GitHub. Através de um motor de pontuação proprietário (Score Engine), o projeto transforma estatísticas brutas em um resumo visual elegante e comparativo.

[![Deploy with Vercel](https://vercel.com/button)](https://dev-profile-one.vercel.app)
![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet)
![Angular](https://img.shields.io/badge/Angular-21.0-DD0031?style=for-the-badge&logo=angular)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker)

---

## 🌟 Funcionalidades

- **🔍 Análise de Perfil Profundo**: Extração automática de métricas como total de commits, estrelas, seguidores e diversidade de linguagens.
- **📊 Radar Técnico**: Visualização 360º de consistência, diversidade, popularidade, estrutura, colaboração e velocidade.
- **⚖️ Modo VS (Comparação)**: Compare dois perfis lado a lado e descubra quem leva a melhor em pontuação técnica.
- **🧬 Seniority Engine**: Estimativa de nível de senioridade (Júnior, Pleno, Sênior) baseada em complexidade de stack e tempo de conta.
- **🖼️ Exportação de Card**: Gere um resumo visual do seu perfil pronto para compartilhar (via html2canvas).

---

## 🛠️ Stack Tecnológica

### Backend (Engine)
- **Framework**: .NET 10.0 (ASP.NET Core)
- **Padrão**: Web API RESTful com Injeção de Dependência.
- **Serviços Externos**: Integração nativa com GitHub API v3.
- **Cache**: Implementação de `IMemoryCache` para performance otimizada.

### Frontend (UI/UX)
- **Framework**: Angular (Standalone Components)
- **Design System**: Glassmorphism UI com foco em legibilidade e densidade de dados.
- **Gráficos**: Integração com bibliotecas de visualização para radares e donuts.
- **Estilo**: SCSS avançado com variáveis dinâmicas e animações fluidas.

---

## 🏗️ Arquitetura do Projeto

O projeto utiliza uma estrutura desacoplada em monorepo:

```text
📂 dev-profile
├── 📂 devprofile-api   # Backend .NET 10
│   ├── 📂 src         # Controllers, Services, Models, DTOs
│   └── Dockerfile.api # Configuração para deploy em container
├── 📂 devprofile-web   # Frontend Angular
│   ├── 📂 src         # Components, Services, Styles
│   └── vercel.json    # Configurações de roteamento SPA
└── render.yaml        # Automação de deploy para o backend
```

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos
- .NET 10.0 SDK instalado
- Node.js (v20+) e Angular CLI instalados

### 2. Clonar e Iniciar
```bash
# Clone o repositório
git clone https://github.com/mapompeo/dev-profile.git

# Iniciando o Backend
cd devprofile-api/src/DevProfile.API
dotnet run

# Iniciando o Frontend (em outro terminal)
cd devprofile-web
npm install
npm start
```

---

## ☁️ Deploy na Nuvem

Este projeto está configurado para um workflow de **CI/CD Moderno**:

- **Backend**: Hospedado no **Render** via Docker. O `render.yaml` gerencia o blueprint automaticamente.
- **Frontend**: Hospedado na **Vercel**. O `vercel.json` gerencia o proxy reverso para a API, eliminando problemas de CORS.

### Variáveis de Ambiente Necessárias:
- `GitHub__Token`: Seu Personal Access Token do GitHub.
- `GitHub__AppName`: `DevProfile` (identificador da aplicação).
- `ASPNETCORE_URLS`: `http://+:8080` (para rodar no container).

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<p align="center">Desenvolvido com ❤️ por <a href="https://github.com/mapompeo">Matheus Pompeo</a></p>
