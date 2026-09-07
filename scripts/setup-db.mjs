/**
 * setup-db.mjs
 * Cria o schema SQL do progresso no PostgreSQL (RDS) e o usuário de aplicação
 * com permissão mínima (sem DDL). Idempotente: rode quantas vezes quiser.
 *
 * Uso (PowerShell):
 *   $env:PGHOST="codequest-db.xxxx.sa-east-1.rds.amazonaws.com"
 *   $env:PGDATABASE="codequest"
 *   $env:PGUSER="postgres"
 *   $env:PGPASSWORD="<senha do master>"
 *   $env:APP_DB_PASSWORD="<senha nova para o usuario cq_app>"
 *   npm i -D pg
 *   node scripts/setup-db.mjs
 *
 * Nada aqui é commitado com segredo: tudo vem de variável de ambiente.
 */

import pg from 'pg';

const {
  PGHOST,
  PGPORT = '5432',
  PGDATABASE = 'codequest',
  PGUSER = 'postgres',
  PGPASSWORD,
  APP_DB_USER = 'cq_app',
  APP_DB_PASSWORD
} = process.env;

for (const [k, v] of Object.entries({ PGHOST, PGPASSWORD, APP_DB_PASSWORD })) {
  if (!v) {
    console.error(`Falta a variável de ambiente ${k}.`);
    process.exit(1);
  }
}

const DDL = `
CREATE TABLE IF NOT EXISTS jogador (
  id             TEXT PRIMARY KEY,               -- "sub" do Google
  nome           TEXT NOT NULL,
  email          TEXT,
  ultima_fase    TEXT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fase_concluida (
  jogador_id     TEXT NOT NULL REFERENCES jogador(id) ON DELETE CASCADE,
  fase_id        TEXT NOT NULL,                  -- ex.: "mundo1-fase1"
  estrelas       SMALLINT NOT NULL CHECK (estrelas BETWEEN 0 AND 3),
  menor_blocos   INTEGER  NOT NULL,
  concluida_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (jogador_id, fase_id)
);

CREATE INDEX IF NOT EXISTS idx_fase_concluida_jogador ON fase_concluida (jogador_id);
`;

/** Escapa aspas simples para interpolar a senha no CREATE/ALTER ROLE. */
const lit = s => `'${String(s).replace(/'/g, "''")}'`;
/** Identificador confiável (vem da config, não do usuário final). */
const ident = s => `"${String(s).replace(/"/g, '""')}"`;

const cliente = new pg.Client({
  host: PGHOST,
  port: Number(PGPORT),
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  ssl: { rejectUnauthorized: false }   // task administrativa pontual
});

try {
  await cliente.connect();
  console.log(`Conectado em ${PGHOST}/${PGDATABASE} como ${PGUSER}.`);

  console.log('→ criando tabelas...');
  await cliente.query(DDL);

  console.log(`→ garantindo o usuário de aplicação "${APP_DB_USER}"...`);
  const existe = await cliente.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [APP_DB_USER]);
  if (existe.rowCount === 0) {
    await cliente.query(`CREATE ROLE ${ident(APP_DB_USER)} LOGIN PASSWORD ${lit(APP_DB_PASSWORD)}`);
  } else {
    await cliente.query(`ALTER ROLE ${ident(APP_DB_USER)} WITH LOGIN PASSWORD ${lit(APP_DB_PASSWORD)}`);
  }

  console.log('→ concedendo permissões (sem DDL)...');
  await cliente.query(`GRANT CONNECT ON DATABASE ${ident(PGDATABASE)} TO ${ident(APP_DB_USER)}`);
  await cliente.query(`GRANT USAGE ON SCHEMA public TO ${ident(APP_DB_USER)}`);
  await cliente.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${ident(APP_DB_USER)}`);
  await cliente.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${ident(APP_DB_USER)}`);

  const tabelas = await cliente.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
  console.log('\n[ok] Schema pronto. Tabelas em public:');
  for (const r of tabelas.rows) console.log(`   - ${r.tablename}`);
  console.log(`\nA Lambda deve conectar como "${APP_DB_USER}" (nunca como "${PGUSER}").`);
} catch (e) {
  console.error('\n[erro] Falhou:', e.message);
  if (e.code === 'ETIMEDOUT' || e.code === 'ENOTFOUND') {
    console.error('  Verifique o security group (regra PostgreSQL 5432 do seu IP) e o host.');
  }
  process.exitCode = 1;
} finally {
  await cliente.end();
}
