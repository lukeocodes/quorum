#!/usr/bin/env tsx
/**
 * Database Migration Runner
 * 
 * Runs SQL migration files in order.
 * Usage: tsx migrations/migrate.ts
 */

import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Go up from migrations/ to api-core/ to root
const rootEnvPath = join(__dirname, '../../..', '.env');
dotenv.config({ path: rootEnvPath });
// Also try local .env as fallback
dotenv.config();

const DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'quorum',
};

async function runMigrations() {
  const pool = new Pool(DB_CONFIG);
  
  try {
    console.log('🔄 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of applied migrations
    const appliedResult = await pool.query(
      'SELECT filename FROM migrations ORDER BY filename'
    );
    const appliedMigrations = new Set(appliedResult.rows.map(row => row.filename));
    
    // Get list of migration files
    const migrationsDir = dirname(fileURLToPath(import.meta.url));
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('📝 No migration files found');
      return;
    }
    
    let appliedCount = 0;
    
    for (const file of files) {
      if (appliedMigrations.has(file)) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        continue;
      }
      
      console.log(`🔄 Applying ${file}...`);
      
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      
      try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        await pool.query('COMMIT');
        
        console.log(`✅ Applied ${file}`);
        appliedCount++;
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ Error applying ${file}:`, error);
        throw error;
      }
    }
    
    if (appliedCount === 0) {
      console.log('✨ All migrations already applied');
    } else {
      console.log(`\n✨ Successfully applied ${appliedCount} migration(s)`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

