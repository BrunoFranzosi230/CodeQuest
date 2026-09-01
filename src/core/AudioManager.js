/**
 * AudioManager.js
 * Todo o áudio do jogo é sintetizado em tempo real pela Web Audio API.
 * Zero arquivos, zero download, zero questão de licenciamento de assets.
 */

import { mundoPorId } from '../data/mundos.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.ligado = true;
    this._timerMusica = null;
    this._mundoAtual = 1;
    this._faixas = new Map();      // arquivo → AudioBuffer decodificado
    this._faixaTocando = null;
  }

  _acordar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.ligado = false; return null; }
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** Uma nota simples com envelope de ataque/decaimento. */
  nota(freq, dur = 0.12, onda = 'square', vol = 0.18, atraso = 0) {
    if (!this.ligado) return;
    const ctx = this._acordar();
    if (!ctx) return;

    const t = ctx.currentTime + atraso;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = onda;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _melodia(notas, onda = 'square', vol = 0.16) {
    notas.forEach(([freq, atraso, dur]) => this.nota(freq, dur || 0.12, onda, vol, atraso));
  }

  // ── Efeitos sonoros (GDD 8.1) ─────────────────────────────────────────────

  encaixar() { this.nota(660, 0.07, 'square', 0.14); this.nota(880, 0.09, 'square', 0.12, 0.05); }
  remover()  { this.nota(300, 0.09, 'square', 0.12); }
  clique()   { this.nota(520, 0.06, 'triangle', 0.14); }
  executar() { this._melodia([[523,0],[659,0.07],[784,0.14]], 'square', 0.15); }
  passo()    { this.nota(420, 0.05, 'triangle', 0.10); }
  girar()    { this.nota(560, 0.07, 'sine', 0.10); }
  chave()    { this._melodia([[880,0],[1046,0.07],[1318,0.14,0.2]], 'sine', 0.17); }
  vitoria()  { this._melodia([[523,0],[659,0.1],[784,0.2],[1046,0.3,0.35]], 'square', 0.17); }
  erro()     { this._melodia([[380,0,0.14],[300,0.12,0.18],[220,0.26,0.28]], 'sawtooth', 0.12); }
  estrela()  { this.nota(1200, 0.1, 'sine', 0.13); }

  // ── Música de fundo por mundo (GDD 8.2) ───────────────────────────────────
  //
  // Há dois modos, e o jogo escolhe sozinho:
  //
  //   1. Faixa gravada — se existir o arquivo declarado em `mundos.js`
  //      (`musica.arquivo`), ele é tocado em laço contínuo.
  //   2. Arpejo sintetizado — o padrão, e a rede de segurança: vale enquanto a
  //      faixa não existe, se o download falhar ou se o formato não for
  //      suportado pelo navegador.
  //
  // O laço usa `AudioBufferSourceNode.loop`, que emenda o fim no começo com
  // precisão de amostra — sem o silêncio que os players de `<audio>` inserem.

  async tocarMusicaDoMundo(mundoId) {
    this._mundoAtual = mundoId;
    this.pararMusica();

    const { musica } = mundoPorId(mundoId);
    if (musica.arquivo) {
      const buffer = await this._carregarFaixa(musica.arquivo);
      if (buffer && this._mundoAtual === mundoId) {
        this._tocarFaixa(buffer, musica.volume ?? 0.35);
        return;
      }
    }
    this._iniciarMusica();
  }

  /** Baixa e decodifica a faixa uma vez; devolve null se não der. */
  async _carregarFaixa(arquivo) {
    if (this._faixas.has(arquivo)) return this._faixas.get(arquivo);

    const ctx = this._acordar();
    if (!ctx) return null;

    try {
      const base = import.meta.env?.BASE_URL || '/';
      const resp = await fetch(`${base}assets/audio/musica/${arquivo}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const buffer = await ctx.decodeAudioData(await resp.arrayBuffer());
      this._faixas.set(arquivo, buffer);
      return buffer;
    } catch (e) {
      // sem faixa o jogo não fica mudo: cai no arpejo sintetizado
      console.warn(`[AudioManager] faixa "${arquivo}" indisponível, usando o arpejo.`, e);
      this._faixas.set(arquivo, null);
      return null;
    }
  }

  _tocarFaixa(buffer, volume) {
    if (!this.ligado) return;
    const ctx = this._acordar();
    if (!ctx) return;

    const fonte = ctx.createBufferSource();
    const ganho = ctx.createGain();

    fonte.buffer = buffer;
    fonte.loop = true;                       // emenda sem falha entre as voltas

    // entrada suave: um corte seco no início incomoda em fone de ouvido
    ganho.gain.setValueAtTime(0, ctx.currentTime);
    ganho.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);

    fonte.connect(ganho).connect(ctx.destination);
    fonte.start();

    this._faixaTocando = { fonte, ganho };
  }

  _iniciarMusica() {
    if (!this.ligado || this._timerMusica) return;
    const { musica } = mundoPorId(this._mundoAtual);
    const intervalo = 60000 / musica.bpm / 2;
    let i = 0;
    this._timerMusica = setInterval(() => {
      if (!this.ligado) return;
      this.nota(musica.notas[i % musica.notas.length], 0.16, musica.onda, 0.035);
      i++;
    }, intervalo);
  }

  pararMusica() {
    clearInterval(this._timerMusica);
    this._timerMusica = null;

    if (this._faixaTocando) {
      const { fonte, ganho } = this._faixaTocando;
      try {
        // desce o volume antes de cortar, para não estalar
        const t = this.ctx.currentTime;
        ganho.gain.cancelScheduledValues(t);
        ganho.gain.setValueAtTime(ganho.gain.value, t);
        ganho.gain.linearRampToValueAtTime(0, t + 0.25);
        fonte.stop(t + 0.3);
      } catch { /* já parou */ }
      this._faixaTocando = null;
    }
  }

  /**
   * Liga/desliga todo o áudio.
   * @param {boolean} retomarMusica quando religa, retoma a música do mundo atual.
   *   As telas sem trilha (menu, mapa de fases) passam `false` para não
   *   começar uma música que não deveria tocar ali.
   */
  alternar(retomarMusica = true) {
    this.ligado = !this.ligado;
    if (this.ligado) {
      this.clique();
      if (retomarMusica) this.tocarMusicaDoMundo(this._mundoAtual);
    } else {
      this.pararMusica();
    }
    return this.ligado;
  }
}
