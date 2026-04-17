import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

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
