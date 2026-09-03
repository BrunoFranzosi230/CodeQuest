/**
 * AuthManager.js
 * Identidade do jogador. Duas formas de entrar:
 *
 *   1. Google   — via Google Identity Services (GIS). O navegador recebe um
 *      "ID token" (JWT assinado pelo Google) com o perfil. Não há segredo no
 *      cliente; quem valida o token é o servidor (ver docs/AWS.md).
 *   2. Convidado — sem conta. O progresso fica só neste navegador.
 *
 * A sessão (perfil + provedor) é guardada em `localStorage` para o jogo abrir
 * já logado na próxima vez. O ID token NÃO é persistido: expira em ~1h e o
 * Google o reemite quando necessário.
 *
 * Este módulo é do domínio: não conhece Phaser nem o DOM do jogo. A única
 * dependência de navegador é opcional e injetável (o carregador do script GIS),
 * o que mantém a classe testável.
 */

const CHAVE_SESSAO = 'codequest_sessao';
const URL_GIS = 'https://accounts.google.com/gsi/client';

export class AuthManager {
  /**
   * @param {object}   [opcoes]
   * @param {string}   [opcoes.clientId]      Client ID OAuth do Google.
   * @param {Storage}  [opcoes.storage]       Onde guardar a sessão.
   * @param {Function} [opcoes.carregarScript] Injeta o carregamento do GIS (testes).
   */
  constructor({ clientId = '', storage, carregarScript } = {}) {
    this.clientId = clientId;
    this._storage = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    this._carregarScript = carregarScript ?? (() => this._injetarGis());
    this.idToken = null;
    this._exp = 0;                      // validade do idToken (epoch ms)
    this._gis = null;
    this.usuario = this._lerSessao();   // pode repor idToken/_exp se ainda válidos
  }

  /** Há credencial do Google configurada? Sem isso, só o modo convidado. */
  get googleDisponivel() {
    return Boolean(this.clientId);
  }

  logado() {
    return this.usuario !== null;
  }

  // ── Convidado ────────────────────────────────────────────────────────────

  entrarComoConvidado() {
    this.idToken = null;
    this.usuario = {
      id: 'convidado',
      nome: 'Convidado',
      email: null,
      foto: null,
      provedor: 'convidado'
    };
    this._gravarSessao();
    return this.usuario;
  }

  // ── Google ───────────────────────────────────────────────────────────────

