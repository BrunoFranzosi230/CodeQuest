# CodeQuest — Redesign visual para o público de 6 a 11 anos

Protótipo jogável que revisa a **Seção 7 (Direção Visual)** do GDD v0.3.
Abra `index.html` no navegador — sem instalação, sem build, sem dependências.

---

## 1. O diagnóstico

Os mockups da seção 6.2 do GDD mostram uma interface **escura, densa e pequena**:
fundo `#0F172A`, painéis `#1E293B`, blocos de 24–28 px de altura e textos de 10–12 px.

Isso é a linguagem visual de uma **IDE ou dashboard de desenvolvedor** — exatamente o
oposto do que a faixa etária alvo reconhece como "jogo". O próprio GDD registra a
contradição na seção 7.3: a tabela de tipografia lista tamanhos de 10 e 11 px e, logo
abaixo, a regra diz que *"para crianças de 6 anos, o mínimo recomendado é 14px"*.

Três problemas concretos:

| Problema | Por que importa para 6–11 anos |
|---|---|
| Paleta escura | Crianças associam fundo escuro a "coisa de adulto/trabalho". Jogos infantis de referência (Scratch, Code.org, LightBot) são claros e saturados. |
| Alvos de toque de 24–28 px | A coordenação motora fina aos 6 anos exige alvos de **no mínimo 48 px** (WCAG 2.5.5 pede 44 px para adultos). Em tablet, blocos de 24 px são inclicáveis. |
| Texto de 10–11 px | Abaixo do limiar de leitura confortável para quem ainda está alfabetizando. |

---

## 2. As mudanças

### 2.1 Paleta — de "IDE escura" para "dia de sol"

| Papel | GDD v0.3 | Redesign | Motivo |
|---|---|---|---|
| Fundo | `#0F172A` | Gradiente céu `#7DD3FC → #C7F0FF` | Ambiente diurno, alegre, com nuvens e sol animados |
| Painéis | `#1E293B` | `#FFFFFF` / `#FFF8EC` | Cartões de papel claro, alto contraste com os blocos |
| Contorno | — | `#2B2140` (4 px em tudo) | Traço grosso estilo desenho animado; separa formas sem depender de cor |
| Chão | `#15803D` | `#6EE7A0` / `#86EFAC` xadrez | Grama viva e legível; xadrez ajuda a **contar casas** |
| Parede | `#374151` cinza | `#C98A4B` com relevo | Blocos de terra reconhecíveis, não "célula de tabela" |

As cores dos blocos de comando foram mantidas na mesma **família semântica** do GDD
(azul = mover, teal = girar, roxo = repetir, laranja = condicional, rosa/magenta = função),
mas com saturação maior para funcionar sobre fundo claro.

### 2.2 Escala — tudo cresceu

| Elemento | GDD v0.3 | Redesign | Ganho |
|---|---|---|---|
| Altura do bloco | 24–28 px | **58 px** (52 px aninhado) | ~2,2× |
| Tile do tabuleiro | 40 px fixo | **26–74 px, calculado** | Preenche a tela disponível |
| Texto do bloco | 11 px | **16 px** | Acima do mínimo da própria regra do GDD |
| Botão principal | 12–15 px | **30 px**, 78 px de altura | Impossível errar o clique |
| Border-radius | 4–5 px | **16–26 px** | Formas macias, "de brinquedo" |

Nenhum elemento interativo tem menos de **48 px** em qualquer dimensão.

### 2.3 Toque em vez de arrastar — a mudança mais importante

O GDD define drag-and-drop como mecânica central (seção 4.3). **Arrastar é a operação
mais difícil para uma criança de 6 anos** — exige pressionar, manter e soltar com
precisão simultânea, e é a causa mais comum de frustração em apps infantis.

O redesign inverte a prioridade:

- **Tocar no bloco** o adiciona ao programa (primário, funciona em qualquer dispositivo)
- Um **cursor amarelo piscando** mostra exatamente onde o próximo bloco vai entrar
- Tocar num bloco já colocado move o cursor para depois dele
- Arrastar continua funcionando no desktop, como atalho para quem prefere

### 2.4 Feedback sem depender de leitura

Para crianças que ainda não leem com fluência (melhoria já prevista na seção 10.3 do GDD):

- **Balão de fala do Bit** no início de cada fase, explicando o objetivo em uma frase curta
- **Objetivo no HUD como ícones**: `🔑 → 🏠`. A chave fica cinza quando é coletada
- **Todo bloco tem ícone antes do texto**: 👣 andar, ↰ ↱ virar, 🔁 repetir
- **Estrelas ao vivo no HUD**: a 3ª estrela apaga sozinha quando a criança passa do número
  mínimo de blocos. Ela descobre "menos blocos é melhor" sem ninguém explicar

### 2.5 O Bit ganhou personalidade

O GDD descreve o Bit como *"robozinho quadrado com expressão neutra"*. Neutro não cria
vínculo. O redesign dá a ele: olhos grandes que **piscam sozinhos**, bochechas rosadas,
antena, sorriso permanente, animação de flutuar no menu, esticada ao andar (squash &
stretch), comemoração ao vencer e cambalhota ao bater na parede.

**Detalhe de design:** o rosto do Bit **nunca gira**. Uma seta amarela orbita ao redor dele
indicando a direção. Se o corpo inteiro girasse, o Bit ficaria de cabeça para baixo ao
andar para o sul — perdendo justamente a expressividade que cria o vínculo.

### 2.6 Erro não é punição

O GDD prevê reinício automático ao colidir. O redesign mantém isso, mas o enquadra como
acidente engraçado: o Bit tropeça, o balão diz *"Ai! Bati na parede."*, o som é cômico —
e **os blocos ficam preservados**. Nada de tela de "game over".

---

