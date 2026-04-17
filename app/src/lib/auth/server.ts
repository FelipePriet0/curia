import { auth, currentUser } from '@clerk/nextjs/server'
import { and, or, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { companies, userTermsAcceptances, users } from '@/db/schema'

export type AuthUser = {
  id: string
  clerkUserId: string
  email: string
  fullName: string | null
  onboardingCompleted: boolean
  emailVerified: boolean
}

type ClerkIdentity = {
  clerkUserId: string
  email: string
  fullName: string | null
  emailVerified: boolean
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function serializeUser(user: typeof users.$inferSelect): AuthUser {
  if (!user.clerkUserId) {
    throw new Error(`User ${user.id} is missing clerkUserId`)
  }

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    fullName: user.fullName,
    onboardingCompleted: user.onboardingCompleted,
    emailVerified: user.emailVerified,
  }
}

function extractPrimaryEmail(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  return user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
}

function getClerkIdentity(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  const email = extractPrimaryEmail(user)
  if (!email) {
    throw new Error('Authenticated Clerk user is missing an email address')
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || null

  return {
    clerkUserId: user.id,
    email: normalizeEmail(email),
    fullName,
    emailVerified: Boolean(user.primaryEmailAddress?.verification?.status === 'verified'),
  } satisfies ClerkIdentity
}

async function syncLocalUser(identity: ClerkIdentity) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(or(
      eq(users.clerkUserId, identity.clerkUserId),
      eq(users.email, identity.email),
    ))
    .limit(1)

  if (existingUser) {
    const [updatedUser] = await db
      .update(users)
      .set({
        clerkUserId: identity.clerkUserId,
        email: identity.email,
        fullName: identity.fullName,
        emailVerified: identity.emailVerified,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser.id))
      .returning()

    return serializeUser(updatedUser)
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      clerkUserId: identity.clerkUserId,
      email: identity.email,
      fullName: identity.fullName,
      emailVerified: identity.emailVerified,
    })
    .returning()

  return serializeUser(createdUser)
}

export function getUserFirstName(user: Pick<AuthUser, 'fullName' | 'email'>) {
  const fallback = user.email.split('@')[0] ?? null
  const fullName = user.fullName?.trim() || fallback
  return fullName ? fullName.split(/\s+/)[0] : null
}

export async function getCurrentSession() {
  const { userId } = await auth()
  if (!userId) return null

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const user = await syncLocalUser(getClerkIdentity(clerkUser))
  return { user }
}

export async function markOnboardingCompleted(userId: string) {
  await db.update(users)
    .set({
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user ? serializeUser(user) : null
}

export async function updateUserFullName(userId: string, fullName: string) {
  const normalized = fullName.trim()
  const [user] = await db
    .update(users)
    .set({
      fullName: normalized || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  return user ? serializeUser(user) : null
}

export async function getCompanyForUser(userId: string) {
  const [company] = await db.select().from(companies).where(eq(companies.userId, userId)).limit(1)
  return company ?? null
}

export async function upsertCompanyForUser(userId: string, values: Partial<typeof companies.$inferInsert>) {
  const existing = await getCompanyForUser(userId)

  if (existing) {
    const [company] = await db.update(companies)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(companies.userId, userId))
      .returning()

    return company
  }

  const [company] = await db.insert(companies)
    .values({
      userId,
      ...(values as Omit<typeof companies.$inferInsert, 'userId'>),
    })
    .returning()

  return company
}

export async function hasAcceptedTermsVersion(userId: string, termsVersion: string) {
  const [acceptance] = await db
    .select({ id: userTermsAcceptances.id })
    .from(userTermsAcceptances)
    .where(and(
      eq(userTermsAcceptances.userId, userId),
      eq(userTermsAcceptances.termsVersion, termsVersion),
    ))
    .limit(1)

  return Boolean(acceptance)
}
