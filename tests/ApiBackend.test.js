import { describe, it, expect, vi } from 'vitest';
import { ApiBackend } from '../src/data/backends/ApiBackend.js';

function resposta({ ok = true, status = 200, body = {} }) {
  return { ok, status, json: () => Promise.resolve(body) };
}

function montar(fetchImpl, token = 'tok-123') {
  return new ApiBackend({
    baseUrl: 'https://api.exemplo.com/',
    obterToken: () => token,
    fetch: fetchImpl
  });
}

describe('ApiBackend', () => {
  it('exige baseUrl', () => {
    expect(() => new ApiBackend({ obterToken: () => 't', fetch: vi.fn() })).toThrow();
  });

  it('normaliza a baseUrl (sem barra no fim)', () => {
    const api = montar(vi.fn());
    expect(api.baseUrl).toBe('https://api.exemplo.com');
  });

  describe('buscar', () => {
    it('GET com Authorization: Bearer e devolve o JSON', async () => {
      const fetchImpl = vi.fn().mockResolvedValue(resposta({ body: { fasesConcluidas: { a: 1 } } }));
      const api = montar(fetchImpl);

      const dados = await api.buscar();

      expect(fetchImpl).toHaveBeenCalledWith(
        'https://api.exemplo.com/progresso',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer tok-123' })
        })
      );
      expect(dados).toEqual({ fasesConcluidas: { a: 1 } });
    });

    it('404 vira null (jogador ainda sem progresso na nuvem)', async () => {
      const api = montar(vi.fn().mockResolvedValue(resposta({ ok: false, status: 404 })));
      expect(await api.buscar()).toBeNull();
    });

    it('outros erros HTTP são lançados', async () => {
      const api = montar(vi.fn().mockResolvedValue(resposta({ ok: false, status: 500 })));
      await expect(api.buscar()).rejects.toThrow(/500/);
    });
  });

  describe('persistir', () => {
    it('PUT com o corpo em JSON e Content-Type', async () => {
      const fetchImpl = vi.fn().mockResolvedValue(resposta({}));
      const api = montar(fetchImpl);
      const progresso = { versao: 1, fasesConcluidas: { 'mundo1-fase1': { estrelas: 3 } } };

      await api.persistir(progresso);

      const [, opts] = fetchImpl.mock.calls[0];
      expect(opts.method).toBe('PUT');
      expect(opts.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(opts.body)).toEqual(progresso);
    });

    it('erro HTTP no PUT é lançado', async () => {
      const api = montar(vi.fn().mockResolvedValue(resposta({ ok: false, status: 403 })));
      await expect(api.persistir({})).rejects.toThrow(/403/);
    });
  });

  describe('limpar', () => {
    it('DELETE aceita 200 e 404', async () => {
      const api200 = montar(vi.fn().mockResolvedValue(resposta({})));
      await expect(api200.limpar()).resolves.toBe(true);

      const api404 = montar(vi.fn().mockResolvedValue(resposta({ ok: false, status: 404 })));
      await expect(api404.limpar()).resolves.toBe(true);
    });
  });

  it('sem token, nem chega a chamar o fetch', async () => {
    const fetchImpl = vi.fn();
    const api = montar(fetchImpl, null);
    await expect(api.buscar()).rejects.toThrow(/token/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
