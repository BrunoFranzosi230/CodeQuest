# O que mudou em relação ao GDD v0.3, ao SDD e ao TDD

Guia de atualização da documentação, seção por seção.
As seções 1 a 5 tratam do **GDD**; a seção 6 trata do **SDD e do TDD**.

---

## 1. O que o protótipo SEGUE (não precisa mexer)

| Seção | Item | Situação |
|---|---|---|
| 1.1 | Pitch: robô Bit, blocos visuais, sem digitar, 100% português | ✅ |
| 1.3 | Público 6–11 anos | ✅ |
| 1.4 | Web, sem instalação, responsivo em tablet | ✅ |
| 4.1 | Core loop completo (ver → montar → executar → ajustar → completar) | ✅ |
| 4.3 | Highlight do bloco em execução | ✅ |
| 4.3 | Reset devolve o Bit ao início **sem apagar os blocos** | ✅ |
| 4.3 | Objetivo: pegar a chave e chegar na saída | ✅ |
| 4.4 | Câmera top-down fixa, fase inteira na tela sem scroll | ✅ |
| 4.5 | Tabela de estrelas: `= mínimo` → ★★★, `até +2` → ★★☆, `+3 ou mais` → ★☆☆ | ✅ exata |
| 4.5 | Saída só abre com a chave coletada | ✅ |
| 4.5 | Dica opcional após 3 tentativas falhas | ✅ |
| 4.5 | Fases desbloqueiam em sequência; cada mundo traz um bloco novo | ✅ |
| 4.2 | Rejogar fase antiga para melhorar o recorde (guarda a melhor nota) | ✅ |
| 5.2 | Os 4 mundos, seus temas e conceitos | ✅ |
| 5.3 | Sem multiplayer, sem login, sem editor, sem app nativo, sem backend | ✅ |
| 6.1 | Fluxo Menu → Mapa → Gameplay → Pause → Vitória → Próxima | ✅ |
| 6.3 | HUD: nome da fase, ícone de objetivo, estrelas, botão de pause | ✅ |
| 6.4 | `Enter` executa, `R` recomeça, `Esc` abre/fecha o pause | ✅ |
| 7.1 | Cartoon 2D flat, sem gradientes complexos, bordas arredondadas | ✅ |
| 7.4 | Grade de 8 colunas × 7 linhas | ✅ |
| 8.1 | SFX de encaixe, execução, vitória, erro e chave coletada | ✅ |
| 8.3 | Animações do Bit: idle, andando, girando, comemorando, tropeçando | ✅ |
| 9.6 | Fase definida por dados declarativos, não por código | ✅ |
| — | Progresso em `localStorage`, sem servidor | ✅ |

---

## 2. O que MUDOU (precisa reescrever no GDD)

### 2.1 — Seção 7.2 · Paleta de cores → **reescrever a tabela inteira**

O fundo deixou de ser escuro. Substituir:

| Papel | GDD v0.3 | Novo |
|---|---|---|
| Fundo do jogo | `#0F172A` | Gradiente céu `#7DD3FC → #C7F0FF` |
| Painel UI | `#1E293B` | `#FFFFFF` / `#FFF8EC` |
| Contorno (novo) | — | `#2B2140`, 4px em todos os elementos |
| Texto principal | `#FFFFFF` | `#2B2140` (fundo agora é claro) |
| Tile de chão | `#15803D` | `#6EE7A0` / `#86EFAC` alternados |
| Tile de parede | `#374151` | `#C98A4B` com relevo |

As cores dos **blocos** mantêm a família semântica do GDD (azul = mover, teal = girar,
roxo = repetir, laranja = condicional, rosa = função), só mais saturadas para funcionar
sobre fundo claro. Uma cor nova: **índigo `#6366F1`** para o bloco `Repetir até chegar`.

### 2.2 — Seção 7.3 · Tipografia → **todos os tamanhos subiram**

| Uso | GDD v0.3 | Novo |
|---|---|---|
| Label de bloco | 11px | **16px** |
| Texto de HUD | 11–12px | **17–20px** |
| Botão principal | 12–15px | **30px** |
| Título de fase / modal | 15–16px | **20 / 34px** |
| Texto secundário | 10–11px | **14–18px** |

> **Remover a contradição:** a tabela atual lista 10px e 11px logo acima da regra que diz
> *"para crianças de 6 anos, o mínimo recomendado é 14px"*. Agora nenhum texto de leitura
> fica abaixo de 14px (as únicas exceções são as estrelinhas decorativas do mapa, 11px,
> que são glifos e não texto).

### 2.3 — Seção 7.4 · Grid e tiles → **tile deixou de ser fixo**

- **De:** `Tile padrão 40×40px`
- **Para:** `Tile de 26 a 74px, calculado em tempo real para preencher o espaço disponível`

