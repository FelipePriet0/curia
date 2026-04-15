/**
 * board.spec.ts
 *
 * Testa os fluxos principais do Board.
 * Usa o storageState de board-user (com onboarding_completed).
 *
 * Nota: o storageState é carregado pelo playwright.config.ts — não precisa fazer login aqui.
 */
import { test, expect } from '@playwright/test'

test.describe('Board — Acesso', () => {
  test('usuário com onboarding feito acessa /board sem redirect', async ({ page }) => {
    await page.goto('/board')
    await expect(page).toHaveURL(/\/board/, { timeout: 8_000 })
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page).not.toHaveURL(/\/onboarding/)
  })

  test('usuário com onboarding feito em /onboarding → redireciona para /board', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/board/, { timeout: 8_000 })
  })
})

test.describe('Board — Interface carrega', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/board')
    await expect(page).toHaveURL(/\/board/, { timeout: 8_000 })
  })

  test('campo de input do board está visível', async ({ page }) => {
    // O input principal de consulta ao conselho deve estar visível
    await expect(
      page.locator('textarea, input[type="text"]').first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('sidebar de conversas está visível', async ({ page }) => {
    // A lista de conversas (sidebar) deve renderizar
    await expect(page.locator('aside, [data-sidebar], nav').first()).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Board — Sessão', () => {
  test('não redireciona para /onboarding após reload', async ({ page }) => {
    await page.goto('/board')
    await expect(page).toHaveURL(/\/board/, { timeout: 8_000 })
    await page.reload()
    await expect(page).toHaveURL(/\/board/, { timeout: 8_000 })
  })

  test('back button em /board não volta para /onboarding', async ({ page }) => {
    await page.goto('/')         // começa na landing
    await page.goto('/board')    // vai para o board (simulando navegação normal)
    await expect(page).toHaveURL(/\/board/, { timeout: 8_000 })

    await page.goBack()

    // Não deve cair em /onboarding — deve ir para / ou ficar em /board
    await expect(page).not.toHaveURL(/\/onboarding/)
  })
})
