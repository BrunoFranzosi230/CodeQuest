/**
 * svgBit.js
 * O Bit desenhado em SVG, para os contextos de interface (logo do menu, modais).
 * No tabuleiro quem desenha o Bit é o Phaser — ver `BootScene._gerarBit()`.
 *
 * O viewBox começa em y=-6 porque a bolinha da antena sobe até y=-2,5 e seria
 * cortada por um box iniciado em zero.
 */
export function svgBit() {
  return `<svg viewBox="0 -6 100 106" aria-hidden="true">
    <line x1="50" y1="20" x2="50" y2="9" stroke="#2B2140" stroke-width="6" stroke-linecap="round"/>
    <circle cx="50" cy="7" r="7" fill="#FBBF24" stroke="#2B2140" stroke-width="5"/>
    <rect x="13" y="20" width="74" height="68" rx="22" fill="#60A5FA" stroke="#2B2140" stroke-width="6"/>
    <rect x="23" y="32" width="54" height="33" rx="15" fill="#F8FAFC" stroke="#2B2140" stroke-width="5"/>
    <circle class="olho-pupila" cx="39" cy="48" r="7" fill="#2B2140"/>
    <circle class="olho-pupila" cx="61" cy="48" r="7" fill="#2B2140"/>
    <circle cx="24" cy="72" r="6" fill="#F472B6" opacity=".85"/>
    <circle cx="76" cy="72" r="6" fill="#F472B6" opacity=".85"/>
    <path d="M40 74 q10 9 20 0" stroke="#2B2140" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>`;
}
