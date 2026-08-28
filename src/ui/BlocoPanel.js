/**
 * BlocoPanel.js
 * Editor de blocos — camada de UI sobre o BlockEngine (SDD 3.3).
 *
 * ── Toque como interação primária ────────────────────────────────────────────
 * Arrastar exige pressionar, manter e soltar com precisão ao mesmo tempo: é a
 * operação mais difícil para uma criança de 6 anos. Aqui, tocar num bloco da
 * paleta já o insere, e um cursor amarelo piscando mostra onde ele vai entrar.
 * Arrastar funciona como atalho — inclusive para mover blocos já colocados,
 * para dentro e para fora dos blocos-caixa.
 */

import {
  DEF_BLOCOS, BLOCOS_DE_GIRO, MAX_BLOCOS, novoBloco, ramosDe, contarBlocos
} from '../data/blocos.js';

/** Marcador no dataTransfer para distinguir "mover" de "inserir novo". */
const MOVER = '__mover__';

export class BlocoPanel {
  /**
   * @param {{ aoMudar?: Function, aoPrever?: Function, som?: object }} deps
   */
  constructor({ aoMudar = () => {}, aoPrever = () => {}, som = null } = {}) {
    this.aoMudar = aoMudar;
    this.aoPrever = aoPrever;
    this.som = som;

    this.programa = [];
    this.funcao = [];
    this.alvo = null;       // { lista, indice } — onde o próximo bloco entra
    this.travado = false;
    this.usaFuncao = false;
    this.blocosDisponiveis = [];
    this._arrastando = null;

    this.elPaleta = null;
    this.elSequencia = null;
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  montar(elPaleta, elSequencia, elTruque, config) {
    this.elPaleta = elPaleta;
    this.elSequencia = elSequencia;
    this.elTruque = elTruque;
    this.blocosDisponiveis = config.blocosDisponiveis;
    this.usaFuncao = config.blocosDisponiveis.includes('funcao');
    this.programa = [];
    this.funcao = [];
    this.alvo = null;
    this.travado = false;
    this._ligarAreaVazia(elSequencia);
    this._renderPaleta();
    this.render();
  }

  /**
   * O painel é bem mais alto que a pilha de blocos, e essa sobra pertence à
   * `.sequencia`, não à lista de blocos. Sem isto, tocar (ou soltar um bloco)
   * na área vazia não fazia nada — e era justamente por ali que a criança
   * tentava tirar o cursor de dentro de um `Repetir`.
   */
  _ligarAreaVazia(el) {
    if (el.__areaVaziaLigada) return;
    el.__areaVaziaLigada = true;

    el.addEventListener('click', e => {
      if (e.target === el) this._moverAlvo(this.programa, this.programa.length);
    });
    this._ligarDrop(el, () => this.programa);
  }

  get total() {
    return contarBlocos(this.programa) + (this.usaFuncao ? contarBlocos(this.funcao) : 0);
  }

  limpar() {
    if (this.travado) return;
    this.programa = [];
    this.funcao = [];
    this.alvo = null;
    this.som?.remover();
    this.render();
  }

  travar(valor) {
    this.travado = valor;
    this.elPaleta?.style.setProperty('pointer-events', valor ? 'none' : '');
    this.elSequencia?.style.setProperty('pointer-events', valor ? 'none' : '');
  }

  /** Destaca o bloco em execução (ou limpa o destaque com `null`). */
  destacar(bloco) {
    this.elSequencia?.querySelectorAll('.ativo').forEach(n => n.classList.remove('ativo'));
    bloco?._el?.classList.add('ativo');
  }

  // ── Paleta ────────────────────────────────────────────────────────────────

  _renderPaleta() {
    this.elPaleta.innerHTML = '';
    this.blocosDisponiveis.forEach(tipo => {
      const def = DEF_BLOCOS[tipo];
      if (!def) return;
      const el = document.createElement('div');
      el.className = `bloco ${def.classe}`;
      el.draggable = true;
      el.innerHTML = this._conteudo(def);
      el.addEventListener('click', () => this.adicionar(tipo));
      el.addEventListener('dragstart', e => {
        this._arrastando = null;
        e.dataTransfer.setData('text/plain', tipo);
        e.dataTransfer.effectAllowed = 'copy';
      });
      this.elPaleta.appendChild(el);
    });
  }

  /** Ícone e rótulo na ordem certa — os blocos de giro têm o ícone espelhado. */
  _conteudo(def) {
    const ico = `<span class="bico">${def.icone}</span>`;
    const txt = `<span class="rotulo-bloco">${def.rotulo}</span>`;
    return def.ladoIcone === 'fim' ? txt + ico : ico + txt;
  }

  // ── Alvo de inserção ──────────────────────────────────────────────────────

  _contem(lista, alvo) {
    if (lista === alvo) return true;
    return lista.some(b => ramosDe(b).some(r => this._contem(r, alvo)));
  }

  _alvoValido() {
    if (!this.alvo) return false;
    return this._contem(this.programa, this.alvo.lista) ||
           (this.usaFuncao && this._contem(this.funcao, this.alvo.lista));
  }

  _alvoAtual() {
    if (!this._alvoValido()) {
      this.alvo = { lista: this.programa, indice: this.programa.length };
    }
    return this.alvo;
  }

  _moverAlvo(lista, indice) {
    this.alvo = { lista, indice };
    this.som?.clique();
    this.render();
  }

  // ── Edição ────────────────────────────────────────────────────────────────

  adicionar(tipo, lista, indice) {
    if (this.travado) return;
    if (!this.blocosDisponiveis.includes(tipo)) return;
    if (this.total >= MAX_BLOCOS) return;

    const destino = lista ? { lista, indice } : this._alvoAtual();
    destino.lista.splice(destino.indice, 0, novoBloco(tipo));
    this.alvo = { lista: destino.lista, indice: destino.indice + 1 };
    this.som?.encaixar();
    this.render();

    // ao inserir um giro, o tabuleiro mostra para onde o Bit ficaria virado
    if (BLOCOS_DE_GIRO[tipo]) this.aoPrever(BLOCOS_DE_GIRO[tipo]);
  }

  remover(lista, i) {
    if (this.travado) return;
    lista.splice(i, 1);
    this.alvo = { lista, indice: Math.min(i, lista.length) };
    this.som?.remover();
    this.render();
  }

  /** Move um bloco já colocado para outra lista (para dentro ou fora de caixas). */
  _mover({ lista, indice, bloco }, destino) {
    if (this.travado) return;
    // um bloco-caixa não pode ser solto dentro do próprio corpo
    if (ramosDe(bloco).some(ramo => this._contem(ramo, destino))) return;

    lista.splice(indice, 1);
    destino.push(bloco);
    this.alvo = { lista: destino, indice: destino.length };
    this.som?.encaixar();
    this.render();
  }

  // ── Renderização ──────────────────────────────────────────────────────────

  render() {
    if (!this.elSequencia) return;
    this.elSequencia.innerHTML = '';
    const alvo = this._alvoAtual();

    const raiz = document.createElement('div');
    raiz.className = 'lista-raiz';
    // pista visível de como voltar ao programa principal
    if (alvo.lista !== this.programa) raiz.classList.add('mostrar-saida');

    this._desenharLista(this.programa, raiz, alvo);
    this._ligarDrop(raiz, () => this.programa);
    raiz.addEventListener('click', e => {
      if (e.target === raiz) this._moverAlvo(this.programa, this.programa.length);
    });
    this.elSequencia.appendChild(raiz);

    /* A caixa do truque vive FORA da área que rola. Dentro dela, um programa
       um pouco mais longo empurrava o truque para baixo da dobra — e é
       justamente ele que a criança precisa ter à vista o tempo todo. */
    if (this.elTruque) {
      this.elTruque.innerHTML = '';
      this.elTruque.classList.toggle('escondido', !this.usaFuncao);

      if (this.usaFuncao) {
        const caixa = document.createElement('div');
        caixa.className = 'caixa-funcao';
        caixa.innerHTML = '<div class="funcao-cabeca"><span>✨</span> Meu truque</div>';
        caixa.appendChild(this._slot(this.funcao, alvo));
        this.elTruque.appendChild(caixa);
      }
    }

    this.aoMudar(this.total);
  }

  _desenharLista(lista, container, alvo) {
    lista.forEach((bloco, i) => {
      if (alvo.lista === lista && alvo.indice === i) container.appendChild(this._caret());
      container.appendChild(this._desenharBloco(bloco, lista, i, alvo));
    });
    if (alvo.lista === lista && alvo.indice >= lista.length) {
      container.appendChild(this._caret());
    }
  }

  _caret() {
    const c = document.createElement('div');
    c.className = 'caret';
    return c;
  }

  _lixo(lista, i) {
    const x = document.createElement('span');
    x.className = 'lixo';
    x.textContent = '✕';
    x.draggable = false;
    x.addEventListener('click', e => { e.stopPropagation(); this.remover(lista, i); });
    return x;
  }

  /** Corpo aninhado onde outros blocos podem ser soltos. */
  _slot(listaFilha, alvo) {
    const corpo = document.createElement('div');
    corpo.className = 'corpo';
    this._desenharLista(listaFilha, corpo, alvo);
    this._ligarDrop(corpo, () => listaFilha);
    corpo.addEventListener('click', e => {
      if (e.target === corpo) this._moverAlvo(listaFilha, listaFilha.length);
    });
    return corpo;
  }

  _ramo(icone, texto, listaFilha, alvo) {
    const r = document.createElement('div');
    r.className = 'ramo';
    r.innerHTML = `<span class="ramo-tag"><i>${icone}</i>${texto}</span>`;
    r.appendChild(this._slot(listaFilha, alvo));
    return r;
  }

  /** Deixa um bloco já colocado ser arrastado para outro lugar. */
  _ligarArrasteDeBloco(el, bloco, lista, indice) {
    el.draggable = true;
    el.addEventListener('dragstart', e => {
      e.stopPropagation();                       // o bloco mais interno ganha
      this._arrastando = { lista, indice, bloco };
      e.dataTransfer.setData('text/plain', MOVER);
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => { this._arrastando = null; });
  }

  _desenharBloco(bloco, lista, i, alvo) {
    const def = DEF_BLOCOS[bloco.tipo];

    if (def.caixa) {
      const wrap = document.createElement('div');
      wrap.className = `bloco-caixa ${def.caixa}`;

      const cabeca = document.createElement('div');
      cabeca.className = 'cabeca';
      cabeca.innerHTML =
        `<span class="bico">${def.icone}</span><span class="rotulo">${def.rotulo}</span>`;

      if (def.contador) {
        const cont = document.createElement('span');
        cont.className = 'contador';
        cont.textContent = `${bloco.vezes}×`;
        cont.title = 'Toque para mudar o número de repetições';
        cont.draggable = false;
        cont.addEventListener('click', e => {
          e.stopPropagation();
          bloco.vezes = bloco.vezes >= 9 ? 2 : bloco.vezes + 1;
          this.som?.clique();
          this.render();
        });
        cabeca.appendChild(cont);
      }

      cabeca.appendChild(this._lixo(lista, i));
      wrap.appendChild(cabeca);

      if (def.ramos === 2) {
        wrap.appendChild(this._ramo('✅', 'dá', bloco.filhos, alvo));
        wrap.appendChild(this._ramo('🚫', 'não dá', bloco.senao, alvo));
      } else {
        wrap.appendChild(this._slot(bloco.filhos, alvo));
      }

      this._ligarArrasteDeBloco(wrap, bloco, lista, i);
      bloco._el = wrap;
      return wrap;
    }

    const el = document.createElement('div');
    el.className = `bloco ${def.classe}`;
    el.innerHTML = this._conteudo(def);
    el.appendChild(this._lixo(lista, i));
    el.addEventListener('click', () => {
      this._moverAlvo(lista, i + 1);
      if (BLOCOS_DE_GIRO[bloco.tipo]) this.aoPrever(BLOCOS_DE_GIRO[bloco.tipo]);
    });
    this._ligarArrasteDeBloco(el, bloco, lista, i);
    bloco._el = el;
    return el;
  }

  /**
   * @param {HTMLElement} node zona que aceita blocos
   * @param {Function} obterLista devolve a lista de destino na hora do drop
   *   (função, e não a lista direto: `limpar()` troca o array de `programa`)
   */
  _ligarDrop(node, obterLista) {
    node.addEventListener('dragover', e => {
      e.preventDefault(); e.stopPropagation();
      node.classList.add('alvo');
    });
    node.addEventListener('dragleave', e => {
      if (e.target === node) node.classList.remove('alvo');
    });
    node.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation();
      node.classList.remove('alvo');

      const destino = obterLista();
      const dado = e.dataTransfer.getData('text/plain');

      if (dado === MOVER) {
        if (this._arrastando) this._mover(this._arrastando, destino);
        this._arrastando = null;
      } else if (DEF_BLOCOS[dado]) {
        this.adicionar(dado, destino, destino.length);
      }
    });
  }
}
