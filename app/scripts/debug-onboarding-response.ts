import { chromium } from 'playwright'
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright'

async function main() {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  const email = process.env.E2E_FRESH_USER_EMAIL

  if (!email) {
    throw new Error('E2E_FRESH_USER_EMAIL não definido')
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await setupClerkTestingToken({ page })
  await page.goto(baseUrl)
  await clerk.signOut({ page }).catch(() => {})
  await clerk.signIn({ page, emailAddress: email })

  const result = await page.evaluate(async () => {
    const payload = {
      company_name: 'Acme Curia',
      industry: 'tech',
      business_type: 'saas',
      product_description: 'Uma plataforma SaaS para founders priorizarem decisões estratégicas.',
      ideal_customer_story: '',
      why_they_paid: '',
      current_moment: '',
      keeping_up_at_night: '',
      current_hypothesis: '',
      what_tried: '',
      pending_decision: '',
    }

    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const text = await response.text()

    return {
      status: response.status,
      ok: response.ok,
      url: response.url,
      text,
    }
  })

  console.log(JSON.stringify(result, null, 2))

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
