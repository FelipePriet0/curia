import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { eq } from 'drizzle-orm'
import { test as setup, expect } from '@playwright/test'
import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { db } from '../../src/db/client'
import { companies, passwordResetTokens, sessions, userTermsAcceptances, users } from '../../src/db/schema'

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: false })

const AUTH_DIR = path.join(__dirname, '.auth')
const FRESH_USER_FILE = path.join(AUTH_DIR, 'fresh-user.json')
const CLERK_API_URL = 'https://api.clerk.com/v1/users'
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? ''

function getNameParts(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: firstName ?? 'Test',
    lastName: rest.join(' ') || 'User',
  }
}

async function clerkRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Clerk API ${response.status}: ${await response.text()}`)
  }

  return response.json() as Promise<T>
}

async function resetClerkUser(input: {
  email: string
  password: string
  fullName: string
}) {
  const normalizedEmail = input.email.trim().toLowerCase()
  const lookupUrl = `${CLERK_API_URL}?query=${encodeURIComponent(normalizedEmail)}&limit=100`
  const existingUsers = await clerkRequest<Array<{
    id: string
    email_addresses?: Array<{ email_address?: string }>
  }>>(lookupUrl, { method: 'GET' })

  for (const user of existingUsers) {
    const hasExactEmail = user.email_addresses?.some((item) => item.email_address?.toLowerCase() === normalizedEmail)
    if (hasExactEmail) {
      await clerkRequest(`${CLERK_API_URL}/${user.id}`, { method: 'DELETE' })
    }
  }

  const { firstName, lastName } = getNameParts(input.fullName)
  const created = await clerkRequest<{ id: string }>(CLERK_API_URL, {
    method: 'POST',
    body: JSON.stringify({
      email_address: [normalizedEmail],
      password: input.password,
      first_name: firstName,
      last_name: lastName,
      skip_password_checks: true,
      skip_password_requirement: true,
    }),
  })

  return created.id
}

async function ensureFreshUser(input: {
  email: string
  password: string
  fullName: string
}) {
  const normalizedEmail = input.email.trim().toLowerCase()
  const clerkUserId = await resetClerkUser(input)

  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  })

  if (existing) {
    await db.update(users)
      .set({
        clerkUserId,
        passwordHash: null,
        fullName: input.fullName,
        onboardingCompleted: false,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))

    await db.delete(sessions).where(eq(sessions.userId, existing.id))
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, existing.id))
    await db.delete(userTermsAcceptances).where(eq(userTermsAcceptances.userId, existing.id))
    await db.delete(companies).where(eq(companies.userId, existing.id))

    return existing.id
  }

  const [created] = await db.insert(users)
    .values({
      clerkUserId,
      email: normalizedEmail,
      passwordHash: null,
      fullName: input.fullName,
      onboardingCompleted: false,
      emailVerified: true,
    })
    .returning({ id: users.id })

  return created.id
}

async function loginAndSaveStorage(params: {
  page: import('@playwright/test').Page
  email: string
  storagePath: string
}) {
  await params.page.goto('/')
  await clerk.signIn({
    page: params.page,
    emailAddress: params.email,
  })

  await expect.poll(async () => {
    return params.page.evaluate(async () => {
      const response = await fetch('/api/auth/session')
      if (!response.ok) return null

      const data = await response.json() as { user?: { email?: string | null } | null }
      return data.user?.email?.toLowerCase() ?? null
    })
  }, {
    timeout: 60_000,
  }).toBe(params.email.trim().toLowerCase())

  await params.page.context().storageState({ path: params.storagePath })
}

setup.beforeAll(async () => {
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  process.env.CLERK_PUBLISHABLE_KEY ||= process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  await clerkSetup()
})

setup('salva sessão fresh-user', async ({ page }) => {
  setup.setTimeout(90_000)
  const email = process.env.E2E_FRESH_USER_EMAIL ?? ''
  const password = process.env.E2E_FRESH_USER_PASSWORD ?? ''

  if (!email || !password || !CLERK_SECRET_KEY) {
    console.warn('⚠ E2E_FRESH_USER_EMAIL / E2E_FRESH_USER_PASSWORD não definidos — pulando setup de fresh-user')
    return
  }

  await ensureFreshUser({
    email,
    password,
    fullName: 'Fresh User',
  })

  await loginAndSaveStorage({
    page,
    email,
    storagePath: FRESH_USER_FILE,
  })
})
