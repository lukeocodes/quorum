#!/usr/bin/env node

/**
 * Wipe PostgreSQL database
 * Removes all data from the API PostgreSQL database while preserving the schema
 */

const { config } = require("dotenv");
const pg = require("pg");
const { createInterface } = require("readline");

// Load environment variables from .env
config();

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

// Verify required environment variables (allow empty strings)
if (
  DB_USER === undefined ||
  DB_PASSWORD === undefined ||
  DB_HOST === undefined ||
  DB_PORT === undefined ||
  DB_NAME === undefined
) {
  console.error("❌ Error: Missing required environment variables in .env");
  console.error("Required: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME");
  console.error(
    "Note: Variables can be empty strings, but they must be defined"
  );
  process.exit(1);
}

console.log("📄 Loading environment variables from .env");
console.log("🗑️  Wiping PostgreSQL database...");
console.log(`📍 Database: ${DB_NAME}`);
console.log(`📍 Host: ${DB_HOST}:${DB_PORT}`);
console.log(`📍 User: ${DB_USER}`);
console.log("");

async function confirm() {
  // Skip confirmation in CI
  if (process.env.CI) {
    return true;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "⚠️  This will delete ALL data from the database. Continue? (yes/no): ",
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === "yes");
      }
    );
  });
}

async function wipeDatabase() {
  const confirmed = await confirm();

  if (!confirmed) {
    console.log("❌ Aborted");
    process.exit(0);
  }

  const pool = new pg.Pool({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: parseInt(DB_PORT),
    database: DB_NAME,
  });

  try {
    const client = await pool.connect();

    try {
      // Disable foreign key checks temporarily
      await client.query("SET session_replication_role = 'replica'");

      // List of tables to truncate (in order to handle dependencies)
      const tables = [
        'messages',
        'message_mentions',
        'channel_summaries',
        'ai_members',
        'channel_shares',
        'channels',
        'user_added_servers',
        'server_invites',
        'server_members',
        'servers',
        'sessions',
        'users',
      ];

      // Truncate each table if it exists
      for (const table of tables) {
        try {
          await client.query(`TRUNCATE TABLE ${table} CASCADE`);
          console.log(`  ✓ Truncated ${table}`);
        } catch (error) {
          if (error.code === '42P01') {
            // Table doesn't exist, skip it
            console.log(`  ⊘ Skipped ${table} (doesn't exist)`);
          } else {
            throw error;
          }
        }
      }

      // Re-enable foreign key checks
      await client.query("SET session_replication_role = 'origin'");

      // Reset sequences (only if they exist)
      const sequences = [
        'users_id_seq',
        'sessions_id_seq',
        'servers_id_seq',
        'server_members_id_seq',
        'server_invites_id_seq',
        'user_added_servers_id_seq',
        'channels_id_seq',
        'channel_shares_id_seq',
        'ai_members_id_seq',
        'messages_id_seq',
        'channel_summaries_id_seq',
        'message_mentions_id_seq',
      ];

      for (const sequence of sequences) {
        try {
          await client.query(`ALTER SEQUENCE ${sequence} RESTART WITH 1`);
        } catch (error) {
          // Sequence doesn't exist, skip it
          if (error.code !== '42P01') {
            console.log(`  ⚠ Warning: Could not reset sequence ${sequence}`);
          }
        }
      }

      console.log("");
      console.log("✅ PostgreSQL database wiped successfully");
      console.log("");
      console.log(
        "💡 The schema is preserved. You can now add new data or re-run migrations."
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("");
    console.error("❌ Failed to wipe database:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

wipeDatabase();
