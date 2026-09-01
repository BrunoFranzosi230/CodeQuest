/**
 * testarFases.js
 * Smoke test das fases — roda o BlockEngine e o BitController de verdade,
 * só sem parte gráfica (o BitController funciona sem `visual`).
 *
 * Verifica, para cada fase, que a solução de referência:
 *   1. chega na saída com a chave;
 *   2. usa exatamente `minBlocos` — ou seja, as 3 estrelas são atingíveis.
 *
 * Carregado apenas em desenvolvimento. No console:  await testarFases()
 */

import { LevelLoader } from '../core/LevelLoader.js';
import { BitController } from '../core/BitController.js';
import { BlockEngine } from '../core/BlockEngine.js';
import { ORDEM_FASES } from '../data/mundos.js';
import { contarBlocos } from '../data/blocos.js';

const A = { tipo: 'andar' };
const D = { tipo: 'virar_dir' };
const E = { tipo: 'virar_esq' };
const F = { tipo: 'funcao' };
const R  = (vezes, ...filhos) => ({ tipo: 'repetir', vezes, filhos });
const U  = (...filhos)        => ({ tipo: 'repetir_ate', filhos });
const SE = (filhos, senao)    => ({ tipo: 'se', filhos, senao });

/** Solução de referência de cada fase (`p` = programa, `f` = truque). */
export const SOLUCOES = {
  'mundo1-fase1': { p: [A, A, A, A] },
  'mundo1-fase2': { p: [A, A, D, A, A] },
  'mundo1-fase3': { p: [A, A, A, E, A, A, A, D, A] },
  'mundo1-fase4': { p: [A, A, A, D, A, A, A, A, D, A, A, A] },
  'mundo1-fase5': { p: [A, A, A, D, D, A, A, A, A, A] },
  'mundo2-fase1': { p: [R(5, A)] },
  'mundo2-fase2': { p: [R(4, A, A, D)] },
  'mundo2-fase3': { p: [R(4, A, D, A, E)] },
  'mundo3-fase1': { p: [U(A)] },
  'mundo3-fase2': { p: [U(SE([A], [D]))] },
  'mundo3-fase3': { p: [U(SE([A], [D]))] },
  'mundo4-fase1': { p: [F, F, F],    f: [A, A, D] },
  'mundo4-fase2': { p: [F, A, F],    f: [A, A, A, D] },
  'mundo4-fase3': { p: [F, A, F, F], f: [A, A, D] }
};

/** GameManager mínimo — o motor só precisa de `emit` e `falar`. */
const gmSilencioso = { emit() {}, falar() {} };

export async function testarFases() {
  const loader = new LevelLoader();
  const relatorio = [];
  let falhas = 0;

  for (const id of ORDEM_FASES) {
    const solucao = SOLUCOES[id];
    if (!solucao) { relatorio.push(`${id} ✗ sem solução de referência`); falhas++; continue; }

    let config;
    try {
      config = await loader.carregar(id);
    } catch (e) {
      relatorio.push(`${id} ✗ ${e.message}`); falhas++; continue;
    }

    const bit = new BitController(config);
    const motor = new BlockEngine(bit, gmSilencioso);
    const { resultado, motivo } = await motor.executar(solucao.p, solucao.f || []);

    const usaFuncao = config.blocosDisponiveis.includes('funcao');
    const usados = contarBlocos(solucao.p) + (usaFuncao ? contarBlocos(solucao.f || []) : 0);

    const venceu = resultado === 'sucesso';
    const minCerto = usados === config.minBlocos;
    if (!venceu || !minCerto) falhas++;

    relatorio.push(
      `${id} ${venceu && minCerto ? '✓' : '✗'} ` +
      `${venceu ? 'chegou' : `falhou (${motivo})`} · ` +
      `blocos ${usados}/min ${config.minBlocos}${minCerto ? '' : ' ← MIN DIVERGENTE'}`
    );
  }

  const cabecalho = falhas === 0
    ? `✅ ${ORDEM_FASES.length} fases OK`
    : `❌ ${falhas} de ${ORDEM_FASES.length} fases com problema`;

  console.info([cabecalho, ...relatorio].join('\n'));
  return { falhas, relatorio };
}
