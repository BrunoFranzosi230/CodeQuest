import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProgressoStorage } from '../src/data/ProgressoStorage.js';

/** Backend remoto de mentira, controlável pelo teste. */
function fakeRemoto(inicial = null) {
  return {
    _dados: inicial,
    buscar: vi.fn(function () { return Promise.resolve(this._dados); }),
    persistir: vi.fn(function (p) { this._dados = p; return Promise.resolve(true); }),
    limpar: vi.fn(function () { this._dados = null; return Promise.resolve(true); })
  };
}

const umProgresso = fases => ({ versao: 1, fasesConcluidas: fases, ultimaFaseJogada: null });

/** Deixa todas as promessas pendentes (write-through) resolverem. */
const escoar = () => new Promise(r => setTimeout(r, 0));

describe('ProgressoStorage + backend remoto', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('sem contexto remoto, comporta-se como antes (só localStorage)', async () => {
    const s = new ProgressoStorage();
    s.registrarConclusao('mundo1-fase1', 3, 4);
    expect(await s.sincronizar()).toMatchObject({ fasesConcluidas: { 'mundo1-fase1': { estrelas: 3 } } });
  });

  it('definirContexto isola o progresso por chave', () => {
    const s = new ProgressoStorage();
    s.definirContexto({ chave: 'codequest_progresso__g-1' });
    s.registrarConclusao('mundo1-fase1', 2, 5);

    expect(localStorage.getItem('codequest_progresso__g-1')).toBeTruthy();
    expect(localStorage.getItem('codequest_progresso')).toBeNull();
  });

  describe('sincronizar', () => {
    it('a nuvem manda quando tem dados', async () => {
      const remoto = fakeRemoto(umProgresso({ 'mundo1-fase1': { estrelas: 3, menorNumeroBlocos: 4 } }));
      const s = new ProgressoStorage();
      s.definirContexto({ chave: 'codequest_progresso__g-1', remoto });

      const conciliado = await s.sincronizar();

      expect(conciliado.fasesConcluidas['mundo1-fase1'].estrelas).toBe(3);
      // e ficou espelhado localmente
      expect(new ProgressoStorage()).toBeDefined();
      s.definirContexto({ chave: 'codequest_progresso__g-1' });
      expect(s.estrelasDaFase('mundo1-fase1')).toBe(3);
    });

    it('nuvem vazia + progresso local (jogou de convidado): sobe o local', async () => {
      const remoto = fakeRemoto(null);
      const s = new ProgressoStorage();
      s.definirContexto({ chave: 'codequest_progresso', remoto });
      s.registrarConclusao('mundo1-fase1', 1, 9);
      remoto.persistir.mockClear();

      await s.sincronizar();
      await escoar();

      expect(remoto.persistir).toHaveBeenCalled();
      expect(remoto._dados.fasesConcluidas['mundo1-fase1'].estrelas).toBe(1);
    });

    it('falha de rede na sincronização não quebra: segue no local', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const remoto = fakeRemoto();
      remoto.buscar.mockRejectedValue(new Error('timeout'));
      const s = new ProgressoStorage();
      s.definirContexto({ chave: 'codequest_progresso', remoto });
      s.registrarConclusao('mundo1-fase1', 2, 5);

      const r = await s.sincronizar();
      expect(r.fasesConcluidas['mundo1-fase1'].estrelas).toBe(2);
    });
  });

  describe('write-through', () => {
    it('registrarConclusao grava local e envia para a nuvem', async () => {
      const remoto = fakeRemoto();
      const s = new ProgressoStorage();
      s.definirContexto({ chave: 'codequest_progresso', remoto });

      s.registrarConclusao('mundo1-fase1', 3, 4);
      await escoar();

      expect(s.estrelasDaFase('mundo1-fase1')).toBe(3);          // local
      expect(remoto.persistir).toHaveBeenCalledWith(
        expect.objectContaining({ fasesConcluidas: expect.any(Object) })
      );
    });

    it('falha ao enviar marca pendência mas não lança', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const remoto = fakeRemoto();
      remoto.persistir.mockRejectedValue(new Error('503'));
      const s = new ProgressoStorage();
      s.definirContexto({ chave: 'codequest_progresso', remoto });

      expect(() => s.registrarConclusao('mundo1-fase1', 1, 9)).not.toThrow();
      await escoar();
      expect(s.pendenteNaNuvem).toBe(true);
    });

    it('apagarTudo limpa local e nuvem', async () => {
      const remoto = fakeRemoto(umProgresso({ 'mundo1-fase1': { estrelas: 3 } }));
      const s = new ProgressoStorage();
      s.definirContexto({ chave: 'codequest_progresso', remoto });
      s.registrarConclusao('mundo1-fase1', 3, 4);

      s.apagarTudo();
      await escoar();

      expect(s.totalEstrelas()).toBe(0);
      expect(remoto.limpar).toHaveBeenCalled();
    });
  });
});

describe('criarBackendRemoto', () => {
  const usuarioGoogle = { id: 'g-1', provedor: 'google' };
  const auth = { obterToken: () => 'tok' };

  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

  async function carregar() {
    vi.resetModules();
    return (await import('../src/data/criarBackendRemoto.js')).criarBackendRemoto;
  }

  it('sem VITE_API_URL, devolve null', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const criar = await carregar();
    expect(criar(usuarioGoogle, auth)).toBeNull();
  });

  it('convidado nunca vai para a nuvem, mesmo com API configurada', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.exemplo.com');
    const criar = await carregar();
    expect(criar({ id: 'convidado', provedor: 'convidado' }, auth)).toBeNull();
    expect(criar(null, auth)).toBeNull();
  });

  it('Google + API configurada: devolve um ApiBackend pronto', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.exemplo.com');
    const criar = await carregar();
    const backend = criar(usuarioGoogle, auth);
    expect(backend).toBeTruthy();
    expect(backend.baseUrl).toBe('https://api.exemplo.com');
  });
});
