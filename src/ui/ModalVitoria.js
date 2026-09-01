/**
 * ModalVitoria.js
 * Tela de conclusão de fase com as estrelas conquistadas e chuva de confete
 * (GDD 4.5 e 6.2).
 */

import { svgBit } from './svgBit.js';

const CORES_CONFETE = ['#FBBF24', '#22C55E', '#38BDF8', '#EC4899', '#A855F7', '#F87171'];

export function criarModalVitoria(dados, { aoProxima, aoRepetir, aoVoltarAoMapa }) {
  const { estrelas, blocosUsados, minBlocos, temProxima } = dados;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-bit festa">${svgBit()}</div>
    <h2 class="modal-titulo">Você conseguiu!</h2>
    <div class="estrelas-grandes">
      ${[0, 1, 2].map(i => `<span class="${i < estrelas ? 'on' : ''}">⭐</span>`).join('')}
    </div>
    <p class="modal-texto">${
      estrelas === 3
        ? `Perfeito! Você usou só ${blocosUsados} blocos.`
        : `Você usou ${blocosUsados} blocos. Dá para fazer com ${minBlocos}!`
    }</p>
    ${temProxima ? `
      <button class="btn btn-gigante btn-verde" data-acao="proxima">
        <span class="ico">▶</span> Próxima
      </button>` : `
      <p class="modal-texto"><strong>Você terminou todas as aventuras! 🎉</strong></p>`}
    <div class="modal-linha">
      <button class="btn btn-medio btn-amarelo" data-acao="repetir">
        <span class="ico">↺</span> De novo
      </button>
      <button class="btn btn-medio btn-azul" data-acao="mapa">
        <span class="ico">🗺</span> Mapa
      </button>
    </div>`;

  modal.querySelector('[data-acao="proxima"]')?.addEventListener('click', aoProxima);
  modal.querySelector('[data-acao="repetir"]').addEventListener('click', aoRepetir);
  modal.querySelector('[data-acao="mapa"]').addEventListener('click', aoVoltarAoMapa);
  return modal;
}

export function chuvaDeConfete(alvo = document.getElementById('confete')) {
  if (!alvo) return;
  for (let i = 0; i < 60; i++) {
    const papel = document.createElement('div');
    papel.className = 'papel';
    papel.style.left = `${Math.random() * 100}vw`;
    papel.style.background = CORES_CONFETE[i % CORES_CONFETE.length];
    papel.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    papel.style.animationDelay = `${Math.random() * 0.5}s`;
    alvo.appendChild(papel);
    setTimeout(() => papel.remove(), 3600);
  }
}
