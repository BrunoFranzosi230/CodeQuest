import { describe, it, expect, vi, afterEach } from 'vitest';
import { LevelLoader, TILE } from '../src/core/LevelLoader.js';
import { fase, CORREDOR } from './ajuda.js';

const loader = () => new LevelLoader();

/** Espera que validar() rejeite, com a mensagem contendo `trecho`. */
function recusa(config, trecho) {
  expect(() => loader().validar(config)).toThrow(new RegExp(trecho, 'i'));
}

describe('LevelLoader.validar', () => {
  it('aceita uma fase bem formada', () => {
    expect(loader().validar(CORREDOR)).toBe(true);
  });

  it.each([
    'id', 'nome', 'mundo', 'minBlocos', 'grid', 'tiles',
    'bitPosicaoInicial', 'blocosDisponiveis'
  ])('recusa fase sem o campo obrigatório "%s"', campo => {
    const quebrada = { ...CORREDOR };
    delete quebrada[campo];
    recusa(quebrada, 'obrigatório');
  });

  it('recusa grid sem colunas ou linhas', () => {
    recusa({ ...CORREDOR, grid: { colunas: 0, linhas: 3 } }, 'colunas');
  });

  it('recusa quando o número de linhas não bate com grid.linhas', () => {
    recusa({ ...CORREDOR, grid: { colunas: 7, linhas: 99 } }, 'linhas');
  });

  it('recusa quando uma linha tem largura diferente das outras', () => {
    const torto = fase([
      [1, 1, 1, 1],
      [1, 4, 2, 1],
      [1, 1, 1, 1]
    ]);
    torto.tiles[1] = [1, 4, 2];                    // uma coluna a menos
    recusa(torto, 'colunas');
  });

  it('recusa posição fora dos limites do grid', () => {
    recusa({ ...CORREDOR, posicaoChave: { col: 99, lin: 0 } }, 'fora do grid');
  });

  it('recusa posição em cima de parede', () => {
    recusa({ ...CORREDOR, posicaoChave: { col: 0, lin: 0 } }, 'parede');
  });

  it('recusa blocosDisponiveis vazio', () => {
    recusa({ ...CORREDOR, blocosDisponiveis: [] }, 'vazio');
  });

  it('recusa bloco desconhecido em blocosDisponiveis', () => {
    recusa({ ...CORREDOR, blocosDisponiveis: ['teletransporte'] }, 'desconhecido');
  });

  it('recusa minBlocos menor que 1', () => {
    recusa({ ...CORREDOR, minBlocos: 0 }, 'minBlocos');
  });

  it('recusa orientação inválida', () => {
    const config = { ...CORREDOR, bitPosicaoInicial: { col: 1, lin: 1, orientacao: 'diagonal' } };
    recusa(config, 'orientação');
  });

  it('aceita fase sem chave (campo opcional)', () => {
    const semChave = { ...CORREDOR, posicaoChave: null };
    expect(loader().validar(semChave)).toBe(true);
  });
});

describe('LevelLoader.carregar', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('busca o JSON da fase e devolve a configuração', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => CORREDOR })));
    const config = await loader().carregar('teste-fase');
    expect(config.id).toBe('teste-fase');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('fases/teste-fase.json'));
  });

  it('guarda em cache: a segunda chamada não vai à rede', async () => {
    const busca = vi.fn(async () => ({ ok: true, json: async () => CORREDOR }));
    vi.stubGlobal('fetch', busca);

    const l = loader();
    await l.carregar('teste-fase');
    await l.carregar('teste-fase');
    expect(busca).toHaveBeenCalledTimes(1);
  });

  it('erro de rede vira FASE_NAO_ENCONTRADA', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    await expect(loader().carregar('inexistente'))
      .rejects.toMatchObject({ code: 'FASE_NAO_ENCONTRADA' });
  });

  it('JSON malformado vira FASE_INVALIDA', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ id: 'x' }) })));
    await expect(loader().carregar('quebrada'))
      .rejects.toMatchObject({ code: 'FASE_INVALIDA' });
  });
});

describe('TILE', () => {
  it('mantém a legenda do SDD 5.1', () => {
    expect(TILE).toEqual({ CHAO: 0, PAREDE: 1, SAIDA: 2, CHAVE: 3, INICIO: 4 });
  });
});
