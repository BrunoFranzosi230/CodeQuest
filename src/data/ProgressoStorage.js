/**
 * ProgressoStorage.js
 * Camada de acesso ao localStorage — único ponto de persistência da aplicação.
 * Equivalente à camada de repositório de um backend tradicional (SDD 5.2).
 */

import { ORDEM_FASES } from './mundos.js';

const CHAVE = 'codequest_progresso';
const VERSAO_SCHEMA = 1;

export class ProgressoStorage {
  constructor() {
    this.disponivel = this._testarDisponibilidade();
  }

  _testarDisponibilidade() {
    try {
      localStorage.setItem('__cq_teste__', '1');
      localStorage.removeItem('__cq_teste__');
      return true;
    } catch {
      return false;
    }
  }

  vazio() {
    return { versao: VERSAO_SCHEMA, fasesConcluidas: {}, ultimaFaseJogada: null };
  }

  carregar() {
    if (!this.disponivel) return this.vazio();
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return this.vazio();
      return this._migrar(JSON.parse(bruto));
    } catch (e) {
      console.warn('[ProgressoStorage] Progresso ilegível, começando do zero.', e);
      return this.vazio();
    }
  }

  salvar(progresso) {
    if (!this.disponivel) return false;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(progresso));
      return true;
    } catch (e) {
      console.warn('[ProgressoStorage] Não foi possível salvar.', e);
      return false;
    }
  }

  /** Migra progressos de versões antigas do schema. */
  _migrar(dados) {
    if (!dados || typeof dados !== 'object') return this.vazio();
    if (!dados.fasesConcluidas) dados.fasesConcluidas = {};
    dados.versao = VERSAO_SCHEMA;
    return dados;
  }

  /**
   * Registra a conclusão de uma fase. Estrelas nunca regridem e o recorde de
   * menor número de blocos é sempre o melhor histórico (GDD 4.2).
   */
  registrarConclusao(faseId, estrelas, blocosUsados) {
    const progresso = this.carregar();
    const atual = progresso.fasesConcluidas[faseId];

    progresso.fasesConcluidas[faseId] = {
      estrelas: Math.max(estrelas, atual?.estrelas ?? 0),
      menorNumeroBlocos: Math.min(blocosUsados, atual?.menorNumeroBlocos ?? Infinity),
      concluidaEm: new Date().toISOString()
    };
    progresso.ultimaFaseJogada = faseId;

    this.salvar(progresso);
    return progresso;
  }

  estrelasDaFase(faseId) {
    return this.carregar().fasesConcluidas[faseId]?.estrelas ?? 0;
  }

  totalEstrelas() {
    return Object.values(this.carregar().fasesConcluidas)
      .reduce((soma, f) => soma + (f.estrelas || 0), 0);
  }

  /** Uma fase está liberada se for a primeira ou se a anterior já foi vencida. */
  estaDesbloqueada(faseId) {
    const i = ORDEM_FASES.indexOf(faseId);
    if (i <= 0) return i === 0;
    return this.estrelasDaFase(ORDEM_FASES[i - 1]) > 0;
  }

  apagarTudo() {
    if (this.disponivel) localStorage.removeItem(CHAVE);
  }
}
