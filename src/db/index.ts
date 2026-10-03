import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { InMemoryPool } from './in-memory-db.ts';

declare global {
  var _appDbPool: any;
}

export const createPool = (): any => {
  if (!global._appDbPool) {
    if (process.env.SQL_HOST && process.env.SQL_HOST.trim() !== '') {
      const pgPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
      });

      pgPool.on('error', (err) => {
        console.error('Unexpected error on idle SQL pool client:', err);
      });
      global._appDbPool = pgPool;
    } else {
      console.log('⚡ Cloud SQL disabled. Using High-Performance In-Memory PostgreSQL Store with full ACID & seed records.');
      global._appDbPool = new InMemoryPool();
    }
  }
  return global._appDbPool;
};

export const pool = createPool();
export const db = (process.env.SQL_HOST && process.env.SQL_HOST.trim() !== '') 
  ? drizzle(pool, { schema }) 
  : null as any;

