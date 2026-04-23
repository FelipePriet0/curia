/**
 * onboarding.spec.ts
 *
 * Testa o fluxo de onboarding do usuário fresh, já com a shell nova
 * e o questionário v2.
 */
import { test, expect } from '@playwright/test'
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright'

async function signInFreshUser(page: import('@playwright/test').Page) {
  const email = process.env.E2E_FRESH_USER_EMAIL ?? ''
  test.skip(!email, 'E2E_FRESH_USER_EMAIL não definido')

  await setupClerkTestingToken({ page })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await clerk.signOut({ page }).catch(() => {})
  await clerk.signIn({
    page,
    emailAddress: email,
  })

  await expect.poll(async () => {
    return page.evaluate(async () => {
      const response = await fetch('/api/auth/session')
      if (!response.ok) return null

      const data = await response.json() as { user?: { email?: string | null } | null }
      return data.user?.email?.toLowerCase() ?? null
    })
  }, {
    timeout: 60_000,
  }).toBe(email.trim().toLowerCase())
}

async function waitForOnboardingReady(page: import('@playwright/test').Page) {
  const waitForTerms = page
    .getByRole('heading', { name: /aceite os termos para abrir seu board/i })
    .waitFor({ state: 'visible', timeout: 30_000 })

  const waitForFirstQuestion = page
    .getByRole('button', { name: 'SaaS' })
    .waitFor({ state: 'visible', timeout: 30_000 })

  await Promise.any([waitForTerms, waitForFirstQuestion])
}

test.describe('Onboarding', () => {
  test('usuário sem onboarding acessando /board → redireciona para /onboarding', async ({ page }) => {
    test.setTimeout(90_000)
    await signInFreshUser(page)
    await page.goto('/board', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 })
    await waitForOnboardingReady(page)
  })

  test('usuário sem onboarding acessando /onboarding → página carrega sem redirect', async ({ page }) => {
    test.setTimeout(90_000)
    await signInFreshUser(page)
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 })
    await waitForOnboardingReady(page)
  })

  test('após completar onboarding → navega para /board (sem histórico de /onboarding)', async ({ page }) => {
    test.setTimeout(120_000)

    await signInFreshUser(page)
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 })
    await waitForOnboardingReady(page)

    const result = await page.evaluate(async () => {
      const bootstrap = await fetch('/api/onboarding/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Fresh User',
          company_name: 'Acme Curia',
          industry: 'tech',
        }),
      })

      if (!bootstrap.ok) {
        return { ok: false, error: 'bootstrap_failed' }
      }

      const terms = await fetch('/api/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms_version: '1.0' }),
      })

      if (!terms.ok) {
        return { ok: false, error: 'terms_failed' }
      }

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Acme Curia',
          industry: 'tech',
          business_type: 'saas',
          product_description: 'Uma plataforma SaaS para founders priorizarem decisões estratégicas.',
          ideal_customer_story: 'Uma founder de SaaS B2B chegou por indicação porque estava perdida nas prioridades da operação.',
          why_they_paid: 'Porque precisava de clareza estratégica prática e não queria mais depender de conselho genérico.',
          current_moment: 'searching_pmf',
          keeping_up_at_night: 'A aquisição desacelerou e eu não sei se o problema é posicionamento ou execução comercial.',
          current_hypothesis: 'Acho que estamos atraindo leads erradas e com discurso confuso.',
          what_tried: 'Mexi na copy, mudei oferta e testei novos canais, mas a conversão não reagiu o suficiente.',
          pending_decision: 'Preciso decidir se reposiciono a oferta agora ou se contrato ajuda comercial antes.',
        }),
      })

      const body = await response.json().catch(() => null)
      return { ok: response.ok, status: response.status, body }
    })

    expect(result.ok).toBeTruthy()
    const conversationId = result.body?.conversation_id as string | undefined
    expect(conversationId).toBeTruthy()

    await page.goto(`/board?conversation=${conversationId}`, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/board\?conversation=/, { timeout: 30_000 })
    await expect(page.locator('textarea, input[aria-label="Enviar mensagem"]').first()).toBeVisible({ timeout: 15_000 })

    await page.goBack()
    await expect(page).not.toHaveURL(/\/onboarding/)
  })
})
