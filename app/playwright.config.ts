import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

// Carrega .env.test se existir (não falha se o arquivo não existir)
loadEnv({ path: '.env.test', override: false })

if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
}

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
    command: 'NEXT_DIST_DIR=.next-playwright CURIA_FAKE_DIAGNOSIS=1 next dev --webpack --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
  },
  projects: [
    // ── 1. Setup: salva sessões autenticadas em disco ────────────────────────
    {
      name: 'setup-board',
      testMatch: /board\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'setup-fresh',
      testMatch: /fresh\.setup\.ts/,
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
    },

    // ── 4. Testes de onboarding (usuário sem onboarding) ─────────────────────
    {
      name: 'onboarding',
      testMatch: /onboarding\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/fresh-user.json',
      },
      dependencies: ['setup-fresh'],
    },

    // ── 5. Testes do board (usuário com onboarding feito) ───────────────────
    {
      name: 'board',
      testMatch: /board\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/board-user.json',
      },
      dependencies: ['setup-board'],
    },
  ],
})