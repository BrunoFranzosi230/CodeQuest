/**
 * blocos.js
 * Catálogo dos tipos de bloco. Fonte única de verdade para o BlocoPanel
 * (aparência) e para o BlockEngine (semântica).
 */

/** Identificadores dos blocos — usados nos JSONs de fase em `blocosDisponiveis`. */
export const BLOCO = {
  ANDAR:       'andar',
  VIRAR_ESQ:   'virar_esq',
  VIRAR_DIR:   'virar_dir',
  REPETIR:     'repetir',
  REPETIR_ATE: 'repetir_ate',
  SE:          'se',
  FUNCAO:      'funcao'
};

/**
 * Seta curva de giro, desenhada em SVG.
 *
 * Antes eram os glifos `↰` e `↱` (U+21B0/U+21B1): dois caracteres pouco comuns,
 * que dependem da fonte instalada e ficam quase idênticos em tamanho pequeno.
 * Desenhados, ficam iguais em qualquer máquina e a diferença entre um e outro
 * é impossível de não ver.
 *
 * A forma mostra o caminho: sobe (a direção em que o Bit anda) e dobra.
 */
function setaDeGiro(sentido) {
  // o espelhamento vai num <g>: `transform` no elemento <svg> raiz é ignorado
  const espelhar = sentido === 'esq' ? ' transform="translate(24,0) scale(-1,1)"' : '';
  return `<svg viewBox="0 0 24 24" class="ico-giro" aria-hidden="true">
    <g${espelhar}>
      <path d="M6 21 L6 12 Q6 7.5 10.5 7.5 L14 7.5"
            fill="none" stroke="currentColor" stroke-width="3.6"
            stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12.5 3 L18.5 7.5 L12.5 12 Z" fill="currentColor"/>
    </g>
  </svg>`;
}

/**
 * Definição visual e estrutural de cada bloco.
 * - `caixa`: o bloco recebe outros blocos dentro (renderizado como contêiner)
 * - `ramos`: quantos corpos aninhados o bloco tem (o `se` tem dois)
 * - `ladoIcone`: 'fim' põe o ícone à direita do rótulo — os dois blocos de giro
 *   ficam espelhados um do outro, uma pista espacial que a criança lê antes
 *   mesmo de ler a palavra
 */
export const DEF_BLOCOS = {
  [BLOCO.ANDAR]:       { classe:'b-andar',   icone:'👣', rotulo:'Andar'        },
  [BLOCO.VIRAR_ESQ]:   { classe:'b-esq',     icone:setaDeGiro('esq'), rotulo:'Esquerda' },
  [BLOCO.VIRAR_DIR]:   { classe:'b-dir',     icone:setaDeGiro('dir'), rotulo:'Direita', ladoIcone:'fim' },
  [BLOCO.REPETIR]:     { classe:'b-repetir', icone:'🔁', rotulo:'Repetir',     caixa:'c-repetir', ramos:1, contador:true },
  [BLOCO.REPETIR_ATE]: { classe:'b-ate',     icone:'🎯', rotulo:'Até chegar',  caixa:'c-ate',     ramos:1 },
  [BLOCO.SE]:          { classe:'b-se',      icone:'🔀', rotulo:'Se dá pra ir', caixa:'c-se',     ramos:2 },
  [BLOCO.FUNCAO]:      { classe:'b-funcao',  icone:'✨', rotulo:'Usar truque'  }
};

/** Blocos que giram o Bit — usados para disparar a prévia no tabuleiro. */
export const BLOCOS_DE_GIRO = { [BLOCO.VIRAR_ESQ]: 'esq', [BLOCO.VIRAR_DIR]: 'dir' };

/** Limite de blocos que a criança pode montar (protege a legibilidade do painel). */
export const MAX_BLOCOS = 30;

/** Cria uma instância nova de bloco para inserir na sequência. */
export function novoBloco(tipo) {
  switch (tipo) {
    case BLOCO.REPETIR:     return { tipo, vezes: 2, filhos: [] };
    case BLOCO.REPETIR_ATE: return { tipo, filhos: [] };
    case BLOCO.SE:          return { tipo, filhos: [], senao: [] };
    default:                return { tipo };
  }
}

/** Lista os corpos aninhados de um bloco (vazio para blocos simples). */
export function ramosDe(bloco) {
  return [bloco.filhos, bloco.senao].filter(Boolean);
}

/** Conta blocos recursivamente, incluindo os aninhados. */
export function contarBlocos(lista) {
  return lista.reduce(
    (n, b) => n + 1 + ramosDe(b).reduce((m, r) => m + contarBlocos(r), 0),
    0
  );
}
