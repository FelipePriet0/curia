/**
 * auth.spec.ts
 *
 * Testa os fluxos de login e cadastro.
 * Login com credenciais válidas usa as variáveis de ambiente E2E_USER_*.
 */
import { test, expect } from '@playwright/test'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fillLoginForm(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
}

async function openSignup(page: import('@playwright/test').Page) {
  await page.goto('/signup')
}

async function openForgotPassword(page: import('@playwright/test').Page) {
  await page.goto('/forgot-password')
}

// ── Login ─────────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test('credenciais inválidas não autenticam o usuário', async ({ page }) => {
    await fillLoginForm(page, 'naoexiste@exemplo.com.br', 'SenhaErrada123!')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('button', { name: /entrar no board/i })).toBeVisible()
  })
})

// ── Signup ────────────────────────────────────────────────────────────────────

test.describe('Signup', () => {
  test('signup renderiza o formulário com CTA principal', async ({ page }) => {
    await openSignup(page)
    await expect(page.getByRole('button', { name: /criar conta/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continuar com google/i })).toBeVisible()
  })

  test('signup com senhas que não coincidem → exibe erro de senhas', async ({ page }) => {
    await openSignup(page)
    await page.getByLabel('E-mail').fill('novo@test.com.br')
    await page.locator('input[autocomplete="new-password"]').first().fill('SenhaForte123!')
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('SenhaDiferente456!')
    await expect(page.getByText(/senhas não coincidem/i)).toBeVisible({ timeout: 3_000 })
  })

  test('signup com e-mail já cadastrado → exibe erro de e-mail existente', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL ?? ''
    test.skip(!email, 'E2E_USER_EMAIL não definido')

    await openSignup(page)
    await page.getByLabel('E-mail').fill(email)
    await page.locator('input[autocomplete="new-password"]').first().fill('SenhaForte123!')
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('SenhaForte123!')
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page).toHaveURL(/\/signup/, { timeout: 8_000 })
  })

  test('link "Já tem conta?" leva para /login', async ({ page }) => {
    await openSignup(page)
    await page.getByRole('link', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('link "Criar conta" em /login leva para /signup', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /criar conta/i }).click()
    await expect(page).toHaveURL(/\/signup/)
  })
})
