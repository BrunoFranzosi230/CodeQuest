/**
 * Testes do backend (Lambda de progresso).
 *
 * As regras ficam em aws/lambda-progresso/handler.mjs e recebem o validador de
 * token e o banco por parâmetro — aqui entram versões falsas dos dois, então
 * nada de rede: nem Google, nem AWS, nem PostgreSQL.
 */

// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  criarHandler, limparProgresso, limparEstrelas, limparBlocos, limparData,
  MAX_FASES, BLOCOS_DESCONHECIDO
} from '../aws/lambda-progresso/handler.mjs';

const PERFIL = { sub: 'google-123', name: 'Ana', email: 'ana@exemplo.com' };

/** Banco falso: registra cada consulta e responde conforme o roteiro. */
function bancoFalso(responder = () => ({ rowCount: 0, rows: [] })) {
  const consultas = [];
  const cx = {
    query: vi.fn(async (sql, params) => {
      consultas.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
      return responder(sql, params);
    }),
    release: vi.fn()
  };
  return { pool: { connect: vi.fn(async () => cx) }, cx, consultas };
}

function montar({ banco = bancoFalso(), verificarToken = async () => PERFIL } = {}) {
  const log = { warn: vi.fn(), error: vi.fn() };
  const handler = criarHandler({ verificarToken, pool: banco.pool, log });
  return { handler, banco, log };
}

const evento = (metodo, { corpo, token = 'token-valido', base64 = false } = {}) => ({
  requestContext: { http: { method: metodo } },
  headers: token ? { authorization: `Bearer ${token}` } : {},
  body: corpo === undefined ? undefined : corpo,
  isBase64Encoded: base64
});

const json = r => JSON.parse(r.body);

describe('Lambda — autenticação', () => {
  it('recusa requisição sem token (401) e nem abre conexão com o banco', async () => {
    const { handler, banco } = montar();
    const r = await handler(evento('GET', { token: null }));
    expect(r.statusCode).toBe(401);
    expect(json(r).erro).toBe('sem token');
    expect(banco.pool.connect).not.toHaveBeenCalled();
  });

  it('recusa token rejeitado pelo Google (401) e registra o motivo no log', async () => {
    const { handler, banco, log } = montar({
      verificarToken: async () => { throw new Error('Token used too late'); }
    });
    const r = await handler(evento('GET'));
    expect(r.statusCode).toBe(401);
    expect(json(r).erro).toBe('token invalido');
    expect(log.warn).toHaveBeenCalledWith('token rejeitado:', 'Token used too late');
    expect(banco.pool.connect).not.toHaveBeenCalled();
  });

  it('recusa token válido mas sem identificador do jogador', async () => {
    const { handler } = montar({ verificarToken: async () => ({ name: 'Sem sub' }) });
    expect((await handler(evento('GET'))).statusCode).toBe(401);
  });

  it('aceita o cabeçalho com "Authorization" maiúsculo e entrega só o token ao validador', async () => {
    const verificarToken = vi.fn(async () => PERFIL);
    const { handler } = montar({ verificarToken });
    await handler({
      requestContext: { http: { method: 'GET' } },
      headers: { Authorization: 'bearer   abc.def.ghi  ' }
    });
    expect(verificarToken).toHaveBeenCalledWith('abc.def.ghi');
  });

  it('responde 204 ao OPTIONS (pré-voo do CORS) sem exigir token', async () => {
    const { handler } = montar();
    expect((await handler(evento('OPTIONS', { token: null }))).statusCode).toBe(204);
  });

  it('recusa método desconhecido com 405', async () => {
    const { handler, banco } = montar();
    expect((await handler(evento('PATCH'))).statusCode).toBe(405);
    expect(banco.pool.connect).not.toHaveBeenCalled();
  });

  it('usa GET quando o evento não informa o método', async () => {
    const { handler } = montar();
    const r = await handler({ headers: { authorization: 'Bearer t' } });
    expect(r.statusCode).toBe(404);
  });

  it('entende o formato antigo do API Gateway (httpMethod)', async () => {
    const { handler, banco } = montar();
    await handler({ httpMethod: 'DELETE', headers: { authorization: 'Bearer t' } });
    expect(banco.consultas[0].sql).toMatch(/^DELETE FROM jogador/);
  });
});