O tamanho é recalculado quando a janela muda **e** quando o painel de blocos cresce
(via `ResizeObserver`). Em desktop 1366px o tile fica em ~73px — quase o dobro do
especificado.

### 2.4 — Seção 7.5 · Blocos de código → **reescrever a tabela**

| Atributo | GDD v0.3 | Novo |
|---|---|---|
| Altura | 24–28px | **58px** (52px quando aninhado) |
| Largura | ~96 / 104px | **100% do painel** (o painel é que tem largura fixa) |
| Border-radius | 4–5px | **16px** |
| Fonte | 11px | **16px** |

Regra nova a acrescentar: **nenhum elemento interativo tem menos de 48px** em qualquer
dimensão (referência: WCAG 2.5.5 pede 44px para adultos; 6 anos exige mais).

### 2.5 — Seção 4.3 · Mecânica principal → **a mudança mais importante**

- **De:** *"Blocos de código — Arrastar blocos do painel lateral para a sequência (drag-and-drop)"*
- **Para:** *"Blocos de código — **Tocar** no bloco do painel o adiciona ao programa. Um
  cursor amarelo piscando mostra onde o próximo bloco vai entrar. Arrastar continua
  disponível no desktop, como atalho secundário."*

**Justificativa para registrar na seção 13:** arrastar exige pressionar, manter e soltar
com precisão ao mesmo tempo — é a operação mais difícil para uma criança de 6 anos e a
causa mais comum de abandono em apps infantis.

### 2.6 — Movimento relativo em vez de absoluto

A seção 5.1 fala em blocos *"mover, girar"* (relativo), mas o exemplo JSON da 9.6 mostra
`["mover_direita","girar_cima","girar_baixo"]` (absoluto). **O GDD se contradiz aqui.**

O protótipo usa **relativo**: `Andar` (para frente), `Virar ↰`, `Virar ↱`. É o modelo do
LightBot, citado como referência direta na 2.1, e é o que torna os Mundos 2, 3 e 4
possíveis — um laço ou uma função só fazem sentido se o mesmo bloco produz efeitos
diferentes conforme a orientação do Bit. Atualizar o exemplo da 9.6.

### 2.7 — Seção 4.5 · Derrota → **não reinicia sozinho na hora**

- **De:** *"A fase reinicia automaticamente com o Bit na posição inicial"*
- **Para:** *"O Bit fica parado onde errou, com animação de tropeço e uma fala explicando
  o que aconteceu. O reinício acontece no próximo Executar."*

**Motivo:** reiniciar instantaneamente apaga a informação mais útil da tentativa — *onde*
deu errado. Deixar o Bit no lugar do erro é o que permite a criança diagnosticar sozinha.

### 2.8 — Seção 4.5 · Dica → **texto por fase, não revelação de bloco**

