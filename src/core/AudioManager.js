/**
 * AudioManager.js
 * Efeitos sintetizados em tempo real pela Web Audio API; música de fundo por
 * faixa gravada (quando existir) ou arpejo sintetizado. Volume por canal.
 */

import { mundoPorId, MUSICA_TEMA } from '../data/mundos.js';

const CHAVE_PREFS = 'codequest_audio';

/**
 * Dois canais com volume próprio, ajustáveis nas Configurações:
 * a música (trilha do tema e dos mundos) e os efeitos (cliques, passos, vitória).
 */
export const CANAL = { MUSICA: 'musica', EFEITOS: 'efeitos' };

export class AudioManager {
  /** @param {{storage?: Storage|null}} [opcoes] onde guardar volume e mudo. */
  constructor({ storage } = {}) {
    this.ctx = null;
    this._storage = storage !== undefined ? storage
      : (typeof localStorage !== 'undefined' ? localStorage : null);
    const prefs = this._lerPrefs();
    this.ligado = prefs.ligado;
    this._volumes = { [CANAL.MUSICA]: prefs.musica, [CANAL.EFEITOS]: prefs.efeitos };
    this._canais = {};             // canal → GainNode ligado ao destino
    this._timerMusica = null;
    this._mundoAtual = 1;
    this._faixas = new Map();      // arquivo → AudioBuffer decodificado
    this._faixaTocando = null;
    this._trilha = null;           // 'jogo' | 'mundoN' — o que deveria estar tocando
    this._musica = null;           // config da trilha (ver mundos.js)
    this._tocando = false;
    this._gestoArmado = false;
  }

