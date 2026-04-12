# RFC: Request for Comments — Projeto de Portfólio

**Engenharia de Software – Católica SC**

---

# Identificação

- **Título do Projeto:** CodeQuest — Jogo Web Educacional de Programação para Crianças

- **Linha de Projeto (Direction):** Jogos

- **Autor:** Bruno Franzosi

- **Data da Proposta:** Abril/2026

- **Versão:** 1.0

---

# 1. Visão do Produto e Impacto (O Problema)

## 1.1 Contexto e Problema

O ensino de lógica de programação para crianças de 6 a 11 anos no Brasil ainda é incipiente e pouco acessível. Grande parte das ferramentas disponíveis no mercado está em inglês, demanda supervisão constante de adultos ou não oferece engajamento suficiente para o público infantil.

**Quem sofre com esse problema:**
Crianças em fase escolar (1º ao 5º ano do Ensino Fundamental) que estão no auge do desenvolvimento do pensamento lógico e abstrato, mas raramente têm acesso a ferramentas que traduzam conceitos computacionais para uma linguagem visual, divertida e em português.

**Como o problema é resolvido atualmente:**
- Escolas que ensinam programação usam majoritariamente o Scratch (interface em inglês)
- Code.org tem conteúdo em português, mas depende de conexão e é voltado para tutoriais, não para jogo livre
- A maioria das escolas públicas brasileiras não possui nenhuma ferramenta para isso

**Limitações das soluções atuais:**
- Idioma: a maioria das ferramentas relevantes está em inglês
- Instalação: diversas soluções exigem download ou cadastro
- Engajamento: ferramentas educacionais raramente têm a qualidade de experiência de um jogo
- Faixa etária: poucas soluções são projetadas especificamente para 6–11 anos

---

## 1.2 Origem da Demanda e Evidências

### Pesquisa com Usuários

Para validar o problema, foram realizadas conversas informais com **3 pessoas de diferentes idades**. As principais dores identificadas foram:

| Dor relatada | Frequência |
|--------------|------------|
| Falta de ferramenta em português para ensinar lógica 
| Alunos desistem quando a ferramenta não é visual ou parece de difícil uso
| Não há tempo para ensinar inglês e programação simultaneamente 


### Evidência de Interesse

A BNCC (Base Nacional Comum Curricular) já prevê o ensino de **pensamento computacional** desde os anos iniciais do Ensino Fundamental (Resolução CNE/CP nº 2/2017). Apesar disso, a maioria das escolas não possui ferramentas adequadas para trabalhar esse conteúdo com crianças pequenas, criando uma lacuna clara entre currículo e prática.

---

## 1.3 Análise de Soluções Existentes (Benchmark)

