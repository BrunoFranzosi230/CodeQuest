/* Captura os mockups do GDD a partir do jogo rodando. */
import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:5173';
const DEST = process.argv[2];
const espera = ms => new Promise(r => setTimeout(r, ms));

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--window-size=1366,860', '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required']
});

const pag = await navegador.newPage();
await pag.setViewport({ width: 1366, height: 820, deviceScaleFactor: 2 });
await pag.goto(URL, { waitUntil: 'networkidle0' });
await espera(1500);

const destravarTudo = () => pag.evaluate(() => {
  const p = gm.storage.carregar();
  ['mundo1-fase1','mundo1-fase2','mundo1-fase3','mundo1-fase4','mundo1-fase5',
   'mundo2-fase1','mundo2-fase2','mundo2-fase3','mundo3-fase1','mundo3-fase2',
   'mundo3-fase3','mundo4-fase1','mundo4-fase2'].forEach((id, i) =>
     p.fasesConcluidas[id] = { estrelas: [3,3,2,3,3,3,2,3,3,3,2,3,3][i], menorNumeroBlocos: 4 });
  gm.storage.salvar(p);
});

// ── 1. Mapa de mundos ───────────────────────────────────────────
await destravarTudo();
await pag.evaluate(() => { gm.irParaMenu(); gm.irParaMapa(); });
await espera(900);
await pag.screenshot({ path: `${DEST}/mapa.png` });

// ── 2. Gameplay (Mundo 3, mostra os blocos aninhados) ───────────
await pag.evaluate(async () => {
  gm.selecionarFase('mundo3-fase2');
  await new Promise(r => setTimeout(r, 900));
  const p = ui.painel;
  p.adicionar('repetir_ate');
  const ate = p.programa[0];
  p.alvo = { lista: ate.filhos, indice: 0 }; p.adicionar('se');
  const se = ate.filhos[0];
  p.alvo = { lista: se.filhos, indice: 0 };  p.adicionar('andar');
  p.alvo = { lista: se.senao,  indice: 0 };  p.adicionar('virar_dir');
  p.alvo = { lista: p.programa, indice: 1 }; p.render();
});
await espera(1400);
await pag.screenshot({ path: `${DEST}/gameplay.png` });

// ── 3. Tela de vitória ──────────────────────────────────────────
await pag.evaluate(async () => {
  gm.selecionarFase('mundo1-fase1');
  await new Promise(r => setTimeout(r, 900));
  ['andar','andar','andar','andar'].forEach(t => ui.painel.adicionar(t));
  gm.emit('PEDIDO_EXECUTAR', { programa: ui.painel.programa, funcao: ui.painel.funcao });
});
await espera(6500);
await pag.screenshot({ path: `${DEST}/vitoria.png` });

// ── 4. Menu de pause ────────────────────────────────────────────
await pag.evaluate(async () => {
  gm.selecionarFase('mundo4-fase1');
  await new Promise(r => setTimeout(r, 900));
  gm.pausar();
});
await espera(1200);
await pag.screenshot({ path: `${DEST}/pause.png` });

// ── 5. O Bit, para a arte conceitual ────────────────────────────
await pag.evaluate(() => { gm.irParaMenu(); });
await espera(900);
const bit = await pag.$('.logo-bit');
await bit.screenshot({ path: `${DEST}/bit.png`, omitBackground: true });

await navegador.close();
console.log('capturas concluídas');
