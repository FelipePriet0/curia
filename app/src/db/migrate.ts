import './load-env'
import path from 'node:path'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db, sql } from './client'

async function main() {
  const migrationsFolder = path.resolve(process.cwd(), 'src/db/drizzle')
  await migrate(db, { migrationsFolder })
  console.log(`[db:migrate] applied migrations from ${migrationsFolder}`)
  await sql.end()
}

main().catch(async (error) => {
  console.error('[db:migrate] failed', error)
  await sql.end({ timeout: 1 }).catch(() => {})
  process.exit(1)
})
