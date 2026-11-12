/**
 * handler.mjs — regras da API de progresso do CodeQuest.
 *
 * Este arquivo não importa nada: o validador de token e o pool do banco chegam
 * por parâmetro (`criarHandler`). Quem liga as peças de verdade é o `index.mjs`.
 * Assim os testes (tests/lambda.test.js) exercitam todas as regras sem AWS,
 * sem Google e sem banco.
 *
 * Fluxo de cada requisição:
 *   1. valida o `Authorization: Bearer <ID token do Google>`;
 *   2. usa o `sub` do token como id do jogador — NUNCA confia em id vindo no corpo;
 *   3. lê/grava nas tabelas `jogador` e `fase_concluida` do PostgreSQL.
 *
 * Rotas (API Gateway HTTP API, payload v2):
 *   GET    /progresso  -> 200 { versao, fasesConcluidas, ultimaFaseJogada } | 404
 *   PUT    /progresso  <- o objeto de progresso completo -> 200 | 400
 *   DELETE /progresso  -> 200
 */

/** Único formato de id de fase aceito (ex.: "mundo1-fase3"). */
export const FORMATO_FASE = /^mundo\d{1,2}-fase\d{1,2}$/;

/** Teto de fases por requisição — o jogo tem 14; sobra folga para expansão. */
export const MAX_FASES = 200;

/** Valor gravado quando o cliente não informa o número de blocos. */
export const BLOCOS_DESCONHECIDO = 999;

const resposta = (status, corpo) => ({
  statusCode: status,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(corpo)
});

/** Erro de entrada do cliente: vira 400, não 500. */
class EntradaInvalida extends Error {}

const ehObjeto = v => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Estrelas sempre inteiras entre 0 e 3 (a tabela tem CHECK com esse intervalo). */
export function limparEstrelas(valor) {
  const n = Math.trunc(Number(valor));
  if (!Number.isFinite(n)) return 0;
  return Math.min(3, Math.max(0, n));
}

/** Número de blocos: inteiro positivo; qualquer outra coisa vira "desconhecido". */
export function limparBlocos(valor) {
  return Number.isInteger(valor) && valor > 0 && valor < BLOCOS_DESCONHECIDO
    ? valor
    : BLOCOS_DESCONHECIDO;
}

