/**
 * setup-grafana-db.mjs
 * Cria (ou atualiza) o usuário do Grafana no PostgreSQL: só leitura, sem
 * acesso a dado pessoal. Idempotente.
 *
 *   - transações sempre read-only e com tempo limite (não trava o banco);
 *   - lê as estatísticas do servidor (pg_monitor: conexões, uptime, tamanho);
 *   - em `jogador` vê só colunas sem dado pessoal (id, atualizado_em,
 *     criado_em) — nome e e-mail ficam de fora (público de 6 a 11 anos);
 *   - lê `fase_concluida` inteira (não tem dado pessoal).
 *
 * Uso (PowerShell), com as mesmas variáveis do setup-db.mjs:
 *   $env:PGHOST="..."; $env:PGUSER="postgres"; $env:PGPASSWORD="<master>"
 *   $env:GRAFANA_DB_PASSWORD="<senha nova do usuário do Grafana>"
 *   node scripts/setup-grafana-db.mjs
 */

import pg from 'pg';

const {
  PGHOST, PGPORT = '5432', PGDATABASE = 'codequest', PGUSER = 'postgres', PGPASSWORD,
  GRAFANA_DB_USER = 'grafana_leitor', GRAFANA_DB_PASSWORD
} = process.env;

for (const [k, v] of Object.entries({ PGHOST, PGPASSWORD, GRAFANA_DB_PASSWORD })) {
  if (!v) { console.error(`Falta a variável de ambiente ${k}.`); process.exit(1); }
}

const lit = s => `'${String(s).replace(/'/g, "''")}'`;
const ident = s => `"${String(s).replace(/"/g, '""')}"`;
const U = ident(GRAFANA_DB_USER);

const cliente = new pg.Client({
  host: PGHOST, port: Number(PGPORT), database: PGDATABASE,
  user: PGUSER, password: PGPASSWORD, ssl: { rejectUnauthorized: false }
});

try {
  await cliente.connect();
  const existe = await cliente.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [GRAFANA_DB_USER]);
  await cliente.query(existe.rowCount
    ? `ALTER ROLE ${U} WITH LOGIN PASSWORD ${lit(GRAFANA_DB_PASSWORD)}`
    : `CREATE ROLE ${U} LOGIN PASSWORD ${lit(GRAFANA_DB_PASSWORD)}`);

  await cliente.query(`ALTER ROLE ${U} SET default_transaction_read_only = on`);
  await cliente.query(`ALTER ROLE ${U} SET statement_timeout = '5s'`);
  await cliente.query(`ALTER ROLE ${U} CONNECTION LIMIT 5`);

  await cliente.query(`GRANT CONNECT ON DATABASE ${ident(PGDATABASE)} TO ${U}`);
  await cliente.query(`GRANT USAGE ON SCHEMA public TO ${U}`);
  await cliente.query(`GRANT pg_monitor TO ${U}`);

  // tudo revogado antes, para regravar as permissões do zero a cada execução
  await cliente.query(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ${U}`);
  await cliente.query(`GRANT SELECT (id, criado_em, atualizado_em) ON jogador TO ${U}`);
  await cliente.query(`GRANT SELECT ON fase_concluida TO ${U}`);

  console.log(`[ok] Usuário "${GRAFANA_DB_USER}" pronto: só leitura, sem nome/e-mail dos jogadores.`);
} catch (e) {
  console.error('[erro] Falhou:', e.message);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
