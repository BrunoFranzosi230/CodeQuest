# Músicas de fundo

Coloque aqui o tema do jogo e as faixas de cada mundo:

```
tema.mp3      Tema do jogo          toca no login, menu e escolha de mundo, ~112 BPM
mundo1.mp3    Floresta Mágica       chiptune simples, ~110 BPM
mundo2.mp3    Fábrica de Engrenagens chiptune rítmico, ~126 BPM
mundo3.mp3    Caverna Misteriosa    chiptune misterioso, ~100 BPM
mundo4.mp3    Cidade Futurista      chiptune eletrônico, ~130 BPM
```

**MP3 (ou OGG) · 44.1 kHz · ~128 kbps · 30–60 s · em laço, sem fade nas pontas.**

O MP3 costuma ter alguns milissegundos de silêncio no começo e no fim, e isso
pode virar um "soluço" curto na emenda do laço. Para evitar, exporte com a
opção *gapless* ou use OGG.

Depois de salvar, descomente o campo `arquivo` do mundo (ou do `MUSICA_TEMA`)
em `src/data/mundos.js`. Enquanto o arquivo não existir, o jogo usa o arpejo
sintetizado — nada quebra.

Guia completo: [`docs/MUSICA.md`](../../../../docs/MUSICA.md)
