# Game Design Document (GDD)

# CodeQuest — Aprenda a Programar Numa Aventura!

**Aluno:** Bruno Franzosi
**E-mail:** bruno.franzosi@catolica.edu.br

**Status do Projeto:** Pesquisa / Prototipagem

**Versão do Documento:** v0.1
**Última atualização:** Abril/2026

---

# 1. Visão Geral

## Elevated Pitch

CodeQuest é um jogo web educacional onde crianças de 6 a 11 anos controlam um robozinho chamado **Bit** por fases de puzzle, montando blocos visuais de código para guiá-lo até o objetivo. Sem digitar uma linha sequer, o jogador aprende sequenciamento, loops, condicionais e funções enquanto se diverte numa aventura colorida — 100% em português.

---

## Gênero

- Educacional
- Puzzle / Lógica
- Plataforma (perspectiva top-down)

---

## Público-Alvo

Crianças de **6 a 11 anos** (1º ao 5º ano do Ensino Fundamental) com acesso a computador ou tablet com navegador. Secundariamente, professores que desejam introduzir pensamento computacional em sala de aula de forma lúdica.

---

## Plataformas

- Web (navegador) — foco principal
- Desktop — via Chrome, Firefox ou Edge
- Tablet — layout responsivo

---

# 2. Acesso ao Projeto

| Item                   | Link                                             |
|------------------------|--------------------------------------------------|
| Build jogável          | A definir (GitHub Pages) |
| Repositório            | [URL DO GITHUB] |
| Vídeo gameplay         | A definir (YouTube) |
| Instruções de execução | Abrir `index.html` no navegador — sem instalação |

---

# 3. Pesquisa e Referências

## Jogos de Referência

### Code.org — Hour of Code
Plataforma educacional gratuita com atividades de programação em blocos para crianças. Inspiração principal para a mecânica de blocos arrastáveis e a progressão pedagógica estruturada por conceitos.
🔗 https://code.org

### LightBot
Jogo de puzzle onde o jogador programa um robô para acender luzes em um tabuleiro. Inspiração direta para a mecânica central do CodeQuest: comandar um personagem por etapas sequenciais.
🔗 https://lightbot.com

### Scratch (MIT Media Lab)
Ambiente de programação visual por blocos voltado a crianças. Referência para a interface de blocos coloridos e a ideia de tornar a programação tangível e visual.
🔗 https://scratch.mit.edu

### Minecraft Education Edition
Versão educacional do Minecraft com suporte a programação em blocos. Referência para engajamento por progressão de mundo e personalização de personagem.
🔗 https://education.minecraft.net

---

## Análise das Referências

**O que esses jogos fazem bem:**
- Feedback visual imediato — o jogador vê o resultado do código na tela
- Progressão pedagógica — cada fase introduz apenas um conceito novo
- Interface por blocos — elimina a barreira sintática da programação textual
- Narrativa e personagem — criam vínculo emocional e motivação para continuar

**O que o CodeQuest herda e melhora:**
- 100% em português brasileiro, com personagens e narrativa locais
- Executável no navegador sem cadastro, login ou instalação
- Foco etário mais estreito (6–11 anos), com UX simplificada para essa faixa

---

# 4. Hipóteses de Design

| Hipótese | Como será testada |
|----------|-------------------|
| Crianças entendem blocos sem tutorial textual | Observação em sessão de playtest silencioso com 3 crianças |
| Feedback visual imediato aumenta o engajamento | Comparar tempo de sessão com e sem animação do personagem |
| Fases curtas (< 3 min) reduzem frustração | Medir taxa de conclusão de fases curtas vs longas no playtest |
| Loops são o conceito mais difícil para a faixa etária | Analisar quantidade de tentativas no Mundo 2 vs Mundo 1 |

## Pilares do Jogo

- **Aprender fazendo** — o jogador descobre conceitos experimentando, não lendo
- **Progressão clara** — cada fase ensina exatamente uma coisa nova
- **Feedback imediato** — o código vira animação na hora
- **Acessibilidade** — sem instalação, sem inglês, sem barreiras de entrada

---

# 5. Gameplay

## Core Loop

