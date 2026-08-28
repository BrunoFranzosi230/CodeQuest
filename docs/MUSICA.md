# Compondo as músicas do CodeQuest

Guia de formato, especificação técnica e como plugar a faixa no jogo.

---

## Resposta curta

**Exporte em OGG Vorbis (`.ogg`), mono ou estéreo, 44.1 kHz, ~96 kbps, em laço
de 30 a 60 segundos.** Salve em `public/assets/audio/musica/` com o nome
`mundoN.ogg` e descomente a linha `arquivo:` do mundo em
[`src/data/mundos.js`](../src/data/mundos.js). Pronto — o jogo toca.

---

## 1. Por que OGG e não MP3

| | OGG Vorbis | MP3 | WAV |
|---|---|---|---|
| Laço perfeito | ✅ | ❌ | ✅ |
| Tamanho de um loop de 40s | ~500 kB | ~600 kB | ~7 MB |
| Chrome · Firefox · Edge | ✅ | ✅ | ✅ |
| Safari / iPhone | ❌ | ✅ | ✅ |

**O ponto decisivo é o laço.** O MP3 adiciona silêncio no início e no fim do
arquivo — é uma característica do próprio codec, não erro de exportação. Numa
música de fundo que repete a cada 40 segundos, isso vira um soluço audível a
cada volta. O OGG não tem esse problema.

WAV loopa perfeito, mas 7 MB por mundo derruba o carregamento — e o Directions
cobra *"carregamento < 5 s"*.

### E o Safari?

O jogo é hospedado como aplicação web e o GDD (1.4) mira **Chrome, Firefox e
Edge** — os três tocam OGG. Se um avaliador abrir no Safari, a faixa não carrega
e o jogo **volta sozinho para o arpejo sintetizado**: fica com música, só não a
sua. Ninguém vê erro.

Se quiser cobrir o Safari também, exporte cada faixa nos dois formatos
(`mundo1.ogg` e `mundo1.m4a`) e me avise — são poucas linhas para tentar o
segundo quando o primeiro falha.

---

## 2. Especificação técnica

| Parâmetro | Valor | Por quê |
|---|---|---|
| Formato | OGG Vorbis | laço sem emenda |
| Taxa de amostragem | 44.1 kHz | padrão; não use 48 kHz |
| Bitrate | 96 kbps (VBR q3) | chiptune não precisa de mais |
| Canais | mono ou estéreo | mono corta o arquivo pela metade |
| Duração | 30 a 60 s | menos que 30 s fica repetitivo |
| Pico | −3 dBFS | é fundo, não pode competir com os efeitos |
| Tamanho alvo | até 700 kB por mundo | o jogo inteiro tem 1,5 MB hoje |
| Início e fim | **sem fade** | fade cria buraco no laço |

### A regra mais importante: o laço tem que fechar

A última nota precisa emendar na primeira **sem silêncio e sem fade**. Na
prática:

1. componha um trecho de, digamos, 32 compassos;
2. corte exatamente no início do compasso 33 — não no fim do 32;
3. exporte só até esse ponto, **sem fade out**;
4. teste: no editor, toque em loop. Se você ouvir a emenda, ela está errada.

O jogo usa `AudioBufferSourceNode.loop`, que emenda com precisão de amostra.
Ele não conserta um arquivo mal cortado — ele reproduz fielmente o que você
entregar, inclusive o defeito.

---

## 3. Estilo, por mundo

O GDD 8.2 já define a direção. Os BPM abaixo são os do arpejo atual — servem
como ponto de partida, não como camisa de força.

| Mundo | Cenário | Estilo (GDD 8.2) | BPM |
|---|---|---|---|
| 1 — Floresta Mágica | grama, dia | chiptune simples, leve | 110 |
| 2 — Fábrica de Engrenagens | metal | chiptune rítmico, mecânico | 126 |
| 3 — Caverna Misteriosa | cristal roxo | chiptune tenso, misterioso | 100 |
| 4 — Cidade Futurista | neon | chiptune eletrônico | 130 |

