import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProgressoStorage } from '../src/data/ProgressoStorage.js';

const CHAVE = 'codequest_progresso';

describe('ProgressoStorage', () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = new ProgressoStorage();
  });
  afterEach(() => vi.restoreAllMocks());

  it('começa vazio quando não há nada salvo', () => {
    const p = storage.carregar();
    expect(p.fasesConcluidas).toEqual({});
    expect(p.ultimaFaseJogada).toBeNull();
    expect(p.versao).toBe(1);
  });

  it('salva e relê o progresso', () => {
    storage.registrarConclusao('mundo1-fase1', 3, 4);
    expect(new ProgressoStorage().estrelasDaFase('mundo1-fase1')).toBe(3);
  });

  describe('registrarConclusao', () => {
    it('guarda estrelas e o número de blocos usados', () => {
      storage.registrarConclusao('mundo1-fase1', 2, 6);
      const fase = storage.carregar().fasesConcluidas['mundo1-fase1'];
      expect(fase.estrelas).toBe(2);
      expect(fase.menorNumeroBlocos).toBe(6);
      expect(fase.concluidaEm).toEqual(expect.any(String));
    });

    it('as estrelas nunca regridem (GDD 4.2)', () => {
      storage.registrarConclusao('mundo1-fase1', 3, 4);
      storage.registrarConclusao('mundo1-fase1', 1, 9);
      expect(storage.estrelasDaFase('mundo1-fase1')).toBe(3);
    });

    it('o recorde de blocos guarda sempre o menor', () => {
      storage.registrarConclusao('mundo1-fase1', 1, 9);
      storage.registrarConclusao('mundo1-fase1', 3, 4);
      expect(storage.carregar().fasesConcluidas['mundo1-fase1'].menorNumeroBlocos).toBe(4);
    });

    it('anota a última fase jogada', () => {
      storage.registrarConclusao('mundo2-fase1', 3, 2);
      expect(storage.carregar().ultimaFaseJogada).toBe('mundo2-fase1');
    });
  });

  describe('estaDesbloqueada', () => {
    it('a primeira fase começa liberada', () => {
      expect(storage.estaDesbloqueada('mundo1-fase1')).toBe(true);
    });

    it('a segunda só libera depois de vencer a primeira', () => {
      expect(storage.estaDesbloqueada('mundo1-fase2')).toBe(false);
      storage.registrarConclusao('mundo1-fase1', 1, 9);
      expect(storage.estaDesbloqueada('mundo1-fase2')).toBe(true);
    });

    it('vencer uma fase não libera as seguintes em cascata', () => {
      storage.registrarConclusao('mundo1-fase1', 3, 4);
      expect(storage.estaDesbloqueada('mundo1-fase3')).toBe(false);
    });

    it('fase inexistente não fica liberada', () => {
      expect(storage.estaDesbloqueada('mundo9-fase9')).toBe(false);
    });
  });

  it('totalEstrelas soma todas as fases concluídas', () => {
    storage.registrarConclusao('mundo1-fase1', 3, 4);
    storage.registrarConclusao('mundo1-fase2', 2, 7);
    expect(storage.totalEstrelas()).toBe(5);
  });

  it('apagarTudo zera o progresso', () => {
    storage.registrarConclusao('mundo1-fase1', 3, 4);
    storage.apagarTudo();
    expect(storage.totalEstrelas()).toBe(0);
  });

  describe('resiliência', () => {
    it('progresso corrompido não quebra o jogo — recomeça do zero', () => {
      localStorage.setItem(CHAVE, '{isto não é json');
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(storage.carregar().fasesConcluidas).toEqual({});
    });

    it('progresso sem fasesConcluidas é migrado', () => {
      localStorage.setItem(CHAVE, JSON.stringify({ versao: 0 }));
      const p = storage.carregar();
      expect(p.fasesConcluidas).toEqual({});
      expect(p.versao).toBe(1);
    });

    it('sem localStorage o jogo segue funcionando, apenas sem salvar', () => {
      const semStorage = new ProgressoStorage();
      semStorage.disponivel = false;

      expect(semStorage.salvar({ a: 1 })).toBe(false);
      expect(semStorage.carregar().fasesConcluidas).toEqual({});
      expect(() => semStorage.apagarTudo()).not.toThrow();
    });

    it('falha ao escrever é avisada, não lançada', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('cota excedida');
      });
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(storage.salvar({ a: 1 })).toBe(false);
    });
  });
});
