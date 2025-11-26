import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'quorum',
};

let pool: Pool | null = null;

export async function setupDatabase(): Promise<Pool> {
  try {
    pool = new Pool(DB_CONFIG);
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    
    return pool;
  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error;
  }
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection closed');
  }
}

