/**
 * ModalPause.js
 * Menu de pausa: continuar, recomeçar a fase ou voltar ao mapa (GDD 6.1).
 */

import { svgBit } from './svgBit.js';

export function criarModalPause({ aoContinuar, aoRecomecar, aoVoltarAoMapa }) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-bit">${svgBit()}</div>
    <h2 class="modal-titulo">Pausa</h2>
    <button class="btn btn-gigante btn-verde" data-acao="continuar">
      <span class="ico">▶</span> Continuar
    </button>
    <div class="modal-linha">
      <button class="btn btn-medio btn-amarelo" data-acao="recomecar">
        <span class="ico">↺</span> Recomeçar
      </button>
      <button class="btn btn-medio btn-vermelho" data-acao="mapa">
        <span class="ico">🗺</span> Mapa
      </button>
    </div>`;

  modal.querySelector('[data-acao="continuar"]').addEventListener('click', aoContinuar);
  modal.querySelector('[data-acao="recomecar"]').addEventListener('click', aoRecomecar);
  modal.querySelector('[data-acao="mapa"]').addEventListener('click', aoVoltarAoMapa);
  return modal;
}
