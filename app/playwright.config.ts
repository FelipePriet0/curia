import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

// Carrega .env.test se existir (não falha se o arquivo não existir)
loadEnv({ path: '.env.test', override: false })

/**
 * Variáveis de ambiente necessárias (.env.test):
 *   PLAYWRIGHT_BASE_URL      → padrão: http://localhost:3000
 *   E2E_USER_EMAIL           → usuário existente com onboarding feito
 *   E2E_USER_PASSWORD
 *   E2E_FRESH_USER_EMAIL     → usuário existente SEM onboarding feito
 *   E2E_FRESH_USER_PASSWORD
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  webServer: {
    command: 'CURIA_FAKE_DIAGNOSIS=1 next dev --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
  },
  projects: [
    // ── 1. Setup: salva sessões autenticadas em disco ────────────────────────
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── 2. Testes sem autenticação ───────────────────────────────────────────
    {
      name: 'public',
      testMatch: /middleware\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── 3. Testes de auth (login / signup) ───────────────────────────────────
    {
      name: 'auth',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // ── 4. Testes de onboarding (usuário sem onboarding) ─────────────────────
    {
      name: 'onboarding',
      testMatch: /onboarding\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/fresh-user.json',
      },
      dependencies: ['setup'],
    },

    // ── 5. Testes do board (usuário com onboarding feito) ────────────────────
    {
      name: 'board',
      testMatch: /board\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/board-user.json',
      },
      dependencies: ['setup'],
    },
  ],
})
