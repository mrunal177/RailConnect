import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _appDbPool: Pool | undefined;
}

export const createPool = (): Pool => {
  if (!global._appDbPool) {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    const pgPool = new Pool({
      connectionString,
      // A warm Vercel function reuses this pool. One client per instance keeps
      // short-lived serverless traffic within Supabase pooler limits.
      max: Number(process.env.DB_POOL_MAX) || (process.env.VERCEL ? 1 : 10),
      connectionTimeoutMillis: 15000,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    pgPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL pool client:', err);
    });

    global._appDbPool = pgPool;
  }

  return global._appDbPool;
};

export const pool = createPool();

export const db = drizzle(pool, {
  schema,
});
