/**
 * auth.setup.ts
 *
 * Prepara usuários de teste diretamente no banco local e salva o estado
 * autenticado em disco para os testes que dependem de sessão.
 */
import { scryptSync, randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { eq } from 'drizzle-orm'
import { test as setup, expect } from '@playwright/test'
import { db } from '../../src/db/client'
import { companies, passwordResetTokens, sessions, users } from '../../src/db/schema'

const AUTH_DIR = path.join(__dirname, '.auth')
const BOARD_USER_FILE = path.join(AUTH_DIR, 'board-user.json')
const FRESH_USER_FILE = path.join(AUTH_DIR, 'fresh-user.json')

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const derivedKey = scryptSync(password, salt, 64)
  return `scrypt:${salt}:${derivedKey.toString('hex')}`
}

async function ensureUser(input: {
  email: string
  password: string
  onboardingCompleted: boolean
  fullName: string
  clearCompany?: boolean
}) {
  const normalizedEmail = input.email.trim().toLowerCase()
  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  })

  if (existing) {
    await db.update(users)
      .set({
        passwordHash: hashPassword(input.password),
        fullName: input.fullName,
        onboardingCompleted: input.onboardingCompleted,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))

    await db.delete(sessions).where(eq(sessions.userId, existing.id))
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, existing.id))

    if (input.clearCompany) {
      await db.delete(companies).where(eq(companies.userId, existing.id))
    }

    return existing.id
  }

  const [created] = await db.insert(users)
    .values({
      email: normalizedEmail,
      passwordHash: hashPassword(input.password),
      fullName: input.fullName,
      onboardingCompleted: input.onboardingCompleted,
      emailVerified: true,
    })
    .returning({ id: users.id })

  return created.id
}

async function loginAndSaveStorage(params: {
  page: import('@playwright/test').Page
  email: string
  password: string
  expectedUrl: RegExp
  storagePath: string
}) {
  await params.page.goto('/login')
  await params.page.locator('input[type="email"]').fill(params.email)
  await params.page.locator('input[type="password"]').fill(params.password)
  await params.page.locator('button[type="submit"]').click()
  await expect(params.page).toHaveURL(params.expectedUrl, { timeout: 30_000 })
  await params.page.context().storageState({ path: params.storagePath })
}

setup.beforeAll(async () => {
  fs.mkdirSync(AUTH_DIR, { recursive: true })
})

setup('salva sessão board-user', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL ?? ''
  const password = process.env.E2E_USER_PASSWORD ?? ''

  if (!email || !password) {
    console.warn('⚠ E2E_USER_EMAIL / E2E_USER_PASSWORD não definidos — pulando setup de board-user')
    return
  }

  await ensureUser({
    email,
    password,
    onboardingCompleted: true,
    fullName: 'Board User',
  })

  await loginAndSaveStorage({
    page,
    email,
    password,
    expectedUrl: /\/board/,
    storagePath: BOARD_USER_FILE,
  })
})

setup('salva sessão fresh-user', async ({ page }) => {
  const email = process.env.E2E_FRESH_USER_EMAIL ?? ''
  const password = process.env.E2E_FRESH_USER_PASSWORD ?? ''

  if (!email || !password) {
    console.warn('⚠ E2E_FRESH_USER_EMAIL / E2E_FRESH_USER_PASSWORD não definidos — pulando setup de fresh-user')
    return
  }

  await ensureUser({
    email,
    password,
    onboardingCompleted: false,
    fullName: 'Fresh User',
    clearCompany: true,
  })

  await loginAndSaveStorage({
    page,
    email,
    password,
    expectedUrl: /\/onboarding/,
    storagePath: FRESH_USER_FILE,
  })
})
