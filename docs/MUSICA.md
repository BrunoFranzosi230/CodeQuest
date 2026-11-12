# Música

## O que toca onde

| Momento | Trilha |
|---|---|
| Login, menu e escolha de mundo | Tema do jogo (`tema.mp3`) |
| Dentro de uma fase | Música do mundo daquela fase |
| Ao sair da fase para o mapa | Volta o tema do jogo |

Hoje há duas faixas gravadas: `tema.mp3` e `mundo4.mp3` (composta por **Richie
Locker**; o crédito aparece discretamente quando a faixa começa). Os mundos 1 a
3 tocam um arpejo sintetizado.

## Como uma trilha é definida

Em `src/data/mundos.js`, cada mundo (e o `MUSICA_TEMA`) tem um campo `musica`:

```js
musica: {
  arquivo: 'mundo4.mp3',      // faixa gravada em public/assets/audio/musica/
  volume: 0.35,
  autor: 'Richie Locker',     // opcional: crédito exibido quando a faixa começa
  notas: [587, 740, 880, 740, 659, 830, 988, 830],  // arpejo de reserva
  bpm: 130,
  onda: 'square'
}
```

`arquivo` e `notas` convivem: se o arquivo faltar ou o navegador não conseguir
tocá-lo, o `AudioManager` cai sozinho para o arpejo. Por isso o arpejo nunca
deve ser removido.

## Adicionar uma faixa

1. Salve o arquivo em `public/assets/audio/musica/` (por exemplo, `mundo1.mp3`).
2. Em `src/data/mundos.js`, descomente o `arquivo` daquele mundo.
3. Se a faixa for de outra pessoa, preencha `autor`.

**Formato:** MP3 ou OGG · 44,1 kHz · ~128 kbps · 30 a 60 s · em laço, sem *fade*
nas pontas. O MP3 costuma ter alguns milissegundos de silêncio nas pontas, o que
pode virar um "soluço" na emenda; exporte com a opção *gapless* ou use OGG.

## Volume

A tela de Ajustes tem dois controles de arrastar — música e efeitos — além de
liga/desliga do som. As preferências ficam em `localStorage` (`codequest_audio`).

## Por que a música só começa depois de um toque

Os navegadores bloqueiam áudio antes da primeira interação do usuário. O
`AudioManager` espera o primeiro toque ou clique para liberar o áudio e então
começa a trilha do momento.

## Efeitos sonoros

Todos são sintetizados na hora com a Web Audio API (osciladores), sem arquivos:
bloco encaixado, executar, passo, chave, vitória e erro.
