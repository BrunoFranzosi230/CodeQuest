# Arquitetura — o que é front, o que é "back" e onde cada coisa mora

## Resposta curta

**O CodeQuest não tem backend.** Não há servidor, banco de dados nem API. Tudo
roda no navegador da criança.

Isso não é uma pendência — é o que o GDD determina:

> **GDD 5.3 — O jogo não inclui:** *"Backend ou banco de dados — tudo roda no cliente"*
>
> **GDD 12.2 — Limitações conhecidas:** *"Sistema de save em nuvem — save local via `localStorage` apenas"*

Por isso as pastas **não** estão divididas em `frontend/` e `backend/`: não haveria
o que colocar em `backend/`.

### Verificação

| Verificado | Resultado |
|---|---|
| Chamadas de rede em `src/` | **1** — `LevelLoader` faz `fetch` de `public/fases/*.json` |
| Essa chamada é uma API? | Não. É arquivo estático, igual a carregar uma imagem |
| Quem toca em `localStorage` | Apenas `src/data/ProgressoStorage.js` |
| Dependências de produção | 1 — `phaser` |

---

## O padrão que o projeto segue: camadas

No lugar de front/back, o projeto usa **separação em camadas** — que é o padrão
adequado para uma aplicação cliente, e mapeia 1:1 nas pastas:

```
src/
├── ui/       ┐
├── styles/   ├─ 1. APRESENTAÇÃO   o que a criança vê e toca
├── scenes/   ┘   (+ renderização)
│
├── core/     ── 2. DOMÍNIO         as regras do jogo
│
└── data/     ── 3. DADOS           persistência e configuração
public/fases/  ┘                    ("backend local")
```

A regra que mantém isso honesto: **cada camada só conhece a de baixo.** A UI não
sabe que existe Phaser; o domínio não sabe que existe DOM; os dados não sabem
que existe jogo.

### 1. Apresentação — `src/ui/`, `src/styles/`, `src/scenes/`

| Pasta | Responsável por |
|---|---|
| `ui/` | Painel de blocos, HUD, mapa de mundos, modais — HTML/CSS |
| `styles/` | Sistema visual (`tokens.css`), blocos (`blocos.css`), layout (`main.css`) |
| `scenes/` | Cenas do Phaser — só a `GameplayScene` desenha no canvas |

Interface em DOM, mundo do jogo em canvas. Detalhe em [README.md](../README.md).

### 2. Domínio — `src/core/`

É o coração, e **não depende de navegador nem de Phaser**:

| Arquivo | Responsável por |
|---|---|
| `GameManager.js` | Estado global e barramento de eventos |
| `BlockEngine.js` | Interpreta a árvore de blocos |
| `BitController.js` | Move o Bit, detecta colisão, chave e vitória |
| `LevelLoader.js` | Carrega e **valida** o JSON da fase |
| `UIManager.js` | Orquestra a apresentação reagindo ao estado |
| `AudioManager.js` | Sintetiza SFX e trilha |

Prova de que a separação é real: o `BitController` funciona **sem parte
gráfica** — é assim que o `src/dev/testarFases.js` roda as 14 fases sem abrir
o jogo.

### 3. Dados — `src/data/` e `public/fases/`

Esta é a camada que **faz o papel de backend**. O seu próprio TDD já a nomeia
assim, na seção 6: *"Camada de Dados / Backend Local"*.

| Onde | O quê | Equivalente num sistema com servidor |
|---|---|---|
| `public/fases/*.json` | As 14 fases | tabela `fases` do banco |
| `data/ProgressoStorage.js` | Progresso do jogador | repositório + tabela `progresso` |
| `data/mundos.js` | Mundos, temas, ordem | dados de configuração |
| `data/blocos.js` | Catálogo de blocos | dados de configuração |

**`ProgressoStorage.js` é o único ponto do sistema que toca em `localStorage`.**
Isso é proposital: é o mesmo papel de uma camada de repositório. Ele tem schema
versionado (`versao: 1`), método de migração e degrada sem quebrar quando o
armazenamento não está disponível (navegação anônima).

---

## Como publicar na web

O CodeQuest é um **site estático**. Não precisa de servidor Node, nem banco, nem
variável de ambiente, nem configuração de CORS.

```bash
npm run build      # gera dist/
```

O `dist/` contém só arquivos que qualquer servidor entrega:

```
dist/
├── index.html
├── favicon.svg
├── assets/
│   ├── index-*.css      ~17 kB   (o CSS do jogo)
│   ├── index-*.js       ~46 kB   (o código do jogo)
│   └── phaser-*.js    ~1.48 MB   (a engine, em chunk separado)
└── fases/               14 JSONs
```

Phaser fica em chunk próprio porque muda raramente: o navegador o mantém em
cache mesmo quando você atualiza o código do jogo.

### Publicação automática (já configurada)

`git push` na `main` dispara [.github/workflows/deploy.yml](../.github/workflows/deploy.yml),
que builda e publica no GitHub Pages.

**Único ajuste necessário:** o `base` do [vite.config.js](../vite.config.js) precisa
ser igual ao nome do repositório. Hoje está `'/CodeQuest/'`, o que gera
`https://usuario.github.io/CodeQuest/`. Se o repositório tiver outro nome, os
arquivos dão 404.

### Funciona em qualquer hospedagem estática

GitHub Pages, Netlify, Vercel, Cloudflare Pages, ou até uma pasta no servidor da
faculdade. É só entregar o conteúdo de `dist/`.

---

## E se um dia precisar de backend de verdade

Cenários que exigiriam servidor: salvar progresso na nuvem, painel do professor
acompanhando a turma, ranking entre alunos, fases criadas pelo professor.

O que mudaria:

```
codequest/
├── client/          ← o que existe hoje
└── server/          ← novo
```

E no código, **um arquivo só**: `ProgressoStorage.js` troca `localStorage` por
`fetch` para a API. Os métodos públicos (`carregar`, `salvar`,
`registrarConclusao`, `estrelasDaFase`, `totalEstrelas`, `estaDesbloqueada`)
continuam com a mesma assinatura, e nenhum outro módulo fica sabendo.

É exatamente para isso que serve concentrar a persistência numa camada só.

> ⚠️ Antes de ir por esse caminho, lembre que o público são **crianças de 6 a 11
> anos**. Login implica coletar dado pessoal de menor de idade, o que puxa LGPD e
> consentimento dos pais. Hoje o jogo coleta **zero dado pessoal** — isso é um
> argumento de defesa, não uma limitação técnica.

---

## Resumo para a banca

| Pergunta | Resposta |
|---|---|
| Onde está o frontend? | `src/ui/`, `src/styles/`, `src/scenes/` |
| Onde está a lógica de negócio? | `src/core/` — sem dependência de DOM ou Phaser |
| Onde está o backend? | Não existe. `src/data/` faz esse papel localmente (TDD §6) |
| Onde ficam os dados? | `public/fases/` (fases) e `localStorage` (progresso) |
| Como sobe pra web? | `npm run build` → `dist/` em qualquer host estático |
| Precisa de servidor? | Não |
