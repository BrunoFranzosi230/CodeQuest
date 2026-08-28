/**
 * HUD.js
 * Barra superior da tela de jogo: pause, nome da fase, objetivo em ícones e
 * contador de estrelas (GDD 6.3).
 */

export class HUD {
  constructor({ aoPausar }) {
    this.el = document.createElement('header');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <button class="btn btn-pequeno btn-vermelho" data-acao="pause" aria-label="Pausar">
        <span class="ico">❚❚</span>
      </button>
      <div class="hud-fase">
        <strong class="hud-nome"></strong>
        <div class="hud-objetivo">
          <span class="obj-chave">🔑</span><span>→</span><span>🏠</span>
        </div>
      </div>
      <div class="hud-estrelas"></div>`;

    this.elNome     = this.el.querySelector('.hud-nome');
    this.elChave    = this.el.querySelector('.obj-chave');
    this.elEstrelas = this.el.querySelector('.hud-estrelas');
    this.el.querySelector('[data-acao="pause"]').addEventListener('click', aoPausar);
  }

  setFase(config) {
    this.elNome.textContent = `Fase ${config.id.replace('mundo', '').replace('-fase', '-')} — ${config.nome}`;
    this.setChaveColetada(false);
  }

  setChaveColetada(pego) {
    this.elChave.classList.toggle('pego', pego);
  }

  /**
   * Estrelas que o programa atual valeria. A criança vê a 3ª apagar quando
   * passa do mínimo de blocos e descobre sozinha que economizar é melhor.
   */
  setEstrelas(n) {
    this.elEstrelas.innerHTML = [0, 1, 2]
      .map(i => `<span class="${i < n ? '' : 'apagada'}">⭐</span>`)
      .join('');
  }
}
