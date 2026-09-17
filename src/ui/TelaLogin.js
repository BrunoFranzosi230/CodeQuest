/**
 * TelaLogin.js
 * Porta de entrada do jogo. Login com Google (salva o progresso na conta) ou
 * modo convidado (progresso só neste aparelho). Ver docs/AUTENTICACAO.md.
 *
 * O botão do Google usa o mesmo componente `.btn` do resto do jogo — não é o
 * widget renderizado pelo Google (esse não aceita o estilo do jogo, roda num
 * iframe deles). O clique só dispara o login por trás (AuthManager.entrarComGoogle).
 */

import { svgBit } from './svgBit.js';

/** "G" oficial do Google, cores originais — mesmo ícone do botão deles. */
const svgGoogle = () => `
  <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>`;

export function criarTelaLogin({ googleDisponivel, aoEntrarGoogle, aoEntrarConvidado }) {
  const tela = document.createElement('section');
  tela.className = 'tela tela-menu tela-login';
  tela.innerHTML = `
    <div class="menu-box">
      <div class="logo-bit">${svgBit()}</div>
      <h1 class="logo">Code<span>Quest</span></h1>
      <p class="subtitulo">Entre para salvar seu progresso</p>

      <button class="btn btn-medio btn-azul" data-acao="google" ${googleDisponivel ? '' : 'disabled'}>
        <span class="ico-google">${svgGoogle()}</span> Entrar com Google
      </button>
      ${googleDisponivel
        ? ''
        : '<p class="login-aviso">Login com Google indisponível nesta configuração.</p>'}

      <button class="btn btn-medio btn-amarelo" data-acao="convidado">
        <span class="ico">👤</span> Entrar como convidado
      </button>
      <p class="login-nota">Como convidado, o progresso fica só neste aparelho.</p>
    </div>`;

  if (googleDisponivel) {
    tela.querySelector('[data-acao="google"]').addEventListener('click', aoEntrarGoogle);
  }
  tela.querySelector('[data-acao="convidado"]').addEventListener('click', aoEntrarConvidado);

  return tela;
}
