import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connect to real PostgreSQL using DATABASE_URL or falling back to environment variables
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://olist_user:secure_password@localhost:5432/olist_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = {
  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`[Database Query] executed query: ${text.slice(0, 50)}... in ${duration}ms`);
      return res;
    } catch (err: any) {
      console.warn(`[Database Pool Warning] Failed database query: ${err.message}. Using fallback memory pipeline.`);
      throw err;
    }
  },
  
  async getClient() {
    return await pool.connect();
  }
};
