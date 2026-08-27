/**
 * fases.test.js
 * Contrato de cada fase publicada:
 *   1. o JSON passa na validação do LevelLoader;
 *   2. a solução de referência chega na saída com a chave;
 *   3. ela usa exatamente `minBlocos` — ou seja, as 3 estrelas são atingíveis.
 *
 * Uma fase impossível ou com `minBlocos` errado quebra o build. Já pegou um
 * bug real: a chave da 4-3 estava fora do caminho.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LevelLoader } from '../src/core/LevelLoader.js';
import { BitController } from '../src/core/BitController.js';
import { BlockEngine } from '../src/core/BlockEngine.js';
import { ORDEM_FASES, MUNDOS, fasesDoMundo } from '../src/data/mundos.js';
import { contarBlocos } from '../src/data/blocos.js';
import { SOLUCOES } from '../src/dev/testarFases.js';
import { gmFalso } from './ajuda.js';

// a partir da raiz do projeto: `import.meta.url` não resolve de forma
// confiável no ambiente jsdom em Windows
const carregarDoDisco = id => JSON.parse(
  readFileSync(join(process.cwd(), 'public', 'fases', `${id}.json`), 'utf8')
);

describe('catálogo de fases', () => {
  it('toda fase da ordem de desbloqueio existe em disco', () => {
    for (const id of ORDEM_FASES) {
      expect(() => carregarDoDisco(id), `arquivo de ${id}`).not.toThrow();
    }
  });

  it('todo mundo declarado tem pelo menos uma fase', () => {
    for (const mundo of MUNDOS) {
      expect(fasesDoMundo(mundo.id).length, `mundo ${mundo.id}`).toBeGreaterThan(0);
    }
  });

  it('toda fase tem solução de referência', () => {
    for (const id of ORDEM_FASES) {
      expect(SOLUCOES[id], `solução de ${id}`).toBeDefined();
    }
  });
});

describe.each(ORDEM_FASES)('fase %s', id => {
  const config = carregarDoDisco(id);
  const solucao = SOLUCOES[id];

  it('o JSON é válido', () => {
    expect(new LevelLoader().validar(config)).toBe(true);
  });

  it('o id do arquivo bate com o campo id', () => {
    expect(config.id).toBe(id);
  });

  it('a solução de referência vence a fase', async () => {
    const bit = new BitController(config);
    const engine = new BlockEngine(bit, gmFalso());
    const { resultado, motivo } = await engine.executar(solucao.p, solucao.f || []);

    expect(resultado, `motivo: ${motivo}`).toBe('sucesso');
    expect(bit.chaveColetada).toBe(true);
  });

  it('a solução usa exatamente minBlocos — as 3 estrelas são atingíveis', () => {
    const usaFuncao = config.blocosDisponiveis.includes('funcao');
    const usados = contarBlocos(solucao.p) + (usaFuncao ? contarBlocos(solucao.f || []) : 0);
    expect(usados).toBe(config.minBlocos);
  });

  it('só usa blocos liberados na fase', () => {
    const permitidos = new Set(config.blocosDisponiveis);
    const conferir = lista => lista.forEach(bloco => {
      expect(permitidos.has(bloco.tipo), `${bloco.tipo} não está em blocosDisponiveis`).toBe(true);
      [bloco.filhos, bloco.senao].filter(Boolean).forEach(conferir);
    });

    conferir(solucao.p);
    if (solucao.f) conferir(solucao.f);
  });
});
