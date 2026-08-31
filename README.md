# CodeQuest

Jogo web educacional de programação em blocos para crianças de 6 a 11 anos.
A criança monta o programa de um robozinho — o **Bit** — para ele pegar a chave
e voltar para casa, aprendendo sequência, repetição, condicional e função sem
digitar uma linha de código.

**TCC — Engenharia de Software · Católica SC · Bruno Franzosi**

---

## Rodando o projeto

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

O jogo roda sem nenhuma configuração (login pelo **modo convidado**). Para
habilitar o **login com Google** e/ou o salvamento na **nuvem**, copie
`.env.example` para `.env.local` e preencha — passo a passo em
[docs/AUTENTICACAO.md](docs/AUTENTICACAO.md).

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento com hot reload |
| `npm run build` | build de produção em `dist/` |
| `npm run preview` | serve o `dist/` para conferir antes de publicar |
| `npm test` | roda os 261 testes |
| `npm run coverage` | testes + cobertura (falha abaixo de 50%) |
| `npm run lint` | análise estática |
| `npm run verificar` | **o portão de qualidade: lint + cobertura** |

### Pelo VSCode

Abra a pasta `codequest` e use:

- **`F5`** — sobe o servidor e abre o Chrome com o depurador conectado
- **`Ctrl+Shift+B`** — só o servidor de desenvolvimento
- **`Ctrl+Shift+P` → Run Task** — `build` ou `preview`

### No console do navegador

```js
await testarFases()     // valida as 14 fases pelo motor real
telemetria.resumo()     // métricas da sessão (tempo, tentativas, estrelas)
telemetria.exportar()   // JSON para anexar ao relatório de playtest
```

---

## Estrutura

```
codequest/
├── index.html                 ponto de entrada (SPA)
├── vite.config.js
├── public/
│   ├── favicon.svg
│   ├── fases/                 14 JSONs, um por fase
│   └── assets/audio/musica/   faixas dos mundos (ver docs/MUSICA.md)
├── src/
│   ├── main.js                bootstrap: managers, Phaser e roteamento
│   ├── core/
│   │   ├── GameManager.js     estado global + barramento de eventos
│   │   ├── LevelLoader.js     carrega e valida o JSON da fase
│   │   ├── BlockEngine.js     interpreta a árvore de blocos
│   │   ├── BitController.js   move o Bit, detecta colisão e vitória
│   │   ├── UIManager.js       telas, HUD e modais (reativo ao estado)
│   │   ├── AudioManager.js    SFX e trilha sintetizados
│   │   ├── AuthManager.js     login com Google / convidado e sessão
│   │   └── Telemetria.js      sessão, métricas de playtest e captura de erros
│   ├── scenes/                cenas do Phaser
│   │   ├── BootScene.js       gera as texturas por código
│   │   ├── MenuScene.js
│   │   ├── MapaMundosScene.js
│   │   └── GameplayScene.js   desenha o tabuleiro e o Bit
│   ├── ui/                    componentes de interface em HTML/CSS
│   │   ├── BlocoPanel.js      editor de blocos
│   │   ├── HUD.js
│   │   ├── TelaLogin.js       porta de entrada (Google / convidado)
│   │   ├── TelaMenu.js
│   │   ├── TelaMapa.js
│   │   ├── ModalPause.js
│   │   ├── ModalVitoria.js
│   │   └── svgBit.js
│   ├── config.js              lê as variáveis de ambiente (.env.local)
│   ├── data/
│   │   ├── blocos.js          catálogo de blocos
│   │   ├── mundos.js          mundos, temas e ordem das fases
│   │   ├── criarBackendRemoto.js  liga a config da AWS ao jogador logado
│   │   ├── backends/ApiBackend.js  cliente REST do progresso na nuvem
│   │   └── ProgressoStorage.js  progresso: localStorage e/ou nuvem
│   ├── dev/testarFases.js     smoke test (só em desenvolvimento)
│   └── styles/
│       ├── main.css           layout, telas e responsividade
│       ├── tokens.css         variáveis do sistema visual
│       └── blocos.css         paleta e editor de sequência
├── tests/                     261 testes (Vitest)
├── docs/
│   ├── ARQUITETURA.md         camadas, o que é "back" e como publicar
│   ├── AUTENTICACAO.md        login com Google, .env e conciliação de progresso
│   ├── AWS.md                 infra do backend de progresso (API Gateway/Lambda/DynamoDB)
│   ├── CONFORMIDADE.md        rastreabilidade com o Contrato e o Directions
│   ├── MUSICA.md              formato e como instalar as faixas dos mundos
│   ├── REDESIGN.md            justificativa da direção visual
│   ├── GDD-DIFF.md            o que mudou em relação ao GDD/SDD/TDD
│   └── EVENTOS.md             catálogo de eventos entre os módulos
├── eslint.config.js
├── sonar-project.properties
└── .github/workflows/
    ├── ci.yml                 lint + testes + cobertura (push e PR)
    └── deploy.yml             publica só se o CI passar
```

