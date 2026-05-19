const db = require('../config/db');

async function findByUsername(username) {
  const { rows } = await db.query(
    `SELECT id, username, email, role, password_hash, created_at
     FROM users WHERE username = $1`,
    [username]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await db.query(
    `SELECT id, username, email, role, created_at FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create({ username, email, password_hash }) {
  const { rows } = await db.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, role, created_at`,
    [username, email || null, password_hash]
  );
  return rows[0];
}

module.exports = { findByUsername, findById, create };
