const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db = null;

/**
 * Run database migrations
 */
function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_name TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of applied migrations
    const appliedMigrations = db.prepare('SELECT migration_name FROM schema_migrations').all();
    const appliedSet = new Set(appliedMigrations.map(m => m.migration_name));

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../database/migrations');
    
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('ℹ️  No migrations directory found, skipping migrations');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📦 Found ${migrationFiles.length} migration files`);

    // Run unapplied migrations
    const insertMigration = db.prepare('INSERT INTO schema_migrations (migration_name) VALUES (?)');
    
    for (const migrationFile of migrationFiles) {
      if (!appliedSet.has(migrationFile)) {
        console.log(`🔄 Running migration: ${migrationFile}`);
        
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
        
        // Run migration in a transaction
        const transaction = db.transaction(() => {
          db.exec(migrationSql);
          insertMigration.run(migrationFile);
        });
        
        transaction();
        console.log(`✅ Migration applied: ${migrationFile}`);
      }
    }

    console.log('✅ All migrations applied');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

/**
 * Initialize the session-based SQLite database
 */
function initializeDatabase() {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'quorum-sessions.db');

    console.log('📂 Database path:', dbPath);

    // Create database connection
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    console.log('✅ Database connection established');

    // Read and execute base schema
    const schemaPath = path.join(__dirname, '../database/schema-sessions.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute the entire schema at once (better-sqlite3 handles multiple statements)
    db.exec(schema);

    console.log('✅ Database schema initialized');

    // Run migrations
    runMigrations();

    return db;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

/**
 * Get the database instance
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

module.exports = {
  initializeDatabase,
  getDb,
  closeDatabase,
};