/** Data ISO válida ou null (o banco usa now() quando vem null). */
export function limparData(valor) {
  if (typeof valor !== 'string') return null;
  const ms = Date.parse(valor);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/**
 * Transforma o corpo do PUT em dados confiáveis para gravar.
 * Entradas com id de fase fora do formato são descartadas; estrutura errada
 * (não-JSON, não-objeto, fases demais) é recusada com EntradaInvalida.
 */
export function limparProgresso(corpoTexto) {
  let p;
  try {
    p = JSON.parse(corpoTexto || '{}');
  } catch {
    throw new EntradaInvalida('corpo nao e JSON');
  }
  if (!ehObjeto(p)) throw new EntradaInvalida('corpo deve ser um objeto');

  const brutas = p.fasesConcluidas ?? {};
  if (!ehObjeto(brutas)) throw new EntradaInvalida('fasesConcluidas deve ser um objeto');

  const entradas = Object.entries(brutas);
  if (entradas.length > MAX_FASES) throw new EntradaInvalida('fases demais');

  const fases = entradas
    .filter(([faseId, d]) => FORMATO_FASE.test(faseId) && ehObjeto(d))
    .map(([faseId, d]) => ({
      faseId,
      estrelas: limparEstrelas(d.estrelas),
      menorBlocos: limparBlocos(d.menorNumeroBlocos),
      concluidaEm: limparData(d.concluidaEm)
    }));

  const ultima = p.ultimaFaseJogada;
  return {
    ultimaFase: typeof ultima === 'string' && FORMATO_FASE.test(ultima) ? ultima : null,
    fases
  };
}

/** Lê o corpo da requisição, decodificando base64 quando o API Gateway manda assim. */
function lerCorpo(evento) {
  return evento.isBase64Encoded && evento.body
    ? Buffer.from(evento.body, 'base64').toString('utf-8')
    : evento.body;
}

async function buscar(cx, jogadorId) {
  const jog = await cx.query('SELECT ultima_fase FROM jogador WHERE id = $1', [jogadorId]);
  if (jog.rowCount === 0) return resposta(404, { erro: 'sem progresso' });

  const fases = await cx.query(
    `SELECT fase_id, estrelas, menor_blocos, concluida_em
       FROM fase_concluida WHERE jogador_id = $1`, [jogadorId]);

  return resposta(200, {
    versao: 1,
    ultimaFaseJogada: jog.rows[0].ultima_fase,
    fasesConcluidas: Object.fromEntries(fases.rows.map(r => [r.fase_id, {
      estrelas: r.estrelas,
      menorNumeroBlocos: r.menor_blocos,
      concluidaEm: r.concluida_em
    }]))
  });
}

async function gravar(cx, perfil, corpoTexto) {
  const { ultimaFase, fases } = limparProgresso(corpoTexto);

  await cx.query('BEGIN');
  await cx.query(
    `INSERT INTO jogador (id, nome, email, ultima_fase, atualizado_em)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (id) DO UPDATE
       SET nome = EXCLUDED.nome, email = EXCLUDED.email,
           ultima_fase = EXCLUDED.ultima_fase, atualizado_em = now()`,
    [perfil.sub, perfil.name ?? 'Jogador', perfil.email ?? null, ultimaFase]);

  // O melhor resultado de cada fase vence: mais estrelas e menos blocos.
  for (const f of fases) {
    await cx.query(
      `INSERT INTO fase_concluida (jogador_id, fase_id, estrelas, menor_blocos, concluida_em)
       VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, now()))
       ON CONFLICT (jogador_id, fase_id) DO UPDATE SET
         estrelas     = GREATEST(fase_concluida.estrelas, EXCLUDED.estrelas),
         menor_blocos = LEAST(fase_concluida.menor_blocos, EXCLUDED.menor_blocos),
         concluida_em = EXCLUDED.concluida_em`,
      [perfil.sub, f.faseId, f.estrelas, f.menorBlocos, f.concluidaEm]);
  }
  await cx.query('COMMIT');
  return resposta(200, { ok: true });
}

async function apagar(cx, jogadorId) {
  await cx.query('DELETE FROM jogador WHERE id = $1', [jogadorId]); // cascata apaga as fases
  return resposta(200, { ok: true });
}

/**
 * Monta o handler da Lambda.
 * @param {object} deps
 * @param {(idToken: string) => Promise<{sub: string, name?: string, email?: string}>} deps.verificarToken
 *        rejeita (lança) se o token for inválido, vencido ou de outro app
 * @param {{connect: () => Promise<{query: Function, release: Function}>}} deps.pool
 * @param {{warn: Function, error: Function}} [deps.log] vai para o CloudWatch
 */
export function criarHandler({ verificarToken, pool, log = console }) {
  return async function handler(evento) {
    const metodo = evento?.requestContext?.http?.method || evento?.httpMethod || 'GET';
    if (metodo === 'OPTIONS') return resposta(204, {});

    // 1) autenticação
    const cabecalho = evento?.headers?.authorization || evento?.headers?.Authorization || '';
    const idToken = cabecalho.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) return resposta(401, { erro: 'sem token' });

    let perfil;
    try {
      perfil = await verificarToken(idToken);
    } catch (e) {
      log.warn('token rejeitado:', e.message);
      return resposta(401, { erro: 'token invalido' });
    }
    if (!perfil?.sub) return resposta(401, { erro: 'token invalido' });

    if (!['GET', 'PUT', 'DELETE'].includes(metodo)) {
      return resposta(405, { erro: 'metodo nao suportado' });
    }

    // 2) banco
    let cx;
    try {
      cx = await pool.connect();
    } catch (e) {
      log.error('banco inacessivel:', e);
      return resposta(503, { erro: 'banco indisponivel' });
    }

    try {
      if (metodo === 'GET') return await buscar(cx, perfil.sub);
      if (metodo === 'PUT') return await gravar(cx, perfil, lerCorpo(evento));
      return await apagar(cx, perfil.sub);
    } catch (e) {
      if (e instanceof EntradaInvalida) return resposta(400, { erro: e.message });
      try { await cx.query('ROLLBACK'); } catch { /* nada a desfazer */ }
      log.error('erro no banco:', e);
      return resposta(500, { erro: 'falha no banco' });
    } finally {
      cx.release();
    }
  };
}
