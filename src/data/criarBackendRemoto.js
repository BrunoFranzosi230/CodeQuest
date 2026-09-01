/**
 * criarBackendRemoto.js
 * Decide se o progresso deste jogador vai para a nuvem e, em caso positivo,
 * monta o cliente. É o único ponto que junta `CONFIG`, o usuário e o
 * `AuthManager` — a `ProgressoStorage` só recebe o backend pronto (ou null).
 */

import { CONFIG } from '../config.js';
import { ApiBackend } from './backends/ApiBackend.js';

/**
 * @param {{provedor?: string}|null} usuario
 * @param {{obterToken: Function}} auth
 * @returns {ApiBackend|null} null quando não há API configurada ou o jogador
 *   não está logado com Google (convidado fica só no `localStorage`).
 */
export function criarBackendRemoto(usuario, auth) {
  if (!CONFIG.apiUrl) return null;
  if (!usuario || usuario.provedor !== 'google') return null;

  return new ApiBackend({
    baseUrl: CONFIG.apiUrl,
    obterToken: () => auth.obterToken()
  });
}
