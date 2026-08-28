/**
 * mundos.js
 * Metadados e tema visual de cada mundo (GDD 5.2).
 * As cores aparecem em dois formatos porque servem a dois consumidores:
 * `css` para os cards do mapa (DOM) e `0x…` para o tabuleiro (Phaser).
 *
 * ── Música ───────────────────────────────────────────────────────────────────
 * Cada mundo tem um tema. O campo `musica` aceita duas formas:
 *
 *   arquivo: 'mundo1.ogg'   toca a faixa gravada em public/assets/audio/musica/
 *   notas/bpm/onda         arpejo sintetizado — o padrão enquanto não há faixa
 *
 * Os dois podem coexistir: se o arquivo faltar ou o navegador não suportar o
 * formato, o jogo volta sozinho para o arpejo. Ver docs/MUSICA.md.
 */

export const MUNDOS = [
  {
    id: 1, nome: 'Floresta Mágica', emoji: '🌳', conceito: 'Sequências',
    css: '#6EE7A0',
    tema: { chao:0x6EE7A0, chaoAlt:0x86EFAC, borda:0x2FAE6A, parede:0xC98A4B, paredeEsc:0x96602F },
    musica: {  /*arquivo:'mundo1.mp3', volume:0.35,*/ notas:[523,659,784,659,587,698,880,698], bpm:110, onda:'triangle' }
  },
  {
    id: 2, nome: 'Fábrica de Engrenagens', emoji: '⚙️', conceito: 'Repetição',
    css: '#C084FC',
    tema: { chao:0xCBD5E1, chaoAlt:0xE2E8F0, borda:0x64748B, parede:0x94A3B8, paredeEsc:0x64748B },
    musica: { /* arquivo:'mundo2.ogg', volume:0.35, */ notas:[440,554,659,554,494,622,740,622], bpm:126, onda:'square' }
  },
  {
    id: 3, nome: 'Caverna Misteriosa', emoji: '🔦', conceito: 'Condicionais',
    css: '#FDBA74',
    tema: { chao:0xC4B5FD, chaoAlt:0xDDD6FE, borda:0x6D28D9, parede:0x7E5BB8, paredeEsc:0x553095 },
    musica: { /* arquivo:'mundo3.ogg', volume:0.35, */ notas:[392,466,587,466,440,523,659,523], bpm:100, onda:'triangle' }
  },
  {
    id: 4, nome: 'Cidade Futurista', emoji: '🌆', conceito: 'Funções',
    css: '#F9A8D4',
    tema: { chao:0x5EEAD4, chaoAlt:0x99F6E4, borda:0x0F766E, parede:0x38BDF8, paredeEsc:0x0369A1 },
    musica: { /* arquivo:'mundo4.ogg', volume:0.35, */ notas:[587,740,880,740,659,830,988,830], bpm:130, onda:'square' }
  }
];

/** Ordem de desbloqueio das fases — reflete a progressão do GDD 4.5. */
export const ORDEM_FASES = [
  'mundo1-fase1', 'mundo1-fase2', 'mundo1-fase3', 'mundo1-fase4', 'mundo1-fase5',
  'mundo2-fase1', 'mundo2-fase2', 'mundo2-fase3',
  'mundo3-fase1', 'mundo3-fase2', 'mundo3-fase3',
  'mundo4-fase1', 'mundo4-fase2', 'mundo4-fase3'
];

export const mundoPorId = id => MUNDOS.find(m => m.id === id) || MUNDOS[0];

/** Fases de um mundo, na ordem de desbloqueio. */
export const fasesDoMundo = id => ORDEM_FASES.filter(f => f.startsWith(`mundo${id}-`));
