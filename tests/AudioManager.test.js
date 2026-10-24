/**
 * O que importa aqui não é o som — é o jogo nunca ficar mudo nem quebrar
 * quando a faixa não existe, o download falha ou o formato não é suportado.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager, CANAL } from '../src/core/AudioManager.js';
import { MUNDOS, MUSICA_TEMA } from '../src/data/mundos.js';

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
    som = new AudioManager({ storage: null });
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

    it('avisa quando a faixa gravada começa (para mostrar o crédito)', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
      MUNDOS[0].musica.autor = 'Fulana';
      const aviso = vi.fn();
      som.aoComecarFaixa = aviso;

      await som.tocarMusicaDoMundo(1);
      expect(aviso).toHaveBeenCalledWith(expect.objectContaining({ autor: 'Fulana' }));

      await som.tocarMusicaDoMundo(1);   // mesma trilha: não reinicia, não repete o crédito
      expect(aviso).toHaveBeenCalledTimes(1);
      delete MUNDOS[0].musica.autor;
      vi.unstubAllGlobals();
    });

    it('arpejo de reserva não dispara o crédito da faixa', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
      const aviso = vi.fn();
      som.aoComecarFaixa = aviso;
      await som.tocarMusicaDoMundo(1);
      expect(aviso).not.toHaveBeenCalled();
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

  describe('tema do jogo (fora das fases)', () => {
    // O tema pode ter MP3 configurado; aqui a faixa "não existe" para os testes
    // não dependerem da rede e exercitarem o arpejo de reserva.
    beforeEach(() => vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 }))));
    afterEach(() => vi.unstubAllGlobals());

    it('o tema tem arpejo de reserva configurado', () => {
      expect(MUSICA_TEMA.notas.length).toBeGreaterThan(0);
      expect(MUSICA_TEMA.bpm).toBeGreaterThan(0);
    });

    it('toca o tema e marca a trilha como "jogo"', async () => {
      await som.tocarMusicaDoJogo();
      expect(som._trilha).toBe('jogo');
      expect(som._timerMusica).not.toBeNull();
    });

    it('pedir o tema de novo não reinicia a música (menu → mapa)', async () => {
      await som.tocarMusicaDoJogo();
      const timer = som._timerMusica;
      await som.tocarMusicaDoJogo();
      expect(som._timerMusica).toBe(timer);
    });

    it('fase → mapa → fase alterna entre mundo e tema', async () => {
      await som.tocarMusicaDoJogo();
      await som.tocarMusicaDoMundo(2);
      expect(som._trilha).toBe('mundo2');
      await som.tocarMusicaDoJogo();
      expect(som._trilha).toBe('jogo');
    });

    it('repetir uma fase do mesmo mundo não reinicia a música', async () => {
      await som.tocarMusicaDoMundo(1);
      const timer = som._timerMusica;
      await som.tocarMusicaDoMundo(1);
      expect(som._timerMusica).toBe(timer);
    });

    it('religar o som no mapa volta a tocar o tema', async () => {
      await som.tocarMusicaDoJogo();
      som.alternar();
      expect(som._timerMusica).toBeNull();
      som.alternar();
      await new Promise(r => setTimeout(r, 10));
      expect(som._trilha).toBe('jogo');
      expect(som._timerMusica).not.toBeNull();
    });

    it('com o som desligado, trocar de tela não toca, mas lembra a trilha', async () => {
      som.ligado = false;
      await som.tocarMusicaDoJogo();
      expect(som._timerMusica).toBeNull();
      som.alternar();
      await new Promise(r => setTimeout(r, 10));
      expect(som._trilha).toBe('jogo');
      expect(som._timerMusica).not.toBeNull();
    });

    it('sair da fase durante o download não deixa a música do mundo tocar', async () => {
      MUNDOS[0].musica.arquivo = 'mundo1.ogg';
      let liberar;
      vi.stubGlobal('fetch', vi.fn(url => url.includes('mundo1')
        ? new Promise(r => { liberar = r; })          // download do mundo fica pendurado
        : Promise.resolve({ ok: false, status: 404 })));

      const mundo = som.tocarMusicaDoMundo(1);
      await som.tocarMusicaDoJogo();
      liberar({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
      await mundo;

      expect(som._trilha).toBe('jogo');
      expect(som._faixaTocando).toBeNull();
      delete MUNDOS[0].musica.arquivo;
    });

    it('antes do primeiro clique (contexto suspenso) não acumula notas', async () => {
      vi.useFakeTimers();
      ctx.state = 'suspended';
      await som.tocarMusicaDoJogo();
      vi.advanceTimersByTime(3000);
      expect(ctx.criados).toHaveLength(0);

      ctx.state = 'running';
      vi.advanceTimersByTime(1000);
      expect(ctx.criados.length).toBeGreaterThan(0);
      vi.useRealTimers();
    });
  });

  describe('volume por canal e preferências', () => {
    /** localStorage de mentira, para ver o que é lembrado entre visitas. */
    const memoria = (inicial = {}) => {
      const dados = { ...inicial };
      return { getItem: k => dados[k] ?? null, setItem: (k, v) => { dados[k] = v; }, dados };
    };

    it('começa com volumes padrão e som ligado', () => {
      const s = new AudioManager({ storage: memoria() });
      expect(s.volume(CANAL.MUSICA)).toBeGreaterThan(0);
      expect(s.volume(CANAL.EFEITOS)).toBeGreaterThan(0);
      expect(s.ligado).toBe(true);
    });

    it('música e efeitos têm canais separados', () => {
      som.definirVolume(CANAL.MUSICA, 0.2);
      som.definirVolume(CANAL.EFEITOS, 0.9);
      som.clique();
      expect(som._canais[CANAL.EFEITOS].gain.value).toBe(0.9);
      expect(som._canal(CANAL.MUSICA).gain.value).toBe(0.2);
    });

    it('mudar o volume com o canal já tocando aplica na hora', () => {
      som.clique();
      som.definirVolume(CANAL.EFEITOS, 0.3);
      expect(som._canais[CANAL.EFEITOS].gain.value).toBe(0.3);
    });

    it('volume fica entre 0 e 1', () => {
      som.definirVolume(CANAL.MUSICA, 7);
      expect(som.volume(CANAL.MUSICA)).toBe(1);
      som.definirVolume(CANAL.MUSICA, -2);
      expect(som.volume(CANAL.MUSICA)).toBe(0);
    });

    it('lembra volume e mudo na próxima visita', () => {
      const armazenamento = memoria();
      const a = new AudioManager({ storage: armazenamento });
      a.ctx = ctx;
      a.definirVolume(CANAL.MUSICA, 0.25);
      a.definirLigado(false);

      const b = new AudioManager({ storage: armazenamento });
      expect(b.volume(CANAL.MUSICA)).toBe(0.25);
      expect(b.ligado).toBe(false);
    });

    it('preferência corrompida não quebra: volta ao padrão', () => {
      const s = new AudioManager({ storage: memoria({ codequest_audio: '{lixo' }) });
      expect(s.ligado).toBe(true);
      const t = new AudioManager({ storage: memoria({ codequest_audio: JSON.stringify({ musica: 50, ligado: 'sim' }) }) });
      expect(t.volume(CANAL.MUSICA)).toBeLessThanOrEqual(1);
      expect(t.ligado).toBe(true);
    });
  });

  it('sem Web Audio no navegador, o jogo segue sem som', () => {
    const semAudio = new AudioManager({ storage: null });
    semAudio.ctx = null;
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);

    expect(() => semAudio.clique()).not.toThrow();
    vi.unstubAllGlobals();
  });
});
