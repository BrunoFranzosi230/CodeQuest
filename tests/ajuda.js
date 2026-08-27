/**
 * ajuda.js
 * Fábricas usadas pelos testes. Não é um arquivo de teste.
 */

/** Legenda: 0 chão · 1 parede · 2 saída · 3 chave · 4 início */
export function fase(tiles, extras = {}) {
  const linhas = tiles.length;
  const colunas = tiles[0].length;

  let inicio = null, chave = null, saida = null;
  tiles.forEach((linha, lin) => linha.forEach((codigo, col) => {
    if (codigo === 4) inicio = { col, lin };
    if (codigo === 3) chave  = { col, lin };
    if (codigo === 2) saida  = { col, lin };
  }));

  return {
    id: 'teste-fase',
    nome: 'Fase de teste',
    mundo: 1,
    conceito: 'sequencia',
    minBlocos: 1,
    grid: { colunas, linhas },
    bitPosicaoInicial: { ...inicio, orientacao: 'direita' },
    tiles,
    posicaoChave: chave,
    posicaoSaida: saida,
    blocosDisponiveis: ['andar', 'virar_esq', 'virar_dir'],
    dica: 'dica de teste',
    ...extras
  };
}

/** Corredor reto: Bit em (1,1), chave em (3,1), saída em (5,1). */
export const CORREDOR = fase([
  [1, 1, 1, 1, 1, 1, 1],
  [1, 4, 0, 3, 0, 2, 1],
  [1, 1, 1, 1, 1, 1, 1]
]);

/** GameManager mínimo para o BlockEngine — só precisa de `emit` e `falar`. */
export function gmFalso() {
  const eventos = [];
  return {
    eventos,
    emit: (nome, dados) => eventos.push({ nome, dados }),
    falar: texto => eventos.push({ nome: 'BIT_FALOU', dados: { texto } })
  };
}

/* Atalhos para montar programas nos testes */
export const A  = { tipo: 'andar' };
export const D  = { tipo: 'virar_dir' };
export const E  = { tipo: 'virar_esq' };
export const F  = { tipo: 'funcao' };
export const R  = (vezes, ...filhos) => ({ tipo: 'repetir', vezes, filhos });
export const U  = (...filhos)        => ({ tipo: 'repetir_ate', filhos });
export const SE = (filhos, senao)    => ({ tipo: 'se', filhos, senao });