- **De:** *"A dica revela o próximo bloco correto"*
- **Para:** *"O Bit fala uma dica em linguagem natural, escrita por fase"* (ex.: *"Repita 4
  vezes: andar, andar, virar à direita"*).

Isso é mais barato de implementar e ensina a **estratégia**, não a resposta. Vale testar
as duas formas no playtest — a 10.3 já previa refinar esse sistema.

### 2.9 — Seção 7.6 · Arte conceitual do Bit

- **De:** *"expressão neutra, levemente pensativo"*
- **Para:** olhos grandes que piscam sozinhos, bochechas rosadas, sorriso permanente,
  antena, esticada ao andar (squash & stretch).

**Decisão nova para a seção 13:** o rosto do Bit **nunca gira**. Uma seta amarela orbita
ao redor dele indicando a direção. Se o corpo inteiro girasse, o Bit ficaria de cabeça
para baixo ao andar para o sul — perdendo a expressividade que cria o vínculo emocional
que a própria 2.2 aponta como ponto forte das referências.

### 2.10 — Seção 14.1 · Assets → **nenhum asset externo**

O GDD prevê sprites do Kenney.nl, música do OpenGameArt e SFX do freesound.org. O
projeto **não usa nenhum arquivo de asset**:

- os tiles e o Bit são desenhados por código com `Graphics` do Phaser e virados em
  textura no `BootScene`;
- a chave e a casa são emoji;
- todo o áudio (SFX e trilha dos 4 mundos) sai de osciladores da Web Audio API.

Ganho triplo: bundle pequeno, carregamento instantâneo e **zero questão de
licenciamento** para a banca cobrar.

---

## 3. O que é NOVO (não existia no GDD)

| Item | Onde encaixar |
|---|---|
| **6º tipo de bloco: `Repetir até chegar`** (laço aberto) | 5.1 e 5.2 — o GDD prevê 5 tipos |
| **Tema visual por mundo** (floresta / metal / cristal / neon) | 7.4 |
| **Balão de fala do Bit** no início de cada fase | Já previsto como melhoria na 10.3 ✅ |
| **Estrelas ao vivo no HUD** (a 3ª apaga quando passa do mínimo) | 6.3 — detalhar |
| **Objetivo no HUD como ícones** `🔑 → 🏠`, a chave apaga ao ser pega | 6.3 |
| **Botão de mudo** | 6.3 |
| **A função se chama "truque"** ("função" não significa nada aos 7 anos) | 5.1 / 7.5 |

### Por que o `Repetir até chegar` foi acrescentado

No Mundo 3, contar quantas repetições um labirinto precisa é um problema de **aritmética**,
não de lógica — e distrai do conceito da fase. Com o laço aberto, a criança foca na
condição. Efeito colateral pedagógico: as três fases do mundo são resolvidas pelo **mesmo
programa de 4 blocos**, e essa é a descoberta.

### Por que as fases 4-1 e 4-2 não têm o bloco `Repetir` na paleta

Num caminho puramente repetitivo, **um laço sempre vence uma função** em número de blocos —
a criança nunca teria motivo para usar o truque. Os caminhos dessas fases repetem o mesmo
motivo em *pontos separados*, situação em que a função é de fato a solução mais curta. Na
4-3 o `Repetir` volta e a função continua ganhando (7 blocos contra 8).

---

## 4. O que ainda FALTA para o escopo da seção 5.1

| Item do GDD | Situação |
|---|---|
| 20 fases (4 mundos × 5) | **14 feitas** — 5 / 3 / 3 / 3. Faltam 6 |
| 3 skins desbloqueáveis do Bit | ❌ não implementado |
| Loop secundário: estrelas desbloqueiam skins (4.2) | ❌ estrelas existem, skins não |
| Música própria dos Mundos 3 e 4 (8.2) | ⚠️ hoje reutilizam o tema do Mundo 1 |
| Animação "Bit pensando" em idle longo (8.3) | ❌ não implementado |
| SFX próprio para highlight de bloco (8.1) | ❌ usa o som de passo |
| Componentes separados do C4 (9.4) | ❌ está tudo em `js/game.js` |

---

## 5. Mudanças no SDD e no TDD

### 5.1 — TDD seção 1 · Stack → **o editor de blocos é próprio, não Blockly**

| Categoria | TDD atual | Implementado |
|---|---|---|
| Engine | Phaser 3.x | ✅ Phaser 3.90 |
| Empacotador | Vite (opcional) | ✅ Vite 6 — deixou de ser opcional |
| **Editor de blocos** | **Google Blockly** | **sistema próprio (`src/ui/BlocoPanel.js`)** |
| Assets | Kenney / OpenGameArt | ❌ nenhum — tudo gerado por código |
| Áudio | Phaser Sound Manager | Web Audio API direto (síntese) |

**Por que trocar o Blockly.** O visual padrão do Blockly é exatamente a estética de IDE
que o redesign corrigiu, e ele é construído em torno de arrastar — a interação que este
projeto move para segundo plano. Chegar ao resultado atual customizando o Blockly custaria
mais que as ~250 linhas do `BlocoPanel.js`, que já suportam sequência, laço contado, laço
aberto, condicional com dois ramos e função.

**O que se ganha em troca:** o `BlocoPanel` é o único módulo acoplado ao formato visual
dos blocos. Se o Blockly voltar a ser um requisito, ele é substituível sozinho — o
`BlockEngine` recebe a mesma árvore de blocos de qualquer maneira.

### 5.2 — SDD 3.3 · Editor de Blocos → **toque no lugar de arrastar**

A tabela de comportamentos precisa ser reescrita:

| Ação | SDD atual | Implementado |
|---|---|---|
| Inserir bloco | arrastar do painel para o slot | **tocar** no bloco do painel |
| Onde o bloco entra | slot escolhido no drop | cursor amarelo piscando marca a posição |
| Remover bloco | arrastar para fora | tocar no ✕ do bloco |
| Reordenar | drag dentro da lista | tocar num bloco move o cursor para depois dele |
| Sequência cheia | bloqueia novos drags | limite de 30 blocos |

Arrastar continua funcionando no desktop (HTML5 Drag & Drop) como atalho secundário.

### 5.3 — SDD 3.4 · BlockEngine → **expansão preguiçosa, não fila pré-montada**

- **De:** *"Expande estruturas de controle em uma fila linear de comandos atômicos"*
- **Para:** *"Percorre a árvore sob demanda, entregando um comando por vez"*

**Motivo, e é um motivo forte:** uma fila pré-montada funciona para `repetir(N)`, mas é
impossível para `Se dá pra ir` e `Repetir até chegar` — os dois dependem de onde o Bit
está *naquele instante*, e a posição só existe depois que os comandos anteriores rodaram.

A solução é um gerador (`function*`). Como ele só avança quando o executor pede o próximo
comando, avalia as condições já com o estado atualizado — sem máquina de estados nem
pilha de execução manual. São ~40 linhas em `src/core/BlockEngine.js`.

### 5.4 — TDD seção 2 · Estrutura de pastas → três ajustes

| TDD | Implementado | Por quê |
|---|---|---|
| `src/data/fases/*.json` | `public/fases/*.json` | o `LevelLoader` busca por `fetch`; em `src/` o Vite trataria como módulo e o arquivo não seria servido como estático |
| `src/ui/BlocklyPanel.js` | `src/ui/BlocoPanel.js` | ver §5.1 |
| `src/styles/main.css` | + `tokens.css` e `blocos.css` | `main.css` continua sendo a entrada e importa os outros dois |

Arquivos acrescentados, todos dentro das pastas já previstas: `src/core/AudioManager.js`,
`src/ui/TelaMenu.js`, `src/ui/TelaMapa.js`, `src/ui/svgBit.js`, `src/data/blocos.js`,
`src/data/mundos.js` e `src/dev/testarFases.js`.

### 5.5 — Divisão entre Phaser e DOM

O SDD e o TDD tratam `MenuScene` e `MapaMundosScene` como cenas que desenham no canvas.
Na implementação, **só a `GameplayScene` desenha**: menu, mapa, HUD, painel de blocos e
modais são HTML/CSS, e aquelas duas cenas atuam como nós de roteamento do SceneManager.

**Motivo:** interface em DOM ganha tipografia nítida, responsividade, acessibilidade e
alvos de toque de graça. Reimplementar isso no canvas custaria caro e renderia pior. O
canvas fica com o que é jogo — tabuleiro, personagem e animação — que é onde a engine
agrega valor e por onde o projeto escala.

### 5.6 — SDD 5.1 · Formato de fase → dois campos novos

Mantido o schema inteiro (incluindo os campos redundantes `posicaoChave`/`posicaoSaida`).
Acrescentados:

- `fala` — frase do Bit ao abrir a fase, para quem ainda não lê com fluência
- `truqueIdeal` — corpo da função na solução de referência (só nas fases do Mundo 4)

E `blocosDisponiveis` passa a usar os ids relativos (`andar`, `virar_esq`, `virar_dir`,
`repetir`, `repetir_ate`, `se`, `funcao`) em vez dos absolutos — ver §2.6.

### 5.7 — TDD seção 7 · Testes

Existe um smoke test em `src/dev/testarFases.js`, carregado só em desenvolvimento. Ele
roda o `BlockEngine` e o `BitController` **de verdade** (sem parte gráfica — o
`BitController` funciona sem `visual`) contra a solução de referência de cada fase, e
verifica que ela chega na saída e que usa exatamente `minBlocos`.

```js
await testarFases()   // no console do navegador
```

Resultado atual: **14 de 14 fases OK**.

---

## 6. Linhas sugeridas para a seção 13 (Decisões Importantes)

| Data | Decisão | Motivo |
|---|---|---|
| Ago 2026 | Paleta clara em vez de escura | Fundo escuro lê como "software de adulto"; todas as referências infantis (Scratch, Code.org, LightBot) são claras |
| Ago 2026 | Toque como interação primária; arrastar vira atalho | Arrastar exige três ações motoras simultâneas — barreira principal aos 6 anos |
| Ago 2026 | Alvos de toque com mínimo de 48px | Coordenação motora fina da faixa etária |
| Ago 2026 | O rosto do Bit não gira; uma seta indica a direção | Preserva a expressividade que cria vínculo emocional |
| Ago 2026 | Mundo 3 usa laço aberto (`até chegar`) em vez de contado | Contar repetições é aritmética, não lógica; distrai do conceito |
| Ago 2026 | Blocos de movimento relativos, não absolutos | Sem isso, laços e funções não fazem sentido |
| Ago 2026 | Editor de blocos próprio em vez do Blockly | O visual padrão do Blockly é a estética de IDE que o redesign corrigiu, e ele é construído em torno de arrastar |
| Ago 2026 | Phaser desenha o mundo; DOM/CSS desenha a interface | Interface em DOM ganha tipografia, responsividade e acessibilidade de graça; o canvas fica com o que é jogo |
| Ago 2026 | Interpretador como gerador preguiçoso | Condicional e laço aberto precisam do estado do Bit em tempo de execução — uma fila pré-montada é impossível |
| Ago 2026 | Nenhum asset externo: tudo gerado por código | Bundle pequeno, carregamento instantâneo e zero questão de licenciamento |
