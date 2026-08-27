import { describe, it, expect } from 'vitest';
import {
  BLOCO, DEF_BLOCOS, BLOCOS_DE_GIRO, MAX_BLOCOS,
  novoBloco, ramosDe, contarBlocos
} from '../src/data/blocos.js';
import { MUNDOS, ORDEM_FASES, mundoPorId, fasesDoMundo } from '../src/data/mundos.js';

describe('catálogo de blocos', () => {
  it('todo bloco tem definição visual completa', () => {
    for (const tipo of Object.values(BLOCO)) {
      const def = DEF_BLOCOS[tipo];
      expect(def, tipo).toBeDefined();
      expect(def.icone, `ícone de ${tipo}`).toBeTruthy();
      expect(def.rotulo, `rótulo de ${tipo}`).toBeTruthy();
    }
  });

  it('os dois blocos de giro têm ícones diferentes — era o que confundia', () => {
    const esq = DEF_BLOCOS[BLOCO.VIRAR_ESQ];
    const dir = DEF_BLOCOS[BLOCO.VIRAR_DIR];
    expect(esq.icone).not.toBe(dir.icone);
    expect(esq.rotulo).not.toBe(dir.rotulo);
    expect(dir.ladoIcone).toBe('fim');          // espelhado em relação ao esquerdo
  });

  it('BLOCOS_DE_GIRO mapeia só os blocos que giram', () => {
    expect(BLOCOS_DE_GIRO).toEqual({
      [BLOCO.VIRAR_ESQ]: 'esq',
      [BLOCO.VIRAR_DIR]: 'dir'
    });
  });

  describe('novoBloco', () => {
    it('bloco simples não tem corpo', () => {
      expect(novoBloco(BLOCO.ANDAR)).toEqual({ tipo: 'andar' });
    });

    it('repetir nasce com contador e corpo vazio', () => {
      expect(novoBloco(BLOCO.REPETIR)).toEqual({ tipo: 'repetir', vezes: 2, filhos: [] });
    });

    it('repetir até chegar nasce só com corpo', () => {
      expect(novoBloco(BLOCO.REPETIR_ATE)).toEqual({ tipo: 'repetir_ate', filhos: [] });
    });

    it('se nasce com os dois ramos', () => {
      expect(novoBloco(BLOCO.SE)).toEqual({ tipo: 'se', filhos: [], senao: [] });
    });

    it('cada chamada devolve um objeto novo, não uma referência compartilhada', () => {
      const a = novoBloco(BLOCO.REPETIR);
      const b = novoBloco(BLOCO.REPETIR);
      a.filhos.push(novoBloco(BLOCO.ANDAR));
      expect(b.filhos).toHaveLength(0);
    });
  });

  describe('ramosDe', () => {
    it('bloco simples não tem ramos', () => {
      expect(ramosDe(novoBloco(BLOCO.ANDAR))).toEqual([]);
    });

    it('repetir tem um ramo', () => {
      expect(ramosDe(novoBloco(BLOCO.REPETIR))).toHaveLength(1);
    });

    it('se tem dois ramos', () => {
      expect(ramosDe(novoBloco(BLOCO.SE))).toHaveLength(2);
    });
  });

  describe('contarBlocos', () => {
    it('lista vazia conta zero', () => {
      expect(contarBlocos([])).toBe(0);
    });

    it('conta blocos simples', () => {
      expect(contarBlocos([novoBloco(BLOCO.ANDAR), novoBloco(BLOCO.VIRAR_DIR)])).toBe(2);
    });

    it('conta o contêiner e o que está dentro dele', () => {
      const repetir = novoBloco(BLOCO.REPETIR);
      repetir.filhos.push(novoBloco(BLOCO.ANDAR), novoBloco(BLOCO.ANDAR));
      expect(contarBlocos([repetir])).toBe(3);
    });

    it('conta os dois ramos do se', () => {
      const se = novoBloco(BLOCO.SE);
      se.filhos.push(novoBloco(BLOCO.ANDAR));
      se.senao.push(novoBloco(BLOCO.VIRAR_DIR));
      expect(contarBlocos([se])).toBe(3);
    });

    it('conta aninhamento profundo', () => {
      const ate = novoBloco(BLOCO.REPETIR_ATE);
      const se = novoBloco(BLOCO.SE);
      se.filhos.push(novoBloco(BLOCO.ANDAR));
      se.senao.push(novoBloco(BLOCO.VIRAR_DIR));
      ate.filhos.push(se);
      expect(contarBlocos([ate])).toBe(4);      // ate + se + andar + virar
    });
  });

  it('o teto de blocos é positivo', () => {
    expect(MAX_BLOCOS).toBeGreaterThan(0);
  });
});

describe('mundos', () => {
  it('os 4 mundos do GDD 5.2 estão declarados', () => {
    expect(MUNDOS.map(m => m.id)).toEqual([1, 2, 3, 4]);
  });

  it('cada mundo tem tema visual e tema musical próprios', () => {
    for (const m of MUNDOS) {
      expect(m.tema, `tema do mundo ${m.id}`).toEqual(expect.objectContaining({
        chao: expect.any(Number), parede: expect.any(Number)
      }));
      expect(m.musica.notas.length, `música do mundo ${m.id}`).toBeGreaterThan(0);
    }
  });

  it('mundoPorId devolve o mundo certo', () => {
    expect(mundoPorId(3).nome).toBe('Caverna Misteriosa');
  });

  it('mundoPorId cai no mundo 1 para id desconhecido', () => {
    expect(mundoPorId(99).id).toBe(1);
  });

  it('fasesDoMundo filtra pelo prefixo do id', () => {
    expect(fasesDoMundo(1)).toHaveLength(5);
    expect(fasesDoMundo(4).every(f => f.startsWith('mundo4-'))).toBe(true);
  });

  it('a ordem de desbloqueio não tem id repetido', () => {
    expect(new Set(ORDEM_FASES).size).toBe(ORDEM_FASES.length);
  });

  it('toda fase da ordem pertence a um mundo declarado', () => {
    const ids = MUNDOS.map(m => m.id);
    for (const fase of ORDEM_FASES) {
      expect(ids).toContain(Number(fase.match(/^mundo(\d+)/)[1]));
    }
  });
});
