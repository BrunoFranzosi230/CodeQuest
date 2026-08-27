/**
 * O que importa aqui não é o som — é o jogo nunca ficar mudo nem quebrar
 * quando a faixa não existe, o download falha ou o formato não é suportado.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager } from '../src/core/AudioManager.js';
import { MUNDOS } from '../src/data/mundos.js';

/** AudioContext de mentira: registra o que foi tocado, sem emitir som. */
function contextoFalso() {
  const criados = [];
  const no = () => ({
    connect: alvo => alvo,
    start: vi.fn(), stop: vi.fn(),
    gain: {
      value: 0,
      setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn()
    },
    frequency: { setValueAtTime: vi.fn() },
    type: '', buffer: null, loop: false
  });

  return {
    criados,
    state: 'running',
    currentTime: 0,
    destination: {},
    resume: vi.fn(),
    createOscillator: () => { const o = no(); criados.push({ tipo: 'osc', no: o }); return o; },
    createGain: () => no(),
    createBufferSource: () => { const s = no(); criados.push({ tipo: 'faixa', no: s }); return s; },
    decodeAudioData: vi.fn(async () => ({ duration: 40 }))
  };
}

describe('AudioManager', () => {
  let som, ctx;

  beforeEach(() => {
    ctx = contextoFalso();
    som = new AudioManager();
    som.ctx = ctx;                    // já "acordado", sem tocar em Web Audio real
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => { som.pararMusica(); vi.restoreAllMocks(); });

  describe('efeitos sonoros', () => {
    it('cada efeito do GDD 8.1 emite som', () => {
      for (const efeito of ['encaixar', 'clique', 'executar', 'passo', 'girar',
                            'chave', 'vitoria', 'erro', 'estrela', 'remover']) {
        ctx.criados.length = 0;
        som[efeito]();
        expect(ctx.criados.length, efeito).toBeGreaterThan(0);
      }
    });

    it('com o som desligado, nada é emitido', () => {
      som.ligado = false;
      som.vitoria();
      expect(ctx.criados).toHaveLength(0);
    });
  });

  describe('música sem faixa gravada — o padrão de hoje', () => {
    it('todo mundo tem arpejo de reserva configurado', () => {
      for (const m of MUNDOS) {
        expect(m.musica.notas.length, `mundo ${m.id}`).toBeGreaterThan(0);
        expect(m.musica.bpm, `mundo ${m.id}`).toBeGreaterThan(0);
      }
    });

    it('sem `arquivo` declarado, toca o arpejo sintetizado', async () => {
      await som.tocarMusicaDoMundo(1);
      expect(som._timerMusica).not.toBeNull();
      expect(som._faixaTocando).toBeNull();
    });
  });

  describe('música com faixa gravada', () => {
    beforeEach(() => {
      MUNDOS[0].musica.arquivo = 'mundo1.ogg';
      MUNDOS[0].musica.volume = 0.35;
    });
    afterEach(() => {
      delete MUNDOS[0].musica.arquivo;
      delete MUNDOS[0].musica.volume;
    });

    it('baixa, decodifica e toca em laço contínuo', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));

      await som.tocarMusicaDoMundo(1);

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('assets/audio/musica/mundo1.ogg'));
      expect(som._faixaTocando).not.toBeNull();
      expect(som._faixaTocando.fonte.loop, 'a faixa precisa repetir').toBe(true);
      expect(som._timerMusica, 'não deve tocar arpejo junto').toBeNull();
      vi.unstubAllGlobals();
    });

    it('guarda a faixa em cache: entrar de novo no mundo não rebaixa', async () => {
      const busca = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
      vi.stubGlobal('fetch', busca);

      await som.tocarMusicaDoMundo(1);
      await som.tocarMusicaDoMundo(1);
      expect(busca).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });

    it('arquivo faltando cai no arpejo — o jogo não fica mudo', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));

      await som.tocarMusicaDoMundo(1);
      expect(som._faixaTocando).toBeNull();
      expect(som._timerMusica, 'deveria ter caído no arpejo').not.toBeNull();
      vi.unstubAllGlobals();
    });

    it('formato não suportado pelo navegador cai no arpejo', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
      ctx.decodeAudioData = vi.fn(async () => { throw new Error('formato inválido'); });

      await som.tocarMusicaDoMundo(1);
      expect(som._timerMusica).not.toBeNull();
      vi.unstubAllGlobals();
    });

    it('não tenta baixar de novo uma faixa que já falhou', async () => {
      const busca = vi.fn(async () => ({ ok: false, status: 404 }));
      vi.stubGlobal('fetch', busca);

      await som.tocarMusicaDoMundo(1);
      await som.tocarMusicaDoMundo(1);
      expect(busca).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });
  });

  describe('troca de mundo e liga/desliga', () => {
    it('trocar de mundo para a música anterior', async () => {
      await som.tocarMusicaDoMundo(1);
      const timerAnterior = som._timerMusica;
      await som.tocarMusicaDoMundo(2);
      expect(som._timerMusica).not.toBe(timerAnterior);
      expect(som._mundoAtual).toBe(2);
    });

    it('desligar silencia e religar retoma o mundo atual', async () => {
      await som.tocarMusicaDoMundo(3);
      expect(som.alternar()).toBe(false);
      expect(som._timerMusica).toBeNull();

      expect(som.alternar()).toBe(true);
      await new Promise(r => setTimeout(r, 10));
      expect(som._mundoAtual).toBe(3);
    });

    it('parar duas vezes seguidas não quebra', () => {
      expect(() => { som.pararMusica(); som.pararMusica(); }).not.toThrow();
    });
  });

  it('sem Web Audio no navegador, o jogo segue sem som', () => {
    const semAudio = new AudioManager();
    semAudio.ctx = null;
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);

    expect(() => semAudio.clique()).not.toThrow();
    vi.unstubAllGlobals();
  });
});