describe('Lambda — GET /progresso', () => {
  it('devolve 404 para quem ainda não tem progresso', async () => {
    const { handler } = montar();
    const r = await handler(evento('GET'));
    expect(r.statusCode).toBe(404);
  });

  it('devolve o progresso no formato que o jogo espera', async () => {
    const banco = bancoFalso(sql => /FROM jogador/.test(sql)
      ? { rowCount: 1, rows: [{ ultima_fase: 'mundo1-fase2' }] }
      : { rowCount: 1, rows: [{
          fase_id: 'mundo1-fase1', estrelas: 3, menor_blocos: 4,
          concluida_em: '2026-10-01T12:00:00.000Z'
        }] });
    const { handler } = montar({ banco });

    const r = await handler(evento('GET'));

    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toBe('application/json');
    expect(json(r)).toEqual({
      versao: 1,
      ultimaFaseJogada: 'mundo1-fase2',
      fasesConcluidas: {
        'mundo1-fase1': {
          estrelas: 3, menorNumeroBlocos: 4, concluidaEm: '2026-10-01T12:00:00.000Z'
        }
      }
    });
  });

  it('filtra pelo id que vem do token — é o que impede ver dados de outro jogador', async () => {
    const { handler, banco } = montar();
    await handler(evento('GET', { corpo: JSON.stringify({ id: 'outro-jogador' }) }));
    expect(banco.consultas.every(c => c.params[0] === PERFIL.sub)).toBe(true);
  });
});