## 3. O que foi construído

```
CodeQuest/
├── index.html          estrutura das 3 telas + modais
├── css/style.css       todo o sistema visual (variáveis CSS)
├── js/levels.js        14 fases em formato de dados
├── js/audio.js         SFX e trilha sintetizados (Web Audio API)
└── js/game.js          motor, interpretador e UI
```

- **Os 4 mundos do GDD, 14 fases jogáveis**, cada um com cenário e conceito próprios
- **Blocos aninhados de verdade** — `Repetir`, `Repetir até chegar` e `Se/Senão` recebem
  outros blocos dentro, inclusive uns aos outros
- **Sistema de estrelas** (3 = número mínimo de blocos, 2 = até +2, 1 = acima disso)
- **Dica automática** após 3 tentativas falhas, como especificado na seção 4.5
- **Progresso salvo** em `localStorage`; fases desbloqueiam em sequência
- **Áudio sem arquivos**: todos os sons e a trilha são gerados por osciladores da Web
  Audio API. Zero assets para baixar, zero questão de licenciamento
- **Controles do GDD 6.4**: `Enter` executa, `R` recomeça, `Esc` abre a pausa

### Progressão dos mundos

| Mundo | Cenário | Conceito | Bloco novo | Fases |
|---|---|---|---|---|
| 1 — Floresta Mágica | grama verde | Sequências | `Andar`, `Virar` | 5 |
| 2 — Fábrica de Engrenagens | piso metálico | Repetição contada | `Repetir N×` | 3 |
| 3 — Caverna Misteriosa | cristal roxo | Condicionais | `Até chegar`, `Se dá pra ir` | 3 |
| 4 — Cidade Futurista | neon ciano | Funções | `Usar truque` | 3 |

Cada mundo troca a paleta do tabuleiro. A criança percebe que "mudou de lugar" antes
mesmo de ler o nome da fase.

### Decisões de design dos mundos 3 e 4

**Mundo 3 usa "repetir até chegar", não "repetir N vezes".** Contar quantas repetições um
labirinto precisa é um problema de aritmética, não de lógica — e distrai do que a fase
quer ensinar. Com o laço aberto, a criança foca na *condição*: "se dá pra ir, ande; se não
dá, vire". As três fases do mundo são resolvidas pelo **mesmo programa de 4 blocos**, o
que é justamente a descoberta: um programa que funciona em mapas diferentes.

**Mundo 4 chama a função de "truque".** "Função" não significa nada aos 7 anos; "ensinar um
truque ao Bit" significa. A caixa do truque fica sempre visível ao lado do programa, e o
bloco `Usar truque` aparece na paleta.

**As fases 4-1 e 4-2 não têm o bloco `Repetir` na paleta.** Isso é deliberado: em um
caminho puramente repetitivo, um laço sempre vence uma função em número de blocos, e a
criança nunca teria motivo para usar o truque. Os caminhos dessas fases repetem o mesmo
motivo em *pontos separados* — situação em que a função é de fato a solução mais curta.
Na 4-3 o `Repetir` volta, e a solução ótima continua sendo a função (7 blocos contra 8).

### Validação feita

As 14 fases foram verificadas rodando o **interpretador real do jogo** (as mesmas funções
`passos()` e `caminhoLivre()` usadas em partida, apenas sem animação): todas são
solucionáveis e o `minBlocos` de cada uma corresponde exatamente à solução ótima — ou
seja, as 3 estrelas são atingíveis em todas.

O layout foi verificado nos três casos de aninhamento mais profundo
(`repetir_ate > se > bloco`, `repetir > blocos`, função + chamadas) em desktop e tablet:
nenhum rótulo truncado, nenhum estouro de painel, tabuleiro sempre inteiro na tela.

### Nota técnica: como `se` e `até chegar` funcionam

O interpretador é um **gerador preguiçoso** (`function*`). Como ele só avança quando o
executor pede o próximo passo, as condições são avaliadas com o Bit já na posição
resultante do passo anterior — sem precisar de máquina de estados, pilha de execução ou
callbacks. São ~20 linhas em [js/game.js](js/game.js).

---

## 4. Relação com a stack do GDD (Phaser + Blockly)

Este protótipo é **HTML/CSS/JS puro** de propósito: valida a direção visual e a mecânica
de toque em algumas horas, sem o custo de aprender Phaser antes de saber se o design
funciona com crianças. É exatamente o que a própria Reflexão Final do GDD recomenda —
*"prototipar a mecânica central mais cedo, antes de definir a estrutura completa"*.

Duas observações para a decisão de arquitetura:

1. **O Blockly não entrega esta interface.** O visual padrão do Blockly é a estética de
   IDE que este redesign está corrigindo. Customizá-lo até chegar aqui provavelmente dá
   mais trabalho do que o sistema de blocos próprio usado neste protótipo — o que reabre
   a decisão registrada em "Abril 2026" na seção 13.
2. **Phaser continua fazendo sentido** para o tabuleiro, animações e partículas do Mundo 3
   em diante. A separação natural é: Phaser desenha o mundo, DOM/CSS desenha os blocos.

---

## 5. Sugestão de próximos passos

- Levar este protótipo para o playtest de outubro **antes** de investir na engine
- Testar especificamente a hipótese "toque vs. arrastar" — cronometrar a montagem do
  primeiro programa nas duas versões
- Validar com crianças a hipótese do Mundo 3: elas percebem sozinhas que o mesmo programa
  resolve as três fases? Essa é a evidência de que o conceito de condicional foi entendido
- Completar os mundos 2, 3 e 4 para 5 fases cada (o GDD prevê 20 fases; há 14)
- Acessibilidade: o CSS já respeita `prefers-reduced-motion`; falta contraste testado
  e navegação por teclado nos blocos
