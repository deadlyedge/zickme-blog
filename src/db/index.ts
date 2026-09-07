import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || ''

// For queries/transactions pool
const pool = new Pool({ connectionString })

export const db = drizzle(pool, { schema })
export type DB = typeof db