describe('Lambda — PUT /progresso', () => {
  const corpo = JSON.stringify({
    versao: 1,
    ultimaFaseJogada: 'mundo1-fase2',
    fasesConcluidas: {
      'mundo1-fase1': { estrelas: 3, menorNumeroBlocos: 4, concluidaEm: '2026-10-01T12:00:00.000Z' },
      'mundo1-fase2': { estrelas: 2, menorNumeroBlocos: 7 }
    }
  });

  it('grava jogador e fases dentro de uma transação', async () => {
    const { handler, banco } = montar();
    const r = await handler(evento('PUT', { corpo }));

    expect(r.statusCode).toBe(200);
    const sqls = banco.consultas.map(c => c.sql);
    expect(sqls[0]).toBe('BEGIN');
    expect(sqls[1]).toMatch(/^INSERT INTO jogador/);
    expect(sqls[2]).toMatch(/^INSERT INTO fase_concluida/);
    expect(sqls[3]).toMatch(/^INSERT INTO fase_concluida/);
    expect(sqls[4]).toBe('COMMIT');
    expect(banco.consultas[1].params).toEqual([PERFIL.sub, 'Ana', 'ana@exemplo.com', 'mundo1-fase2']);
    expect(banco.consultas[2].params).toEqual(
      [PERFIL.sub, 'mundo1-fase1', 3, 4, '2026-10-01T12:00:00.000Z']);
    expect(banco.consultas[3].params).toEqual([PERFIL.sub, 'mundo1-fase2', 2, 7, null]);
    expect(banco.cx.release).toHaveBeenCalledTimes(1);
  });

  it('mantém o melhor resultado de cada fase (mais estrelas, menos blocos)', async () => {
    const { handler, banco } = montar();
    await handler(evento('PUT', { corpo }));
    expect(banco.consultas[2].sql).toContain('GREATEST(fase_concluida.estrelas, EXCLUDED.estrelas)');
    expect(banco.consultas[2].sql).toContain('LEAST(fase_concluida.menor_blocos, EXCLUDED.menor_blocos)');
  });

  it('nunca concatena dado do jogador no SQL — tudo vai como parâmetro', async () => {
    const malicioso = JSON.stringify({
      ultimaFaseJogada: "x'; DROP TABLE jogador; --",
      fasesConcluidas: { "mundo1-fase1'; DROP TABLE jogador; --": { estrelas: 3 } }
    });
    const { handler, banco } = montar();
    await handler(evento('PUT', { corpo: malicioso }));
    expect(banco.consultas.some(c => c.sql.includes('DROP'))).toBe(false);
    expect(banco.consultas[1].params[3]).toBeNull();           // última fase fora do formato
    expect(banco.consultas.filter(c => /fase_concluida/.test(c.sql))).toHaveLength(0);
  });

  it('ignora o id de jogador enviado no corpo', async () => {
    const { handler, banco } = montar();
    await handler(evento('PUT', { corpo: JSON.stringify({ id: 'vitima', sub: 'vitima' }) }));
    expect(banco.consultas[1].params[0]).toBe(PERFIL.sub);
  });

  it('usa nome padrão e e-mail nulo quando o token não traz esses campos', async () => {
    const { handler, banco } = montar({ verificarToken: async () => ({ sub: 'so-id' }) });
    await handler(evento('PUT', { corpo: '{}' }));
    expect(banco.consultas[1].params).toEqual(['so-id', 'Jogador', null, null]);
  });

  it('aceita corpo vazio (só registra o jogador)', async () => {
    const { handler, banco } = montar();
    const r = await handler(evento('PUT'));
    expect(r.statusCode).toBe(200);
    expect(banco.consultas.map(c => c.sql.split(' ')[0])).toEqual(['BEGIN', 'INSERT', 'COMMIT']);
  });

  it('decodifica corpo em base64', async () => {
    const { handler, banco } = montar();
    const b64 = Buffer.from(corpo, 'utf-8').toString('base64');
    await handler(evento('PUT', { corpo: b64, base64: true }));
    expect(banco.consultas[1].params[3]).toBe('mundo1-fase2');
  });

  it.each([
    ['JSON quebrado', '{ isto nao e json'],
    ['lista no lugar de objeto', '[1,2,3]'],
    ['fasesConcluidas que não é objeto', '{"fasesConcluidas":"tudo"}'],
    ['fasesConcluidas como lista', '{"fasesConcluidas":[]}']
  ])('responde 400 para %s, sem gravar nada', async (_nome, ruim) => {
    const { handler, banco, log } = montar();
    const r = await handler(evento('PUT', { corpo: ruim }));
    expect(r.statusCode).toBe(400);
    expect(banco.consultas).toHaveLength(0);
    expect(log.error).not.toHaveBeenCalled();
    expect(banco.cx.release).toHaveBeenCalledTimes(1);
  });

  it('responde 400 quando vêm fases demais', async () => {
    const fases = Object.fromEntries(
      Array.from({ length: MAX_FASES + 1 }, (_, i) => [`mundo1-fase${i}`, { estrelas: 1 }]));
    const { handler } = montar();
    const r = await handler(evento('PUT', { corpo: JSON.stringify({ fasesConcluidas: fases }) }));
    expect(r.statusCode).toBe(400);
  });

  it('desfaz a transação e responde 500 se o banco falhar no meio', async () => {
    const banco = bancoFalso(sql => {
      if (/fase_concluida/.test(sql)) throw new Error('disco cheio');
      return { rowCount: 0, rows: [] };
    });
    const { handler, log } = montar({ banco });

    const r = await handler(evento('PUT', { corpo }));

    expect(r.statusCode).toBe(500);
    expect(json(r).erro).toBe('falha no banco');           // sem detalhes internos na resposta
    expect(banco.consultas.at(-1).sql).toBe('ROLLBACK');
    expect(log.error).toHaveBeenCalled();
    expect(banco.cx.release).toHaveBeenCalledTimes(1);
  });

  it('ainda responde 500 quando até o ROLLBACK falha', async () => {
    const banco = bancoFalso(() => { throw new Error('conexao caiu'); });
    const { handler } = montar({ banco });
    const r = await handler(evento('PUT', { corpo }));
    expect(r.statusCode).toBe(500);
    expect(banco.cx.release).toHaveBeenCalledTimes(1);
  });
});

