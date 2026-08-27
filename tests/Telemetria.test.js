import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Telemetria, TIPO } from '../src/core/Telemetria.js';
import { GameManager, EVENTOS } from '../src/core/GameManager.js';

/** Relógio controlado, para os testes não dependerem de tempo real. */
function relogio(inicio = 1_000_000) {
  let t = inicio;
  return { agora: () => t, avancar: ms => { t += ms; } };
}

describe('Telemetria', () => {
  let tel, tempo;

  beforeEach(() => {
    localStorage.clear();
    tempo = relogio();
    tel = new Telemetria({ agora: tempo.agora });
  });

  describe('sessão', () => {
    it('gera um id efêmero e registra o início', () => {
      const id = tel.iniciarSessao();
      expect(id).toMatch(/^s-/);
      expect(tel.eventos()[0].tipo).toBe(TIPO.SESSAO_INICIADA);
    });

    it('cada sessão tem id diferente', () => {
      const a = tel.iniciarSessao();
      const b = new Telemetria({ agora: tempo.agora }).iniciarSessao();
      expect(a).not.toBe(b);
    });

    it('não guarda nenhum dado pessoal — o público são crianças', () => {
      tel.iniciarSessao();
      tel.registrar('fase_concluida', { fase: 'mundo1-fase1', estrelas: 3 });

      const CAMPOS_PERMITIDOS = new Set([
        't', 'sessao', 'tipo', 'tela', 'fase', 'mundo', 'estrelas', 'blocos',
        'tentativas', 'tentativa', 'segundos', 'motivo', 'origem', 'mensagem', 'pilha'
      ]);
      const PROIBIDOS = /(^|_)(nome|email|cpf|usuario|login|telefone|endereco|ip)($|_)/i;

      for (const evento of tel.eventos()) {
        for (const campo of Object.keys(evento)) {
          expect(CAMPOS_PERMITIDOS.has(campo), `campo inesperado: ${campo}`).toBe(true);
          expect(campo, `campo sensível: ${campo}`).not.toMatch(PROIBIDOS);
        }
      }
    });
  });

  describe('registro', () => {
    it('carimba horário, sessão e tipo', () => {
      tel.iniciarSessao();
      const e = tel.registrar('teste', { a: 1 });
      expect(e).toMatchObject({ t: tempo.agora(), sessao: tel.sessaoId, tipo: 'teste', a: 1 });
    });

    it('mantém apenas os eventos mais recentes (buffer circular)', () => {
      const curta = new Telemetria({ agora: tempo.agora, max: 5 });
      for (let i = 0; i < 20; i++) curta.registrar('teste', { i });

      const eventos = curta.eventos();
      expect(eventos).toHaveLength(5);
      expect(eventos.at(-1).i).toBe(19);
    });

    it('storage indisponível não derruba o jogo', () => {
      const semStorage = new Telemetria({ storage: null, agora: tempo.agora });
      expect(() => semStorage.registrar('teste')).not.toThrow();
      expect(semStorage.eventos()).toEqual([]);
    });

    it('cota estourada não derruba o jogo', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('cota');
      });
      expect(() => tel.registrar('teste')).not.toThrow();
      vi.restoreAllMocks();
    });

    it('dados corrompidos no storage viram lista vazia', () => {
      localStorage.setItem('codequest_telemetria', 'nao é json');
      expect(tel.eventos()).toEqual([]);
    });
  });

  describe('captura de erros', () => {
    it('registra mensagem e pilha de um Error', () => {
      const e = tel.registrarErro(new Error('quebrou'), 'teste');
      expect(e.tipo).toBe(TIPO.ERRO);
      expect(e.mensagem).toBe('quebrou');
      expect(e.pilha).toBeTruthy();
    });

    it('aceita erro que não é Error', () => {
      expect(tel.registrarErro('falha em texto').mensagem).toBe('falha em texto');
    });

    it('captura erro não tratado da janela', () => {
      const desligar = tel.ligarCapturaGlobal(window);
      window.dispatchEvent(new ErrorEvent('error', { message: 'estourou' }));
      expect(tel.eventos().some(e => e.tipo === TIPO.ERRO)).toBe(true);
      desligar();
    });

    it('a função devolvida desliga a captura', () => {
      tel.ligarCapturaGlobal(window)();
      window.dispatchEvent(new ErrorEvent('error', { message: 'ignorado' }));
      expect(tel.eventos()).toHaveLength(0);
    });

    it('sem janela, não quebra', () => {
      expect(() => tel.ligarCapturaGlobal(null)()).not.toThrow();
    });
  });

  describe('integração com o jogo', () => {
    let gm;

    beforeEach(() => {
      gm = new GameManager();
      tel.iniciarSessao();
      tel.ligarAoJogo(gm);
    });

    it('registra o ciclo completo de uma fase', () => {
      gm.emit(EVENTOS.FASE_CARREGADA, { config: { id: 'mundo1-fase1', mundo: 1 } });
      gm.emit(EVENTOS.FASE_FALHOU, { motivo: 'colisao' });
      gm.emit(EVENTOS.FASE_FALHOU, { motivo: 'nao_chegou' });
      tempo.avancar(45_000);
      gm.emit(EVENTOS.FASE_CONCLUIDA, { faseId: 'mundo1-fase1', estrelas: 2, blocosUsados: 6 });

      const conclusao = tel.eventos().find(e => e.tipo === TIPO.FASE_CONCLUIDA);
      expect(conclusao).toMatchObject({
        fase: 'mundo1-fase1', estrelas: 2, blocos: 6, tentativas: 2, segundos: 45
      });
    });

    it('zera o contador de tentativas ao trocar de fase', () => {
      gm.emit(EVENTOS.FASE_CARREGADA, { config: { id: 'mundo1-fase1', mundo: 1 } });
      gm.emit(EVENTOS.FASE_FALHOU, { motivo: 'colisao' });
      gm.emit(EVENTOS.FASE_CARREGADA, { config: { id: 'mundo1-fase2', mundo: 1 } });
      gm.emit(EVENTOS.FASE_CONCLUIDA, { faseId: 'mundo1-fase2', estrelas: 3, blocosUsados: 5 });

      const conclusao = tel.eventos().find(e => e.tipo === TIPO.FASE_CONCLUIDA);
      expect(conclusao.tentativas).toBe(0);
    });

    it('a função devolvida cancela todas as assinaturas', () => {
      const desligar = tel.ligarAoJogo(gm);
      const antes = tel.eventos().length;
      desligar();
      gm.emit(EVENTOS.FASE_CARREGADA, { config: { id: 'x', mundo: 1 } });
      // a primeira assinatura (do beforeEach) ainda vale, então cresce 1 só
      expect(tel.eventos().length).toBe(antes + 1);
    });
  });

  describe('resumo — as métricas de playtest do GDD seção 10', () => {
    beforeEach(() => tel.iniciarSessao());

    it('agrega tentativas, tempo, estrelas, blocos e uso de dica', () => {
      const gm = new GameManager();
      tel.ligarAoJogo(gm);

      gm.emit(EVENTOS.FASE_CARREGADA, { config: { id: 'mundo1-fase1', mundo: 1 } });
      gm.emit(EVENTOS.FASE_FALHOU, { motivo: 'colisao' });
      gm.emit(EVENTOS.DICA_DISPONIVEL, { dica: 'x' });
      tempo.avancar(30_000);
      gm.emit(EVENTOS.FASE_CONCLUIDA, { faseId: 'mundo1-fase1', estrelas: 3, blocosUsados: 4 });

      gm.emit(EVENTOS.FASE_CARREGADA, { config: { id: 'mundo1-fase2', mundo: 1 } });
      gm.emit(EVENTOS.FASE_FALHOU, { motivo: 'nao_chegou' });

      const r = tel.resumo();
      expect(r.fases['mundo1-fase1']).toEqual({
        tentativasFalhas: 1, concluida: true, usouDica: true,
        estrelas: 3, blocos: 4, segundos: 30
      });
      expect(r.fases['mundo1-fase2'].concluida).toBe(false);
      expect(r).toMatchObject({ iniciadas: 2, concluidas: 1, taxaConclusao: 0.5 });
    });

    it('conta os erros da sessão', () => {
      tel.registrarErro(new Error('a'));
      tel.registrarErro(new Error('b'));
      expect(tel.resumo().erros).toBe(2);
    });

    it('sessão vazia devolve resumo neutro', () => {
      const vazia = new Telemetria({ storage: null });
      expect(vazia.resumo()).toMatchObject({ iniciadas: 0, concluidas: 0, taxaConclusao: 0 });
    });
  });

  it('exportar devolve JSON com resumo e eventos', () => {
    tel.iniciarSessao();
    const dados = JSON.parse(tel.exportar());
    expect(dados).toHaveProperty('resumo');
    expect(dados).toHaveProperty('eventos');
  });

  it('limpar apaga os eventos', () => {
    tel.iniciarSessao();
    tel.limpar();
    expect(tel.eventos()).toEqual([]);
  });
});
