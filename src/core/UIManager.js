/**
 * UIManager.js
 * Renderiza telas, HUD, painéis e modais reagindo ao `appState` do GameManager.
 * Não contém regra de jogo — é puramente reativo ao estado (SDD 3.6).
 */

import { EVENTOS } from './GameManager.js';
import { BlocoPanel } from '../ui/BlocoPanel.js';
import { HUD } from '../ui/HUD.js';
import { criarTelaLogin } from '../ui/TelaLogin.js';
import { criarTelaMenu, criarModalTutorial } from '../ui/TelaMenu.js';
import { criarTelaMapa } from '../ui/TelaMapa.js';
import { criarModalPause } from '../ui/ModalPause.js';
import { criarModalVitoria, chuvaDeConfete } from '../ui/ModalVitoria.js';

export class UIManager {
  /**
   * @param {import('./GameManager.js').GameManager} gm
   * @param {import('./AudioManager.js').AudioManager} som
   * @param {import('./AuthManager.js').AuthManager} auth
   * @param {(usuario: object|null) => Promise<void>} aplicarUsuario
   *   Troca o usuário do jogo e sincroniza o progresso (definido em main.js —
   *   é ele quem conhece a config da AWS).
   */
  constructor(gm, som, auth, aplicarUsuario) {
    this.gm = gm;
    this.som = som;
    this.auth = auth;
    this._aplicarUsuario = aplicarUsuario ?? (async () => {});
    this.raiz = document.getElementById('ui-overlay');
    this.containerJogo = document.getElementById('game-container');
    this.app = document.getElementById('app');
    this.jogo = null;

    // O canvas é movido para dentro do painel central, e esse painel muda de
    // tamanho sozinho (o painel de blocos cresce conforme a criança monta o
    // programa). O ScaleManager precisa ser avisado — o observer cobre os casos
    // implícitos, e `_ajustarCanvas()` é chamado nos momentos previsíveis para
    // não depender de o observer estar disponível.
    this._observador = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => this._ajustarCanvas())
      : null;

    window.addEventListener('resize', () => this._ajustarCanvas());

    this.painel = new BlocoPanel({
      som,
      aoMudar: total => this._aoMudarPrograma(total),
      aoPrever: sentido => gm.emit(EVENTOS.PREVER_GIRO, { sentido })
    });

