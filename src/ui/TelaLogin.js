/**
 * TelaLogin.js
 * Porta de entrada do jogo. Login com Google (salva o progresso na conta) ou
 * modo convidado (progresso só neste aparelho). Ver docs/AUTENTICACAO.md.
 */

import { svgBit } from './svgBit.js';

export function criarTelaLogin({ googleDisponivel, aoEntrarConvidado, montarBotaoGoogle }) {
  const tela = document.createElement('section');
  tela.className = 'tela tela-menu tela-login';
  tela.innerHTML = `
    <div class="menu-box">
      <div class="logo-bit">${svgBit()}</div>
      <h1 class="logo">Code<span>Quest</span></h1>
      <p class="subtitulo">Entre para salvar seu progresso</p>

      <div class="login-google" data-slot="google"></div>
      ${googleDisponivel
        ? ''
        : '<p class="login-aviso">Login com Google indisponível nesta configuração.</p>'}

      <button class="btn btn-medio btn-amarelo" data-acao="convidado">
        <span class="ico">👤</span> Entrar como convidado
      </button>
      <p class="login-nota">Como convidado, o progresso fica só neste aparelho.</p>
    </div>`;

  tela.querySelector('[data-acao="convidado"]').addEventListener('click', aoEntrarConvidado);

  if (googleDisponivel) {
    montarBotaoGoogle(tela.querySelector('[data-slot="google"]'));
  }

  return tela;
}
