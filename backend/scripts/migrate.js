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

    // Seed/repair the admin user — credentials come from .env only, never hardcoded.
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminEmail    = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminEmail || !adminPassword) {
      throw new Error('ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    }

    const hash = await bcrypt.hash(adminPassword, 12);

    // Try to update an existing admin-role row (handles username rename gracefully).
    // If none exists yet, insert fresh.
    const updated = await client.query(
      `UPDATE users
          SET username = $1, email = $2, password_hash = $3, updated_at = NOW()
        WHERE role = 'admin'
        RETURNING id`,
      [adminUsername, adminEmail, hash]
    );

    let action = 'updated';
    if (updated.rowCount === 0) {
      await client.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')`,
        [adminUsername, adminEmail, hash]
      );
      action = 'created';
    }

    console.log(`\nAdmin user ${action}:`);
    console.log(`  username: ${adminUsername}`);
    console.log(`  email:    ${adminEmail}\n`);

    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error('Migration failed:', err.message); process.exit(1); });
