import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { InMemoryPool } from './in-memory-db.ts';

declare global {
  var _appDbPool: Pool | undefined;
}

export const createPool = (): Pool => {
  if (!global._appDbPool) {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) {
      console.warn('[AI Studio] DATABASE_URL is not configured — activating in-memory database mock with seeded data');
      global._appDbPool = new InMemoryPool() as unknown as Pool;
      return global._appDbPool;
    }

    try {
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
    } catch (err) {
      console.warn('[AI Studio] PostgreSQL pool creation failed — activating in-memory database mock', err);
      global._appDbPool = new InMemoryPool() as unknown as Pool;
    }
  }

  return global._appDbPool;
};

export const pool = createPool();

let dbInstance: any;
try {
  if (process.env.DATABASE_URL?.trim()) {
    dbInstance = drizzle(pool, { schema });
  } else {
    const noOp = {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
      create: async (d: any) => d?.data ?? {},
      update: async (d: any) => d?.data ?? {},
      delete: async () => ({}),
    };
    dbInstance = new Proxy({}, {
      get: (_, prop) => (prop === 'query' ? new Proxy({}, { get: () => noOp }) : async () => []),
    });
  }
} catch {
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  dbInstance = new Proxy({}, {
    get: (_, prop) => (prop === 'query' ? new Proxy({}, { get: () => noOp }) : async () => []),
  });
}

export const db = dbInstance;
