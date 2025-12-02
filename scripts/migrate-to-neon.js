/**
 * SQLite to PostgreSQL Migration Script
 * 
 * This script copies data from your local SQLite dev.db to Neon PostgreSQL.
 * 
 * Usage:
 *   node scripts/migrate-to-neon.js <NEON_DATABASE_URL>
 * 
 * Example:
 *   node scripts/migrate-to-neon.js "postgresql://user:password@ep-xyz.neon.tech:5432/neondb?sslmode=require"
 * 
 * Steps:
 * 1. Create a Neon project at https://neon.tech
 * 2. Copy your Neon connection string (with password)
 * 3. Run: npx prisma migrate deploy (with DATABASE_URL pointing to Neon) to create schema
 * 4. Run this script with your Neon connection string to copy data
 */

import Database from 'better-sqlite3';
import pkg from 'pg';
const { Pool } = pkg;

const NEON_URL = process.argv[2];

if (!NEON_URL) {
  console.error('❌ Error: Neon database URL not provided');
  console.error('Usage: node scripts/migrate-to-neon.js <NEON_URL>');
  console.error('Example: node scripts/migrate-to-neon.js "postgresql://user:pass@host:5432/db?sslmode=require"');
  process.exit(1);
}

const sqlitePath = './prisma/dev.db';

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to Neon...\n');

  // Connect to SQLite
  let sqliteDb;
  try {
    sqliteDb = new Database(sqlitePath);
    console.log(`✅ Connected to SQLite: ${sqlitePath}`);
  } catch (error) {
    console.error(`❌ Error: Could not open SQLite database at ${sqlitePath}`);
    console.error(error.message);
    process.exit(1);
  }

  // Connect to Neon
  const pool = new Pool({
    connectionString: NEON_URL,
    ssl: true,
  });

  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to Neon PostgreSQL\n');
  } catch (error) {
    console.error('❌ Error: Could not connect to Neon');
    console.error(error.message);
    sqliteDb.close();
    process.exit(1);
  }

  try {
    // Migrate Post table
    console.log('📋 Migrating table: Post');
    
    // Read all posts from SQLite
    const posts = sqliteDb.prepare('SELECT * FROM Post ORDER BY id').all();
    console.log(`   Found ${posts.length} posts in SQLite`);

    if (posts.length > 0) {
      // Truncate target table (optional, but safer for re-runs)
      await client.query('TRUNCATE TABLE "Post" CASCADE');
      console.log('   Cleared existing data in Neon');

      // Insert posts into Neon
      for (const post of posts) {
        await client.query(
          `INSERT INTO "Post" (id, username, content, image, "createdAt") 
           VALUES ($1, $2, $3, $4, $5)`,
          [post.id, post.username, post.content, post.image, new Date(post.createdAt)]
        );
      }
      console.log(`   ✅ Inserted ${posts.length} posts into Neon`);
    } else {
      console.log('   ℹ️  No posts to migrate');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Update your .env with Neon connection string');
    console.log('   2. Run: npm run dev (to test locally)');
    console.log('   3. Run: npx prisma studio (to inspect data)');
    console.log('   4. Update Netlify environment variables with Neon URL');
    console.log('   5. Deploy to Netlify\n');

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    pool.end();
    sqliteDb.close();
  }
}

migrateData();
