import { defineConfig } from 'vite';

export default defineConfig({
  // Na Vercel o site fica na raiz do domínio; no GitHub Pages, na subpasta com
  // o nome do repositório (https://usuario.github.io/CodeQuest/). A Vercel
  // define VERCEL=1 durante o build.
  base: process.env.VERCEL ? '/' : '/CodeQuest/',

  server: {
    port: 5173,
    open: true
  },

  test: {
    // jsdom porque a camada de dados usa `localStorage`
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      // "50% dos sistemas de lógica de jogo" (Portfolio Directions — Jogos
      // Digitais). Os sistemas de lógica são o domínio e a camada de dados;
      // cenas, UI e áudio são renderização e ficam fora da métrica.
      include: [
        'src/core/GameManager.js',
        'src/core/LevelLoader.js',
        'src/core/BlockEngine.js',
        'src/core/BitController.js',
        'src/core/Telemetria.js',
        'src/core/AudioManager.js',
        'src/core/AuthManager.js',
        'src/core/Dicas.js',
        'src/data/**/*.js'
      ],
      // config.js só lê variáveis de ambiente; nada a testar.
      exclude: ['src/config.js'],
      thresholds: { lines: 50, functions: 50, statements: 50, branches: 50 }
    }
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // o Phaser sozinho passa de 500 kB — é esperado e fica em chunk próprio
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Phaser em chunk separado: muda raramente, então o navegador
        // mantém em cache mesmo quando o código do jogo é atualizado.
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
        }
      }
    }
  }
});
