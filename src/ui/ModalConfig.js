/**
 * ModalConfig.js
 * Configurações: volume da música e dos efeitos (deslizando), som ligado e
 * tela cheia. Tudo vale na hora e fica salvo no aparelho (AudioManager).
 */

import { CANAL } from '../core/AudioManager.js';

/** Tela cheia existe em quase todo navegador — no iPhone, não. */
const telaCheiaSuportada = () => Boolean(document.fullscreenEnabled);
const emTelaCheia = () => Boolean(document.fullscreenElement);

function linhaVolume({ id, icone, rotulo, valor }) {
  const pct = Math.round(valor * 100);
  return `
    <div class="cfg-linha">
      <label class="cfg-rotulo" for="${id}"><span class="ico">${icone}</span> ${rotulo}</label>
      <div class="cfg-controle">
        <input type="range" class="cfg-volume" id="${id}" min="0" max="100" step="5"
               value="${pct}" style="--pct:${pct}%" aria-valuetext="${pct}%">
        <output class="cfg-valor" for="${id}">${pct}%</output>
      </div>
    </div>`;
}

export function criarModalConfig({ som, aoFechar }) {
  const modal = document.createElement('div');
  modal.className = 'modal modal-config';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'cfg-titulo');
  modal.innerHTML = `
    <h2 class="modal-titulo" id="cfg-titulo"><span class="ico">⚙️</span> Ajustes</h2>

    ${linhaVolume({ id: 'cfg-musica', icone: '🎵', rotulo: 'Música', valor: som.volume(CANAL.MUSICA) })}
    ${linhaVolume({ id: 'cfg-efeitos', icone: '🔔', rotulo: 'Efeitos', valor: som.volume(CANAL.EFEITOS) })}

    <div class="cfg-linha">
      <span class="cfg-rotulo" id="cfg-som-rotulo"><span class="ico">🔊</span> Som</span>
      <button class="cfg-chave" data-acao="som" role="switch"
              aria-labelledby="cfg-som-rotulo" aria-checked="${som.ligado}">
        <span class="cfg-chave-bola"></span>
      </button>
    </div>

    ${telaCheiaSuportada() ? `
    <div class="cfg-linha">
      <span class="cfg-rotulo" id="cfg-tela-rotulo"><span class="ico">⛶</span> Tela cheia</span>
      <button class="cfg-chave" data-acao="tela-cheia" role="switch"
              aria-labelledby="cfg-tela-rotulo" aria-checked="${emTelaCheia()}">
        <span class="cfg-chave-bola"></span>
      </button>
    </div>` : ''}

    <button class="btn btn-grande btn-verde" data-acao="fechar">
      <span class="ico">✔</span> Pronto
    </button>`;

  const ligarVolume = (id, canal, aoSoltar) => {
    const input = modal.querySelector(`#${id}`);
    const saida = modal.querySelector(`output[for="${id}"]`);
    input.addEventListener('input', () => {
      const pct = Number(input.value);
      som.definirVolume(canal, pct / 100);
      input.style.setProperty('--pct', `${pct}%`);
      input.setAttribute('aria-valuetext', `${pct}%`);
      saida.textContent = `${pct}%`;
    });
    if (aoSoltar) input.addEventListener('change', aoSoltar);
  };
  ligarVolume('cfg-musica', CANAL.MUSICA);
  // ao soltar o controle dos efeitos, toca um clique para ouvir o novo volume
  ligarVolume('cfg-efeitos', CANAL.EFEITOS, () => som.clique());

  const chaveSom = modal.querySelector('[data-acao="som"]');
  const atualizarSom = () => {
    chaveSom.setAttribute('aria-checked', String(som.ligado));
    modal.classList.toggle('som-desligado', !som.ligado);
  };
  chaveSom.addEventListener('click', () => { som.definirLigado(!som.ligado); atualizarSom(); });
  atualizarSom();

  const chaveTela = modal.querySelector('[data-acao="tela-cheia"]');
  if (chaveTela) {
    const atualizarTela = () => chaveTela.setAttribute('aria-checked', String(emTelaCheia()));
    chaveTela.addEventListener('click', () => {
      const pedido = emTelaCheia()
        ? document.exitFullscreen()
        : document.documentElement.requestFullscreen();
      pedido.then(atualizarTela, atualizarTela);
    });
    // sair da tela cheia pelo Esc/gesto do sistema também atualiza a chave;
    // o ouvinte se desliga sozinho depois que o modal sai da tela
    const aoMudarTela = () => {
      if (!modal.isConnected) { document.removeEventListener('fullscreenchange', aoMudarTela); return; }
      atualizarTela();
    };
    document.addEventListener('fullscreenchange', aoMudarTela);
  }

  modal.querySelector('[data-acao="fechar"]').addEventListener('click', aoFechar);
  return modal;
}
