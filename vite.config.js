import { defineConfig } from 'vite';

export default defineConfig({
  // Nome do repositório no GitHub Pages (https://usuario.github.io/CodeQuest/)
  base: '/CodeQuest/',

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
      reporter: ['text', 'lcov', 'html'],
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
        'src/data/**/*.js'
      ],
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
