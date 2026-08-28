/**
 * main.js
 * Bootstrap: instancia os managers, cria o jogo Phaser e liga o roteamento
 * entre o estado da aplicação e as cenas (TDD 4.1).
 */

import './styles/main.css';
import Phaser from 'phaser';

import { GameManager, EVENTOS } from './core/GameManager.js';
import { UIManager } from './core/UIManager.js';
import { AudioManager } from './core/AudioManager.js';
import { Telemetria } from './core/Telemetria.js';

import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MapaMundosScene } from './scenes/MapaMundosScene.js';
import { GameplayScene } from './scenes/GameplayScene.js';

const gm = new GameManager();
const som = new AudioManager();
const ui = new UIManager(gm, som);

// Telemetria de sessão + crash reporting. Só observa eventos: nenhum outro
// módulo sabe que ela existe, e nada sai do navegador da criança.
const telemetria = new Telemetria();
telemetria.iniciarSessao();
telemetria.ligarCapturaGlobal();
telemetria.ligarAoJogo(gm);

const jogo = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  transparent: true,          // o céu vem do CSS, atrás do canvas
  scale: {
    // NONE (e não RESIZE): o canvas vive dentro de um painel que muda de
    // tamanho por conta própria, e no modo RESIZE o Phaser ignora
    // `scale.resize()` e volta a casar com a janela. Quem dita o tamanho aqui
    // é o ResizeObserver do UIManager.
    mode: Phaser.Scale.NONE,
    width: 800,
    height: 600
  },
  scene: [BootScene, MenuScene, MapaMundosScene, GameplayScene]
});

// Injetados no jogo para as cenas alcançarem sem import circular
jogo.gm = gm;
jogo.som = som;
ui.setJogo(jogo);

// ── Roteamento estado → cena ────────────────────────────────────────────────

const CENAS = ['MenuScene', 'MapaMundosScene', 'GameplayScene'];

/*
 * A cena de jogo NÃO entra neste mapa de propósito. `scene.isActive()` passa a
 * responder `true` assim que `start()` é chamado — antes de o `create()` rodar.
 * Com dois caminhos podendo iniciá-la (mudança de estado e seleção de fase), o
 * segundo enxergava a cena como "já ativa" e disparava um `restart`, fazendo o
 * `create()` rodar duas vezes por fase. Quem inicia a cena de jogo é apenas o
 * handler de SELECIONAR_FASE, abaixo.
 */
const CENA_DO_ESTADO = {
  menu: 'MenuScene',
  mapa: 'MapaMundosScene'
};

function trocarPara(chave) {
  CENAS.forEach(nome => {
    if (nome !== chave && jogo.scene.isActive(nome)) jogo.scene.stop(nome);
  });
  if (!jogo.scene.isActive(chave)) jogo.scene.start(chave);
}

gm.on(EVENTOS.ESTADO_MUDOU, ({ novoEstado }) => {
  const cena = CENA_DO_ESTADO[novoEstado];
  if (cena) trocarPara(cena);
});

/** Porta de entrada única da cena de jogo — ver a nota acima. */
gm.on(EVENTOS.SELECIONAR_FASE, () => {
  if (jogo.scene.isActive('GameplayScene')) {
    jogo.scene.getScene('GameplayScene').scene.restart();   // trocou de fase
  } else {
    trocarPara('GameplayScene');                            // veio do mapa
  }
});

// Acesso pelo console durante o desenvolvimento
// Sempre exposto: é assim que se coleta o resultado de um playtest, copiando
// o JSON do console da máquina onde a criança jogou.
window.telemetria = telemetria;

if (import.meta.env.DEV) {
  Object.assign(window, { jogo, gm, som, ui });
  import('./dev/testarFases.js').then(({ testarFases }) => {
    window.testarFases = testarFases;
    console.info('[dev] `testarFases()` valida as 14 fases · `telemetria.resumo()` mostra as métricas da sessão');
  });
}

// Sem isto, cada hot-reload cria um Phaser.Game novo sem destruir o anterior:
// vários jogos disputando o mesmo canvas e listeners duplicados no GameManager.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    som.pararMusica();
    jogo.destroy(true);
    document.getElementById('ui-overlay').innerHTML = '';
  });
}
