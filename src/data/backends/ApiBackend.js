/**
 * ApiBackend.js
 * Cliente REST do progresso na nuvem. Uma instância representa um jogador
 * logado. É o "outro lado" da `ProgressoStorage`: quando presente, ela passa a
 * ler e gravar aqui além do `localStorage`.
 *
 * Contrato (infra e detalhes em docs/AWS.md):
 *
 *   GET    {baseUrl}/progresso  → 200 {progresso} | 404 (ainda não existe)
 *   PUT    {baseUrl}/progresso  ← {progresso}     → 200
 *   DELETE {baseUrl}/progresso                    → 200 | 204 | 404
 *
 * Toda requisição leva `Authorization: Bearer <ID token do Google>`. O servidor
 * valida o token e usa o `sub` como chave do jogador — o cliente nunca envia o
 * id do usuário no corpo.
 */
export class ApiBackend {
  /**
   * @param {object}   opcoes
   * @param {string}   opcoes.baseUrl     URL do API Gateway, sem barra no fim.
   * @param {Function} opcoes.obterToken  () => string | null  (ID token atual).
   * @param {Function} [opcoes.fetch]     Injeta o fetch (testes).
   */
  constructor({ baseUrl, obterToken, fetch: fetchImpl } = {}) {
    if (!baseUrl) throw new Error('ApiBackend precisa de baseUrl.');
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this._obterToken = obterToken ?? (() => null);
    this._fetch = fetchImpl ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    if (!this._fetch) throw new Error('fetch indisponível neste ambiente.');
  }

  async buscar() {
    const resp = await this._req('GET');
    if (resp.status === 404) return null;
    if (!resp.ok) throw new Error(`GET /progresso: HTTP ${resp.status}`);
    return resp.json();
  }

  async persistir(progresso) {
    const resp = await this._req('PUT', progresso);
    if (!resp.ok) throw new Error(`PUT /progresso: HTTP ${resp.status}`);
    return true;
  }

  async limpar() {
    const resp = await this._req('DELETE');
    if (!resp.ok && resp.status !== 404) throw new Error(`DELETE /progresso: HTTP ${resp.status}`);
    return true;
  }

  async _req(metodo, corpo) {
    const token = this._obterToken();
    if (!token) throw new Error('Sem ID token — o jogador precisa entrar com o Google.');

    const temCorpo = corpo !== undefined;
    return this._fetch(`${this.baseUrl}/progresso`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(temCorpo ? { 'Content-Type': 'application/json' } : {})
      },
      body: temCorpo ? JSON.stringify(corpo) : undefined
    });
  }
}
