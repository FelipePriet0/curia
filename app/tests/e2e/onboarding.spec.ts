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
    test.setTimeout(60_000)

    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/onboarding/)

    await page.getByLabel(/qual é o nome da empresa/i).fill('Acme Curia')
    await page.getByRole('button', { name: /enviar/i }).click()

    await page.getByRole('button', { name: 'Tech / SaaS' }).click()
    await page.getByRole('button', { name: 'SaaS' }).click()

    await page.getByLabel(/me venda o produto em 30 segundos/i).fill(
      'Uma plataforma SaaS para founders priorizarem decisões estratégicas.'
    )
    await page.getByRole('button', { name: /enviar/i }).click()

    await page.getByRole('button', { name: /pular esta pergunta/i }).click()
    await page.getByRole('button', { name: /pular esta pergunta/i }).click()
    await page.getByRole('button', { name: /pular esta pergunta/i }).click()
    await page.getByRole('button', { name: /pular esta pergunta/i }).click()
    await page.getByRole('button', { name: /pular esta pergunta/i }).click()
    await page.getByRole('button', { name: /pular esta pergunta/i }).click()

    await page.getByRole('button', { name: 'Sim, tenho claro' }).click()
    await page.getByRole('button', { name: /pular esta pergunta/i }).click()
    await page.getByRole('button', { name: 'Orgânico / SEO' }).click()

    await page.getByRole('button', { name: 'Aquisição de clientes' }).click()
    await page.getByRole('button', { name: /confirmar seleção/i }).click()

    await page.getByRole('button', { name: /pular esta pergunta/i }).click()
    await expect(page.getByText(/diagnóstico pronto/i)).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /entrar no board/i }).click()
    await expect(page).toHaveURL(/\/board/, { timeout: 8_000 })

    await page.goBack()
    await expect(page).not.toHaveURL(/\/onboarding/)
  })
})
