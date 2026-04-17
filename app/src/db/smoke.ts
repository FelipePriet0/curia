import './load-env'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db, sql } from './client'
import { users } from './schema'

async function main() {
  const id = randomUUID()
  const email = `smoke-${Date.now()}@curia.local`

  await db.insert(users).values({
    id,
    email,
    fullName: 'Smoke Test',
  })

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      onboardingCompleted: users.onboardingCompleted,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  console.log(JSON.stringify(result[0] ?? null, null, 2))

  await db.delete(users).where(eq(users.id, id))
  await sql.end()
}

main().catch(async (error) => {
  console.error('[db:smoke] failed', error)
  await sql.end({ timeout: 1 }).catch(() => {})
  process.exit(1)
})