---

## Arquitetura

**Phaser desenha o mundo, DOM/CSS desenha a interface.**

O tabuleiro, o Bit e as animações vivem no canvas do Phaser — é onde a engine
agrega valor e por onde o projeto escala para efeitos mais ricos. Já os blocos,
o HUD, o mapa e os modais são HTML/CSS: em DOM eles ganham tipografia nítida,
responsividade e alvos de toque acessíveis de graça, coisas que reimplementar
no canvas custaria caro e renderia pior.

Os módulos não se chamam diretamente. Tudo passa pelo barramento de eventos do
`GameManager` — ver [docs/EVENTOS.md](docs/EVENTOS.md).

### Nenhum asset de terceiros

Não há sprites nem fontes em arquivo. Os tiles e o Bit são desenhados por código
com `Graphics` e virados em textura no `BootScene`; a chave e a casa são emoji;
e os efeitos sonoros saem de osciladores da Web Audio API. Isso mantém o bundle
pequeno, o carregamento instantâneo e elimina qualquer questão de licenciamento.

A música de fundo aceita faixas próprias em `public/assets/audio/musica/`. Se o
arquivo não existir, o jogo toca um arpejo sintetizado no lugar — ver
[docs/MUSICA.md](docs/MUSICA.md).

### O interpretador é um gerador

`BlockEngine.comandos()` é uma `function*`. Como só avança quando o executor
pede o próximo comando, os blocos `Se dá pra ir` e `Repetir até chegar`
conseguem avaliar a condição já com o Bit na posição resultante do comando
anterior — sem máquina de estados nem pilha de execução manual.

---

## Formato de fase

Cada fase é um JSON em `public/fases/`, validado pelo `LevelLoader` no
carregamento.

```json
{
  "id": "mundo1-fase1",
  "nome": "Primeiros Passos",
  "mundo": 1,
  "conceito": "sequencia",
  "minBlocos": 4,
  "grid": { "colunas": 8, "linhas": 7 },
  "bitPosicaoInicial": { "col": 1, "lin": 3, "orientacao": "direita" },
  "tiles": [[1,1,1,1,1,1,1,1], "..."],
  "posicaoChave": { "col": 3, "lin": 3 },
  "posicaoSaida": { "col": 5, "lin": 3 },
  "blocosDisponiveis": ["andar", "virar_esq", "virar_dir"],
  "fala": "Toque em ANDAR para eu me mexer!",
  "dica": "Use o bloco ANDAR quatro vezes seguidas.",
  "sequenciaIdeal": ["andar", "andar", "andar", "andar"]
}
```

**Legenda do `tiles`:** `0` chão · `1` parede · `2` saída · `3` chave · `4`
posição inicial do Bit.

Para criar uma fase nova: adicione o JSON em `public/fases/`, registre o id em
`ORDEM_FASES` (`src/data/mundos.js`) e a solução de referência em
`src/dev/testarFases.js`. Rode `testarFases()` para confirmar que ela é
solucionável e que o `minBlocos` corresponde à solução ótima.

---

## Progressão

| Mundo | Cenário | Conceito | Bloco novo | Fases |
|---|---|---|---|---|
| 1 — Floresta Mágica | grama | Sequências | `Andar`, `Virar` | 5 |
| 2 — Fábrica de Engrenagens | metal | Repetição contada | `Repetir N×` | 3 |
| 3 — Caverna Misteriosa | cristal | Condicionais | `Até chegar`, `Se dá pra ir` | 3 |
| 4 — Cidade Futurista | neon | Funções | `Usar truque` | 3 |

O GDD prevê 20 fases (5 por mundo); há 14 implementadas.

---

## Publicação

`git push` na `main` dispara o workflow em `.github/workflows/deploy.yml`, que
builda e publica no GitHub Pages. O `base` do `vite.config.js` precisa bater com
o nome do repositório.

---

## Stack

| Categoria | Ferramenta |
|---|---|
| Engine | Phaser 3 |
| Empacotador | Vite |
| Linguagem | JavaScript (ES6+, módulos nativos) |
| Persistência | `localStorage`; nuvem opcional na AWS (ver [docs/AWS.md](docs/AWS.md)) |
| Autenticação | Google Identity Services (ou modo convidado) |
| Áudio | Web Audio API (sintetizado) |
| Hospedagem | GitHub Pages (jogo) + AWS serverless (progresso, opcional) |

O editor de blocos é próprio, não Blockly — a justificativa está em
[docs/GDD-DIFF.md](docs/GDD-DIFF.md).
