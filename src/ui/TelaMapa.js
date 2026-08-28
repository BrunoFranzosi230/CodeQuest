/**
 * TelaMapa.js
 * Mapa de mundos com o progresso visual do jogador (GDD 5.1 e 6.1).
 */

import { MUNDOS, fasesDoMundo } from '../data/mundos.js';

export function criarTelaMapa(storage, { aoVoltar, aoEscolherFase }) {
  const tela = document.createElement('section');
  tela.className = 'tela tela-mapa';
  tela.innerHTML = `
    <header class="topo">
      <button class="btn btn-pequeno btn-vermelho" data-acao="voltar" aria-label="Voltar">
        <span class="ico">←</span>
      </button>
      <h2>Escolha uma aventura</h2>
      <div class="placar-estrelas"><span class="ico">⭐</span> ${storage.totalEstrelas()}</div>
    </header>
    <div class="mundos"></div>`;

  tela.querySelector('[data-acao="voltar"]').addEventListener('click', aoVoltar);
  const container = tela.querySelector('.mundos');

  MUNDOS.forEach(mundo => {
    const fases = fasesDoMundo(mundo.id);
    if (!fases.length) return;

    const travado = !storage.estaDesbloqueada(fases[0]);
    const card = document.createElement('div');
    card.className = `mundo${travado ? ' travado' : ''}`;
    card.innerHTML = `
      <div class="mundo-cabeca">
        <div class="mundo-emoji" style="background:${mundo.css}">
          ${travado ? '🔒' : mundo.emoji}
        </div>
        <div class="mundo-info">
          <h3>Mundo ${mundo.id} — ${mundo.nome}</h3>
          <p>${mundo.conceito}</p>
        </div>
      </div>
      <div class="fases"></div>`;

    const lista = card.querySelector('.fases');
    fases.forEach((faseId, i) => {
      const estrelas = storage.estrelasDaFase(faseId);
      const livre = storage.estaDesbloqueada(faseId);

      const botao = document.createElement('button');
      botao.className = 'fase-btn'
        + (estrelas ? ' completa' : '')
        + (livre ? '' : ' travada');
      botao.innerHTML = livre
        ? `${i + 1}<span class="mini-estrelas">${'⭐'.repeat(estrelas)}</span>`
        : '🔒';
      if (livre) botao.addEventListener('click', () => aoEscolherFase(faseId));
      else botao.disabled = true;
      lista.appendChild(botao);
    });

    container.appendChild(card);
  });

  return tela;
}
