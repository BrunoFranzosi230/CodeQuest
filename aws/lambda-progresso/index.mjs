/**
 * index.mjs — Lambda do progresso do CodeQuest.
 *
 * Fluxo de cada requisição:
 *   1. valida o `Authorization: Bearer <ID token do Google>` (assinatura + aud + exp);
 *   2. usa o `sub` do token como id do jogador — NUNCA confia em id vindo no corpo;
 *   3. lê/grava nas tabelas `jogador` e `fase_concluida` do PostgreSQL.
 *
 * Rotas (API Gateway HTTP API, payload v2):
 *   GET    /progresso  -> 200 { versao, fasesConcluidas, ultimaFaseJogada } | 404
 *   PUT    /progresso  <- o objeto de progresso completo -> 200
 *   DELETE /progresso  -> 200
 *
 * Variáveis de ambiente:
 *   GOOGLE_CLIENT_ID, PGHOST, PGPORT (opc.), PGDATABASE, PGUSER, PGPASSWORD
 */

import { OAuth2Client } from 'google-auth-library';
import pg from 'pg';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const google = new OAuth2Client();

// Pool no escopo do módulo: reaproveitado entre invocações no mesmo container.
const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 1,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
  ssl: { rejectUnauthorized: false }   // conexão cifrada; sem validar o CA (ver docs)
});

const resposta = (status, corpo) => ({
  statusCode: status,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(corpo)
});

export const handler = async (evento) => {
  const metodo = evento?.requestContext?.http?.method || evento?.httpMethod || 'GET';
  if (metodo === 'OPTIONS') return resposta(204, {});

  // 1) autenticação
  let perfil;
  try {
    const h = evento.headers?.authorization || evento.headers?.Authorization || '';
    const idToken = h.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) return resposta(401, { erro: 'sem token' });
    const ticket = await google.verifyIdToken({ idToken, audience: CLIENT_ID });
    perfil = ticket.getPayload();               // { sub, name, email, ... }
  } catch (e) {
    console.warn('token rejeitado:', e.message);
    return resposta(401, { erro: 'token invalido' });
  }
  const jogadorId = perfil.sub;

  const corpoTexto = evento.isBase64Encoded && evento.body
    ? Buffer.from(evento.body, 'base64').toString('utf-8')
    : evento.body;

  const cx = await pool.connect();
  try {
    if (metodo === 'GET') {
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

    if (metodo === 'PUT') {
      const p = JSON.parse(corpoTexto || '{}');
      const fases = p.fasesConcluidas || {};

      await cx.query('BEGIN');
      await cx.query(
        `INSERT INTO jogador (id, nome, email, ultima_fase, atualizado_em)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (id) DO UPDATE
           SET nome = EXCLUDED.nome, email = EXCLUDED.email,
               ultima_fase = EXCLUDED.ultima_fase, atualizado_em = now()`,
        [jogadorId, perfil.name ?? 'Jogador', perfil.email ?? null, p.ultimaFaseJogada ?? null]);

      for (const [faseId, d] of Object.entries(fases)) {
        await cx.query(
          `INSERT INTO fase_concluida (jogador_id, fase_id, estrelas, menor_blocos, concluida_em)
           VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, now()))
           ON CONFLICT (jogador_id, fase_id) DO UPDATE SET
             estrelas     = GREATEST(fase_concluida.estrelas, EXCLUDED.estrelas),
             menor_blocos = LEAST(fase_concluida.menor_blocos, EXCLUDED.menor_blocos),
             concluida_em = EXCLUDED.concluida_em`,
          [jogadorId, faseId,
           Number(d.estrelas ?? 0),
           Number.isFinite(d.menorNumeroBlocos) ? d.menorNumeroBlocos : 999,
           d.concluidaEm ?? null]);
      }
      await cx.query('COMMIT');
      return resposta(200, { ok: true });
    }

    if (metodo === 'DELETE') {
      await cx.query('DELETE FROM jogador WHERE id = $1', [jogadorId]); // cascata apaga as fases
      return resposta(200, { ok: true });
    }

    return resposta(405, { erro: 'metodo nao suportado' });
  } catch (e) {
    try { await cx.query('ROLLBACK'); } catch { /* nada a desfazer */ }
    console.error('erro no banco:', e);
    return resposta(500, { erro: 'falha no banco' });
  } finally {
    cx.release();
  }
};