Duas recomendações para o público de 6 a 11 anos:

- **Deixe espaço.** A criança fica minutos na mesma fase pensando. Música cheia
  demais cansa rápido e vira motivo para desligar o som.
- **Evite tensão real no Mundo 3.** "Misteriosa" para criança é curiosidade, não
  suspense. Nada de dissonância pesada ou percussão ameaçadora.

---

## 4. Com o que compor

Tudo abaixo é gratuito e exporta OGG:

| Ferramenta | Bom para |
|---|---|
| **BeepBox** (beepbox.co) | chiptune no navegador, sem instalar; ideal para começar |
| **LMMS** | DAW completo, gratuito, roda no Windows |
| **Bosca Ceoil** | feito para chiptune de jogo, bem simples |
| **Audacity** | não compõe, mas é o melhor para cortar o laço e exportar OGG |

Fluxo típico: compõe no BeepBox → exporta WAV → corta o laço e exporta OGG no
Audacity (`Arquivo → Exportar → Exportar como OGG`, qualidade 3).

> **Autoria.** Compor a própria trilha conta a favor no critério 5 do Demo Day
> ("autoria genuína"). Se usar qualquer trecho de terceiro, registre a licença
> em `docs/` — o projeto hoje não tem nenhum asset externo, e essa é uma
> posição confortável de defender.

---

## 5. Instalando a faixa no jogo

**1.** Salve o arquivo em:

```
public/assets/audio/musica/mundo1.ogg
```

**2.** Em [`src/data/mundos.js`](../src/data/mundos.js), descomente o `arquivo`
do mundo:

```js
// antes
musica: { /* arquivo:'mundo1.ogg', volume:0.35, */ notas:[...], bpm:110, onda:'triangle' }

// depois
musica: { arquivo:'mundo1.ogg', volume:0.35, notas:[...], bpm:110, onda:'triangle' }
```

Deixe `notas`, `bpm` e `onda` onde estão: eles continuam sendo a rede de
segurança se o arquivo falhar.

**3.** `npm run dev` e entre numa fase daquele mundo.

Não precisa mexer em mais nada. O `AudioManager` baixa, decodifica, guarda em
cache e toca em laço, com entrada suave de 1,2 s e saída de 0,25 s ao trocar de
mundo.

### Ajustando o volume

O `volume` vai de 0 a 1. **0.35 é um bom ponto de partida** — os efeitos sonoros
tocam em torno de 0.15 e precisam passar por cima da música. Se a criança não
ouvir o "peguei a chave", a música está alta demais.

### Um mundo por vez

Pode instalar só o Mundo 1 e deixar os outros três no arpejo. O jogo lida com a
mistura sem problema.

---

## 6. Conferindo se ficou bom

```bash
npm run dev
```

No console do navegador:

```js
som.tocarMusicaDoMundo(1)   // toca o tema do mundo 1
som.pararMusica()
som.alternar()              // liga/desliga, como o botão do rodapé
```

Checklist antes de fechar:

- [ ] Dá pelo menos duas voltas completas sem soluço na emenda
- [ ] Dá para ouvir os efeitos (chave, vitória, erro) por cima
- [ ] Não incomoda depois de 5 minutos na mesma fase
- [ ] O arquivo tem menos de 700 kB
- [ ] Trocar de mundo faz a transição sem estalo

Se o arquivo não carregar, o console avisa:

```
[AudioManager] faixa "mundo1.ogg" indisponível, usando o arpejo.
```

Causas prováveis: nome diferente do declarado, pasta errada, ou formato que o
navegador não abre.

---

## 7. Sobre o tamanho do build

Hoje o jogo tem ~1,5 MB (quase tudo Phaser). Quatro faixas de 500 kB somam
2 MB — mais que dobra.

Elas ficam em `public/`, então são baixadas **sob demanda**, não no
carregamento inicial: a faixa do Mundo 4 só é buscada quando a criança chega
lá. O tempo de abertura do jogo não muda.

Ainda assim, vale medir o total depois de instalar as quatro. O Directions
cobra carregamento abaixo de 5 s.
