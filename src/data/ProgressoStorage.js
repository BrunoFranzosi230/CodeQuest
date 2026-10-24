/**
 * ProgressoStorage.js
 * Camada de acesso à persistência do progresso. Equivalente à camada de
 * repositório de um backend tradicional (SDD 5.2).
 *
 * Dois destinos, e a classe usa os dois ao mesmo tempo:
 *
 *   • localStorage — sempre. É a fonte síncrona que o jogo lê durante a
 *     partida e a cópia offline.
 *   • backend remoto (AWS) — quando `definirContexto({ remoto })` recebe um
 *     cliente. Aí toda gravação também é enviada para a nuvem (write-through,
 *     sem bloquear o jogo) e `sincronizar()` puxa o que está lá ao entrar.
 *
 * Sem backend remoto o comportamento é idêntico ao de antes: só localStorage.
 */

import { ORDEM_FASES } from './mundos.js';

const CHAVE = 'codequest_progresso';
const VERSAO_SCHEMA = 1;

export class ProgressoStorage {
  constructor() {
    this.disponivel = this._testarDisponibilidade();
    /** Chave do localStorage. Trocada por uma versão com o id do usuário
     *  quando alguém entra com Google e não há nuvem configurada. */
    this._chave = CHAVE;
    /** Cliente remoto (ver ApiBackend). null → só localStorage. */
    this._remoto = null;
    /** Alguma gravação na nuvem ficou pendente por falha de rede? */
    this.pendenteNaNuvem = false;
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

  /**
   * Define de quem é o progresso e para onde ele vai.
   * @param {object} ctx
   * @param {string} [ctx.chave]  chave do localStorage (isola contas no mesmo aparelho).
   * @param {object} [ctx.remoto] cliente com `buscar()`, `persistir()`, `limpar()`.
   */
  definirContexto({ chave, remoto } = {}) {
    this._chave = chave || CHAVE;
    this._remoto = remoto ?? null;
    this.pendenteNaNuvem = false;
  }

  /**
   * Concilia o progresso local com o da nuvem, fase a fase, ficando com o
   * melhor de cada lado (mais estrelas, menos blocos). Nada se perde se o
   * jogador avançou num aparelho que estava sem conexão com a nuvem. Se o
   * resultado tem algo que a nuvem não tinha, ele sobe. Chamado ao entrar.
   * @returns {Promise<object>} o progresso já conciliado.
   */
  async sincronizar() {
    if (!this._remoto) return this.carregar();

    let daNuvem = null;
    try {
      daNuvem = await this._remoto.buscar();
    } catch (e) {
      console.warn('[ProgressoStorage] Sem resposta da nuvem; seguindo com o progresso local.', e);
      return this.carregar();
    }

    const nuvem = this._migrar(daNuvem ?? this.vazio());
    const conciliado = this._mesclar(this.carregar(), nuvem);

    this._gravarLocal(conciliado);
    if (JSON.stringify(conciliado.fasesConcluidas) !== JSON.stringify(nuvem.fasesConcluidas)) {
      this._empurrarRemoto(conciliado);
    }
    return conciliado;
  }

  /** Une dois progressos: por fase, o maior nº de estrelas e o menor de blocos. */
  _mesclar(a, b) {
    const fases = { ...a.fasesConcluidas };
    for (const [id, f] of Object.entries(b.fasesConcluidas)) {
      const atual = fases[id];
      fases[id] = !atual ? f : {
        estrelas: Math.max(atual.estrelas ?? 0, f.estrelas ?? 0),
        menorNumeroBlocos: Math.min(atual.menorNumeroBlocos ?? Infinity, f.menorNumeroBlocos ?? Infinity),
        // datas ISO 8601: a ordem de texto é a ordem cronológica
        concluidaEm: [atual.concluidaEm, f.concluidaEm].filter(Boolean)
          .sort((x, y) => x.localeCompare(y)).pop() ?? null
      };
    }
    return {
      versao: VERSAO_SCHEMA,
      fasesConcluidas: fases,
      ultimaFaseJogada: b.ultimaFaseJogada ?? a.ultimaFaseJogada ?? null
    };
  }

  vazio() {
    return { versao: VERSAO_SCHEMA, fasesConcluidas: {}, ultimaFaseJogada: null };
  }

  carregar() {
    if (!this.disponivel) return this.vazio();
    try {
      const bruto = localStorage.getItem(this._chave);
      if (!bruto) return this.vazio();
      return this._migrar(JSON.parse(bruto));
    } catch (e) {
      console.warn('[ProgressoStorage] Progresso ilegível, começando do zero.', e);
      return this.vazio();
    }
  }

  /** Grava no localStorage e, se houver, envia para a nuvem (sem bloquear). */
  salvar(progresso) {
    const ok = this._gravarLocal(progresso);
    this._empurrarRemoto(progresso);
    return ok;
  }

  _gravarLocal(progresso) {
    if (!this.disponivel) return false;
    try {
      localStorage.setItem(this._chave, JSON.stringify(progresso));
      return true;
    } catch (e) {
      console.warn('[ProgressoStorage] Não foi possível salvar.', e);
      return false;
    }
  }

  /** Envia para a nuvem em segundo plano; falha de rede vira pendência. */
  _empurrarRemoto(progresso) {
    if (!this._remoto) return;
    Promise.resolve()
      .then(() => this._remoto.persistir(progresso))
      .then(() => { this.pendenteNaNuvem = false; })
      .catch(e => {
        this.pendenteNaNuvem = true;
        console.warn('[ProgressoStorage] Falha ao sincronizar com a nuvem; tentará na próxima gravação.', e);
      });
  }

  /**
   * Migra progressos de versões antigas do schema e higieniza o que veio de
   * fora (nuvem ou localStorage): só passam fases que existem, com estrelas
   * 0–3 e números válidos. Monta um objeto novo — campo desconhecido não entra.
   */
  _migrar(dados) {
    if (!dados || typeof dados !== 'object') return this.vazio();

    const fasesConcluidas = {};
    for (const id of ORDEM_FASES) {
      const f = dados.fasesConcluidas?.[id];
      if (!f || typeof f !== 'object') continue;
      const estrelas = Number(f.estrelas);
      const blocos = Number(f.menorNumeroBlocos);
      const data = typeof f.concluidaEm === 'string' && !Number.isNaN(Date.parse(f.concluidaEm))
        ? f.concluidaEm : null;
      fasesConcluidas[id] = {
        estrelas: Number.isInteger(estrelas) ? Math.min(Math.max(estrelas, 0), 3) : 0,
        menorNumeroBlocos: Number.isInteger(blocos) && blocos > 0 ? blocos : null,
        concluidaEm: data
      };
    }

    return {
      versao: VERSAO_SCHEMA,
      fasesConcluidas,
      ultimaFaseJogada: ORDEM_FASES.includes(dados.ultimaFaseJogada) ? dados.ultimaFaseJogada : null
    };
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
    if (this.disponivel) localStorage.removeItem(this._chave);
    if (this._remoto) {
      this._remoto.limpar().catch(e =>
        console.warn('[ProgressoStorage] Falha ao apagar o progresso na nuvem.', e));
    }
  }
}
