import './load-env'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type SqlClient = ReturnType<typeof postgres>

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

function createSqlClient() {
  return postgres(getDatabaseUrl(), {
    max: 1,
    prepare: false,
  })
}

function createDb() {
  return drizzle(getSqlClient(), { schema })
}

type Database = ReturnType<typeof createDb>

declare global {
  // eslint-disable-next-line no-var
  var __curiaSql: SqlClient | undefined
  // eslint-disable-next-line no-var
  var __curiaDb: Database | undefined
}

function getSqlClient() {
  if (globalThis.__curiaSql) {
    return globalThis.__curiaSql
  }

  const client = createSqlClient()

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__curiaSql = client
  }

  return client
}

function getDb() {
  if (globalThis.__curiaDb) {
    return globalThis.__curiaDb
  }

  const instance = createDb()

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__curiaDb = instance
  }

  return instance
}

function createLazyProxy<T extends object>(factory: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const instance = factory()
      const value = Reflect.get(instance, prop, instance)

      return typeof value === 'function' ? value.bind(instance) : value
    },
  })
}

// Next may import route modules during `next build`. Keep DB init lazy so image
// builds do not require a live DATABASE_URL until runtime or migrations.
export const db = createLazyProxy(getDb)
export const sql = createLazyProxy(getSqlClient)