```
Ver a fase → Montar sequência de blocos → Executar → Ver o Bit agir → Ajustar → Completar → Próxima fase
```

## Loops Secundários

- Coletar estrelas dentro das fases para desbloquear skins do Bit
- Revisitar fases antigas para bater o recorde de menor número de blocos

---

## Mecânicas Principais

| Mecânica | Descrição |
|----------|-----------|
| Blocos de código | Arrastar blocos do painel lateral para a sequência (drag-and-drop) |
| Execução | Botão "Executar" anima o Bit seguindo a sequência em tempo real |
| Reset | Botão "Recomeçar" reseta o Bit à posição inicial sem apagar os blocos |
| Objetivo | Guiar o Bit até a saída coletando a chave pelo caminho |

## Câmera

- Visão top-down (cima para baixo) fixa por fase
- A fase inteira é visível na tela — sem scroll

---

## Sistemas

**Vitória**
O Bit alcança a saída da fase com a chave coletada.

**Derrota**
O Bit cai em um buraco, bate em um obstáculo ou a sequência termina sem atingir o objetivo. A fase reinicia automaticamente.

**Progressão**
Fases desbloqueadas em sequência. Cada mundo introduz um novo tipo de bloco. Estrelas coletadas desbloqueiam skins cosméticas do Bit.

---

# 6. Escopo do Projeto

## O jogo inclui

- 4 mundos temáticos com 5 fases cada (20 fases no total)
- 5 tipos de blocos: mover, girar, repetir, se/senão, função
- 1 personagem jogável (Bit) com 3 skins desbloqueáveis
- Sistema de estrelas por fase (0 a 3)
- Tela de mapa com progresso visual
- Efeitos sonoros e música de fundo por mundo

## O jogo não inclui

- Multiplayer online
- Sistema de login ou conta de usuário
- Editor de fases pelo usuário
- Versão mobile nativa (app)
- Geração procedural de fases

---

# 7. Prototipagem

| Protótipo | Objetivo | Resultado |
|-----------|----------|-----------|
| Mecânica de blocos drag-and-drop | Validar se crianças entendem a interface | A definir |
| Animação do Bit seguindo comandos | Testar feedback visual da execução | A definir |
| Fase 1 completa (Mundo 1) | Validar o core loop do jogo | A definir |

---

# 8. Interface (UI/UX)

## HUD

> ⚠️ *Adicionar mockup de tela aqui*

- Contador de estrelas coletadas na fase
- Botão Executar (verde)
- Botão Recomeçar (amarelo)
- Painel de blocos disponíveis (lateral esquerda)
- Área de sequência de blocos (lateral direita)

---

## Menus

> ⚠️ *Adicionar mockups de tela aqui*

- **Menu principal** — logo + botão Jogar + botão Créditos
- **Mapa de mundos** — seleção de fase com progresso visual
- **Pause** — continuar, recomeçar, voltar ao mapa
- **Fase completa** — estrelas conquistadas + próxima fase

## Controles

| Input | Ação |
|-------|------|
| Mouse / Touch | Arrastar blocos, clicar em botões |
| Enter | Executar |
| R | Recomeçar |
| Esc | Pause |

---

# 9. Direção Visual

## Direção de Arte

> ⚠️ *Adicionar mood board aqui*

- Estilo cartoon 2D flat design
- Paleta de cores vibrantes e amigáveis (verde, azul, amarelo)
- Personagens com expressões grandes e exageradas
- Tipografia arredondada e legível para crianças

## Referências Visuais

- Code.org — interface de blocos coloridos
- Cartoon Network — estilo visual de personagens
- Material Design — cards e botões limpos

---

# 10. Áudio

| Tipo | Onde usar | Observação |
|------|-----------|------------|
| Música de fundo | Cada mundo tem tema próprio | Loop, estilo chiptune alegre |
| SFX — bloco encaixado | Ao soltar bloco na sequência | Som de clique satisfatório |
| SFX — execução | Ao pressionar Executar | Beep de inicialização |
| SFX — vitória | Ao completar a fase | Fanfarra curta |
| SFX — erro/reset | Ao Bit colidir ou cair | Som de tropeço cômico |

---

# 11. Animação

