/**
 * MenuScene.js
 * Cena de navegação do menu principal.
 *
 * O conteúdo do menu (logo, botões) é renderizado em HTML/CSS pelo UIManager,
 * não no canvas: são elementos de interface, não de jogo, e em DOM ganham
 * tipografia nítida, acessibilidade e responsividade de graça. A cena existe
 * para ser o nó de roteamento do SceneManager do Phaser.
 */

import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.game.gm.irParaMenu();
  }
}