  _acordar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.ligado = false; return null; }
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
      this._destravarNoPrimeiroGesto();
    }
    return this.ctx;
  }

  /**
   * O navegador só libera áudio depois de uma interação. O tema do jogo é
   * pedido já na abertura, então o primeiro clique/tecla em qualquer lugar
   * destrava o contexto e a música começa ali.
   */
  _destravarNoPrimeiroGesto() {
    if (this._gestoArmado || typeof document === 'undefined') return;
    this._gestoArmado = true;
    const eventos = ['pointerdown', 'keydown', 'touchstart'];
    const destravar = () => {
      this.ctx?.resume();
      eventos.forEach(ev => document.removeEventListener(ev, destravar, true));
      this._gestoArmado = false;
    };
    eventos.forEach(ev => document.addEventListener(ev, destravar, true));
  }

  // ── Volume e preferências ─────────────────────────────────────────────────

  _lerPrefs() {
    const padrao = { musica: 0.7, efeitos: 0.8, ligado: true };
    try {
      const p = JSON.parse(this._storage?.getItem(CHAVE_PREFS) ?? 'null');
      if (!p || typeof p !== 'object') return padrao;
      const vol = (v, d) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : d);
      return {
        musica: vol(p.musica, padrao.musica),
        efeitos: vol(p.efeitos, padrao.efeitos),
        ligado: typeof p.ligado === 'boolean' ? p.ligado : true
      };
    } catch {
      return padrao;
    }
  }

  _salvarPrefs() {
    try {
      this._storage?.setItem(CHAVE_PREFS, JSON.stringify({
        musica: this._volumes[CANAL.MUSICA],
        efeitos: this._volumes[CANAL.EFEITOS],
        ligado: this.ligado
      }));
    } catch { /* navegação anônima: vale só nesta sessão */ }
  }

  /** Nó de volume do canal, criado na primeira vez que o canal toca algo. */
  _canal(canal) {
    if (!this.ctx) return null;
    if (!this._canais[canal]) {
      const g = this.ctx.createGain();
      g.gain.value = this._volumes[canal];
      g.connect(this.ctx.destination);
      this._canais[canal] = g;
    }
    return this._canais[canal];
  }

  /** Volume de 0 a 1 do canal (`CANAL.MUSICA` ou `CANAL.EFEITOS`). */
  volume(canal) {
    return this._volumes[canal];
  }

  definirVolume(canal, valor) {
    if (!(canal in this._volumes)) return;
    const v = Math.min(Math.max(Number(valor) || 0, 0), 1);
    this._volumes[canal] = v;
    if (this._canais[canal]) this._canais[canal].gain.value = v;
    this._salvarPrefs();
  }

  // ── Síntese ───────────────────────────────────────────────────────────────

  /** Uma nota simples com envelope de ataque/decaimento. */
  nota(freq, dur = 0.12, onda = 'square', vol = 0.18, atraso = 0, canal = CANAL.EFEITOS) {
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

    osc.connect(g).connect(this._canal(canal));
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

  // ── Música de fundo (GDD 8.2) ─────────────────────────────────────────────
  //
  // Duas trilhas: o tema do jogo (login, menu e escolha de mundo) e o tema de
  // cada mundo (dentro das fases). Cada uma tem dois modos, e o jogo escolhe
  // sozinho:
  //
  //   1. Faixa gravada — se existir o arquivo declarado em `mundos.js`
  //      (`musica.arquivo`), ele é tocado em laço contínuo.
  //   2. Arpejo sintetizado — o padrão, e a rede de segurança: vale enquanto a
  //      faixa não existe, se o download falhar ou se o formato não for
  //      suportado pelo navegador.
  //
  // O laço usa `AudioBufferSourceNode.loop`, que emenda o fim no começo com
  // precisão de amostra — sem o silêncio que os players de `<audio>` inserem.

  /** Tema do jogo: fora das fases. */
  tocarMusicaDoJogo() {
    return this._tocarTrilha('jogo', MUSICA_TEMA);
  }

  tocarMusicaDoMundo(mundoId) {
    this._mundoAtual = mundoId;
    return this._tocarTrilha(`mundo${mundoId}`, mundoPorId(mundoId).musica);
  }

  /**
   * Troca a trilha. Pedir a que já está tocando não reinicia — navegar entre
   * menu e mapa, ou repetir uma fase do mesmo mundo, mantém a música corrida.
   */
  async _tocarTrilha(chave, musica) {
    if (this._trilha === chave && this._tocando) return;

    this.pararMusica();
    this._trilha = chave;
    this._musica = musica;
    if (!this.ligado) return;          // lembra a trilha para quando religar
    this._tocando = true;

    if (musica.arquivo) {
      const buffer = await this._carregarFaixa(musica.arquivo);
      if (this._trilha !== chave || !this._tocando) return;   // trocou durante o download
      if (buffer) {
        this._tocarFaixa(buffer, musica.volume ?? 0.35);
        return;
      }
    }
    this._iniciarMusica(musica);
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

    fonte.connect(ganho).connect(this._canal(CANAL.MUSICA));
    fonte.start();

    this._faixaTocando = { fonte, ganho };
  }

  _iniciarMusica(musica) {
    if (!this.ligado || this._timerMusica) return;
    if (!musica.notas?.length || !musica.bpm) return;   // sem arpejo de reserva: fica em silêncio
    if (!this._acordar()) return;
    const intervalo = 60000 / musica.bpm / 2;
    let i = 0;
    this._timerMusica = setInterval(() => {
      // antes do primeiro gesto o contexto está suspenso: agendar notas ali
      // as acumularia todas para tocar de uma vez quando destravar
      if (!this.ligado || this.ctx?.state !== 'running') return;
      this.nota(musica.notas[i % musica.notas.length], 0.16, musica.onda, 0.035, 0, CANAL.MUSICA);
      i++;
    }, intervalo);
  }

  pararMusica() {
    this._tocando = false;
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

  /** Liga/desliga todo o áudio. Ao religar, retoma a trilha da tela atual. */
  alternar() {
    return this.definirLigado(!this.ligado);
  }

  /** Liga ou desliga todo o áudio e lembra a escolha no aparelho. */
  definirLigado(ligado) {
    if (ligado === this.ligado) return this.ligado;
    this.ligado = Boolean(ligado);
    this._salvarPrefs();
    if (this.ligado) {
      this.clique();
      if (this._musica) void this._tocarTrilha(this._trilha, this._musica);
    } else {
      this.pararMusica();
    }
    return this.ligado;
  }
}
