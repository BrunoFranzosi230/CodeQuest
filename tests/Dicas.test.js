import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dicasDaFase, primeiroPasso } from '../src/core/Dicas.js';
import { GameManager, EVENTOS, FALHAS_ATE_DICA } from '../src/core/GameManager.js';
import { ORDEM_FASES } from '../src/data/mundos.js';

const fase = id => JSON.parse(readFileSync(join(process.cwd(), 'public', 'fases', `${id}.json`), 'utf8'));

describe('Dicas', () => {
  it('toda fase tem os três níveis de dica', () => {
    for (const id of ORDEM_FASES) {
      const dicas = dicasDaFase(fase(id));
      expect(dicas.map(d => d.nivel), id).toEqual([1, 2, 3]);
      expect(dicas.every(d => d.texto.length > 10), id).toBe(true);
    }
  });

  it('só o último nível é a resposta', () => {
    const dicas = dicasDaFase(fase('mundo1-fase1'));
    expect(dicas.filter(d => d.resposta).map(d => d.nivel)).toEqual([3]);
  });

  describe('primeiro passo', () => {
    it('sequência: conta os blocos iguais do começo', () => {
      expect(primeiroPasso(fase('mundo1-fase1'))).toMatch(/4 blocos “Andar”/);
    });

    it('repetição: diz quantas vezes', () => {
      expect(primeiroPasso(fase('mundo2-fase2'))).toMatch(/“Repetir” de 4 vezes/);
    });

    it('condicional: aponta o “Se dá pra ir” dentro do “Até chegar”', () => {
      expect(primeiroPasso(fase('mundo3-fase2'))).toMatch(/“Até chegar”.*“Se dá pra ir”/);
      expect(primeiroPasso(fase('mundo3-fase1'))).not.toMatch(/Se dá pra ir/);
    });

    it('função: descreve o começo do truque', () => {
      expect(primeiroPasso(fase('mundo4-fase1'))).toMatch(/truque tem 3 blocos e começa com “Andar”/);
    });

    it('sem solução de referência, não inventa', () => {
      expect(primeiroPasso({ sequenciaIdeal: [] })).toBeNull();
      expect(dicasDaFase(null)).toEqual([]);
    });
  });
});

describe('GameManager.pedirDica', () => {
  let gm;
  beforeEach(() => {
    gm = new GameManager();
    gm.configFase = fase('mundo2-fase2');
    gm.faseAtual = 'mundo2-fase2';
    gm.resetTentativas();
  });

  it('cada pedido avança um nível e avisa quem escuta', () => {
    const vista = vi.fn();
    gm.on(EVENTOS.DICA_VISTA, vista);

    expect(gm.pedirDica()).toMatchObject({ nivel: 1, total: 3 });
    expect(gm.pedirDica()).toMatchObject({ nivel: 2 });
    expect(vista).toHaveBeenCalledTimes(2);
    expect(vista).toHaveBeenLastCalledWith({ nivel: 2, fase: 'mundo2-fase2' });
  });

  it('a resposta fica bloqueada até errar algumas vezes', () => {
    gm.pedirDica(); gm.pedirDica();
    const r = gm.pedirDica();
    expect(r).toMatchObject({ bloqueada: true, nivel: 3, faltam: FALHAS_ATE_DICA });

    for (let i = 0; i < FALHAS_ATE_DICA; i++) gm.registrarFalha('colisao');
    expect(gm.pedirDica()).toMatchObject({ nivel: 3, resposta: true, texto: gm.configFase.dica });
  });

  it('depois da resposta, repete a resposta', () => {
    for (let i = 0; i < FALHAS_ATE_DICA; i++) gm.registrarFalha('colisao');
    gm.pedirDica(); gm.pedirDica(); gm.pedirDica();
    expect(gm.pedirDica()).toMatchObject({ nivel: 3 });
  });

  it('trocar de fase volta para a primeira dica', () => {
    gm.pedirDica(); gm.pedirDica();
    gm.resetTentativas();
    expect(gm.pedirDica()).toMatchObject({ nivel: 1 });
  });

  it('sem fase carregada, não há dica', () => {
    gm.configFase = null;
    expect(gm.pedirDica()).toBeNull();
  });
});
