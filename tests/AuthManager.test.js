import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthManager, decodificarJwt } from '../src/core/AuthManager.js';

const CHAVE_SESSAO = 'codequest_sessao';

/** Monta um JWT falso (só o payload importa; a assinatura não é verificada). */
function jwtFalso(payload) {
  const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'RS256' })}.${b64(payload)}.assinatura`;
}

describe('decodificarJwt', () => {
  it('lê o payload de um JWT', () => {
    const token = jwtFalso({ sub: '123', name: 'Ana', email: 'ana@x.com' });
    expect(decodificarJwt(token)).toMatchObject({ sub: '123', name: 'Ana' });
  });

  it('lê acentos corretamente (UTF-8)', () => {
    const token = jwtFalso({ sub: '1', name: 'João Concéição' });
    expect(decodificarJwt(token).name).toBe('João Concéição');
  });

  it('rejeita token sem payload', () => {
    expect(() => decodificarJwt('semtoken')).toThrow();
  });
});

describe('AuthManager', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => { delete globalThis.google; vi.restoreAllMocks(); });

  describe('modo convidado', () => {
    it('cria um usuário convidado e persiste a sessão', () => {
      const auth = new AuthManager({ storage: localStorage });
      const u = auth.entrarComoConvidado();

      expect(u).toMatchObject({ id: 'convidado', provedor: 'convidado' });
      expect(auth.logado()).toBe(true);
      expect(JSON.parse(localStorage.getItem(CHAVE_SESSAO)).provedor).toBe('convidado');
    });

    it('funciona mesmo sem client id do Google', () => {
      const auth = new AuthManager({ storage: localStorage });
      expect(auth.googleDisponivel).toBe(false);
      expect(() => auth.entrarComoConvidado()).not.toThrow();
    });
  });

  describe('sessão persistida', () => {
    it('restaura o usuário salvo ao instanciar', () => {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify({
        id: 'g-1', nome: 'Ana', provedor: 'google'
      }));
      const auth = new AuthManager({ storage: localStorage });
      expect(auth.usuario).toMatchObject({ id: 'g-1', provedor: 'google' });
    });

    it('ignora sessão malformada', () => {
      localStorage.setItem(CHAVE_SESSAO, '{quebrado');
      expect(new AuthManager({ storage: localStorage }).usuario).toBeNull();
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ nome: 'sem id' }));
      expect(new AuthManager({ storage: localStorage }).usuario).toBeNull();
    });

    it('sair() limpa memória e storage', () => {
      const auth = new AuthManager({ storage: localStorage });
      auth.entrarComoConvidado();
      auth.sair();
      expect(auth.logado()).toBe(false);
      expect(auth.obterToken()).toBeNull();
      expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
    });
  });

  describe('login com Google', () => {
    it('googleDisponivel reflete a presença do client id', () => {
      expect(new AuthManager({ clientId: 'abc.apps.googleusercontent.com', storage: localStorage })
        .googleDisponivel).toBe(true);
    });

    it('entrarComGoogle aplica a credencial e vira usuário google', async () => {
      let callbackGoogle;
      globalThis.google = {
        accounts: { id: {
          initialize: cfg => { callbackGoogle = cfg.callback; },
          prompt: () => callbackGoogle({
            credential: jwtFalso({ sub: '99', name: 'Bit', email: 'b@x.com', picture: 'p.png' })
          })
        } }
      };
      const auth = new AuthManager({
        clientId: 'abc', storage: localStorage,
        carregarScript: () => Promise.resolve()
      });

      const usuario = await auth.entrarComGoogle();

      expect(usuario).toMatchObject({ id: '99', nome: 'Bit', email: 'b@x.com', provedor: 'google' });
      expect(auth.obterToken()).toBeTypeOf('string');
      expect(auth.usuario.id).toBe('99');
    });

    it('entrarComGoogle rejeita sem client id', async () => {
      const auth = new AuthManager({ storage: localStorage, carregarScript: () => Promise.resolve() });
      await expect(auth.entrarComGoogle()).rejects.toThrow();
    });

    it('entrarComGoogle rejeita quando o prompt não é exibido', async () => {
      globalThis.google = {
        accounts: { id: {
          initialize: vi.fn(),
          prompt: cb => cb({ isNotDisplayed: () => true, isSkippedMoment: () => false })
        } }
      };
      const auth = new AuthManager({
        clientId: 'abc', storage: localStorage, carregarScript: () => Promise.resolve()
      });
      await expect(auth.entrarComGoogle()).rejects.toThrow();
    });

    it('entrarComGoogle rejeita se o jogador cancelar (sem credencial)', async () => {
      let callbackGoogle;
      globalThis.google = {
        accounts: { id: {
          initialize: cfg => { callbackGoogle = cfg.callback; },
          prompt: () => callbackGoogle({ credential: null })
        } }
      };
      const auth = new AuthManager({
        clientId: 'abc', storage: localStorage, carregarScript: () => Promise.resolve()
      });
      await expect(auth.entrarComGoogle()).rejects.toThrow(/cancelado/);
    });

    it('propaga falha no carregamento do script', async () => {
      const auth = new AuthManager({
        clientId: 'abc', storage: localStorage,
        carregarScript: () => Promise.reject(new Error('offline'))
      });
      await expect(auth.entrarComGoogle()).rejects.toThrow('offline');
    });
  });

  describe('idToken entre recarregamentos', () => {
    const daquiUmaHora = () => Math.floor(Date.now() / 1000) + 3600;

    function logarComGoogle(payload) {
      let cb;
      globalThis.google = {
        accounts: { id: {
          initialize: c => { cb = c.callback; },
          prompt: () => cb({ credential: jwtFalso(payload) })
        } }
      };
      const auth = new AuthManager({
        clientId: 'abc', storage: localStorage, carregarScript: () => Promise.resolve()
      });
      return auth.entrarComGoogle().then(() => auth);
    }

    it('tokenValido reflete a validade do exp', async () => {
      const semLogin = new AuthManager({ storage: localStorage });
      expect(semLogin.tokenValido()).toBe(false);

      const auth = await logarComGoogle({ sub: '1', name: 'A', exp: daquiUmaHora() });
      expect(auth.tokenValido()).toBe(true);
    });

    it('uma nova instância reaproveita o token salvo se ainda vale', async () => {
      await logarComGoogle({ sub: '7', name: 'Bit', exp: daquiUmaHora() });

      const outra = new AuthManager({ storage: localStorage });
      expect(outra.usuario).toMatchObject({ id: '7', provedor: 'google' });
      expect(outra.tokenValido()).toBe(true);
      expect(outra.obterToken()).toBeTypeOf('string');
    });

    it('token expirado não é reaproveitado, mas o perfil continua', () => {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify({
        id: '7', nome: 'Bit', provedor: 'google',
        idToken: 'x.y.z', exp: Date.now() - 1000
      }));
      const auth = new AuthManager({ storage: localStorage });
      expect(auth.usuario).toMatchObject({ id: '7', provedor: 'google' });
      expect(auth.tokenValido()).toBe(false);
      expect(auth.obterToken()).toBeNull();
    });

    it('renovarTokenSilencioso pega um token novo pelo One Tap', async () => {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ id: '7', nome: 'Bit', provedor: 'google' }));
      let cb;
      globalThis.google = {
        accounts: { id: {
          initialize: c => { cb = c.callback; },
          prompt: () => cb({ credential: jwtFalso({ sub: '7', name: 'Bit', exp: daquiUmaHora() }) })
        } }
      };
      const auth = new AuthManager({
        clientId: 'abc', storage: localStorage, carregarScript: () => Promise.resolve()
      });
      expect(auth.tokenValido()).toBe(false);

      const renovado = await auth.renovarTokenSilencioso();
      expect(renovado).toMatchObject({ id: '7', provedor: 'google' });
      expect(auth.tokenValido()).toBe(true);
    });

    it('renovarTokenSilencioso devolve null sem client id', async () => {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ id: '7', nome: 'Bit', provedor: 'google' }));
      const auth = new AuthManager({ storage: localStorage, carregarScript: () => Promise.resolve() });
      expect(await auth.renovarTokenSilencioso()).toBeNull();
    });
  });
});
