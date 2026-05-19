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

    // Seed default admin
    const { rows } = await client.query(`SELECT id FROM users WHERE username = 'admin'`);
    if (rows.length === 0) {
      const hash = await bcrypt.hash('sentinel', 12);
      await client.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ('admin', 'admin@sentinel.local', $1, 'admin')`,
        [hash]
      );
      console.log('\nDefault admin user created:');
      console.log('  username: admin');
      console.log('  password: sentinel');
      console.log('  ⚠  Change this password in production!\n');
    } else {
      console.log('\nAdmin user already exists — skipped seed.');
    }

    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error('Migration failed:', err.message); process.exit(1); });
