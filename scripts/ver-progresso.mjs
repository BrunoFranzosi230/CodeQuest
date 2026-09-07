/**
 * ver-progresso.mjs
 * Mostra o conteúdo das tabelas de progresso — útil para conferir se a Lambda
 * está gravando. Usa as mesmas variáveis de ambiente do setup-db.mjs.
 *
 *   node scripts/ver-progresso.mjs
 */

import pg from 'pg';

const { PGHOST, PGPORT = '5432', PGDATABASE = 'codequest', PGUSER = 'postgres', PGPASSWORD } = process.env;

if (!PGHOST || !PGPASSWORD) {
  console.error('Defina PGHOST, PGUSER, PGPASSWORD, PGDATABASE (mesmas do setup-db.mjs).');
  process.exit(1);
}

const cliente = new pg.Client({
  host: PGHOST, port: Number(PGPORT), database: PGDATABASE,
  user: PGUSER, password: PGPASSWORD, ssl: { rejectUnauthorized: false }
});

try {
  await cliente.connect();

  const jogadores = await cliente.query(
    'SELECT id, nome, email, ultima_fase, atualizado_em FROM jogador ORDER BY atualizado_em DESC');
  console.log(`\njogador (${jogadores.rowCount}):`);
  console.table(jogadores.rows);

  const fases = await cliente.query(
    `SELECT jogador_id, fase_id, estrelas, menor_blocos, concluida_em
       FROM fase_concluida ORDER BY jogador_id, fase_id`);
  console.log(`\nfase_concluida (${fases.rowCount}):`);
  console.table(fases.rows);
} catch (e) {
  console.error('[erro]', e.message);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
