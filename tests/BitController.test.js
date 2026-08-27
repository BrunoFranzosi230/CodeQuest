import { describe, it, expect, vi } from 'vitest';
import { BitController, RESULTADO, ORIENTACOES } from '../src/core/BitController.js';
import { fase, CORREDOR } from './ajuda.js';

describe('BitController', () => {
  it('funciona sem camada gráfica — é o que permite testar a regra isolada', async () => {
    const bit = new BitController(CORREDOR);
    expect(bit.visual).toBeNull();
    await expect(bit.andar()).resolves.toBe(RESULTADO.OK);
  });

  it('começa na posição e orientação declaradas na fase', () => {
    const bit = new BitController(CORREDOR);
    expect([bit.col, bit.lin]).toEqual([1, 1]);
    expect(bit.orientacao).toBe('direita');
    expect(bit.chaveColetada).toBe(false);
    expect(bit.venceu).toBe(false);
  });

  describe('podeAndar', () => {
    it('é verdadeiro com chão à frente', () => {
      expect(new BitController(CORREDOR).podeAndar()).toBe(true);
    });

    it('é falso com parede à frente', () => {
      const bit = new BitController(CORREDOR);
      bit.dir = ORIENTACOES.indexOf('esquerda');   // parede em (0,1)
      expect(bit.podeAndar()).toBe(false);
    });

    it('é falso na borda do grid (fora do array)', () => {
      const bit = new BitController(fase([[4, 0]]));
      bit.dir = ORIENTACOES.indexOf('cima');       // não existe linha -1
      expect(bit.podeAndar()).toBe(false);
    });
  });

  describe('andar', () => {
    it('avança um tile na direção atual', async () => {
      const bit = new BitController(CORREDOR);
      await bit.andar();
      expect([bit.col, bit.lin]).toEqual([2, 1]);
    });

    it('colide sem sair do lugar', async () => {
      const bit = new BitController(CORREDOR);
      bit.dir = ORIENTACOES.indexOf('esquerda');
      const resultado = await bit.andar();
      expect(resultado).toBe(RESULTADO.COLIDIU);
      expect([bit.col, bit.lin]).toEqual([1, 1]);
    });

    it('coleta a chave ao pisar nela, uma vez só', async () => {
      const bit = new BitController(CORREDOR);
      await bit.andar();
      await bit.andar();                            // (3,1) = chave
      expect(bit.chaveColetada).toBe(true);

      bit.visual = { coletarChave: vi.fn(), mover: vi.fn(), posicionar: vi.fn(), restaurarChave: vi.fn() };
      await bit.andar();
      expect(bit.visual.coletarChave).not.toHaveBeenCalled();
    });

    it('recusa a saída sem a chave e não vence', async () => {
      const semChave = fase([
        [1, 1, 1, 1],
        [1, 4, 2, 1],
        [1, 1, 1, 1]
      ]);
      const bit = new BitController(semChave);
      expect(await bit.andar()).toBe(RESULTADO.SEM_CHAVE);
      expect(bit.venceu).toBe(false);
    });

    it('vence ao chegar na saída com a chave', async () => {
      const bit = new BitController(CORREDOR);
      for (let i = 0; i < 3; i++) await bit.andar();
      expect(await bit.andar()).toBe(RESULTADO.VENCEU);
      expect(bit.venceu).toBe(true);
    });
  });

  describe('girar', () => {
    it('vira 90° no sentido horário', async () => {
      const bit = new BitController(CORREDOR);        // direita
      await bit.girar('dir');
      expect(bit.orientacao).toBe('baixo');
    });

    it('vira 90° no sentido anti-horário', async () => {
      const bit = new BitController(CORREDOR);
      await bit.girar('esq');
      expect(bit.orientacao).toBe('cima');
    });

    it('quatro giros voltam à orientação inicial', async () => {
      const bit = new BitController(CORREDOR);
      const inicial = bit.orientacao;
      for (let i = 0; i < 4; i++) await bit.girar('dir');
      expect(bit.orientacao).toBe(inicial);
    });
  });

  it('reset devolve posição, orientação e chave ao estado inicial', async () => {
    const bit = new BitController(CORREDOR);
    await bit.andar();
    await bit.andar();
    await bit.girar('dir');
    bit.reset();

    expect([bit.col, bit.lin]).toEqual([1, 1]);
    expect(bit.orientacao).toBe('direita');
    expect(bit.chaveColetada).toBe(false);
    expect(bit.venceu).toBe(false);
  });

  it('avisa a camada visual a cada comando, quando existe', async () => {
    const visual = {
      posicionar: vi.fn(), mover: vi.fn(), girar: vi.fn(),
      tropecar: vi.fn(), coletarChave: vi.fn(), restaurarChave: vi.fn()
    };
    const bit = new BitController(CORREDOR, { visual });

    await bit.andar();
    expect(visual.mover).toHaveBeenCalledWith(2, 1, expect.any(Number));

    await bit.girar('dir');
    expect(visual.girar).toHaveBeenCalled();

    await bit.andar();                                // parede ao sul
    expect(visual.tropecar).toHaveBeenCalled();
  });
});
