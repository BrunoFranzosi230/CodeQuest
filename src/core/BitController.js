/**
 * BitController.js
 * Move o Bit no grid, detecta colisão, coleta de chave e chegada na saída,
 * e dispara as animações correspondentes (SDD 3.5).
 *
 * Não conhece Phaser: recebe um objeto `visual` com a interface de animação.
 * Isso mantém a regra de jogo testável sem instanciar o motor gráfico.
 */

import { TILE } from './LevelLoader.js';

/** Índices de orientação: 0 cima · 1 direita · 2 baixo · 3 esquerda */
export const ORIENTACOES = ['cima', 'direita', 'baixo', 'esquerda'];
const DELTAS = [ { dc:0, dl:-1 }, { dc:1, dl:0 }, { dc:0, dl:1 }, { dc:-1, dl:0 } ];

export const DUR_ANDAR = 280;
export const DUR_GIRAR = 230;

/** Resultados possíveis de um comando. */
export const RESULTADO = {
  OK:       'ok',
  COLIDIU:  'colidiu',
  SEM_CHAVE:'sem_chave',
  VENCEU:   'venceu'
};

export class BitController {
  /**
   * @param {object} configFase configuração validada pelo LevelLoader
   * @param {{visual?: object}} deps
   */
  constructor(configFase, { visual = null } = {}) {
    this.config = configFase;
    this.tiles = configFase.tiles;
    this.visual = visual;
    this.reset();
  }

  setVisual(visual) { this.visual = visual; }

  reset() {
    const inicio = this.config.bitPosicaoInicial;
    this.col = inicio.col;
    this.lin = inicio.lin;
    this.dir = Math.max(0, ORIENTACOES.indexOf(inicio.orientacao || 'direita'));
    this.chaveColetada = false;
    this.venceu = false;
    this.visual?.posicionar(this.col, this.lin, this.dir);
    this.visual?.restaurarChave();
  }

  get orientacao() { return ORIENTACOES[this.dir]; }

  /** Tile à frente do Bit (undefined se fora do grid). */
  _tileAFrente() {
    const { dc, dl } = DELTAS[this.dir];
    return this.tiles[this.lin + dl]?.[this.col + dc];
  }

  /** Condição avaliada pelo bloco `Se dá pra ir`. */
  podeAndar() {
    const t = this._tileAFrente();
    return t !== undefined && t !== TILE.PAREDE;
  }

  /**
   * Anda um tile para a frente.
   * @returns {Promise<string>} um valor de RESULTADO
   */
  async andar() {
    if (!this.podeAndar()) {
      await this.visual?.tropecar();
      return RESULTADO.COLIDIU;
    }

    const { dc, dl } = DELTAS[this.dir];
    this.col += dc;
    this.lin += dl;
    await this.visual?.mover(this.col, this.lin, DUR_ANDAR);

    return this._avaliarTileAtual();
  }

  /** @param {'esq'|'dir'} sentido */
  async girar(sentido) {
    this.dir = (this.dir + (sentido === 'dir' ? 1 : 3)) % 4;
    await this.visual?.girar(this.dir, DUR_GIRAR);
    return RESULTADO.OK;
  }

  /** Verifica chave e saída no tile onde o Bit acabou de pisar. */
  _avaliarTileAtual() {
    const tile = this.tiles[this.lin][this.col];

    if (tile === TILE.CHAVE && !this.chaveColetada) {
      this.chaveColetada = true;
      this.visual?.coletarChave();
      return RESULTADO.OK;
    }

    if (tile === TILE.SAIDA) {
      if (this.chaveColetada) {
        this.venceu = true;
        return RESULTADO.VENCEU;
      }
      return RESULTADO.SEM_CHAVE;
    }

    return RESULTADO.OK;
  }

  async comemorar() { await this.visual?.comemorar(); }
}
