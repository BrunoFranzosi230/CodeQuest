/**
 * LevelLoader.js
 * Carrega e valida a configuração de uma fase a partir do JSON estático
 * servido em `public/fases/` (SDD 3.2 e 5.1).
 */

import { DEF_BLOCOS } from '../data/blocos.js';

/** Códigos do array `tiles` (SDD 5.1). */
export const TILE = { CHAO:0, PAREDE:1, SAIDA:2, CHAVE:3, INICIO:4 };

const CAMPOS_OBRIGATORIOS = [
  'id', 'nome', 'mundo', 'minBlocos', 'grid', 'tiles',
  'bitPosicaoInicial', 'blocosDisponiveis'
];

const ORIENTACOES = ['cima', 'direita', 'baixo', 'esquerda'];

export class LevelLoader {
  constructor() {
    this._cache = new Map();
  }

  /**
   * @param {string} faseId ex: 'mundo1-fase3'
   * @returns {Promise<object>} configuração validada
   */
  async carregar(faseId) {
    if (this._cache.has(faseId)) return this._cache.get(faseId);

    let config;
    try {
      const base = import.meta.env.BASE_URL || '/';
      const resp = await fetch(`${base}fases/${faseId}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      config = await resp.json();
    } catch (e) {
      const erro = new Error(`Fase não encontrada: ${faseId} — ${e.message}`);
      erro.code = 'FASE_NAO_ENCONTRADA';
      throw erro;
    }

    try {
      this.validar(config);
    } catch (e) {
      const erro = new Error(`Fase inválida (${faseId}): ${e.message}`);
      erro.code = 'FASE_INVALIDA';
      throw erro;
    }

    this._cache.set(faseId, config);
    return config;
  }

  /** Valida campos obrigatórios e consistência interna. Lança em caso de erro. */
  validar(config) {
    for (const campo of CAMPOS_OBRIGATORIOS) {
      if (!(campo in config)) throw new Error(`campo obrigatório ausente: '${campo}'`);
    }

    this._validarGrid(config);
    this._validarPosicoes(config);
    this._validarBlocos(config);

    if (!(config.minBlocos >= 1)) throw new Error("'minBlocos' deve ser >= 1");

    return true;
  }

  _validarGrid({ grid, tiles }) {
    const { colunas, linhas } = grid;
    if (!colunas || !linhas) throw new Error("'grid' precisa de 'colunas' e 'linhas'");

    if (tiles.length !== linhas) {
      throw new Error(`tiles tem ${tiles.length} linhas, grid.linhas diz ${linhas}`);
    }
    tiles.forEach((linha, i) => {
      if (linha.length !== colunas) {
        throw new Error(`linha ${i} tem ${linha.length} colunas, esperado ${colunas}`);
      }
    });
  }

  /** Toda posição declarada precisa existir no grid e não ser parede. */
  _validarPosicoes(config) {
    const { colunas, linhas } = config.grid;
    const posicoes = [
      ['bitPosicaoInicial', config.bitPosicaoInicial],
      ['posicaoChave', config.posicaoChave],
      ['posicaoSaida', config.posicaoSaida]
    ];

    for (const [nome, pos] of posicoes) {
      if (!pos) continue;
      if (pos.col < 0 || pos.col >= colunas || pos.lin < 0 || pos.lin >= linhas) {
        throw new Error(`${nome} fora do grid (col ${pos.col}, lin ${pos.lin})`);
      }
      if (config.tiles[pos.lin][pos.col] === TILE.PAREDE) {
        throw new Error(`${nome} está sobre uma parede`);
      }
    }

    const ori = config.bitPosicaoInicial.orientacao;
    if (ori && !ORIENTACOES.includes(ori)) {
      throw new Error(`orientação inválida: '${ori}'`);
    }
  }

  _validarBlocos({ blocosDisponiveis }) {
    if (!Array.isArray(blocosDisponiveis) || blocosDisponiveis.length === 0) {
      throw new Error("'blocosDisponiveis' não pode estar vazio");
    }
    const desconhecido = blocosDisponiveis.find(b => !DEF_BLOCOS[b]);
    if (desconhecido) {
      throw new Error(`bloco desconhecido em blocosDisponiveis: '${desconhecido}'`);
    }
  }
}