| Animação | Onde usar | Loop |
|----------|-----------|------|
| Bit — idle | Bit parado esperando comando | Sim |
| Bit — andando | Executando bloco "mover" | Sim (durante movimento) |
| Bit — girando | Executando bloco "girar" | Não |
| Bit — comemorando | Ao completar a fase | Não |
| Bit — tropeçando | Ao colidir com obstáculo | Não |
| Blocos — highlight | Bloco ativo durante execução | Não |

---

# 12. Arquitetura de Software

- **GameManager** central — controla estado geral (menu, jogo, pausa, fim de fase)
- **LevelLoader** — carrega a fase a partir de um arquivo JSON de configuração
- **BlockEngine** — interpreta a sequência de blocos e converte em comandos para o Bit
- **BitController** — executa os comandos (mover, girar, etc.) com animações
- **UIManager** — gerencia HUD, painéis e transições de tela

## Tecnologias Utilizadas

| Categoria | Ferramenta |
|-----------|------------|
| Engine / Framework | Phaser.js 3 (HTML5) |
| Editor de Blocos | Google Blockly |
| Linguagem | JavaScript (ES6+) |
| Versionamento | Git + GitHub |
| Hospedagem | GitHub Pages |
| Assets | OpenGameArt / Kenney.nl (CC0) |

---

# 12. Testes e Playtests

## Playtests

| Data | Participantes | Principais problemas |
|------|---------------|----------------------|
| A definir | 5 crianças (6–8 anos) | A definir após protótipo |
| A definir | 5 crianças (9–11 anos) | A definir após protótipo |

## Melhorias Implementadas

> ⚠️ *A ser preenchido após os playtests*

---

# 13. Cronograma

| Fase | Atividades | Prazo |
|------|------------|-------|
| Pré-produção | GDD, RFC, pesquisa de referências, protótipo de papel | Abril 2026 |
| Protótipo digital | Motor do jogo, Mundo 1 — 5 fases jogáveis | Maio–Junho 2026 |
| Desenvolvimento | Mundos 2–4, sistema de progresso, arte final | Julho–Setembro 2026 |
| Testes | Playtests com crianças, ajustes de UX e dificuldade | Outubro 2026 |
| Entrega final | Documentação completa, build publicada, vídeo de gameplay | Novembro 2026 |

---

# 14. Riscos do Projeto

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Escopo muito grande para o prazo | Atraso na entrega | MVP com Mundo 1 completo; mundos 2–4 adicionados progressivamente |
| Blockly incompatível com Phaser | Retrabalho técnico | Testar integração no início do protótipo |
| Dificuldade de acesso a crianças para testes | Falta de validação real | Contactar escola local ou familiares na faixa etária |
| Performance baixa em tablets antigos | Experiência ruim | Limitar efeitos visuais e otimizar sprites |

---

# 15. Limitações Conhecidas

- Multiplayer online — fora do escopo do TCC
- Sistema de save em nuvem — save local via localStorage apenas
- Versão mobile nativa — apenas web responsivo
- Mundos 5+ — possível expansão futura fora do TCC

---

# 16. Decisões Importantes

| Data | Decisão | Motivo |
|------|---------|--------|
| Abril 2026 | Usar Blockly ao invés de sistema de blocos próprio | Reduzir escopo técnico e focar no design de fases |
| Abril 2026 | Focar em crianças de 6–11 anos (não adolescentes) | Lacuna maior no mercado brasileiro para essa faixa etária |
| Abril 2026 | Top-down ao invés de plataforma lateral | Mais fácil de criar fases de puzzle sem física complexa |

---

# 17. Créditos

| Recurso | Fonte | Licença |
|---------|-------|---------|
| Sprites do personagem | A definir (Kenney.nl ou criação própria) | CC0 / Original |
| Música de fundo | A definir (OpenGameArt) | CC0 ou CC-BY |
| Efeitos sonoros | A definir (freesound.org) | CC0 |
| Ícones de blocos | Google Material Icons | Apache 2.0 |

---

# 17. Reflexão Final

> ⚠️ *Esta seção será preenchida ao final do projeto.*
>
> Descreva os principais desafios enfrentados, os aprendizados técnicos e o que você faria de diferente se recomeçasse. 1 a 3 parágrafos são suficientes.