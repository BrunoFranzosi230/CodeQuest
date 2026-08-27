import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameManager, EVENTOS } from '../src/core/GameManager.js';

describe('GameManager', () => {
  let gm;

  beforeEach(() => {
    localStorage.clear();
    gm = new GameManager();
  });

  describe('barramento de eventos', () => {
    it('entrega o evento a quem assinou', () => {
      const ouvinte = vi.fn();
      gm.on('QUALQUER', ouvinte);
      gm.emit('QUALQUER', { x: 1 });
      expect(ouvinte).toHaveBeenCalledWith({ x: 1 });
    });

    it('a função devolvida por on() cancela a assinatura', () => {
      const ouvinte = vi.fn();
      gm.on('QUALQUER', ouvinte)();
      gm.emit('QUALQUER', {});
      expect(ouvinte).not.toHaveBeenCalled();
    });

    it('um ouvinte que quebra não impede os outros', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const bom = vi.fn();
      gm.on('QUALQUER', () => { throw new Error('falhei'); });
      gm.on('QUALQUER', bom);
      expect(() => gm.emit('QUALQUER', {})).not.toThrow();
      expect(bom).toHaveBeenCalled();
    });
  });

  describe('estado', () => {
    it('começa nulo para a primeira transição realmente emitir', () => {
      expect(gm.appState).toBeNull();
      const ouvinte = vi.fn();
      gm.on(EVENTOS.ESTADO_MUDOU, ouvinte);
      gm.irParaMenu();
      expect(ouvinte).toHaveBeenCalledWith({ novoEstado: 'menu', anterior: null });
    });

    it('não emite quando o estado não muda', () => {
      gm.irParaMenu();
      const ouvinte = vi.fn();
      gm.on(EVENTOS.ESTADO_MUDOU, ouvinte);
      gm.irParaMenu();
      expect(ouvinte).not.toHaveBeenCalled();
    });

    it('só pausa durante o jogo', () => {
      gm.irParaMapa();
      gm.pausar();
      expect(gm.appState).toBe('mapa');
    });

    it('pausa e retoma durante o jogo', () => {
      gm.storage.registrarConclusao('mundo1-fase1', 3, 4);
      gm.selecionarFase('mundo1-fase2');
      gm.pausar();
      expect(gm.appState).toBe('pausado');
      gm.retomar();
      expect(gm.appState).toBe('jogando');
    });
  });

  describe('seleção de fase', () => {
    it('recusa fase ainda travada', () => {
      expect(gm.selecionarFase('mundo4-fase3')).toBe(false);
      expect(gm.appState).toBeNull();
    });

    it('aceita a primeira fase e deduz o mundo pelo id', () => {
      expect(gm.selecionarFase('mundo1-fase1')).toBe(true);
      expect(gm.mundoAtual).toBe(1);
      expect(gm.appState).toBe('jogando');
    });

    it('proximaFaseId segue a ordem e termina em null', () => {
      gm.faseAtual = 'mundo1-fase1';
      expect(gm.proximaFaseId()).toBe('mundo1-fase2');

      gm.faseAtual = 'mundo4-fase3';
      expect(gm.proximaFaseId()).toBeNull();
      expect(gm.temProximaFase()).toBe(false);
    });
  });

  describe('estrelas (GDD 4.5)', () => {
    beforeEach(() => { gm.configFase = { minBlocos: 4, dica: 'dica' }; });

    it.each([
      [3, 3, 'abaixo do mínimo'],
      [4, 3, 'igual ao mínimo'],
      [5, 2, 'um a mais'],
      [6, 2, 'dois a mais'],
      [7, 1, 'três a mais'],
      [20, 1, 'muito acima']
    ])('%i blocos → %i estrela(s) (%s)', (blocos, esperado) => {
      expect(gm.calcularEstrelas(blocos)).toBe(esperado);
    });
  });

  describe('dica automática (GDD 4.5)', () => {
    beforeEach(() => {
      gm.configFase = { minBlocos: 4, dica: 'vire à direita' };
      gm.resetTentativas();
    });

    it('só aparece na terceira tentativa falha', () => {
      const ouvinte = vi.fn();
      gm.on(EVENTOS.DICA_DISPONIVEL, ouvinte);

      gm.registrarFalha('colisao');
      gm.registrarFalha('colisao');
      expect(ouvinte).not.toHaveBeenCalled();

      gm.registrarFalha('colisao');
      expect(ouvinte).toHaveBeenCalledWith({ dica: 'vire à direita' });
    });

    it('não se repete nas tentativas seguintes', () => {
      const ouvinte = vi.fn();
      gm.on(EVENTOS.DICA_DISPONIVEL, ouvinte);
      for (let i = 0; i < 6; i++) gm.registrarFalha('colisao');
      expect(ouvinte).toHaveBeenCalledTimes(1);
    });

    it('trocar de fase zera o contador', () => {
      gm.registrarFalha('colisao');
      gm.registrarFalha('colisao');
      gm.selecionarFase('mundo1-fase1');
      expect(gm.tentativasFalhas).toBe(0);
      expect(gm.dicaDisponivel).toBe(false);
    });
  });

  describe('conclusão de fase', () => {
    beforeEach(() => {
      gm.selecionarFase('mundo1-fase1');
      gm.configFase = { minBlocos: 4 };
    });

    it('persiste o resultado e muda para vitória', () => {
      expect(gm.concluirFase(4)).toBe(3);
      expect(gm.appState).toBe('vitoria');
      expect(gm.storage.estrelasDaFase('mundo1-fase1')).toBe(3);
    });

    it('emite os dados que o modal de vitória precisa', () => {
      const ouvinte = vi.fn();
      gm.on(EVENTOS.FASE_CONCLUIDA, ouvinte);
      gm.concluirFase(6);

      expect(ouvinte).toHaveBeenCalledWith({
        faseId: 'mundo1-fase1',
        estrelas: 2,
        blocosUsados: 6,
        minBlocos: 4,
        temProxima: true
      });
    });

    it('concluir libera a fase seguinte', () => {
      gm.concluirFase(4);
      expect(gm.storage.estaDesbloqueada('mundo1-fase2')).toBe(true);
    });
  });

  it('falar emite o pedido de balão de fala', () => {
    const ouvinte = vi.fn();
    gm.on(EVENTOS.BIT_FALOU, ouvinte);
    gm.falar('oi', 500);
    expect(ouvinte).toHaveBeenCalledWith({ texto: 'oi', ms: 500 });
  });
});
