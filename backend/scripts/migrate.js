require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log(`  ✓ ${file}`);
    }

    // Seed/repair the demo admin so the documented credentials always work.
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'sentinel';
    const hash = await bcrypt.hash(defaultAdminPassword, 12);
    const existingAdmin = await client.query(`SELECT id FROM users WHERE username = 'admin'`);
    await client.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ('admin', 'admin@sentinel.local', $1, 'admin')
       ON CONFLICT (username) DO UPDATE
       SET email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           updated_at = NOW()`,
      [hash]
    );

    console.log(`\nDefault admin user ${existingAdmin.rows.length === 0 ? 'created' : 'updated'}:`);
    console.log('  username: admin');
    console.log(`  password: ${defaultAdminPassword}`);
    console.log('  Change this password in production!\n');

    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error('Migration failed:', err.message); process.exit(1); });
