import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '../.env.docker'),
]

for (const file of envCandidates) {
  if (fs.existsSync(file)) {
    loadEnv({ path: file, override: false })
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Drizzle.')
}

export default defineConfig({
  out: './src/db/drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
})
