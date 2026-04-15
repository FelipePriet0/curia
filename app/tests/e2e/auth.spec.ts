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

// ── Login ─────────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test('credenciais inválidas → exibe mensagem de erro', async ({ page }) => {
    await fillLoginForm(page, 'naoexiste@exemplo.com.br', 'SenhaErrada123!')
    await expect(page.getByText(/e-mail ou senha incorretos/i)).toBeVisible({ timeout: 8_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('e-mail sem formato válido → campo HTML5 bloqueia envio', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('email-invalido')
    await page.locator('input[type="password"]').fill('Qualquer1!')
    await page.locator('button[type="submit"]').click()
    // O browser bloqueia — a URL não muda
    await expect(page).toHaveURL(/\/login/)
  })

  test('login com credenciais válidas (usuário com onboarding) → vai para /board', async ({ page }) => {
    const email    = process.env.E2E_USER_EMAIL    ?? ''
    const password = process.env.E2E_USER_PASSWORD ?? ''
    test.skip(!email || !password, 'E2E_USER_EMAIL / E2E_USER_PASSWORD não definidos')

    await fillLoginForm(page, email, password)
    await expect(page).toHaveURL(/\/board/, { timeout: 10_000 })
  })

  test('login com credenciais válidas (usuário sem onboarding) → vai para /onboarding', async ({ page }) => {
    const email    = process.env.E2E_FRESH_USER_EMAIL    ?? ''
    const password = process.env.E2E_FRESH_USER_PASSWORD ?? ''
    test.skip(!email || !password, 'E2E_FRESH_USER_EMAIL / E2E_FRESH_USER_PASSWORD não definidos')

    await fillLoginForm(page, email, password)
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 })
  })
})

// ── Signup ────────────────────────────────────────────────────────────────────

test.describe('Signup', () => {
  test('signup sem aceitar termos → exibe erro de termos', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('E-mail').fill('novo@test.com.br')
    await page.locator('input[autocomplete="new-password"]').first().fill('SenhaForte123!')
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('SenhaForte123!')
    // Não marca o checkbox de termos
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page.getByText(/aceite os termos/i)).toBeVisible({ timeout: 5_000 })
  })

  test('signup com senhas que não coincidem → exibe erro de senhas', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('E-mail').fill('novo@test.com.br')
    await page.locator('input[autocomplete="new-password"]').first().fill('SenhaForte123!')
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('SenhaDiferente456!')
    await expect(page.getByText(/senhas não coincidem/i)).toBeVisible({ timeout: 3_000 })
  })

  test('signup com e-mail já cadastrado → exibe erro de e-mail existente', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL ?? ''
    test.skip(!email, 'E2E_USER_EMAIL não definido')

    await page.goto('/signup')
    await page.getByLabel('E-mail').fill(email)
    await page.locator('input[autocomplete="new-password"]').first().fill('SenhaForte123!')
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('SenhaForte123!')
    await page.locator('input[type="checkbox"]').check()
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(
      page.getByText(/já está cadastrado|faça login/i)
    ).toBeVisible({ timeout: 8_000 })
  })

  test('botão Google em /signup sem aceitar termos → exibe erro de termos', async ({ page }) => {
    await page.goto('/signup')
    await page.getByRole('button', { name: /cadastrar com google/i }).click()
    await expect(page.getByText(/aceite os termos/i)).toBeVisible({ timeout: 3_000 })
    // Não redireciona — continua em /signup
    await expect(page).toHaveURL(/\/signup/)
  })

  test('link "Já tem conta?" leva para /login', async ({ page }) => {
    await page.goto('/signup')
    await page.getByRole('link', { name: /já tem conta/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('link "Criar conta" em /login leva para /signup', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /criar conta/i }).click()
    await expect(page).toHaveURL(/\/signup/)
  })
})

// ── Back button após auth ─────────────────────────────────────────────────────

test.describe('Navegação pós-auth', () => {
  test('back button em /board não volta para /onboarding (regressão)', async ({ page }) => {
    const email    = process.env.E2E_USER_EMAIL    ?? ''
    const password = process.env.E2E_USER_PASSWORD ?? ''
    test.skip(!email || !password, 'E2E_USER_EMAIL / E2E_USER_PASSWORD não definidos')

    // Fazer login
    await fillLoginForm(page, email, password)
    await expect(page).toHaveURL(/\/board/, { timeout: 10_000 })

    // Clicar voltar
    await page.goBack()

    // Não deve ir para /onboarding
    await expect(page).not.toHaveURL(/\/onboarding/)
  })
})
