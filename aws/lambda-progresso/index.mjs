/**
 * index.mjs — ponto de entrada da Lambda do progresso do CodeQuest.
 *
 * Aqui só ficam as ligações com o mundo real (Google e PostgreSQL). As regras
 * da API estão em `handler.mjs`, que é testado em tests/lambda.test.js.
 *
 * Variáveis de ambiente:
 *   GOOGLE_CLIENT_ID, PGHOST, PGPORT (opc.), PGDATABASE, PGUSER, PGPASSWORD
 */

import { readFileSync } from 'node:fs';
import { OAuth2Client } from 'google-auth-library';
import pg from 'pg';
import { criarHandler } from './handler.mjs';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const google = new OAuth2Client();

// Certificados da AWS para o RDS de São Paulo (arquivo público, baixado de
// https://truststore.pki.rds.amazonaws.com/sa-east-1/sa-east-1-bundle.pem).
// Com ele a Lambda confere que está falando com o banco verdadeiro.
// Se o arquivo faltar no zip, a função falha ao iniciar — melhor do que
// conectar sem validar.
const CAMINHO_CA = new URL('./sa-east-1-bundle.pem', import.meta.url);
const ssl = { ca: readFileSync(CAMINHO_CA, 'utf-8'), rejectUnauthorized: true };

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
  ssl
});

/** Confere assinatura, `aud` e `exp` do ID token e devolve { sub, name, email, ... }. */
async function verificarToken(idToken) {
  const ticket = await google.verifyIdToken({ idToken, audience: CLIENT_ID });
  return ticket.getPayload();
}

export const handler = criarHandler({ verificarToken, pool });
