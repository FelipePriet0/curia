/**
 * middleware.spec.ts
 *
 * Testa a proteção de rotas do middleware.
 * Não precisa de credenciais — usa apenas browser sem sessão.
 */
import { test, expect } from '@playwright/test'

test.describe('Proteção de rotas (sem sessão)', () => {
  test('GET /board → redireciona para /login', async ({ page }) => {
    await page.goto('/board')
    await expect(page).toHaveURL(/\/login/)
  })

  test('GET /board/qualquer-subrota → redireciona para /login', async ({ page }) => {
    await page.goto('/board/alguma-coisa')
    await expect(page).toHaveURL(/\/login/)
  })

  test('GET /onboarding → redireciona para /login', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Rotas públicas acessíveis sem sessão', () => {
  test('GET / → landing page carrega', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('GET /login → página de login carrega', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('button', { name: /entrar no board/i })).toBeVisible()
  })

  test('GET /signup → página de cadastro carrega', async ({ page }) => {
    await page.goto('/signup')
    await expect(page).toHaveURL(/\/signup/)
    await expect(page.getByRole('button', { name: /criar conta/i })).toBeVisible()
  })

  test('GET /forgot-password → página de recuperação carrega', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page).toHaveURL(/\/forgot-password/)
  })
})
