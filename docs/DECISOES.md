# Registro de decisões

Cada decisão que mudou o rumo do projeto, com o motivo e o que foi descartado.
A visão de design está no [GDD, seção 13](GDD.md#13-decisões-importantes).

## 1. Phaser para o tabuleiro, DOM/CSS para a interface

**Decisão.** O canvas do Phaser desenha só o mundo do jogo (tabuleiro, Bit,
animações). Blocos, HUD, mapa e modais são HTML/CSS.

**Motivo.** Texto nítido, layout responsivo e alvos de toque grandes vêm prontos
no DOM. Reimplementar isso no canvas custaria caro e ficaria pior no celular.

**Descartado.** Interface inteira dentro do Phaser.

## 2. Editor de blocos próprio no lugar do Blockly (jun. 2026)

**Decisão.** O plano inicial era usar o Google Blockly. Foi trocado por um editor
próprio em HTML/CSS (`src/ui/BlocoPanel.js`).

**Motivo.** O Blockly é pensado para mouse e para blocos pequenos e encaixáveis.
Para crianças de 6 anos em telas de toque era preciso blocos grandes, "tocar
para adicionar" e um visual próprio — mais fácil de construir do que de adaptar.
De quebra, o jogo ficou com uma única dependência de produção (Phaser).

**Custo.** Arrastar, soltar, aninhar blocos e a caixa "Meu truque" tiveram de
ser implementados à mão.

## 3. Interpretador como gerador

**Decisão.** `BlockEngine.comandos()` é uma `function*` que entrega um comando
por vez.

**Motivo.** Os blocos condicionais precisam avaliar o tabuleiro **depois** do
comando anterior. Com um gerador, o executor anima um passo, e só então o
interpretador decide o próximo — sem máquina de estados.

## 4. Módulos conversam por eventos

**Decisão.** Barramento de eventos no `GameManager` ([EVENTOS.md](EVENTOS.md)).

**Motivo.** Cenas do Phaser e telas em DOM têm ciclos de vida diferentes; com
eventos, nenhuma precisa de referência à outra, e os testes exercitam cada
módulo isolado.

## 5. Arte e efeitos sonoros gerados por código

**Decisão.** Tiles e o Bit são desenhados com `Graphics` e viram textura na
`BootScene`; efeitos sonoros saem de osciladores da Web Audio API.

**Motivo.** Carregamento instantâneo, bundle pequeno e nenhuma questão de
licença de assets. As únicas exceções são as duas faixas de música gravadas.

## 6. Tema claro e blocos maiores (ago. 2026)

**Decisão.** Troca do tema escuro por um claro e colorido; blocos de 42–58px.

**Motivo.** Observação da Profª Janaína sobre o "dedo gordo" em telas pequenas
e legibilidade para crianças de 6 anos.

## 7. Login com Google e progresso na nuvem (set. 2026)

**Decisão.** Login opcional com Google e modo convidado; progresso sincronizado
com a AWS para quem faz login.

**Motivo.** Recomendação do professor: o progresso só em `localStorage` se perde
ao trocar de aparelho ou limpar o navegador.

**Descartado.** Cadastro próprio com senha — exigiria guardar senhas de crianças.
Com o Google, o jogo não guarda senha nenhuma.

**Como foi contido o risco.** O modo convidado segue sem coletar nada, e o
servidor guarda só id, nome, e-mail e progresso.

## 8. PostgreSQL (RDS) e não NoSQL (set. 2026)

**Decisão.** Banco relacional PostgreSQL no Amazon RDS, com API Gateway + Lambda.

**Motivo.** Exigência de banco SQL. O modelo cabe em duas tabelas com chave
estrangeira, e regras como "manter o melhor resultado" ficam no próprio SQL.

**Descartado.** DynamoDB (era a primeira ideia, por ser sempre gratuito) e
plataformas prontas de backend, que tiram o controle da arquitetura.

## 9. Mescla "o melhor de cada fase" (out. 2026)

**Decisão.** Ao sincronizar, o jogo combina aparelho e nuvem ficando com mais
estrelas e menos blocos em cada fase — no cliente e também no SQL.

**Motivo.** A primeira versão deixava a nuvem sobrescrever o aparelho, e uma
criança que jogava offline perdia progresso ao reconectar.

## 10. Frontend na Vercel, backend na AWS (out. 2026)

**Decisão.** A Vercel hospeda somente os arquivos estáticos do jogo; o GitHub
Pages mantém uma cópia publicada pelo GitHub Actions. API e banco ficam na AWS.

**Motivo.** *Preview* automática por PR, útil para os colegas revisarem. O uso
foi autorizado pelo professor apenas para o frontend.

## 11. Banco acessível pela internet, com compensações (out. 2026)

**Decisão.** O RDS aceita conexões externas na porta 5432.

**Motivo.** Fechar exigiria Lambda dentro da VPC e NAT Gateway pago. As
compensações (TLS com certificado conferido, senhas fortes, usuários de menor
privilégio) estão descritas em [AWS.md](AWS.md#decisão-registrada-banco-acessível-pela-internet).

## 12. Regras da Lambda separadas das ligações externas (nov. 2026)

**Decisão.** `handler.mjs` contém as regras e recebe token e banco por
parâmetro; `index.mjs` só faz as ligações.

**Motivo.** Permitir testar o backend inteiro sem rede e sem banco.

## 13. Grafana para monitorar o banco (nov. 2026)

**Decisão.** Painel Grafana com usuário de banco só de leitura.

**Motivo.** Pedido do professor: enxergar se o banco está no ar. O usuário do
Grafana não tem acesso a nome nem e-mail dos jogadores.

## Escopo que ficou de fora

- 20 fases previstas → 14 entregues (5 + 3 + 3 + 3).
- Skins do Bit e a animação "pensando".
- Acessibilidade para deficiência visual.
