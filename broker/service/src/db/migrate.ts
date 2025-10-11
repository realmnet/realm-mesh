import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/realmmesh'
});

async function migrate(): Promise<void> {
  try {
    console.log('Running migrations...');

    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    await pool.query(schemaSQL);

    console.log('✅ Migrations completed successfully');
    console.log('📊 Sample data inserted');

    // Verify the setup
    const result = await pool.query('SELECT COUNT(*) as count FROM realms');
    console.log(`📈 ${result.rows[0].count} realms created`);

    // Show tree
    const tree = await pool.query('SELECT * FROM realm_tree_view');
    console.log('\n🌳 Realm Tree:');
    tree.rows.forEach(row => {
      console.log(row.tree_view);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

export { migrate };