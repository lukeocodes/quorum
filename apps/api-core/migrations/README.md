# Database Migrations

This directory contains SQL migration files for the Quorum API database.

## Running Migrations

To apply all pending migrations:

```bash
cd apps/api
tsx migrations/migrate.ts
```

The migration runner will:
1. Create a `migrations` table (if it doesn't exist) to track applied migrations
2. Check which migrations have already been applied
3. Run any new migrations in alphabetical order
4. Record successfully applied migrations

## Migration Files

Migration files are named with a numeric prefix for ordering:

- `001_add_user_added_servers.sql` - First migration
- `002_example_migration.sql` - Second migration
- etc.

## Creating New Migrations

1. Create a new `.sql` file with the next number prefix
2. Add your SQL commands (CREATE TABLE, ALTER TABLE, etc.)
3. Add descriptive comments at the top
4. Test locally before committing

Example:

```sql
-- Migration: Add new feature
-- Description: Detailed description of what this migration does

CREATE TABLE IF NOT EXISTS my_new_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_my_new_table_name ON my_new_table(name);
```

## Important Notes

- Migrations are run in a transaction - if any part fails, the entire migration is rolled back
- Once a migration is applied, it won't run again (tracked in `migrations` table)
- Always test migrations on a local database first
- Migrations should be idempotent when possible (use `IF NOT EXISTS`, etc.)

## Fresh Database Setup

For a brand new database, you can either:

1. Run all migrations:
   ```bash
   cd apps/api
   tsx migrations/migrate.ts
   ```

2. Or apply the full schema directly:
   ```bash
   psql quorum < apps/electron/database/schema.sql
   ```

For existing databases, always use the migration runner to apply updates.

