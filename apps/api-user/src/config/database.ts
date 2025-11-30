import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

export async function setupDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'quorum',
  });

  // Test connection
  try {
    const client = await pool.connect();
    console.log('✅ Database connected');
    
    // Initialize tables
    await initializeTables(client);
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
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

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return pool;
}

async function initializeTables(client: PoolClient): Promise<void> {
  // User preferences table
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      preference_key VARCHAR(255) NOT NULL,
      preference_value TEXT NOT NULL,
      server_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, preference_key, server_id)
    )
  `);

  // Channel sections table
  await client.query(`
    CREATE TABLE IF NOT EXISTS channel_sections (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      server_id INTEGER NOT NULL,
      sections JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, server_id)
    )
  `);

  // Create indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
    ON user_preferences(user_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_preferences_server_id 
    ON user_preferences(user_id, server_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_channel_sections_user_server 
    ON channel_sections(user_id, server_id)
  `);

  console.log('✅ Database tables initialized');
}

