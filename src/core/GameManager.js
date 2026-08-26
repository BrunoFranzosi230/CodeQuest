/**
 * GameManager.js
 * Fonte única de verdade do estado global e barramento de eventos da aplicação.
 * É o único módulo autorizado a alterar `appState` (SDD 3.1).
 */

import { ProgressoStorage } from '../data/ProgressoStorage.js';
import { ORDEM_FASES } from '../data/mundos.js';

/** @typedef {'menu'|'mapa'|'jogando'|'pausado'|'vitoria'} AppState */

/** Eventos do barramento — o catálogo completo está em `docs/EVENTOS.md`. */
export const EVENTOS = {
  ESTADO_MUDOU:        'ESTADO_MUDOU',
  SELECIONAR_FASE:     'SELECIONAR_FASE',
  FASE_CARREGADA:      'FASE_CARREGADA',
  PROGRAMA_MUDOU:      'PROGRAMA_MUDOU',
  BLOCO_EM_EXECUCAO:   'BLOCO_EM_EXECUCAO',
  EXECUCAO_INICIADA:   'EXECUCAO_INICIADA',
  EXECUCAO_FINALIZADA: 'EXECUCAO_FINALIZADA',
  PEDIDO_EXECUTAR:     'PEDIDO_EXECUTAR',
  PEDIDO_RESET:        'PEDIDO_RESET',
  PREVER_GIRO:         'PREVER_GIRO',
  CHAVE_COLETADA:      'CHAVE_COLETADA',
  FASE_CONCLUIDA:      'FASE_CONCLUIDA',
  FASE_FALHOU:         'FASE_FALHOU',
  DICA_DISPONIVEL:     'DICA_DISPONIVEL',
  BIT_FALOU:           'BIT_FALOU'
};

/** Tentativas falhas antes de oferecer a dica (GDD 4.5). */
const FALHAS_ATE_DICA = 3;

export class GameManager {
  constructor() {
    /** @type {AppState|null} começa nulo para a primeira transição emitir de fato */
    this.appState = null;
    this.mundoAtual = null;
    this.faseAtual = null;
    this.configFase = null;
    this.tentativasFalhas = 0;
    this.dicaDisponivel = false;
    this.storage = new ProgressoStorage();
    this._listeners = {};
  }

  // ── Barramento de eventos ─────────────────────────────────────────────────

  /** Registra um listener. Devolve a função de cancelamento. */
  on(evento, callback) {
    (this._listeners[evento] ??= []).push(callback);
    return () => {
      this._listeners[evento] = this._listeners[evento].filter(cb => cb !== callback);
    };
  }

  emit(evento, payload) {
    (this._listeners[evento] || []).forEach(cb => {
      try {
        cb(payload);
      } catch (e) {
        console.error(`[GameManager] Listener de ${evento} falhou:`, e);
      }
    });
  }

  // ── Transições de estado ──────────────────────────────────────────────────

  /** Única forma autorizada de mudar o appState. */
  setState(novoEstado) {
    const anterior = this.appState;
    if (anterior === novoEstado) return;
    this.appState = novoEstado;
    this.emit(EVENTOS.ESTADO_MUDOU, { novoEstado, anterior });
  }

  irParaMenu()  { this.setState('menu'); }
  irParaMapa()  { this.faseAtual = null; this.setState('mapa'); }
  pausar()      { if (this.appState === 'jogando') this.setState('pausado'); }
  retomar()     { if (this.appState === 'pausado') this.setState('jogando'); }

  // ── Seleção e progressão de fases ─────────────────────────────────────────

  selecionarFase(faseId) {
    if (!this.storage.estaDesbloqueada(faseId)) return false;
    this.faseAtual = faseId;
    this.mundoAtual = Number(faseId.match(/^mundo(\d+)/)?.[1]) || 1;
    this.resetTentativas();
    this.setState('jogando');
    this.emit(EVENTOS.SELECIONAR_FASE, { faseId, mundo: this.mundoAtual });
    return true;
  }

  proximaFaseId() {
    const i = ORDEM_FASES.indexOf(this.faseAtual);
    return i >= 0 && i < ORDEM_FASES.length - 1 ? ORDEM_FASES[i + 1] : null;
  }

  temProximaFase() {
    return this.proximaFaseId() !== null;
  }

  // ── Falhas e dica automática ──────────────────────────────────────────────

  resetTentativas() {
    this.tentativasFalhas = 0;
    this.dicaDisponivel = false;
  }

  registrarFalha(motivo) {
    this.tentativasFalhas++;
    if (this.tentativasFalhas >= FALHAS_ATE_DICA && !this.dicaDisponivel) {
      this.dicaDisponivel = true;
      this.emit(EVENTOS.DICA_DISPONIVEL, { dica: this.configFase?.dica });
    }
    this.emit(EVENTOS.FASE_FALHOU, { motivo, tentativas: this.tentativasFalhas });
  }

  // ── Conclusão de fase ─────────────────────────────────────────────────────

  /**
   * Estrelas por economia de blocos (GDD 4.5):
   * igual ao mínimo → 3 · até 2 a mais → 2 · 3 ou mais → 1
   */
  calcularEstrelas(blocosUsados) {
    const min = this.configFase?.minBlocos ?? 1;
    if (blocosUsados <= min) return 3;
    if (blocosUsados <= min + 2) return 2;
    return 1;
  }

  concluirFase(blocosUsados) {
    const estrelas = this.calcularEstrelas(blocosUsados);
    this.storage.registrarConclusao(this.faseAtual, estrelas, blocosUsados);
    this.setState('vitoria');
    this.emit(EVENTOS.FASE_CONCLUIDA, {
      faseId: this.faseAtual,
      estrelas,
      blocosUsados,
      minBlocos: this.configFase?.minBlocos,
      temProxima: this.temProximaFase()
    });
    return estrelas;
  }

  /** Atalho para o Bit dizer algo no balão de fala. */
  falar(texto, ms = 3000) {
    this.emit(EVENTOS.BIT_FALOU, { texto, ms });
  }
}
