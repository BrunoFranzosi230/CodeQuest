/**
 * BlockEngine.js
 * Interpreta a árvore de blocos montada pela criança e envia comandos
 * atômicos ao BitController, um por vez (SDD 3.4).
 *
 * ── Por que a expansão é preguiçosa ──────────────────────────────────────────
 * O SDD previa expandir a sequência inteira numa fila linear antes de executar.
 * Isso funciona para `repetir(N)`, mas não para `Se dá pra ir` nem para
 * `Repetir até chegar`: ambos dependem de onde o Bit está *naquele instante*.
 *
 * A solução é um gerador (`function*`). Ele só avança quando o executor pede o
 * próximo comando, então avalia as condições já com o estado resultante do
 * comando anterior — sem máquina de estados nem pilha de execução manual.
 */

import { BLOCO } from '../data/blocos.js';
import { RESULTADO } from './BitController.js';

/** Teto de comandos executados — corta laços que nunca terminam. */
export const LIMITE_COMANDOS = 200;
/** Teto de voltas de um `repetir até`, caso o corpo não mova o Bit. */
const LIMITE_VOLTAS = 60;
/** Profundidade máxima de aninhamento — protege contra função recursiva. */
const PROFUNDIDADE_MAX = 8;

export class BlockEngine {
  /**
   * @param {import('./BitController.js').BitController} bitController
   * @param {import('./GameManager.js').GameManager} gameManager
   */
  constructor(bitController, gameManager) {
    this.bit = bitController;
    this.gm = gameManager;
    this._cancelado = false;
  }

  cancelar() { this._cancelado = true; }

  /**
   * Percorre a árvore devolvendo um comando atômico por vez.
   * @param {Array} lista corpo a percorrer
   * @param {Array} funcao corpo do "truque" (Mundo 4)
   */
  *comandos(lista, funcao, profundidade = 0) {
    if (profundidade > PROFUNDIDADE_MAX) return;

    for (const bloco of lista) {
      switch (bloco.tipo) {
        case BLOCO.REPETIR:
          for (let i = 0; i < bloco.vezes; i++) {
            yield* this.comandos(bloco.filhos, funcao, profundidade + 1);
            if (this.bit.venceu) return;
          }
          break;

        case BLOCO.REPETIR_ATE:
          yield* this._ateChegar(bloco, funcao, profundidade);
          break;

        case BLOCO.SE:
          // avaliada aqui, com o Bit já na posição do comando anterior
          yield* this.comandos(
            this.bit.podeAndar() ? bloco.filhos : bloco.senao,
            funcao,
            profundidade + 1
          );
          break;

        case BLOCO.FUNCAO:
          yield* this.comandos(funcao, funcao, profundidade + 1);
          break;

        default:
          yield bloco;
      }

      if (this.bit.venceu || this._cancelado) return;
    }
  }

  /** Repete o corpo até o Bit vencer, com teto para corpos que não avançam. */
  *_ateChegar(bloco, funcao, profundidade) {
    if (!bloco.filhos.length) return;
    let voltas = 0;
    while (!this.bit.venceu && !this._cancelado && voltas++ < LIMITE_VOLTAS) {
      yield* this.comandos(bloco.filhos, funcao, profundidade + 1);
    }
  }

  /**
   * Executa o programa completo.
   * @param {Array} programa árvore de blocos do painel principal
   * @param {Array} funcao corpo do truque
   * @returns {Promise<{resultado:'sucesso'|'erro', motivo?:string}>}
   */
  async executar(programa, funcao = []) {
    this._cancelado = false;
    this.bit.reset();

    let n = 0;

    for (const bloco of this.comandos(programa, funcao)) {
      if (this._cancelado) return { resultado:'erro', motivo:'cancelado' };

      if (++n > LIMITE_COMANDOS) {
        return { resultado:'erro', motivo:'limite_excedido' };
      }

      this.gm.emit('BLOCO_EM_EXECUCAO', { bloco });
      const res = await this._executarBloco(bloco);
      this.gm.emit('BLOCO_EM_EXECUCAO', { bloco: null });

      if (res === RESULTADO.COLIDIU)   return { resultado:'erro', motivo:'colisao' };
      if (res === RESULTADO.SEM_CHAVE) this.gm.falar('Preciso da chave primeiro!', 2000);
      if (res === RESULTADO.VENCEU)    return { resultado:'sucesso' };
    }

    return this.bit.venceu
      ? { resultado:'sucesso' }
      : { resultado:'erro', motivo:'nao_chegou' };
  }

  async _executarBloco(bloco) {
    switch (bloco.tipo) {
      case BLOCO.ANDAR:     return this.bit.andar();
      case BLOCO.VIRAR_ESQ: return this.bit.girar('esq');
      case BLOCO.VIRAR_DIR: return this.bit.girar('dir');
      default:              return RESULTADO.OK;
    }
  }
}

/** Mensagem que o Bit fala para cada tipo de falha. */
export const MENSAGEM_FALHA = {
  colisao:          'Ai! Bati na parede.',
  limite_excedido:  'O Bit se perdeu! Tente outro programa.',
  nao_chegou:       'Quase! O Bit não chegou em casa.',
  sequencia_vazia:  'Monte um programa primeiro!',
  cancelado:        'Parei aqui!'
};
