/**
 * onboarding.spec.ts
 *
 * Testa o fluxo de onboarding.
 * Usa o storageState de fresh-user (sem onboarding_completed).
 *
 * Nota: o storageState é carregado pelo playwright.config.ts — não precisa fazer login aqui.
 */
import { test, expect } from '@playwright/test'

test.describe('Onboarding', () => {
  test('usuário sem onboarding acessando /board → redireciona para /onboarding', async ({ page }) => {
    await page.goto('/board')
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 8_000 })
  })

  test('usuário sem onboarding acessando /onboarding → página carrega sem redirect', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/onboarding/)
    // Deve mostrar a primeira pergunta do onboarding
    await expect(page.getByText(/qual é o nome da empresa/i)).toBeVisible({ timeout: 8_000 })
  })

  test('após completar onboarding → navega para /board (sem histórico de /onboarding)', async ({ page }) => {
    // Este teste só pode ser executado uma vez por conta —
    // depois o usuário fica com onboarding_completed = true e não entra mais aqui.
    // Para reexecutar: reset o onboarding_completed no Supabase ou use uma nova conta.
    test.skip(true, 'Teste destrutivo — executar manualmente com conta descartável')
  })
})
