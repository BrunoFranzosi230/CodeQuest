/**
 * Telemetria.js
 * Telemetria de sessão e captura de erros — exigência do Portfolio Directions
 * (linha Jogos Digitais): *"Telemetria básica de sessão, crash reporting ou log
 * de erros"*.
 *
 * ── Onde os dados ficam ──────────────────────────────────────────────────────
 * Tudo em `localStorage`, no próprio navegador. Não há servidor, e por isso não
 * há envio de nada para lugar nenhum.
 *
 * ── Privacidade ──────────────────────────────────────────────────────────────
 * O público são crianças de 6 a 11 anos. Nenhum dado pessoal é registrado: sem
 * nome, sem e-mail, sem IP, sem identificador persistente. O id de sessão é
 * aleatório, vive só naquela sessão e não permite reidentificar ninguém.
 *
 * ── Para que serve na prática ────────────────────────────────────────────────
 * `resumo()` devolve exatamente as métricas que o GDD seção 10 diz que serão
 * coletadas nos playtests: tempo por fase, número de tentativas, taxa de
 * conclusão, uso da dica e blocos usados.
 */

import { EVENTOS } from './GameManager.js';

const CHAVE = 'codequest_telemetria';
const MAX_EVENTOS = 300;

export const TIPO = {
  SESSAO_INICIADA:  'sessao_iniciada',
  FASE_INICIADA:    'fase_iniciada',
  FASE_CONCLUIDA:   'fase_concluida',
  TENTATIVA_FALHOU: 'tentativa_falhou',
  DICA_USADA:       'dica_usada',
  ERRO:             'erro'
};

export class Telemetria {
  /**
   * @param {{ storage?: Storage, agora?: () => number, max?: number }} deps
   *   injetáveis para os testes não dependerem de relógio nem de navegador
   */
  constructor({ storage, agora = () => Date.now(), max = MAX_EVENTOS } = {}) {
    this.agora = agora;
    this.max = max;
    // `undefined` = use o padrão do navegador · `null` = desligue de propósito
    this.storage = storage === undefined ? this._storagePadrao() : storage;
    this.sessaoId = null;
    this._inicioFase = null;
    this._faseAtual = null;
    this._tentativas = 0;
  }

  _storagePadrao() {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
      return null;   // navegação anônima pode lançar só de acessar
    }
  }

  // ── Sessão ────────────────────────────────────────────────────────────────

  iniciarSessao() {
    // aleatório e efêmero: não identifica a criança nem persiste entre sessões
    this.sessaoId = `s-${this.agora().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    this.registrar(TIPO.SESSAO_INICIADA, {
      tela: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null
    });
    return this.sessaoId;
  }

  // ── Registro ──────────────────────────────────────────────────────────────

  registrar(tipo, dados = {}) {
    const evento = { t: this.agora(), sessao: this.sessaoId, tipo, ...dados };
    const lista = this.eventos();
    lista.push(evento);

    // buffer circular: mantém só os mais recentes, para não estourar a cota
    this._gravar(lista.slice(-this.max));
    return evento;
  }

  registrarErro(erro, origem = 'desconhecida') {
    return this.registrar(TIPO.ERRO, {
      origem,
      mensagem: String(erro?.message ?? erro),
      pilha: erro?.stack ? String(erro.stack).split('\n').slice(0, 4).join(' | ') : null
    });
  }

  // ── Captura automática ────────────────────────────────────────────────────

  /** Crash reporting: erros não tratados e promessas rejeitadas. */
  ligarCapturaGlobal(alvo = typeof window !== 'undefined' ? window : null) {
    if (!alvo) return () => {};

    const aoErro = e => this.registrarErro(e.error ?? e.message, 'window.onerror');
    const aoRejeitar = e => this.registrarErro(e.reason, 'unhandledrejection');

    alvo.addEventListener('error', aoErro);
    alvo.addEventListener('unhandledrejection', aoRejeitar);

    return () => {
      alvo.removeEventListener('error', aoErro);
      alvo.removeEventListener('unhandledrejection', aoRejeitar);
    };
  }

  /** Assina os eventos do jogo. Nenhum outro módulo precisa saber que existe. */
  ligarAoJogo(gm) {
    const cancelar = [];

    cancelar.push(gm.on(EVENTOS.FASE_CARREGADA, ({ config }) => {
      this._faseAtual = config.id;
      this._inicioFase = this.agora();
      this._tentativas = 0;
      this.registrar(TIPO.FASE_INICIADA, { fase: config.id, mundo: config.mundo });
    }));

    cancelar.push(gm.on(EVENTOS.FASE_FALHOU, ({ motivo }) => {
      this._tentativas++;
      this.registrar(TIPO.TENTATIVA_FALHOU, {
        fase: this._faseAtual, motivo, tentativa: this._tentativas
      });
    }));

    cancelar.push(gm.on(EVENTOS.DICA_DISPONIVEL, () => {
      this.registrar(TIPO.DICA_USADA, { fase: this._faseAtual });
    }));

    cancelar.push(gm.on(EVENTOS.FASE_CONCLUIDA, ({ faseId, estrelas, blocosUsados }) => {
      this.registrar(TIPO.FASE_CONCLUIDA, {
        fase: faseId,
        estrelas,
        blocos: blocosUsados,
        tentativas: this._tentativas,
        segundos: this._inicioFase ? Math.round((this.agora() - this._inicioFase) / 1000) : null
      });
    }));

    return () => cancelar.forEach(c => c());
  }

  // ── Leitura ───────────────────────────────────────────────────────────────

  eventos() {
    if (!this.storage) return [];
    try {
      return JSON.parse(this.storage.getItem(CHAVE)) || [];
    } catch {
      return [];
    }
  }

  _gravar(lista) {
    if (!this.storage) return false;
    try {
      this.storage.setItem(CHAVE, JSON.stringify(lista));
      return true;
    } catch {
      return false;   // cota cheia: telemetria nunca pode derrubar o jogo
    }
  }

  /**
   * Métricas agregadas por fase — as mesmas do GDD seção 10.
   * @returns {{fases: object, erros: number, totalEventos: number}}
   */
  resumo() {
    const eventos = this.eventos();
    const fases = {};

    const daFase = id => (fases[id] ??= {
      tentativasFalhas: 0, concluida: false, usouDica: false,
      estrelas: null, blocos: null, segundos: null
    });

    for (const e of eventos) {
      switch (e.tipo) {
        case TIPO.FASE_INICIADA:    daFase(e.fase); break;
        case TIPO.TENTATIVA_FALHOU: daFase(e.fase).tentativasFalhas++; break;
        case TIPO.DICA_USADA:       daFase(e.fase).usouDica = true; break;
        case TIPO.FASE_CONCLUIDA: {
          const f = daFase(e.fase);
          Object.assign(f, {
            concluida: true, estrelas: e.estrelas, blocos: e.blocos, segundos: e.segundos
          });
          break;
        }
      }
    }

    const iniciadas = Object.keys(fases).length;
    const concluidas = Object.values(fases).filter(f => f.concluida).length;

    return {
      fases,
      iniciadas,
      concluidas,
      taxaConclusao: iniciadas ? +(concluidas / iniciadas).toFixed(2) : 0,
      erros: eventos.filter(e => e.tipo === TIPO.ERRO).length,
      totalEventos: eventos.length
    };
  }

  /** JSON pronto para anexar ao relatório de playtest. */
  exportar() {
    return JSON.stringify({ resumo: this.resumo(), eventos: this.eventos() }, null, 2);
  }

  limpar() {
    try { this.storage?.removeItem(CHAVE); } catch { /* nada a fazer */ }
  }
}
