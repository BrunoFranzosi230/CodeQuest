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
    const { gm } = this.game;
    // Mesma cena serve de nó de roteamento para o login e para o menu: sem
    // usuário, a porta é a tela de login.
    if (gm.usuario) gm.irParaMenu();
    else gm.irParaLogin();
  }
}
