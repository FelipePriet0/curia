import './load-env'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

declare global {
  // eslint-disable-next-line no-var
  var __curiaSql: ReturnType<typeof postgres> | undefined
}

const sql = globalThis.__curiaSql ?? postgres(getDatabaseUrl(), {
  max: 1,
  prepare: false,
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__curiaSql = sql
}

export const db = drizzle(sql, { schema })
export { sql }
