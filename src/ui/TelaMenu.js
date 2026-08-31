/**
 * TelaMenu.js
 * Menu principal (GDD 6.1).
 */

import { svgBit } from './svgBit.js';

export function criarTelaMenu({ aoJogar, aoComoJogar, aoSair, usuario }) {
  const tela = document.createElement('section');
  tela.className = 'tela tela-menu';

  const nome = usuario?.nome ?? 'Jogador';
  const ehConvidado = usuario?.provedor === 'convidado';

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
      <p class="login-nota">
        ${ehConvidado ? 'Jogando como convidado' : `Olá, ${escaparHtml(nome)}!`}
        <button class="link-sair" data-acao="sair">${ehConvidado ? 'entrar' : 'sair'}</button>
      </p>
    </div>`;

  tela.querySelector('[data-acao="jogar"]').addEventListener('click', aoJogar);
  tela.querySelector('[data-acao="ajuda"]').addEventListener('click', aoComoJogar);
  tela.querySelector('[data-acao="sair"]').addEventListener('click', aoSair);
  return tela;
}

/** O nome vem do Google; escapa antes de interpolar no HTML. */
function escaparHtml(texto) {
  const d = document.createElement('div');
  d.textContent = texto;
  return d.innerHTML;
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