| Solução | Público-alvo | Pontos Fortes | Limitações |
|---------|-------------|---------------|------------|
| [Code.org](https://code.org) | 6–18 anos | Gratuito, acessível, progressivo | Interface parcialmente em inglês, não é um jogo real |
| [Scratch (MIT)](https://scratch.mit.edu) | 8–16 anos | Muito flexível, grande comunidade | Curva de aprendizado alta para 6–8 anos, inglês no core |
| [LightBot](https://lightbot.com) | 6–12 anos | Excelente mecânica de puzzle | Pago, interface em inglês, sem narrativa |
| [Tynker](https://tynker.com) | 7–18 anos | Qualidade visual alta, progressivo | Pago, 100% em inglês |
| [Blockly Games](https://blockly.games) | 8–15 anos | Gratuito, open source | Visual simples, sem narrativa ou personagem |

### Diferencial do Projeto

O **CodeQuest** preenche uma lacuna específica que nenhuma das soluções acima resolve completamente:

- ✅ **100% em português brasileiro** — interface, narrativa e personagens
- ✅ **Sem instalação** — abre no navegador, imediato
- ✅ **Jogo de verdade** — não é tutorial disfarçado, tem progressão, personagem e história
- ✅ **Projetado para 6–11 anos** — UX, tipografia e dificuldade calibrados para essa faixa
- ✅ **Gratuito e seguro** — sem anúncios, sem dados pessoais sensíveis, sem chat

---

## 1.4 Público-Alvo

**Primário:** Crianças de 6 a 11 anos (ou mais) cursando o Ensino Fundamental I
- Contexto de uso: em casa, na escola ou em espaços de aprendizagem
- Nível técnico esperado: nenhum — é o ponto de partida

**Secundário:** Professores do Ensino Fundamental
- Contexto de uso: sala de aula, laboratório de informática
- Nível técnico esperado: básico (saber abrir navegador)

**Terciário:** Pais que buscam atividades educativas digitais para os filhos
- Contexto de uso: em casa, como atividade extracurricular

---

## 1.5 Objetivos do Projeto

### Objetivo Geral

Desenvolver um jogo web educacional que ensine os conceitos fundamentais de programação — sequenciamento, loops, condicionais e funções — para crianças de 6 a 11 anos, de forma visual, interativa e inteiramente em português.

### Objetivos Específicos

1. Implementar um sistema de blocos de código visual arrastáveis (drag-and-drop) usando Google Blockly integrado ao Phaser.js
2. Criar 4 mundos temáticos progressivos, cada um introduzindo um novo conceito de programação
3. Desenvolver um personagem animado (Bit) que executa os comandos do jogador em tempo real, tornando o código visível
4. Garantir que o jogo seja completamente funcional no navegador, sem instalação ou cadastro
5. Validar a proposta com pelo menos 5 crianças na fase de testes de usabilidade

---

## 1.6 Métricas de Sucesso (KPIs)

| Métrica                                 |Meta                                                     |
|-----------------------------------------|---------------------------------------------------------|
| Taxa de conclusão do Mundo 1            | ≥ 70% das crianças que iniciam completam todas as fases |
| Tempo médio de sessão                   | ≥ 10 minutos sem intervenção de adulto                  |
| Avaliação de satisfação (escala visual) | ≥ 80% escolhem "amei" ou "gostei"                       |
| Desempenho técnico                      | Carregamento < 5 segundos em conexão 10 Mbps            |
| Compatibilidade                         | Funcional em Chrome, Firefox e Edge sem erros           |

---

# 2. Engenharia de Requisitos

## 2.1 Personas

### Persona 1 — Sofia, 8 anos

> *"Eu quero jogar mas às vezes trava e aí eu desisto."*

- **Contexto:** Aluna do 3º ano, usa tablet em casa e computador na escola
- **Objetivos:** Se divertir, vencer as fases, mostrar para os amigos
- **Dificuldades:** Perde interesse se a interface for confusa ou se o feedback demorar

### Persona 2 — Professora Ana, 34 anos

> *"Eu precisaria de algo que não dependa de internet rápida e que eu não precise ensinar inglês antes."*

- **Contexto:** Professora do 4º ano em escola pública de Joinville
- **Objetivos:** Introduzir pensamento computacional sem sair da sua área
- **Dificuldades:** Pouco tempo de aula, sem suporte técnico na escola

---

## 2.2 Casos de Uso Principais

- Selecionar e iniciar uma fase
- Montar sequência de blocos de código
- Executar o código e observar o Bit em ação
- Reiniciar a fase após erro
- Completar a fase e coletar estrelas
- Navegar pelo mapa de mundos
- Desbloquear skin do personagem

---

## 2.3 Requisitos Funcionais (RF)

| ID   | Requisito                                                                                 |
|------|-------------------------------------------------------------------------------------------|
| RF01 | O sistema deve exibir um mapa de mundos com indicação de progresso do jogador |
| RF02 | O sistema deve permitir que o jogador arraste blocos de código para uma área de sequência |
| RF03 | O sistema deve executar a sequência de blocos animando o personagem Bit em tempo real |
| RF04 | O sistema deve reiniciar a fase quando o Bit colide com um obstáculo ou cai |
| RF05 | O sistema deve registrar o número de estrelas coletadas por fase |
| RF06 | O sistema deve bloquear fases não desbloqueadas até que a anterior seja concluída |
| RF07 | O sistema deve permitir que o jogador pause e retome o jogo |
| RF08 | O sistema deve destacar visualmente o bloco sendo executado no momento |
| RF09 | O sistema deve salvar o progresso localmente (localStorage) |
| RF10 | O sistema deve exibir uma tela de vitória com as estrelas ao completar uma fase |

---

## 2.4 Requisitos Não Funcionais (RNF)

| ID | Requisito |
|----|-----------|
| RNF01 | O jogo deve carregar em menos de 5 segundos em conexão de 10 Mbps |
| RNF02 | A interface deve ser usável por crianças de 6 anos sem leitura de instruções |
| RNF03 | O sistema deve funcionar nos navegadores Chrome, Firefox e Edge (versões dos últimos 2 anos) |
| RNF04 | O jogo não deve coletar nenhum dado pessoal do usuário |
| RNF05 | O sistema deve funcionar sem conexão com internet após o carregamento inicial |
| RNF06 | Todos os textos devem estar em português brasileiro |

---

## 2.5 Regras de Negócio

- Fases são desbloqueadas em sequência — não é possível pular uma fase não concluída
- O progresso é salvo automaticamente ao concluir cada fase
- Estrelas são contadas com base no número de blocos usados (menos blocos = mais estrelas)
- Skins cosméticas são puramente visuais e não afetam a gameplay

---

## 2.6 Fora do Escopo

- Multiplayer ou funcionalidades sociais de qualquer tipo
- Sistema de login, cadastro ou contas de usuário
- Editor de fases para o usuário final
- Versão mobile nativa (iOS / Android)
- Monetização, anúncios ou compras dentro do jogo
- Backend ou banco de dados — tudo roda no cliente

---

# 3. Fluxos e Comportamento do Sistema

## 3.1 Fluxo Principal do Usuário

```
Tela Inicial → Mapa de Mundos → Seleção de Fase → Gameplay
     ↓                                                 ↓
  [Jogar]                              [Executar código]
                                                ↓
                                    Bit executa os comandos
                                       ↙           ↘
                                  Sucesso          Erro
                                     ↓               ↓
                              Tela de vitória     Reset automático
                                     ↓
                              Próxima fase
```

> ⚠️ *Adicionar diagrama visual aqui (Figma / Excalidraw)*

## 3.2 Fluxos Alternativos

- **Fase impossível de resolver:** Botão de dica opcional aparece após 3 tentativas falhas
- **Saída acidental:** Menu de pause com confirmação antes de voltar ao mapa
- **Progresso perdido:** Se localStorage for apagado, o jogo inicia do Mundo 1 sem dados anteriores

---

# 4. Mockups e Experiência do Usuário (UX)

## 4.1 Fluxo de Navegação

```
Tela Inicial → Mapa de Mundos → Fase selecionada → Gameplay → Tela de Vitória
                    ↑                                              ↓
                    └──────────────── Próxima fase ───────────────┘
```

## 4.2 Wireframes ou Mockups das Telas

> ⚠️ *Adicionar prints de wireframes aqui (Figma / desenho à mão escaneado)*

**Telas planejadas:**
- Tela inicial (logo + botão Jogar)
- Mapa de mundos com fases bloqueadas/desbloqueadas
- Tela de gameplay (mapa da fase + painel de blocos + área de sequência)
- Tela de vitória (estrelas + botão próxima fase)

## 4.3 Fluxo de Interação do Usuário

1. Criança abre o jogo no navegador
2. Vê a tela inicial e clica em "Jogar"
3. Escolhe a fase disponível no mapa
4. Observa o mapa da fase e o painel de blocos disponíveis
5. Arrasta blocos para montar a sequência de comandos
6. Clica em "Executar" e vê o Bit agir
7. Ajusta os blocos se necessário e tenta novamente
8. Completa a fase e vê as estrelas conquistadas

---

# 5. Arquitetura do Sistema

## 5.1 Diagrama C4

> ⚠️ *Adicionar diagramas C4 aqui (nível 1, 2 e 3)*

**Visão macro:**
- **Usuário (criança)** → acessa via navegador
- **CodeQuest (sistema web)** → jogo client-side completo
- **Sem sistemas externos** — tudo roda localmente após o carregamento

**Containers:**
- `index.html` — ponto de entrada
- **Phaser.js** — motor de renderização e física do jogo
- **Blockly** — engine de blocos visuais
- **localStorage** — persistência do progresso

## 5.2 Modelo de Dados

```json
// Estrutura salva no localStorage
{
  "progresso": {
    "mundo1": { "fase1": 3, "fase2": 2, "fase3": 0 },
    "mundo2": { "fase1": -1 }
  },
  "skinAtiva": "default"
}
```
> -1 = não desbloqueada | 0 = desbloqueada, não concluída | 1–3 = estrelas conquistadas

## 5.3 Principais Componentes

| Componente | Responsabilidade |
|------------|-----------------|
| GameManager | Estado global: menu, jogo, pausa, fim de fase |
| LevelLoader | Carrega configuração da fase a partir de JSON |
| BlockEngine | Interpreta sequência de blocos e converte em comandos |
| BitController | Executa os comandos com animações no Phaser |
| UIManager | HUD, painéis, transições de tela |

## 5.4 Stack Tecnológica

| Tecnologia | Motivo da escolha |
|------------|-------------------|
| **Phaser.js 3** | Framework HTML5 maduro, gratuito, ampla documentação, ideal para jogos 2D no browser |
| **Google Blockly** | Biblioteca open source para blocos visuais, usada pelo próprio Code.org |
| **JavaScript ES6+** | Linguagem nativa do browser, sem necessidade de compilação |
| **GitHub Pages** | Hospedagem gratuita e integrada ao repositório |
| **localStorage** | Persistência simples sem necessidade de backend |

---

# 6. Segurança e Privacidade

- O sistema **não coleta nenhum dado pessoal**
- Não há login, cadastro ou formulários com dados de usuário
- Todo o processamento é client-side — nenhum dado é enviado a servidores
- Não há anúncios, rastreadores ou scripts de terceiros além do Blockly e Phaser

## 6.1 Privacidade e LGPD

| Item | Detalhe |
|------|---------|
| Dados coletados | Nenhum dado pessoal |
| Armazenamento | Apenas progresso de jogo salvo localmente no dispositivo (localStorage) |
| Remoção de dados | Usuário pode limpar o progresso nas configurações do jogo |
| Compartilhamento | Nenhum dado é compartilhado com terceiros |

---

# 7. Planejamento do Projeto

| Marco | Descrição | Prazo |
|-------|-----------|-------|
| M1 — Pré-produção | GDD, RFC, pesquisa, protótipo de papel | Abril 2026 |
| M2 — Prova de Conceito | Integração Phaser + Blockly funcionando | Maio 2026 |
| M3 — MVP | Mundo 1 completo (5 fases jogáveis) | Junho 2026 |
| M4 — Desenvolvimento | Mundos 2–4, arte e áudio finais | Set 2026 |
| M5 — Testes | Playtests com crianças, ajustes de UX | Out 2026 |
| M6 — Entrega | Build publicada, documentação completa | Nov 2026 |

---

# 8. Referências

- BNCC — Base Nacional Comum Curricular: https://basenacionalcomum.mec.gov.br
- Phaser.js: https://phaser.io
- Google Blockly: https://developers.google.com/blockly
- Code.org: https://code.org
- Scratch MIT: https://scratch.mit.edu
- Kenney.nl (assets CC0): https://kenney.nl
- OpenGameArt: https://opengameart.org
- PIAGET, J. *A Psicologia da Criança*. Rio de Janeiro: Bertrand Brasil, 1998.

---

# 9. Apêndices

> ⚠️ *A ser preenchido com:*
> - Mockups de tela (Figma)
> - Prints de pesquisa com professores
> - Diagramas C4 completos
> - Link para protótipo navegável

---

# 10. Parecer do Comitê de Avaliação

*(A ser preenchido pelos estrevistados)*

Avaliador 1: __________________________ Status: [ ] Aprovado [ ] Ajustar

Observações:
---

**Avaliador 2:** __________________________
**Status:** [ ] Aprovado [ ] Ajustar

Observações:

---

**Avaliador 3:** __________________________
**Status:** [ ] Aprovado [ ] Ajustar

Observações:
