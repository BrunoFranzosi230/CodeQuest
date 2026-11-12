# CodeQuest

[![CI](https://github.com/BrunoFranzosi230/CodeQuest/actions/workflows/ci.yml/badge.svg)](https://github.com/BrunoFranzosi230/CodeQuest/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=BrunoFranzosi230_CodeQuest&metric=alert_status)](https://sonarcloud.io/project/overview?id=BrunoFranzosi230_CodeQuest)
[![Cobertura](https://sonarcloud.io/api/project_badges/measure?project=BrunoFranzosi230_CodeQuest&metric=coverage)](https://sonarcloud.io/project/overview?id=BrunoFranzosi230_CodeQuest)

Jogo web educacional de programação em blocos para crianças de 6 a 11 anos.
A criança monta o programa de um robozinho — o **Bit** — para ele pegar a chave
e voltar para casa, aprendendo sequência, repetição, condicional e função sem
digitar uma linha de código.

**TCC — Engenharia de Software · Católica SC · Bruno Franzosi**

| | |
|---|---|
| 🎮 **Jogar** | https://code-quest-bot-beep.vercel.app |
| 🪞 Espelho | https://brunofranzosi230.github.io/CodeQuest/ |
| 📖 Documentação | [Wiki](https://github.com/BrunoFranzosi230/CodeQuest/wiki) · pasta [docs/](docs/Home.md) |
| 🔎 Qualidade | [SonarCloud](https://sonarcloud.io/project/overview?id=BrunoFranzosi230_CodeQuest) |

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [GDD](docs/GDD.md) | Game Design Document |
| [Arquitetura](docs/ARQUITETURA.md) | Frontend em camadas, backend e o caminho do clique até o banco |
| [Backend na AWS](docs/AWS.md) | API, modelo de dados, segurança e publicação da Lambda |
| [Autenticação](docs/AUTENTICACAO.md) | Login com Google, modo convidado, sincronização e LGPD |
| [Eventos](docs/EVENTOS.md) | Catálogo dos eventos entre os módulos |
| [Qualidade, CI/CD e monitoramento](docs/QUALIDADE-E-DEPLOY.md) | Ambientes, pipeline, testes, SonarCloud, Grafana |
| [Decisões](docs/DECISOES.md) | O que foi decidido, por quê e o que foi descartado |
| [Música](docs/MUSICA.md) | Trilhas, créditos e como adicionar faixas |

---

## Rodando o projeto

Precisa do [Node.js](https://nodejs.org) 22 ou mais novo.

```bash
git clone https://github.com/BrunoFranzosi230/CodeQuest.git
cd CodeQuest
npm install
npm run dev
```

Abre em `http://localhost:5173`.

O jogo roda sem nenhuma configuração, no **modo convidado**. Para habilitar o
**login com Google** e o salvamento na **nuvem**, copie `.env.example` para
`.env.local` e preencha — passo a passo em
[docs/AUTENTICACAO.md](docs/AUTENTICACAO.md).

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento com hot reload |
| `npm run build` | build de produção em `dist/` |
| `npm run preview` | serve o `dist/` para conferir antes de publicar |
| `npm test` | roda os 354 testes (jogo e backend) |
| `npm run coverage` | testes + cobertura (falha abaixo de 50%) |
| `npm run lint` | análise estática |
| `npm run verificar` | **o portão de qualidade: lint + cobertura** |

### No console do navegador (em desenvolvimento)

```js
await testarFases()     // valida as 14 fases pelo motor real
telemetria.resumo()     // métricas da sessão (tempo, tentativas, estrelas)
telemetria.exportar()   // JSON para anexar ao relatório de playtest
```

---

## Arquitetura em um parágrafo

O **frontend** é uma aplicação estática (Vite + Phaser 3): o Phaser desenha o
tabuleiro e o Bit, e HTML/CSS desenha a interface. O **backend** guarda o
progresso de quem faz login com Google: API Gateway → Lambda (Node 22) → RDS
PostgreSQL, na AWS. No modo convidado, tudo fica no `localStorage` e o backend
nem é chamado. Detalhes em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

```
CodeQuest/
├── index.html                 ponto de entrada
├── public/
│   ├── fases/                 14 JSONs, um por fase
│   └── assets/audio/musica/   faixas gravadas
├── src/                       FRONTEND
│   ├── main.js                liga managers, Phaser e telas
│   ├── config.js              lê as variáveis de ambiente
│   ├── core/                  regras do jogo (GameManager, BlockEngine, BitController,
│   │                          LevelLoader, Dicas, AuthManager, AudioManager, Telemetria, UIManager)
│   ├── scenes/                cenas do Phaser (tabuleiro e Bit)
│   ├── ui/                    telas e componentes em HTML/CSS
│   ├── data/                  progresso (local + nuvem), mundos e blocos
│   └── styles/
├── aws/lambda-progresso/      BACKEND
│   ├── handler.mjs            regras da API (testadas sem rede)
│   └── index.mjs              liga as regras ao Google e ao PostgreSQL
├── scripts/                   criação do banco e utilitários
├── observabilidade/grafana/   painel de monitoramento do banco
├── tests/                     354 testes (Vitest)
├── docs/                      documentação (publicada na Wiki)
└── .github/workflows/         CI, deploy do site, deploy da Lambda e Wiki
```

---

## Progressão

| Mundo | Conceito | Bloco novo | Fases |
|---|---|---|---|
| 1 — Floresta Mágica | Sequências | `Andar`, `Virar` | 5 |
| 2 — Fábrica de Engrenagens | Repetição | `Repetir N×` | 3 |
| 3 — Caverna Misteriosa | Condicionais | `Até chegar`, `Se dá pra ir` | 3 |
| 4 — Cidade Futurista | Funções | `Usar truque` | 3 |

Para criar uma fase nova: adicione o JSON em `public/fases/`, registre o id em
`ORDEM_FASES` (`src/data/mundos.js`) e a solução de referência em
`src/dev/testarFases.js`. O formato está no [GDD, seção 9.6](docs/GDD.md#96-formato-de-fase-json).

---

## Publicação

| O quê | Como |
|---|---|
| Frontend (Vercel) | deploy automático a cada push; `main` é produção, PRs ganham *preview* |
| Frontend (GitHub Pages) | `.github/workflows/deploy.yml`, só se lint e testes passarem |
| Backend (Lambda) | `.github/workflows/lambda.yml`, quando `aws/lambda-progresso/` muda |
| Wiki | `.github/workflows/wiki.yml`, quando `docs/` muda |

Todo o fluxo está em [docs/QUALIDADE-E-DEPLOY.md](docs/QUALIDADE-E-DEPLOY.md).

## Monitoramento

Painel Grafana que mostra se o banco de dados está no ar e como o jogo está
sendo usado, sem dados pessoais:

```bash
cd observabilidade/grafana
docker compose up -d      # http://localhost:3000
```

Guia: [observabilidade/grafana/LEIA-ME.md](observabilidade/grafana/LEIA-ME.md).

---

## Stack

| Categoria | Ferramenta |
|---|---|
| Engine | Phaser 3 |
| Empacotador | Vite |
| Linguagem | JavaScript (ES2023, módulos nativos) |
| Backend | AWS Lambda (Node 22) + API Gateway |
| Banco de dados | PostgreSQL (Amazon RDS) |
| Autenticação | Google Identity Services (ou modo convidado) |
| Áudio | Web Audio API + faixas MP3 |
| Qualidade | ESLint, Vitest, SonarCloud, GitHub Actions |
| Monitoramento | Grafana, CloudWatch Logs, telemetria de sessão |
| Hospedagem | Vercel e GitHub Pages (frontend) · AWS (backend) |

## Créditos

- Música do Mundo 4: **Richie Locker**.
- Código, arte e efeitos sonoros: Bruno Franzosi.

## Licença

Código sob a licença [MIT](LICENSE). As faixas de música pertencem aos seus autores.
