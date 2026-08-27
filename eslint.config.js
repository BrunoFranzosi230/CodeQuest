/**
 * Análise estática — exigida pelo Portfolio Directions (linha Jogos Digitais).
 * Roda com `npm run lint` e no CI a cada push/PR.
 */

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**']
  },

  // Código da aplicação — roda no navegador
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        Storage: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        ResizeObserver: 'readonly',
        DataTransfer: 'readonly',
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        HTMLElement: 'readonly',
        CustomEvent: 'readonly',
        Image: 'readonly'
      }
    },
    rules: {
      /* --- erros de verdade --- */
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-const-assign': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-fallthrough': 'error',
      'no-self-compare': 'error',
      'no-unsafe-negation': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'no-cond-assign': 'error',
      'require-atomic-updates': 'error',

      /* --- riscos --- */
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-var': 'error',

      /* --- manutenibilidade (critério 3 do Demo Day) --- */
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],
      'no-else-return': 'warn',
      'max-depth': ['warn', 4],
      'complexity': ['warn', 15],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }]
    }
  },

  // Testes — rodam no Node com os globais do Vitest
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        localStorage: 'readonly',
        Storage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        process: 'readonly',
        // ambiente jsdom, usado nos testes de telemetria e persistência
        window: 'readonly',
        document: 'readonly',
        ErrorEvent: 'readonly',
        ArrayBuffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error'
    }
  }
];
