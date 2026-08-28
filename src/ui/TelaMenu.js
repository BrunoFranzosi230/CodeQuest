/**
 * TelaMenu.js
 * Menu principal (GDD 6.1).
 */

import { svgBit } from './svgBit.js';

export function criarTelaMenu({ aoJogar, aoComoJogar }) {
  const tela = document.createElement('section');
  tela.className = 'tela tela-menu';
  tela.innerHTML = `
    <div class="menu-box">
      <div class="logo-bit">${svgBit()}</div>
      <h1 class="logo">Code<span>Quest</span></h1>
      <p class="subtitulo">A aventura do robô Bit</p>
      <button class="btn btn-gigante btn-verde" data-acao="jogar">
        <span class="ico">▶</span> JOGAR
      </button>
      <button class="btn btn-medio btn-azul" data-acao="ajuda">
        <span class="ico">❓</span> Como jogar
      </button>
    </div>`;

  tela.querySelector('[data-acao="jogar"]').addEventListener('click', aoJogar);
  tela.querySelector('[data-acao="ajuda"]').addEventListener('click', aoComoJogar);
  return tela;
}

export function criarModalTutorial({ aoFechar }) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <h2 class="modal-titulo">Como jogar</h2>
    <ol class="tutorial">
      <li><span class="tut-ico">👆</span> Toque nos blocos coloridos para montar o programa do Bit.</li>
      <li><span class="tut-ico">🔑</span> O Bit precisa pegar a chave...</li>
      <li><span class="tut-ico">🏠</span> ...e depois voltar para casa!</li>
      <li><span class="tut-ico">▶</span> Aperte EXECUTAR e veja o Bit andar.</li>
      <li><span class="tut-ico">⭐</span> Use poucos blocos para ganhar 3 estrelas.</li>
    </ol>
    <button class="btn btn-gigante btn-verde" data-acao="fechar">Entendi!</button>`;

  modal.querySelector('[data-acao="fechar"]').addEventListener('click', aoFechar);
  return modal;
}
