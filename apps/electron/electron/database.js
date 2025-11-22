const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Pool } = pg;

const DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'quorum',
};

let pool;

async function setupDatabase() {
  try {
    pool = new Pool(DB_CONFIG);
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Database connected');
    
    // Don't run migrations here - they should be run separately via npm run db:migrate
    // Just verify the database is accessible
    
    return pool;
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

module.exports = { setupDatabase, getPool };