    this._ligarEventos();
    this._ligarTeclado();
  }

  // ── Assinaturas ───────────────────────────────────────────────────────────

  _ligarEventos() {
    const { gm } = this;

    gm.on(EVENTOS.ESTADO_MUDOU, ({ novoEstado }) => this._aoMudarEstado(novoEstado));
    gm.on(EVENTOS.PROGRESSO_SINCRONIZADO, () => {
      // o progresso da nuvem chegou depois da tela abrir — redesenha o mapa
      if (this.gm.appState === 'mapa') this._mostrarMapa();
    });
    gm.on(EVENTOS.FASE_CARREGADA, ({ config }) => this._montarFase(config));
    gm.on(EVENTOS.BIT_FALOU, ({ texto, ms }) => this._falar(texto, ms));
    gm.on(EVENTOS.CHAVE_COLETADA, () => this.hud?.setChaveColetada(true));
    gm.on(EVENTOS.BLOCO_EM_EXECUCAO, ({ bloco }) => this.painel.destacar(bloco));
    gm.on(EVENTOS.DICA_DISPONIVEL, () => this.elDica?.classList.remove('escondido'));
    gm.on(EVENTOS.FASE_CONCLUIDA, dados => this._mostrarVitoria(dados));

    gm.on(EVENTOS.EXECUCAO_INICIADA, () => {
      this.painel.travar(true);
      this._travarBotoes(true);
    });
    gm.on(EVENTOS.EXECUCAO_FINALIZADA, () => {
      this.painel.travar(false);
      this._travarBotoes(false);
      this.painel.destacar(null);
    });
  }

  _ligarTeclado() {
    document.addEventListener('keydown', e => {
      if (this.gm.appState !== 'jogando' && this.gm.appState !== 'pausado') return;
      if (e.key === 'Enter') this._executar();
      if (e.key.toLowerCase() === 'r') this.gm.emit(EVENTOS.PEDIDO_RESET, {});
      if (e.key === 'Escape') {
        this.gm.appState === 'pausado' ? this.gm.retomar() : this.gm.pausar();
      }
    });
  }

  // ── Roteamento de telas ───────────────────────────────────────────────────

  _aoMudarEstado(estado) {
    switch (estado) {
      case 'login':    this._mostrarLogin(); break;
      case 'menu':     this._mostrarMenu(); break;
      case 'mapa':     this._mostrarMapa(); break;
      case 'jogando':  this._mostrarJogo(); break;
      case 'pausado':  this._mostrarPause(); break;
      case 'vitoria':  break; // o modal vem pelo evento FASE_CONCLUIDA
    }
  }

  /** Liga o UIManager ao jogo Phaser (chamado pelo main.js após o boot). */
  setJogo(jogo) { this.jogo = jogo; }

  /** Casa o tamanho do canvas com o do painel que o contém. */
  _ajustarCanvas() {
    const c = this.containerJogo;
    if (!this.jogo || !c.isConnected || c.clientWidth === 0) return;
    const atual = this.jogo.scale.gameSize;
    if (Math.round(atual.width) === c.clientWidth &&
        Math.round(atual.height) === c.clientHeight) return;
    this.jogo.scale.resize(c.clientWidth, c.clientHeight);
  }

  /** Tira o canvas do fluxo da tela antes de trocar de cena. */
  _guardarCanvas() {
    this._observador?.disconnect();
    if (this.containerJogo.parentElement !== this.app) {
      this.app.appendChild(this.containerJogo);
    }
    this.containerJogo.classList.add('escondido');
  }

  _limparTela() {
    this._fecharModais();
    this._guardarCanvas();
    this.raiz.innerHTML = '';
    this.hud = null;
    this.elDica = null;
  }

  /** Tela de entrada: login com Google ou modo convidado. */
  _mostrarLogin() {
    this._limparTela();
    this.som.pararMusica();
    const tela = criarTelaLogin({
      googleDisponivel: this.auth.googleDisponivel,
      aoEntrarConvidado: () => {
        this.som.clique();
        this._entrar(this.auth.entrarComoConvidado());
      },
      montarBotaoGoogle: el => this.auth.renderizarBotao(
        el,
        usuario => this._entrar(usuario),
        erro => this._avisoLogin(tela, `Não deu para entrar com o Google: ${erro.message}`)
      )
    });
    this.raiz.appendChild(tela);
  }

  _avisoLogin(tela, texto) {
    let aviso = tela.querySelector('.login-aviso');
    if (!aviso) {
      aviso = document.createElement('p');
      aviso.className = 'login-aviso';
      tela.querySelector('.menu-box').appendChild(aviso);
    }
    aviso.textContent = texto;
  }

  /** Fecha o login: aplica o usuário, sincroniza o progresso e abre o menu. */
  async _entrar(usuario) {
    await this._aplicarUsuario(usuario);
    this.gm.irParaMenu();
  }

  _mostrarMenu() {
    this._limparTela();
    this.raiz.appendChild(criarTelaMenu({
      usuario: this.gm.usuario,
      aoJogar: () => { this.som.clique(); this.gm.irParaMapa(); },
      aoComoJogar: () => { this.som.clique(); this._abrirModal(criarModalTutorial({
        aoFechar: () => { this.som.clique(); this._fecharModais(); }
      })); },
      aoSair: async () => {
        this.som.clique();
        this.auth.sair();
        await this._aplicarUsuario(null);
        this.gm.irParaLogin();
      }
    }));
  }

  _mostrarMapa() {
    this._limparTela();
    // A tela de escolha de fases não tem trilha própria: a música do mundo só
    // começa ao entrar numa fase. Silencia aqui para o caso de ter voltado de
    // uma fase com a música tocando.
    this.som.pararMusica();
    this.raiz.appendChild(criarTelaMapa(this.gm.storage, {
      som: this.som,
      aoVoltar: () => { this.som.clique(); this.gm.irParaMenu(); },
      aoEscolherFase: faseId => { this.som.clique(); this.gm.selecionarFase(faseId); }
    }));
  }

  /** Monta o esqueleto da tela de jogo. O conteúdo chega em `_montarFase`. */
  _mostrarJogo() {
    if (this.raiz.querySelector('.tela-jogo')) { this._fecharModais(); return; }
    this._limparTela();

    const tela = document.createElement('section');
    tela.className = 'tela tela-jogo';

    this.hud = new HUD({ aoPausar: () => { this.som.clique(); this.gm.pausar(); } });
    tela.appendChild(this.hud.el);

    const palco = document.createElement('main');
    palco.className = 'palco';
    palco.innerHTML = `
      <aside class="painel painel-blocos">
        <h3 class="painel-titulo">Blocos</h3>
        <div class="paleta"></div>
      </aside>
      <div class="painel painel-mapa">
        <div class="balao-bit escondido"></div>
      </div>
      <aside class="painel painel-seq">
        <h3 class="painel-titulo">Meu programa <span class="pill">0</span></h3>
        <div class="area-programa">
          <div class="sequencia"></div>
          <div class="slot-truque escondido"></div>
        </div>
        <div class="seq-acoes">
          <button class="btn btn-pequeno btn-amarelo" data-acao="limpar" aria-label="Limpar programa">
            <span class="ico">🗑</span>
          </button>
          <button class="btn btn-pequeno btn-roxo escondido" data-acao="dica" aria-label="Ver dica">
            <span class="ico">💡</span>
          </button>
        </div>
      </aside>`;
    tela.appendChild(palco);

    const rodape = document.createElement('footer');
    rodape.className = 'rodape';
    rodape.innerHTML = `
      <button class="btn btn-grande btn-amarelo" data-acao="reset">
        <span class="ico">↺</span> <span class="txt">Recomeçar</span>
      </button>
      <button class="btn btn-gigante btn-verde" data-acao="executar">
        <span class="ico">▶</span> EXECUTAR
      </button>
      <button class="btn btn-grande btn-azul" data-acao="som" aria-label="Ligar/desligar som">
        <span class="ico">${this.som.ligado ? '🔊' : '🔇'}</span>
      </button>`;
    tela.appendChild(rodape);

    this.raiz.appendChild(tela);

    // o canvas do Phaser passa a viver dentro do painel central
    const painelMapa = palco.querySelector('.painel-mapa');
    painelMapa.insertBefore(this.containerJogo, painelMapa.firstChild);
    this.containerJogo.classList.remove('escondido');
    this._observador?.observe(this.containerJogo);
    setTimeout(() => this._ajustarCanvas(), 0);   // depois do layout

    this.elBalao   = palco.querySelector('.balao-bit');
    this.elPill    = palco.querySelector('.pill');
    this.elDica    = palco.querySelector('[data-acao="dica"]');
    this.elPaleta  = palco.querySelector('.paleta');
    this.elSeq     = palco.querySelector('.sequencia');
    this.elTruque  = palco.querySelector('.slot-truque');

    tela.querySelector('[data-acao="limpar"]').addEventListener('click', () => this.painel.limpar());
    this.elDica.addEventListener('click', () => {
      this.som.clique();
      this._falar(`💡 ${this.gm.configFase?.dica || ''}`, 7000);
    });
    rodape.querySelector('[data-acao="executar"]').addEventListener('click', () => this._executar());
    rodape.querySelector('[data-acao="reset"]').addEventListener('click', () => {
      this.som.clique();
      this.gm.emit(EVENTOS.PEDIDO_RESET, {});
    });
    rodape.querySelector('[data-acao="som"]').addEventListener('click', e => {
      e.currentTarget.querySelector('.ico').textContent = this.som.alternar() ? '🔊' : '🔇';
    });
  }

  _montarFase(config) {
    this.hud?.setFase(config);
    this.elDica?.classList.add('escondido');

    /* Destrava a interface ao entrar na fase. Sem isto, sair no meio de uma
       execução (pausar → "Mapa" ou "Recomeçar") reiniciava a cena sem que
       EXECUCAO_FINALIZADA chegasse a ser emitido, e a criança caía na fase
       seguinte com os botões desabilitados. */
    this.painel.travar(false);
    this._travarBotoes(false);

    this.painel.montar(this.elPaleta, this.elSeq, this.elTruque, config);
    this._ajustarCanvas();
  }

  // ── Interações da tela de jogo ────────────────────────────────────────────

  _executar() {
    if (this.gm.appState !== 'jogando') return;
    this.gm.emit(EVENTOS.PEDIDO_EXECUTAR, {
      programa: this.painel.programa,
      funcao: this.painel.funcao
    });
  }

  _aoMudarPrograma(total) {
    if (this.elPill) this.elPill.textContent = total;
    this.hud?.setEstrelas(total === 0 ? 3 : this.gm.calcularEstrelas(total));
    // no layout em faixas o painel de blocos cresce e encolhe o do tabuleiro
    this._ajustarCanvas();
  }

  _travarBotoes(travar) {
    this.raiz.querySelectorAll('.rodape .btn, [data-acao="limpar"]')
      .forEach(b => { b.disabled = travar; });
  }

  _falar(texto, ms = 3000) {
    if (!this.elBalao) return;
    clearTimeout(this._timerBalao);
    this.elBalao.innerHTML = `<span class="balao-ico">🤖</span> ${texto}`;
    this.elBalao.classList.remove('escondido');
    this._timerBalao = setTimeout(() => this.elBalao.classList.add('escondido'), ms);
  }

  // ── Modais ────────────────────────────────────────────────────────────────

  _abrirModal(modal) {
    this._fecharModais();
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.appendChild(modal);
    this.raiz.appendChild(overlay);
    this._overlay = overlay;
  }

  _fecharModais() {
    this._overlay?.remove();
    this._overlay = null;
  }

  _mostrarPause() {
    this._abrirModal(criarModalPause({
      aoContinuar:    () => { this.som.clique(); this.gm.retomar(); },
      aoRecomecar:    () => { this.som.clique(); this.gm.selecionarFase(this.gm.faseAtual); },
      aoVoltarAoMapa: () => { this.som.clique(); this.gm.irParaMapa(); }
    }));
  }

  _mostrarVitoria(dados) {
    chuvaDeConfete();
    for (let i = 0; i < 3; i++) setTimeout(() => this.som.estrela(), 400 + i * 200);

    setTimeout(() => {
      this._abrirModal(criarModalVitoria(dados, {
        aoProxima: () => {
          this.som.clique();
          const proxima = this.gm.proximaFaseId();
          proxima ? this.gm.selecionarFase(proxima) : this.gm.irParaMapa();
        },
        aoRepetir:      () => { this.som.clique(); this.gm.selecionarFase(this.gm.faseAtual); },
        aoVoltarAoMapa: () => { this.som.clique(); this.gm.irParaMapa(); }
      }));
    }, 700);
  }
}
