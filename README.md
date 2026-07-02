# 🚀 CodeQuest — Aprenda a Programar Numa Aventura!

O **CodeQuest** é um jogo web educacional desenvolvido para ensinar os fundamentos da programação a crianças por meio de uma experiência interativa, visual e gamificada.

Através de uma interface de blocos (drag-and-drop), o jogador guia o robô **Bit** por desafios, desenvolvendo o pensamento computacional de forma intuitiva e acessível.

---

## 🎯 Visão Geral

O projeto surge para preencher a lacuna de ferramentas educacionais de programação que:

- Sejam **100% em português brasileiro**
- Não exijam **instalação ou cadastros complexos**
- Sejam **acessíveis para crianças em fase inicial de leitura**

---

## ❗ O Problema

O ensino de programação para crianças enfrenta desafios como:

- Dificuldade com sintaxe textual
- Ferramentas complexas ou em inglês
- Baixo engajamento sem interatividade

Além disso, muitas soluções atuais:

- Exigem instalação
- Não são adaptadas ao público infantil
- Não consideram limitações de leitura

---

## 💡 A Solução

O **CodeQuest** resolve esse problema oferecendo:

- Um ambiente **100% web**
- Interface **visual baseada em blocos**
- Aprendizado através de **jogo e experimentação**

A lógica de programação deixa de ser abstrata e passa a ser **visual e prática**.

---

## 🎯 Objetivos

### Objetivo Geral

Desenvolver um jogo educacional capaz de:

- Ensinar lógica de programação de forma lúdica  
- Estimular o pensamento computacional  
- Promover aprendizado baseado em experimentação  

### Objetivos Específicos

- Implementar interface com **Google Blockly**
- Criar sistema de **fases progressivas**
- Ensinar:
  - Sequenciamento
  - Loops
  - Condicionais
  - Funções
- Fornecer **feedback imediato ao jogador**

---

## 🎮 Gameplay

O jogo segue um ciclo simples:

1. Ver o desafio  
2. Montar os blocos  
3. Executar o código  
4. Observar o resultado  
5. Ajustar a solução  

➡️ Isso incentiva aprendizado por tentativa e erro.

---

## 🧩 Funcionalidades

- 🗺️ **Mundos Temáticos**  
    1 mundo com 3 a 5 fases progressivas, focadas na introdução de conceitos básicos

- 🧱 **Programação em Blocos**  
  Interface visual com drag-and-drop utilizando Blockly para montagem de algoritmos simples

- ⚡ **Execução em Tempo Real**  
  Conversão dos blocos em ações imediatas no jogo, permitindo feedback instantâneo

- ⭐ **Sistema de Estrelas**  
  Avaliação básica da solução (correta/incorreta ou até 3 níveis simples de desempenho)

- 💾 **Salvamento Automático**  
  Uso de `localStorage` para progresso local

---

## 🛠️ Tecnologias Utilizadas

- **Engine de Jogo:** Phaser.js 3  
- **Interface de Programação:** Google Blockly  
- **Linguagem:** JavaScript (ES6+) ( não confirmado )  
- **Persistência:** localStorage  
- **Hospedagem:** (A definir)  

---

## 👥 Público-Alvo

Crianças do **1º ao 5º ano do Ensino Fundamental**

---

## 🧠 Visão do Sistema

O **CodeQuest** integra aprendizado e entretenimento, permitindo que crianças desenvolvam habilidades de:

- Lógica  
- Resolução de problemas  
- Pensamento computacional  

Tudo de forma natural, progressiva e divertida.

---

## 📂 Estrutura do Projeto
    📁 docs/ → Documentação (GDD, RFC)
    📁 src/ → Código-fonte
    📁 assets/ → Imagens e sons (CC0) ( ainfa não implementado)

## 📅 Cronograma
📌 Agosto/2026 — Prova de Conceito
Integração inicial entre Phaser.js e Blockly
Execução básica de comandos (ex: mover personagem)
Estrutura inicial do projeto

📌 Setembro/2026 — Desenvolvimento Base
Implementação da interface de blocos funcional
Criação da primeira fase jogável
Sistema de execução dos blocos no jogo

📌 Outubro/2026 — Expansão do MVP
Desenvolvimento de 3 a 5 fases completas
Introdução de loops e condicionais simples
Implementação de feedback ao jogador
Salvamento de progresso com localStorage

📌 Novembro/2026 — Finalização
Polimento geral (interface e experiência do usuário)
Correção de bugs
Testes finais
Finalização da documentação do TCC

## 👨‍💻 Autor

Bruno Franzosi
Engenharia de Software – Católica SC

📧 bruno.franzosi@catolica.edu.br

## 💭 Filosofia

"Aprender fazendo — o jogador descobre conceitos experimentando, não lendo."


# Sugestão de Melhoria (revisão por Pares)
## Rafael
Minha sugestão de melhoria seria incluir um mapa visual de progresso, onde o jogador possa visualizar as fases concluídas e as próximas etapas, aumentando o engajamento.

## Ramires Silva Paes 
Minha sugestão de melhoria é um sistema de repetição de execução (Replay) é relevante permitir que o jogador visualize novamente a execução do seu código, possibilitando uma melhor análise do comportamento do personagem e dos erros cometidos.

## Fernando Lucas Moraes da Luz
Sugiro implementar uma funcionalidade que destaque visualmente blocos inválidos ou sequências incorretas antes da execução, ajudando o jogador a identificar problemas de lógica.

## Bruno Luis Pereira
Minha sugestão  implementar um sistema de dicas que analise a sequência de blocos montada pelo jogador e forneça sugestões quando ele estiver travado, auxiliando no aprendizado sem entregar diretamente a solução.

# Comentários 
## Ramires Silva Paes
Li o GDD do CodeQuest e achei o conceito muito bem elaborado. Gostei especialmente de como a progressão dos mundos foi estruturada — cada um introduz um conceito de programação diferente (sequência, loop, condicional e função) de forma gradual e coerente. O sistema de dica após três tentativas também é uma boa solução para reduzir a frustração sem eliminar o desafio. Fico curioso para ver o protótipo funcionando.

## Fernando Lucas Moraes da Luz


