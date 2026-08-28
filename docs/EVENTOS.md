# Catálogo de eventos

Toda comunicação entre módulos passa pelo barramento do `GameManager`
(`gm.on(evento, cb)` / `gm.emit(evento, payload)`). Nenhum módulo chama outro
diretamente — é o que permite trocar a camada de UI ou a de renderização sem
tocar na regra de jogo.

```
                     ┌──────────────┐
   emite ────────────►  GameManager  ├──────────► escuta
                     └──────────────┘
   GameplayScene                       UIManager
   UIManager                           GameplayScene
   BlockEngine
```

| Evento | Quem emite | Quem escuta | Payload |
|---|---|---|---|
| `ESTADO_MUDOU` | GameManager | UIManager, main.js (roteador) | `{ novoEstado, anterior }` |
| `SELECIONAR_FASE` | GameManager | main.js (roteador) | `{ faseId, mundo }` |
| `FASE_CARREGADA` | GameplayScene | UIManager | `{ config }` |
| `PEDIDO_EXECUTAR` | UIManager | GameplayScene | `{ programa, funcao }` |
| `PEDIDO_RESET` | UIManager | GameplayScene | — |
| `EXECUCAO_INICIADA` | GameplayScene | UIManager | — |
| `BLOCO_EM_EXECUCAO` | BlockEngine | UIManager | `{ bloco }` (`null` limpa o destaque) |
| `EXECUCAO_FINALIZADA` | GameplayScene | UIManager | `{ resultado, motivo }` |
| `CHAVE_COLETADA` | GameplayScene | UIManager | — |
| `FASE_CONCLUIDA` | GameManager | UIManager | `{ faseId, estrelas, blocosUsados, minBlocos, temProxima }` |
| `FASE_FALHOU` | GameManager | — | `{ motivo, tentativas }` |
| `DICA_DISPONIVEL` | GameManager | UIManager | `{ dica }` |
| `BIT_FALOU` | qualquer módulo | UIManager | `{ texto, ms }` |

## Estados da aplicação

```
null ──► menu ──► mapa ──► jogando ──► vitoria ──► (jogando | mapa)
                    ▲          │
                    │          ▼
                    └──────  pausado
```

O estado inicial é `null` de propósito: assim a primeira transição para `menu`
realmente emite `ESTADO_MUDOU` e a UI é renderizada.

## Motivos de falha

Emitidos em `EXECUCAO_FINALIZADA.motivo` e traduzidos em fala do Bit pelo mapa
`MENSAGEM_FALHA` (`BlockEngine.js`).

| Motivo | Quando |
|---|---|
| `colisao` | o Bit tentou andar contra uma parede |
| `nao_chegou` | o programa terminou sem chegar na saída |
| `limite_excedido` | passou de 200 comandos (laço que não termina) |
| `sequencia_vazia` | apertou Executar sem montar nada |
| `cancelado` | execução interrompida (troca de fase no meio) |
