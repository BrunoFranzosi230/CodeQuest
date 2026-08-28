/**
 * GameplayScene.js
 * Renderiza o tabuleiro da fase e o Bit, e fornece ao BitController o objeto
 * `visual` com as animações. É a única cena que desenha no canvas.
 */

import Phaser from 'phaser';
import { LevelLoader, TILE } from '../core/LevelLoader.js';
import { BitController } from '../core/BitController.js';
import { BlockEngine, MENSAGEM_FALHA } from '../core/BlockEngine.js';
import { EVENTOS } from '../core/GameManager.js';
import { mundoPorId } from '../data/mundos.js';
import { TILE_TEX } from './BootScene.js';
import { contarBlocos } from '../data/blocos.js';

const CELULA_MIN = 26;
const CELULA_MAX = 74;
const ESPACO = 3;      // vão entre tiles
const MOLDURA = 20;    // respiro do tabuleiro dentro do canvas

export class GameplayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameplayScene' });
  }

  async create() {
    this.gm = this.game.gm;
    this.som = this.game.som;
    this.executando = false;
    this._inscricoes = [];

    const faseId = this.gm.faseAtual;
    if (!faseId) { this.gm.irParaMapa(); return; }

    let config;
    try {
      config = await new LevelLoader().carregar(faseId);
    } catch (e) {
      console.error('[GameplayScene]', e);
      this.gm.falar('Não consegui carregar esta fase.', 4000);
      this.gm.irParaMapa();
      return;
    }
    if (!this.scene.isActive()) return; // saiu da cena enquanto carregava

    this.config = config;
    this.gm.configFase = config;
    this.tema = mundoPorId(config.mundo).tema;

    this.bit = new BitController(config);
    this.motor = new BlockEngine(this.bit, this.gm);

    this._montarTabuleiro();
    this.bit.setVisual(this._criarVisualDoBit());
    this.bit.reset();

    // registrado uma vez só: `_montarTabuleiro` é chamado a cada redimensionamento
    this.scale.on('resize', this._aoRedimensionar, this);
    this._registrarEventos();
    this.som.tocarMusicaDoMundo(config.mundo);

    this.gm.emit(EVENTOS.FASE_CARREGADA, { config });
    this.gm.falar(config.fala, 4200);
  }

  // ── Tabuleiro ─────────────────────────────────────────────────────────────

  _calcularCelula() {
    const { colunas, linhas } = this.config.grid;
    const { width: W, height: H } = this.scale;
    const c = Math.floor(Math.min(
      (W - MOLDURA * 2 - colunas * ESPACO) / colunas,
      (H - MOLDURA * 2 - linhas  * ESPACO) / linhas
    ));
    return Phaser.Math.Clamp(c, CELULA_MIN, CELULA_MAX);
  }

  _montarTabuleiro() {
    this.tabuleiro?.destroy(true);
    this.tabuleiro = this.add.container(0, 0);

    const { colunas, linhas } = this.config.grid;
    this.celula = this._calcularCelula();
    const passo = this.celula + ESPACO;

    this.larguraGrid = colunas * passo - ESPACO;
    this.alturaGrid  = linhas  * passo - ESPACO;

    // fundo do tabuleiro (a "borda de grama" em volta dos tiles)
    const fundo = this.add.rectangle(
      this.larguraGrid / 2, this.alturaGrid / 2,
      this.larguraGrid + 20, this.alturaGrid + 20,
      this.tema.borda
    ).setStrokeStyle(4, 0x2b2140);
    fundo.setDisplaySize(this.larguraGrid + 20, this.alturaGrid + 20);
    this.tabuleiro.add(fundo);

    const escala = this.celula / TILE_TEX;
    const decoracoes = [];   // desenhadas depois de TODOS os tiles — ver abaixo

    this.config.tiles.forEach((linha, lin) => {
      linha.forEach((codigo, col) => {
        const x = col * passo + this.celula / 2;
        const y = lin * passo + this.celula / 2;

        const chave = codigo === TILE.PAREDE
          ? `parede-${this.config.mundo}`
          : codigo === TILE.SAIDA
            ? 'casa'
            : ((col + lin) % 2 ? `chao-alt-${this.config.mundo}` : `chao-${this.config.mundo}`);

        this.tabuleiro.add(this.add.image(x, y, chave).setScale(escala));

        if (codigo === TILE.SAIDA || codigo === TILE.CHAVE) decoracoes.push({ codigo, x, y });
      });
    });

    /* O anel da casa é maior que o próprio tile e a chave "pula" para fora do
       dela. Se fossem criados dentro do laço, os tiles das linhas seguintes
       seriam adicionados depois e passariam por cima. */
    decoracoes.forEach(({ codigo, x, y }) => {
      if (codigo === TILE.SAIDA) {
        const anel = this.add.image(x, y, 'casa-anel').setScale(escala);
        this.tabuleiro.add(anel);
        this.tweens.add({
          targets: anel, scale: escala * 1.12, alpha: 0.35,
          duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
        this.tabuleiro.add(this._emoji(x, y, '🏠'));
      } else {
        this.chaveSprite = this._emoji(x, y, '🔑');
        this.tabuleiro.add(this.chaveSprite);
        this.tweens.add({
          targets: this.chaveSprite, y: y - 8, scale: 1.08,
          duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      }
    });

    this._centralizar();
  }

  /**
   * Texto de emoji dimensionado pelo tile.
   * O `padding` não é estético: o Phaser recorta a textura do texto pelas
   * métricas da fonte, e emoji ultrapassam essas métricas — sem folga, a chave
   * e a casa saem com o topo e a base cortados.
   */
  _emoji(x, y, glifo) {
    return this.add.text(x, y, glifo, {
      fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
      fontSize: `${Math.round(this.celula * 0.56)}px`,
      padding: { x: 12, y: 12 }
    }).setOrigin(0.5);
  }

  _centralizar() {
    const { width: W, height: H } = this.scale;
    this.tabuleiro.setPosition(
      Math.round((W - this.larguraGrid) / 2),
      Math.round((H - this.alturaGrid) / 2)
    );
  }

  _aoRedimensionar() {
    if (!this.config || !this.tabuleiro) return;
    const nova = this._calcularCelula();
    if (nova !== this.celula) {
      this._montarTabuleiro();
      this.bit.setVisual(this._criarVisualDoBit());
      this.bit.visual.posicionar(this.bit.col, this.bit.lin, this.bit.dir);
      if (this.bit.chaveColetada) this.chaveSprite?.setVisible(false);
    } else {
      this._centralizar();
      this._reposicionarBit();
    }
  }

  /** Centro do tile (col, lin) em coordenadas do canvas. */
  _centroDoTile(col, lin) {
    const passo = this.celula + ESPACO;
    return {
      x: this.tabuleiro.x + col * passo + this.celula / 2,
      y: this.tabuleiro.y + lin * passo + this.celula / 2
    };
  }

  // ── O Bit ─────────────────────────────────────────────────────────────────

  _criarVisualDoBit() {
    if (this.pupilaE) this.tweens.killTweensOf([this.pupilaE, this.pupilaD]);
    this.bitCont?.destroy(true);
    this.setaCont?.destroy(true);

    const escala = this.celula / 100;

    // corpo — nunca gira, para o rosto continuar legível em qualquer direção
    this.bitCont = this.add.container(0, 0);
    const corpo = this.add.image(0, 0, 'bit-corpo').setScale(escala);
    this.pupilaE = this.add.image(-11 * escala, -2 * escala, 'bit-pupila').setScale(escala);
    this.pupilaD = this.add.image( 11 * escala, -2 * escala, 'bit-pupila').setScale(escala);
    this.bitCont.add([corpo, this.pupilaE, this.pupilaD]);
    this.bitCont.setDepth(10);

    // seta de direção — orbita o corpo
    this.setaCont = this.add.container(0, 0);
    const seta = this.add.image(0, -this.celula * 0.62, 'seta').setScale(escala * 1.15);
    this.setaCont.add(seta);
    this.setaCont.setDepth(11);

    this._piscar();

    const cena = this;
    return {
      posicionar(col, lin, dir) {
        const { x, y } = cena._centroDoTile(col, lin);
        cena.bitCont.setPosition(x, y).setScale(1).setAngle(0);
        cena.setaCont.setPosition(x, y).setAngle(dir * 90);
      },

      mover(col, lin, dur) {
        const { x, y } = cena._centroDoTile(col, lin);
        cena.som.passo();
        cena.tweens.add({ targets: cena.setaCont, x, y, duration: dur, ease: 'Sine.easeInOut' });
        cena.tweens.add({
          targets: cena.bitCont, scaleX: 1.12, scaleY: 0.9,
          duration: dur / 2, yoyo: true, ease: 'Sine.easeInOut'
        });
        return cena._tween({ targets: cena.bitCont, x, y, duration: dur, ease: 'Sine.easeInOut' });
      },

      girar(dir, dur) {
        cena.som.girar();
        return cena._tween({
          targets: cena.setaCont, angle: dir * 90, duration: dur, ease: 'Back.easeOut'
        });
      },

      tropecar() {
        cena.som.erro();
        return cena._tween({
          targets: cena.bitCont, angle: { from: -16, to: 14 },
          duration: 200, yoyo: true, ease: 'Sine.easeInOut',
          onComplete: () => cena.bitCont.setAngle(0)
        });
      },

      comemorar() {
        return cena._tween({
          targets: cena.bitCont, y: cena.bitCont.y - 18, scaleY: 1.15, scaleX: 0.9,
          duration: 220, yoyo: true, repeat: 2, ease: 'Sine.easeInOut'
        });
      },

      coletarChave() {
        cena.som.chave();
        cena.gm.emit(EVENTOS.CHAVE_COLETADA, {});
        cena.gm.falar('Peguei a chave! 🔑', 1600);
        if (!cena.chaveSprite) return;
        cena.tweens.killTweensOf(cena.chaveSprite);
        cena.tweens.add({
          targets: cena.chaveSprite, y: cena.chaveSprite.y - 50, scale: 1.9, alpha: 0,
          duration: 420, ease: 'Cubic.easeOut',
          onComplete: () => cena.chaveSprite.setVisible(false)
        });
      },

      restaurarChave() {
        if (!cena.chaveSprite) return;
        cena.tweens.killTweensOf(cena.chaveSprite);
        const { y } = cena._centroDoTile(cena.config.posicaoChave.col, cena.config.posicaoChave.lin);
        cena.chaveSprite.setVisible(true).setAlpha(1).setScale(1)
          .setY(y - cena.tabuleiro.y);
        cena.tweens.add({
          targets: cena.chaveSprite, y: cena.chaveSprite.y - 8, scale: 1.08,
          duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      }
    };
  }

  _reposicionarBit() {
    const { x, y } = this._centroDoTile(this.bit.col, this.bit.lin);
    this.bitCont?.setPosition(x, y);
    this.setaCont?.setPosition(x, y);
  }

  /**
   * Piscada automática dos olhos.
   *
   * O timer é único: `_criarVisualDoBit()` roda de novo a cada mudança de
   * tamanho do painel, e sem remover o anterior os timers se acumulavam. Dois
   * tweens simultâneos no mesmo `scaleY` faziam um terminar enquanto o outro
   * ainda corria, deixando as pupilas achatadas — o Bit ficava de olho
   * fechado e parecia que não piscava mais.
   */
  _piscar() {
    this._eventoPiscar?.remove();

    // Reagenda a si mesmo com um intervalo novo a cada piscada: assim o ritmo
    // é irregular e a piscada é garantida. (Um `loop` de intervalo fixo daria
    // ritmo de metrônomo; sorteá-la por probabilidade a cada tique tornaria
    // possível o Bit passar fases inteiras sem piscar.)
    const agendar = () => {
      this._eventoPiscar = this.time.delayedCall(Phaser.Math.Between(2200, 4800), () => {
        if (this.pupilaE?.active) {
          const escala = this.celula / 100;
          this.tweens.killTweensOf([this.pupilaE, this.pupilaD]);
          this.pupilaE.setScale(escala);
          this.pupilaD.setScale(escala);

          this.tweens.add({
            targets: [this.pupilaE, this.pupilaD],
            scaleY: escala * 0.1,
            duration: 90, yoyo: true, ease: 'Sine.easeInOut',
            // garante o olho aberto mesmo se o tween for interrompido
            onComplete: () => { this.pupilaE?.setScale(escala); this.pupilaD?.setScale(escala); }
          });
        }
        agendar();
      });
    };
    agendar();
  }

  /**
   * Prévia do giro: uma seta translúcida gira da direção atual do Bit até a
   * que o bloco produziria, e some.
   *
   * É o remédio para a confusão de referencial. Virar é relativo ao Bit — com
   * ele olhando para baixo, "direita" leva para o lado ESQUERDO da tela. Aos
   * 6 anos essa troca de perspectiva ainda não está consolidada, então em vez
   * de explicar, o jogo mostra: toca no bloco, vê para onde ele aponta.
   */
  _preverGiro(sentido) {
    if (!this.setaCont || this.executando) return;

    this._fantasma?.destroy();

    const escala = this.celula / 100;
    const destino = (this.bit.dir + (sentido === 'dir' ? 1 : 3)) % 4;

    const fantasma = this.add.container(this.setaCont.x, this.setaCont.y);

    // trilha translúcida ligando o Bit à seta, para a prévia se ler como
    // "para lá" e não como um segundo Bit no tabuleiro
    const trilha = this.add.ellipse(0, -this.celula * 0.55, this.celula * 0.22, this.celula * 0.5, 0xffffff, 0.35);
    const seta = this.add.image(0, -this.celula * 0.92, 'seta')
      .setScale(escala * 1.4)
      .setTint(0xffffff);

    fantasma.add([trilha, seta]);
    fantasma.setAngle(this.bit.dir * 90).setDepth(9).setAlpha(0);
    this._fantasma = fantasma;

    this.tweens.add({ targets: fantasma, alpha: 0.95, duration: 120 });
    this.tweens.add({
      targets: fantasma, angle: destino * 90,
      duration: 300, ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: fantasma, alpha: 0, duration: 300, delay: 780,
      onComplete: () => {
        fantasma.destroy();
        if (this._fantasma === fantasma) this._fantasma = null;
      }
    });
  }

  /** Envolve um tween numa Promise, para o BitController poder aguardar. */
  _tween(config) {
    return new Promise(resolve => {
      const aoFim = config.onComplete;
      this.tweens.add({
        ...config,
        onComplete: (...args) => { aoFim?.(...args); resolve(); }
      });
    });
  }

  // ── Execução do programa ──────────────────────────────────────────────────

  _registrarEventos() {
    const inscrever = (evento, cb) => this._inscricoes.push(this.gm.on(evento, cb));
    inscrever(EVENTOS.PEDIDO_EXECUTAR, ({ programa, funcao }) => this._executar(programa, funcao));
    inscrever(EVENTOS.PEDIDO_RESET, () => {
      if (this.executando) return;
      this.bit.reset();
      this.gm.falar('Voltei para o começo!', 1500);
    });
    inscrever(EVENTOS.PREVER_GIRO, ({ sentido }) => this._preverGiro(sentido));
    this.events.once('shutdown', () => {
      this._inscricoes.forEach(cancelar => cancelar());
      this._inscricoes = [];
      this.scale.off('resize', this._aoRedimensionar, this);
      this._eventoPiscar?.remove();
      this._eventoPiscar = null;
      this._fantasma?.destroy();
      this._fantasma = null;
      this.motor?.cancelar();
    });
  }

  async _executar(programa, funcao) {
    if (this.executando) return;

    const usados = contarBlocos(programa) + contarBlocos(funcao);
    if (usados === 0) {
      this.som.erro();
      this.gm.falar(MENSAGEM_FALHA.sequencia_vazia);
      return;
    }

    this.executando = true;
    this.gm.emit(EVENTOS.EXECUCAO_INICIADA, {});
    this.som.executar();
    await new Promise(r => this.time.delayedCall(320, r));

    const { resultado, motivo } = await this.motor.executar(programa, funcao);

    this.executando = false;
    this.gm.emit(EVENTOS.EXECUCAO_FINALIZADA, { resultado, motivo });

    if (resultado === 'sucesso') {
      this.som.vitoria();
      await this.bit.comemorar();
      this.gm.concluirFase(usados);
    } else {
      if (motivo !== 'colisao') this.som.erro();
      this.gm.registrarFalha(motivo);
      this.gm.falar(MENSAGEM_FALHA[motivo] || MENSAGEM_FALHA.nao_chegou, 3000);
    }
  }
}