describe('Lambda — DELETE /progresso', () => {
  it('apaga apenas o jogador do token', async () => {
    const { handler, banco } = montar();
    const r = await handler(evento('DELETE'));
    expect(r.statusCode).toBe(200);
    expect(banco.consultas).toEqual([
      { sql: 'DELETE FROM jogador WHERE id = $1', params: [PERFIL.sub] }
    ]);
  });
});

describe('Lambda — banco fora do ar', () => {
  it('responde 503 e registra o erro quando não consegue conectar', async () => {
    const log = { warn: vi.fn(), error: vi.fn() };
    const pool = { connect: vi.fn(async () => { throw new Error('ETIMEDOUT'); }) };
    const handler = criarHandler({ verificarToken: async () => PERFIL, pool, log });

    const r = await handler(evento('GET'));

    expect(r.statusCode).toBe(503);
    expect(log.error).toHaveBeenCalled();
  });

  it('usa o console como log padrão', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler = criarHandler({
      verificarToken: async () => { throw new Error('x'); },
      pool: bancoFalso().pool
    });
    await handler(evento('GET'));
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });
});

describe('Lambda — limpeza dos dados recebidos', () => {
  it.each([
    [3, 3], [0, 0], ['2', 2], [2.9, 2], [7, 3], [-1, 0], [undefined, 0], ['abc', 0], [null, 0]
  ])('estrelas %p viram %p (sempre de 0 a 3)', (entrada, esperado) => {
    expect(limparEstrelas(entrada)).toBe(esperado);
  });

  it.each([
    [4, 4], [1, 1], [0, BLOCOS_DESCONHECIDO], [-3, BLOCOS_DESCONHECIDO],
    [2.5, BLOCOS_DESCONHECIDO], ['4', BLOCOS_DESCONHECIDO], [undefined, BLOCOS_DESCONHECIDO],
    [Infinity, BLOCOS_DESCONHECIDO], [5000, BLOCOS_DESCONHECIDO]
  ])('blocos %p viram %p', (entrada, esperado) => {
    expect(limparBlocos(entrada)).toBe(esperado);
  });

  it('data válida é normalizada para ISO; o resto vira null', () => {
    expect(limparData('2026-10-01T12:00:00Z')).toBe('2026-10-01T12:00:00.000Z');
    expect(limparData('ontem')).toBeNull();
    expect(limparData(1234567890)).toBeNull();
    expect(limparData(undefined)).toBeNull();
  });

  it('descarta fases com id fora do formato ou com valor que não é objeto', () => {
    const { fases } = limparProgresso(JSON.stringify({
      fasesConcluidas: {
        'mundo1-fase1': { estrelas: 3, menorNumeroBlocos: 4 },
        'fase-secreta': { estrelas: 3 },
        '__proto__': { estrelas: 3 },
        'mundo2-fase1': null,
        'mundo2-fase2': 'tres estrelas',
        'mundo2-fase3': [3]
      }
    }));
    expect(fases).toEqual([
      { faseId: 'mundo1-fase1', estrelas: 3, menorBlocos: 4, concluidaEm: null }
    ]);
  });

  it('trata corpo ausente como progresso vazio', () => {
    expect(limparProgresso(undefined)).toEqual({ ultimaFase: null, fases: [] });
    expect(limparProgresso('')).toEqual({ ultimaFase: null, fases: [] });
  });

  it('aceita fasesConcluidas nulo como vazio', () => {
    expect(limparProgresso('{"fasesConcluidas":null}').fases).toEqual([]);
  });

  it('última fase que não é texto vira null', () => {
    expect(limparProgresso('{"ultimaFaseJogada":42}').ultimaFase).toBeNull();
  });
});
