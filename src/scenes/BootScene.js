/**
 * BootScene.js
 * Gera por código todas as texturas do jogo (tiles de cada mundo e as peças do
 * Bit) e segue para o menu.
 *
 * Nenhum sprite vem de arquivo: o desenho é feito com Graphics e convertido em
 * textura. Isso mantém o bundle pequeno, o carregamento instantâneo e evita
 * qualquer dependência de asset de terceiros (GDD 14.1).
 */

import Phaser from 'phaser';
import { MUNDOS } from '../data/mundos.js';

/** Lado do tile na textura base — o sprite é escalado em tela conforme o espaço. */
export const TILE_TEX = 64;
const CONTORNO = 0x2b2140;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    MUNDOS.forEach(m => this._gerarTilesDoMundo(m));
    this._gerarCasa();
    this._gerarBit();
    this._gerarSeta();

    this.scene.start('MenuScene');
  }

  // ── Tiles ────────────────────────────────────────────────────────────────

  _gerarTilesDoMundo({ id, tema }) {
    this._tileArredondado(`chao-${id}`,     tema.chao,    0x000000, 0.09);
    this._tileArredondado(`chao-alt-${id}`, tema.chaoAlt, 0x000000, 0.09);
    this._parede(`parede-${id}`, tema.parede, tema.paredeEsc);
  }

  /** Tile de chão: cor sólida com uma sombra fina na base, sem gradiente. */
  _tileArredondado(chave, cor, corSombra, alphaSombra) {
    const g = this.add.graphics();
    g.fillStyle(cor, 1);
    g.fillRoundedRect(0, 0, TILE_TEX, TILE_TEX, 9);
    g.fillStyle(corSombra, alphaSombra);
    g.fillRoundedRect(0, TILE_TEX - 6, TILE_TEX, 6, { tl:0, tr:0, bl:9, br:9 });
    g.generateTexture(chave, TILE_TEX, TILE_TEX);
    g.destroy();
  }

  /** Parede: bloco com relevo mais grosso, para parecer volume. */
  _parede(chave, cor, corEsc) {
    const g = this.add.graphics();
    g.fillStyle(corEsc, 1);
    g.fillRoundedRect(0, 0, TILE_TEX, TILE_TEX, 11);
    g.fillStyle(cor, 1);
    g.fillRoundedRect(0, 0, TILE_TEX, TILE_TEX - 8, 11);
    g.generateTexture(chave, TILE_TEX, TILE_TEX);
    g.destroy();
  }

  /** Tile da casa: fundo âmbar com moldura, o emoji 🏠 é desenhado por cima. */
  _gerarCasa() {
    const g = this.add.graphics();
    g.fillStyle(0xfde68a, 1);
    g.fillRoundedRect(0, 0, TILE_TEX, TILE_TEX, 9);
    g.lineStyle(5, 0xf59e0b, 1);
    g.strokeRoundedRect(2.5, 2.5, TILE_TEX - 5, TILE_TEX - 5, 8);
    g.generateTexture('casa', TILE_TEX, TILE_TEX);
    g.destroy();

    // anel que pulsa em volta da casa
    const a = this.add.graphics();
    a.lineStyle(4, 0xfbbf24, 1);
    a.strokeRoundedRect(2, 2, TILE_TEX + 12, TILE_TEX + 12, 14);
    a.generateTexture('casa-anel', TILE_TEX + 16, TILE_TEX + 16);
    a.destroy();
  }

  // ── Bit ──────────────────────────────────────────────────────────────────

  /**
   * O corpo do Bit é uma textura só; as pupilas são separadas para poderem
   * piscar sozinhas (escala vertical) sem redesenhar o resto.
   */
  _gerarBit() {
    const g = this.add.graphics();
    const dy = 8; // desloca tudo para a antena caber na textura

    // antena
    g.lineStyle(6, CONTORNO, 1);
    g.lineBetween(50, 20 + dy, 50, 9 + dy);
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(50, 7 + dy, 7);
    g.lineStyle(5, CONTORNO, 1);
    g.strokeCircle(50, 7 + dy, 7);

    // corpo
    g.fillStyle(0x60a5fa, 1);
    g.fillRoundedRect(13, 20 + dy, 74, 68, 22);
    g.lineStyle(6, CONTORNO, 1);
    g.strokeRoundedRect(13, 20 + dy, 74, 68, 22);

    // visor
    g.fillStyle(0xf8fafc, 1);
    g.fillRoundedRect(23, 32 + dy, 54, 33, 15);
    g.lineStyle(5, CONTORNO, 1);
    g.strokeRoundedRect(23, 32 + dy, 54, 33, 15);

    // bochechas
    g.fillStyle(0xf472b6, 0.85);
    g.fillCircle(24, 72 + dy, 6);
    g.fillCircle(76, 72 + dy, 6);

    // sorriso
    g.lineStyle(5, CONTORNO, 1);
    g.beginPath();
    g.moveTo(40, 74 + dy);
    g.lineTo(46, 79 + dy);
    g.lineTo(54, 79 + dy);
    g.lineTo(60, 74 + dy);
    g.strokePath();

    g.generateTexture('bit-corpo', 100, 100 + dy);
    g.destroy();

    const p = this.add.graphics();
    p.fillStyle(CONTORNO, 1);
    p.fillCircle(7, 7, 7);
    p.generateTexture('bit-pupila', 14, 14);
    p.destroy();
  }

  /** Seta âmbar que orbita o Bit indicando a direção. */
  _gerarSeta() {
    const g = this.add.graphics();
    g.fillStyle(0xfbbf24, 1);
    g.lineStyle(3, CONTORNO, 1);
    g.beginPath();
    g.moveTo(14, 2);
    g.lineTo(26, 24);
    g.lineTo(2, 24);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.generateTexture('seta', 28, 26);
    g.destroy();
  }
}
