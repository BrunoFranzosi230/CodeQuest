/**
 * ssl-rds.mjs — configuração de TLS para falar com o PostgreSQL no Amazon RDS.
 * Usa os certificados públicos da AWS (região de São Paulo) para conferir que
 * o servidor do outro lado é mesmo o banco, e não alguém no meio do caminho.
 */

import { readFileSync } from 'node:fs';

const CAMINHO_CA = new URL('../aws/lambda-progresso/sa-east-1-bundle.pem', import.meta.url);

export const sslRds = { ca: readFileSync(CAMINHO_CA, 'utf-8'), rejectUnauthorized: true };
