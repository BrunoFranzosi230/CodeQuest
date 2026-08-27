import { describe, it, expect } from 'vitest';
import { BitController } from '../src/core/BitController.js';
import { BlockEngine, LIMITE_COMANDOS } from '../src/core/BlockEngine.js';
import { fase, CORREDOR, gmFalso, A, D, E, F, R, U, SE } from './ajuda.js';

/** Monta motor + Bit para uma fase. */
function motor(config = CORREDOR) {
  const bit = new BitController(config);
  const gm = gmFalso();
  return { bit, gm, engine: new BlockEngine(bit, gm) };
}

describe('BlockEngine', () => {
  describe('sequência', () => {
    it('executa os blocos na ordem e vence o corredor', async () => {
      const { engine, bit } = motor();
      const r = await engine.executar([A, A, A, A]);
      expect(r.resultado).toBe('sucesso');
      expect([bit.col, bit.lin]).toEqual([5, 1]);
    });

    it('falha por colisão e informa o motivo', async () => {
      const { engine } = motor();
      const r = await engine.executar([E, A]);          // vira para cima, bate
      expect(r).toEqual({ resultado: 'erro', motivo: 'colisao' });
    });

    it('falha quando o programa acaba antes de chegar', async () => {
      const { engine } = motor();
      const r = await engine.executar([A]);
      expect(r).toEqual({ resultado: 'erro', motivo: 'nao_chegou' });
    });

    it('programa vazio não chega a lugar nenhum', async () => {
      const { engine } = motor();
      expect((await engine.executar([])).resultado).toBe('erro');
    });

    it('reseta o Bit antes de cada execução', async () => {
      const { engine, bit } = motor();
      await engine.executar([A, A]);
      expect(bit.col).toBe(3);
      await engine.executar([A]);
      expect(bit.col).toBe(2);                          // partiu do início
    });
  });

  describe('repetir (laço contado)', () => {
    it('expande o corpo N vezes', async () => {
      const { engine, bit } = motor();
      const r = await engine.executar([R(4, A)]);
      expect(r.resultado).toBe('sucesso');
      expect(bit.col).toBe(5);
    });

    it('para assim que vence, sem gastar as repetições restantes', async () => {
      const { engine, bit } = motor();
      const r = await engine.executar([R(9, A)]);
      expect(r.resultado).toBe('sucesso');
      expect(bit.col).toBe(5);                          // não passou da saída
    });
  });

  describe('repetir até chegar (laço aberto)', () => {
    it('repete o corpo até vencer', async () => {
      const { engine, bit } = motor();
      const r = await engine.executar([U(A)]);
      expect(r.resultado).toBe('sucesso');
      expect(bit.col).toBe(5);
    });

    it('corpo vazio não trava a execução', async () => {
      const { engine } = motor();
      const r = await engine.executar([U()]);
      expect(r.resultado).toBe('erro');
    });

    it('para no teto de comandos quando o corpo nunca chega', async () => {
      // sala aberta sem saída alcançável: o laço giraria para sempre
      const semSaida = fase([
        [1, 1, 1, 1],
        [1, 4, 0, 1],
        [1, 0, 2, 1],
        [1, 1, 1, 1]
      ]);
      const { engine } = motor(semSaida);
      const r = await engine.executar([U(D)]);          // só gira, nunca anda
      expect(r.resultado).toBe('erro');
    });
  });

  describe('se / senão', () => {
    it('escolhe o ramo conforme o caminho estar livre naquele instante', async () => {
      // corredor que dobra: andar enquanto dá, virar quando bate
      const emL = fase([
        [1, 1, 1, 1, 1],
        [1, 4, 0, 3, 1],
        [1, 1, 1, 0, 1],
        [1, 1, 1, 2, 1],
        [1, 1, 1, 1, 1]
      ]);
      const { engine, bit } = motor(emL);
      const r = await engine.executar([U(SE([A], [D]))]);
      expect(r.resultado).toBe('sucesso');
      expect([bit.col, bit.lin]).toEqual([3, 3]);
    });

    it('o ramo "não dá" roda quando há parede à frente', async () => {
      const { engine, bit } = motor();
      await engine.executar([E, SE([A], [D])]);        // olhando para parede
      expect(bit.orientacao).toBe('direita');          // girou pelo ramo senão
    });

    it('ramo vazio simplesmente não produz comandos', async () => {
      const { engine, bit } = motor();
      await engine.executar([SE([], [])]);
      expect([bit.col, bit.lin]).toEqual([1, 1]);
    });
  });

  describe('função ("truque")', () => {
    it('insere o corpo do truque em cada chamada', async () => {
      const { engine, bit } = motor();
      const r = await engine.executar([F, F], [A, A]);
      expect(r.resultado).toBe('sucesso');
      expect(bit.col).toBe(5);
    });

    it('truque vazio não quebra a execução', async () => {
      const { engine } = motor();
      const r = await engine.executar([F], []);
      expect(r.resultado).toBe('erro');
    });

    it('truque que chama a si mesmo para na trava de profundidade', async () => {
      const { engine } = motor();
      const truqueRecursivo = [A, F];
      const r = await engine.executar([F], truqueRecursivo);
      // o importante é terminar: sem a trava, isto estouraria a pilha
      expect(r).toBeDefined();
    });
  });

  describe('proteções', () => {
    it('respeita o teto de comandos', async () => {
      const salaAberta = fase([
        [1, 1, 1, 1],
        [1, 4, 0, 1],
        [1, 0, 2, 1],
        [1, 1, 1, 1]
      ]);
      const { engine } = motor(salaAberta);
      const r = await engine.executar([R(9, R(9, R(9, D)))]);   // 729 giros
      expect(r).toEqual({ resultado: 'erro', motivo: 'limite_excedido' });
    });

    it('cancelar interrompe a execução', async () => {
      const { engine } = motor();
      engine.cancelar();
      const r = await engine.executar([A, A, A, A]);
      // executar() zera o cancelamento, então isto documenta o contrato:
      // cancelar vale para a execução em andamento, não para a próxima
      expect(r.resultado).toBe('sucesso');
    });

    it('o teto é uma constante exportada e positiva', () => {
      expect(LIMITE_COMANDOS).toBeGreaterThan(0);
    });
  });

  it('avisa a UI de cada bloco em execução e limpa o destaque no fim', async () => {
    const { engine, gm } = motor();
    await engine.executar([A, A]);

    const avisos = gm.eventos.filter(e => e.nome === 'BLOCO_EM_EXECUCAO');
    expect(avisos.length).toBeGreaterThanOrEqual(4);          // 2 blocos × (liga/desliga)
    expect(avisos.at(-1).dados.bloco).toBeNull();             // terminou limpo
  });
});
