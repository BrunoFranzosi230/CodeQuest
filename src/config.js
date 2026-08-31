/**
 * config.js
 * Ponto único de leitura das variáveis de ambiente (Vite as injeta em
 * `import.meta.env`). Nenhum outro módulo lê `import.meta.env` diretamente —
 * assim o que é configurável fica visível num lugar só.
 *
 * Defina os valores em `.env.local` (fora do git). Veja `.env.example`.
 */

const env = import.meta.env ?? {};

export const CONFIG = {
  /**
   * Client ID OAuth do Google (Google Cloud Console → Credenciais →
   * "ID do cliente OAuth" do tipo "Aplicativo Web"). É público por design:
   * não é segredo, vai no HTML de qualquer app que usa login do Google.
   * Vazio → o botão "Entrar com Google" fica desabilitado e só o modo
   * convidado funciona (útil em desenvolvimento e nos testes).
   */
  googleClientId: env.VITE_GOOGLE_CLIENT_ID ?? '',

  /**
   * URL base da API de progresso na AWS (ex.:
   * https://abc123.execute-api.us-east-1.amazonaws.com). Vazio → o progresso
   * é salvo só no navegador (localStorage). Preencher aqui é o único passo
   * para "ligar" a nuvem. Contrato da API em `docs/AWS.md`.
   */
  apiUrl: (env.VITE_API_URL ?? '').replace(/\/$/, '')
};
