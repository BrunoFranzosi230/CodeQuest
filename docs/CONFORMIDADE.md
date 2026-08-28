# Conformidade com o Contrato Pedagógico e o Portfolio Directions

Rastreabilidade entre o que é exigido e onde está atendido no projeto.
Fontes: Contrato Pedagógico Portfólio + PAC VIII (2026/2) e
[Portfolio Directions — Jogos Digitais](https://github.com/CatolicaSC-Portfolio/The-Portfolio-Playbook).

---

## 1. A pergunta do backend

**O Directions da linha Jogos Digitais não exige backend, banco de dados, contas
de usuário nem persistência online.** Mais que isso, o Directions GERAL marca
como 🚫 **Não Usar**, desde 2026-02:

- *"Plataforma que oferece banco de dados, autenticação, storage"* — Firebase,
  Supabase e equivalentes
- *"Plataforma otimizada para front-end (Vercel, Netlify, Render)"*

Ou seja: os dois caminhos mais rápidos para "ter um backend" estão vedados.

Somado a isso, *"projeto inacessível — link quebrado ou fora do ar"* é **linha
vermelha** (reprova direto, slide 13). Um site estático praticamente não sai do
ar; um backend em camada gratuita hiberna e pode estar fora justamente no
momento em que a banca abre o link.

**Decisão:** manter a aplicação 100% cliente, como o GDD 5.3 já determinava, e
investir o esforço nas exigências que de fato existem — abaixo.

---

## 2. Portfolio Directions — Jogos Digitais

| Exigência | Situação | Onde |
|---|---|---|
| Jogável do início ao fim, com loop completo | ✅ | 14 fases, 4 mundos |
| Build funcional distribuída | ⚠️ ver §4 | `npm run build` → `dist/` |
| Código-fonte em repositório acessível | ✅ | GitHub |
| Documentação seguindo o template de GDD | ✅ | GDD v0.3 + [GDD-DIFF.md](GDD-DIFF.md) |
| Personagem controlável, regras, objetivo, vitória/derrota | ✅ | Bit, chave + casa, estrelas |
| Interface navegável (menus, HUD, feedback visual/sonoro) | ✅ | menu, mapa, HUD, SFX |
| **Cobertura de testes: 50% dos sistemas de lógica** | ✅ **98% de linhas** | `tests/` |
| **Pipeline CI/CD com build automatizado** | ✅ | [ci.yml](../.github/workflows/ci.yml) |
| **Análise estática de código** | ✅ | ESLint + [sonar-project.properties](../sonar-project.properties) |
| **Telemetria de sessão / crash reporting / log de erros** | ✅ | [Telemetria.js](../src/core/Telemetria.js) |
| Wiki no repositório | ⬜ pendente | conteúdo pronto em `docs/` |

### Cobertura — o número e o recorte

```
Statements   96.76%      Branches   89.94%
Functions    95.60%      Lines      98.13%      216 testes
```

O recorte está em [vite.config.js](../vite.config.js): a métrica cobre o
**domínio e a camada de dados** (`GameManager`, `LevelLoader`, `BlockEngine`,
`BitController`, `Telemetria`, `src/data/`) — que são os "sistemas de lógica de
jogo". Cenas, UI e áudio são renderização e ficam fora.

O limiar de 50% é aplicado pelo próprio Vitest: **abaixo disso o build falha**.

### O teste que mais protege o projeto

[`tests/fases.test.js`](../tests/fases.test.js) roda o motor de verdade contra a
solução de referência de cada uma das 14 fases e verifica que ela vence e que
usa exatamente `minBlocos`. **Uma fase impossível quebra o build** — já pegou um
bug real (a chave da 4-3 estava fora do caminho).

Verificado sabotando `minBlocos` de uma fase: o portão retorna código 1.

---

## 3. Contrato Pedagógico — os três pilares (slide 6)

### 1 · Execução

| Item | Situação |
|---|---|
| Implementar a arquitetura da RFC | ✅ módulos do C4: `GameManager`, `LevelLoader`, `BlockEngine`, `BitController`, `UIManager` |
| Entregas modulares (MVPs) | ✅ um mundo por MVP |
| Documentação que permita contribuição externa | ✅ [README](../README.md), [ARQUITETURA](ARQUITETURA.md), [EVENTOS](EVENTOS.md) |
| Commits frequentes revisados por pares | ⬜ depende do squad (PAC VIII) |

### 2 · Engenharia

| Item | Situação |
|---|---|
| Clean Architecture | ✅ camadas com dependência única para dentro — ver [ARQUITETURA.md](ARQUITETURA.md) |
| SOLID — responsabilidade única | ✅ `ProgressoStorage` é o único ponto que toca `localStorage`; `BlocoPanel` o único acoplado ao visual dos blocos |
| SOLID — inversão de dependência | ✅ `BitController` recebe `visual` por injeção e roda sem Phaser |
| Design Patterns | ✅ Observer (barramento de eventos), Repository (`ProgressoStorage`), State (`appState`), Iterator (gerador do `BlockEngine`) |
| Refatorar a partir de code reviews | ⬜ depende do squad (PAC VIII) |

### 3 · DevOps

| Item | Situação |
|---|---|
| Pipeline CI/CD configurado e funcionando | ✅ [ci.yml](../.github/workflows/ci.yml) + [deploy.yml](../.github/workflows/deploy.yml) |
| Deploy acessível | ⚠️ ver §4 |
| Estratégia de observabilidade | ✅ [Telemetria.js](../src/core/Telemetria.js) |
| Ambientes separados de desenvolvimento e produção | ⬜ ver §4 |

---

## 4. Os dois pontos que ainda dependem de você

### 4.1 Hospedagem — confirmar com o professor

O Directions da linha Jogos manda hospedar em **"Itch.io, loja ou servidor
próprio"**. **GitHub Pages não é citado em nenhum dos dois documentos** — nem
permitido, nem proibido.

Hoje o `deploy.yml` publica no GitHub Pages. Leve isso a uma das cinco
orientações antes de fechar. Se não for aceito, o caminho mais direto é o
**Itch.io**: aceita upload de um zip de build HTML5, que é exatamente o conteúdo
de `dist/`.

> Impacto se ficar mal resolvido: *"projeto inacessível"* é linha vermelha.

### 4.2 Ambientes separados

O contrato pede *"ambientes separados: desenvolvimento e produção"*. Hoje há um
só. O caminho mais barato é publicar a branch `develop` num endereço de teste e
a `main` no endereço final — o `ci.yml` já roda em `develop`.

---

## 5. Como reproduzir a verificação

```bash
npm ci
npm run verificar     # análise estática + testes + cobertura com limiar
npm run build         # build de produção
```

O mesmo comando roda no CI a cada push e pull request, e o deploy só publica se
ele passar.

---

## 6. Ética, integridade e LGPD (critério 5 do Demo Day)

O público são **crianças de 6 a 11 anos**, o que torna dado pessoal um assunto
sensível. O projeto coleta **zero dado pessoal**:

- sem cadastro, sem login, sem nome, sem e-mail
- a telemetria usa um id de sessão aleatório e efêmero, que não reidentifica
  ninguém — há um teste que falha se um campo sensível aparecer
  ([Telemetria.test.js](../tests/Telemetria.test.js))
- nada sai do navegador: não há servidor para onde enviar
- nenhum asset de terceiros — sprites, tiles e áudio são gerados por código,
  então não há licença de terceiro em jogo

`npm audit`: **0 vulnerabilidades**.
