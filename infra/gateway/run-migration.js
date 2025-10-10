const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/gateway_db'
});

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...\n');

    // Run init.sql first (if needed)
    console.log('1️⃣  Running init.sql...');
    const initSQL = fs.readFileSync(path.join(__dirname, 'scripts/init.sql'), 'utf8');
    await pool.query(initSQL);
    console.log('✅ Base schema created\n');

    // Run client model migration
    console.log('2️⃣  Running client model migration...');
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'scripts/migration_client_model.sql'), 'utf8');
    await pool.query(migrationSQL);
    console.log('✅ Client/Agent/Participant tables created\n');

    console.log('🎉 All migrations completed successfully!\n');

    // Verify
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('📊 Database tables:');
    tables.rows.forEach(row => console.log(`   - ${row.tablename}`));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
