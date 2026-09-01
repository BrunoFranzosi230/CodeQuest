/**
 * MapaMundosScene.js
 * Cena de navegação do mapa de mundos.
 * Os cards dos mundos são renderizados em HTML/CSS pelo UIManager — ver a
 * justificativa em MenuScene.js.
 */

import Phaser from 'phaser';

export class MapaMundosScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapaMundosScene' });
  }

  create() {
    this.game.gm.irParaMapa();
  }
}