  /**
   * Renderiza o botão oficial do Google dentro de `elemento`. O clique dispara
   * `aoEntrar(usuario)` ou `aoFalhar(erro)`.
   */
  async renderizarBotao(elemento, aoEntrar, aoFalhar) {
    if (!this.googleDisponivel) return;
    try {
      const google = await this._pronto();
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: resp => {
          try {
            aoEntrar(this._aplicarCredencial(resp?.credential));
          } catch (e) {
            aoFalhar?.(e);
          }
        }
      });
      google.accounts.id.renderButton(elemento, {
        type: 'standard', theme: 'filled_blue', size: 'large',
        shape: 'pill', text: 'signin_with', locale: 'pt-BR'
      });
    } catch (e) {
      aoFalhar?.(e);
    }
  }

  /** Aplica o JWT recebido do Google e devolve o usuário. */
  _aplicarCredencial(credencial) {
    if (!credencial) throw new Error('O Google não devolveu credencial.');
    const perfil = decodificarJwt(credencial);
    this.idToken = credencial;
    this._exp = (perfil.exp ?? 0) * 1000;   // "exp" do JWT vem em segundos
    this.usuario = {
      id: perfil.sub,
      nome: perfil.name || perfil.given_name || 'Jogador',
      email: perfil.email ?? null,
      foto: perfil.picture ?? null,
      provedor: 'google'
    };
    this._gravarSessao();
    return this.usuario;
  }

  sair() {
    try { globalThis.google?.accounts?.id?.disableAutoSelect?.(); } catch { /* ok */ }
    this.usuario = null;
    this.idToken = null;
    this._exp = 0;
    try { this._storage?.removeItem(CHAVE_SESSAO); } catch { /* ok */ }
  }

  /** Usado pelo ApiBackend para assinar as requisições à AWS. */
  obterToken() {
    return this.idToken;
  }

  /** O idToken em mãos ainda tem validade (com folga de 1 min)? */
  tokenValido() {
    return Boolean(this.idToken && this._exp > Date.now() + 60_000);
  }

  /**
   * Tenta obter um idToken novo sem incomodar o jogador (One Tap com seleção
   * automática). Usado no boot quando a sessão foi lembrada mas o token já
   * expirou. Resolve com o usuário renovado, ou `null` se não for possível.
   */
  async renovarTokenSilencioso() {
    if (!this.googleDisponivel || this.usuario?.provedor !== 'google') return null;
    try {
      const google = await this._pronto();
      return await new Promise(resolve => {
        let resolvido = false;
        let timer = null;
        const terminar = valor => {
          if (resolvido) return;
          resolvido = true;
          if (timer) clearTimeout(timer);
          resolve(valor);
        };

        google.accounts.id.initialize({
          client_id: this.clientId,
          auto_select: true,
          callback: resp => terminar(resp?.credential ? this._aplicarCredencial(resp.credential) : null)
        });
        google.accounts.id.prompt(notif => {
          if (notif?.isNotDisplayed?.() || notif?.isSkippedMoment?.() || notif?.isDismissedMoment?.()) {
            terminar(null);
          }
        });
        timer = setTimeout(() => terminar(null), 4000);   // não fica pendurado
      });
    } catch {
      return null;
    }
  }

  // ── Sessão persistida ────────────────────────────────────────────────────

  _lerSessao() {
    try {
      const bruto = this._storage?.getItem(CHAVE_SESSAO);
      const s = bruto ? JSON.parse(bruto) : null;
      if (!s || !s.id || !s.provedor) return null;

      // reaproveita o idToken salvo enquanto ainda tem folga de validade
      if (s.idToken && s.exp && s.exp > Date.now() + 60_000) {
        this.idToken = s.idToken;
        this._exp = s.exp;
      }
      return {
        id: s.id, nome: s.nome, email: s.email ?? null,
        foto: s.foto ?? null, provedor: s.provedor
      };
    } catch {
      return null;
    }
  }

  _gravarSessao() {
    if (!this.usuario) return;
    const dados = { ...this.usuario };
    // guarda o idToken só no login com Google, para o boot seguinte já
    // conseguir falar com a nuvem sem pedir um novo clique (vale ~1h).
    if (this.usuario.provedor === 'google' && this.idToken) {
      dados.idToken = this.idToken;
      dados.exp = this._exp;
    }
    try {
      this._storage?.setItem(CHAVE_SESSAO, JSON.stringify(dados));
    } catch { /* navegação anônima: segue sem lembrar */ }
  }

  // ── Carregamento do Google Identity Services ─────────────────────────────

  _pronto() {
    this._gis ??= Promise.resolve(this._carregarScript()).then(() => {
      const google = globalThis.google;
      if (!google?.accounts?.id) throw new Error('Google Identity Services indisponível.');
      return google;
    });
    return this._gis;
  }

  _injetarGis() {
    return new Promise((resolve, reject) => {
      if (globalThis.google?.accounts?.id) return resolve();
      const doc = globalThis.document;
      if (!doc) return reject(new Error('Sem DOM para carregar o Google.'));

      const existente = doc.querySelector(`script[src="${URL_GIS}"]`);
      const alvo = existente ?? doc.createElement('script');
      alvo.addEventListener('load', () => resolve(), { once: true });
      alvo.addEventListener('error', () => reject(new Error('Falha ao carregar o Google.')), { once: true });

      if (!existente) {
        alvo.src = URL_GIS;
        alvo.async = true;
        alvo.defer = true;
        doc.head.appendChild(alvo);
      }
    });
  }
}

/**
 * Decodifica o payload de um JWT. NÃO valida a assinatura — no cliente só
 * precisamos ler o perfil para montar a tela; a validação criptográfica é
 * responsabilidade do servidor (docs/AWS.md).
 */
export function decodificarJwt(jwt) {
  const payload = String(jwt).split('.')[1];
  if (!payload) throw new Error('Token em formato inesperado.');

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(base64);
  const bytes = Uint8Array.from(binario, c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
