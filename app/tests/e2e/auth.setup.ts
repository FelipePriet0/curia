/**
 * auth.setup.ts
 *
 * Roda uma única vez antes dos testes que dependem de auth.
 * Faz login com as duas contas de teste e salva o estado da sessão em disco,
 * para que os testes não precisem fazer login repetidamente.
 *
 * Contas necessárias (ver .env.test.example):
 *   - board-user  : usuário existente com onboarding_completed = true
 *   - fresh-user  : usuário existente com onboarding_completed = false
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const BOARD_USER_FILE  = path.join(__dirname, '.auth/board-user.json')
const FRESH_USER_FILE  = path.join(__dirname, '.auth/fresh-user.json')

// ── Salva sessão do usuário com onboarding feito ──────────────────────────────
setup('salva sessão board-user', async ({ page }) => {
  const email    = process.env.E2E_USER_EMAIL    ?? ''
  const password = process.env.E2E_USER_PASSWORD ?? ''

  if (!email || !password) {
    console.warn('⚠  E2E_USER_EMAIL / E2E_USER_PASSWORD não definidos — pulando setup de board-user')
    return
  }

  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/board/, { timeout: 10_000 })
  await page.context().storageState({ path: BOARD_USER_FILE })
})

// ── Salva sessão do usuário sem onboarding ────────────────────────────────────
setup('salva sessão fresh-user', async ({ page }) => {
  const email    = process.env.E2E_FRESH_USER_EMAIL    ?? ''
  const password = process.env.E2E_FRESH_USER_PASSWORD ?? ''

  if (!email || !password) {
    console.warn('⚠  E2E_FRESH_USER_EMAIL / E2E_FRESH_USER_PASSWORD não definidos — pulando setup de fresh-user')
    return
  }

  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()

  // Captura erro de login antes do timeout para diagnóstico
  const errorBox = page.locator('[class*="red"]').first()
  const hasError = await errorBox.isVisible().catch(() => false)
  if (hasError) {
    const msg = await errorBox.textContent().catch(() => '(sem texto)')
    throw new Error(`fresh-user login falhou: ${msg} — verifique se o usuário existe no Supabase e se o e-mail está confirmado`)
  }

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 })
  await page.context().storageState({ path: FRESH_USER_FILE })
})
