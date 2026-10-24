/**
 * Dicas.js
 * Dicas em três níveis, da mais leve à resposta, para a criança pedir ajuda
 * sem receber a solução de cara:
 *
 *   1. Estratégia   — como pensar no conceito do mundo (sempre liberada)
 *   2. Primeiro passo — por onde começar, tirado da solução de referência
 *   3. Resposta     — o campo `dica` do JSON da fase (liberada após algumas
 *                     tentativas, ver GameManager)
 */

import { BLOCO, DEF_BLOCOS } from '../data/blocos.js';

const ESTRATEGIA = {
  sequencia: 'Conte as casas com o dedo: cada “Andar” leva o Bit uma casa para onde a setinha aponta. Primeiro a chave 🔑, depois a casa 🏠.',
  loop: 'Procure um pedaço do caminho que se repete. O “Repetir” faz os blocos de dentro dele várias vezes, e assim você usa menos blocos.',
  condicional: 'O “Até chegar” faz o Bit seguir sozinho até a casa. O “Se dá pra ir” deixa ele decidir: andar quando dá, virar quando tem parede.',
  funcao: 'Ache um movimento que aparece mais de uma vez no caminho. Ensine ele no “Meu truque” e depois use o truque no programa.'
};

const rotulo = id => `“${DEF_BLOCOS[id]?.rotulo ?? id}”`;

/** Por onde começar, deduzido do primeiro bloco da solução de referência. */
export function primeiroPasso(config) {
  const seq = config?.sequenciaIdeal ?? [];
  const primeiro = seq[0];
  if (typeof primeiro !== 'string') return null;

  if (primeiro === BLOCO.FUNCAO && config.truqueIdeal?.length) {
    const t = config.truqueIdeal;
    return `O truque tem ${t.length} blocos e começa com ${rotulo(t[0])}. Depois, use o truque no programa.`;
  }
  if (primeiro.startsWith(BLOCO.REPETIR_ATE)) {
    return primeiro.includes(`${BLOCO.SE}{`)
      ? `Comece com um ${rotulo(BLOCO.REPETIR_ATE)} e coloque um ${rotulo(BLOCO.SE)} dentro dele.`
      : `Comece com um ${rotulo(BLOCO.REPETIR_ATE)} e coloque um bloco dentro dele.`;
  }
  const repetir = /^repetir\((\d+)\)/.exec(primeiro);
  if (repetir) {
    return `Comece com um ${rotulo(BLOCO.REPETIR)} de ${repetir[1]} vezes e coloque dentro dele o pedaço que se repete.`;
  }

  let seguidos = 0;
  while (seq[seguidos] === primeiro) seguidos++;
  return seguidos > 1
    ? `Comece com ${seguidos} blocos ${rotulo(primeiro)} seguidos.`
    : `O primeiro bloco é ${rotulo(primeiro)}.`;
}

/** As dicas da fase, em ordem. Níveis sem conteúdo ficam de fora. */
export function dicasDaFase(config) {
  if (!config) return [];
  return [
    { nivel: 1, titulo: 'Como pensar', texto: ESTRATEGIA[config.conceito] },
    { nivel: 2, titulo: 'Primeiro passo', texto: primeiroPasso(config) },
    { nivel: 3, titulo: 'Resposta', texto: config.dica, resposta: true }
  ].filter(d => d.texto);
}
