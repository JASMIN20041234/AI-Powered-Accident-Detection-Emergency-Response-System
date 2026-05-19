const db = require('../config/db');

async function findAllByUser(userId) {
  const { rows } = await db.query(
    `SELECT id, name, relationship, phone, callmebot_apikey, is_active, created_at, updated_at
     FROM contacts
     WHERE user_id = $1 AND is_active = TRUE
     ORDER BY created_at ASC`,
    [userId]
  );
  return rows;
}

async function findById(id, userId) {
  const { rows } = await db.query(
    `SELECT * FROM contacts WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rows[0] || null;
}

async function create({ user_id, name, relationship, phone, callmebot_apikey }) {
  const { rows } = await db.query(
    `INSERT INTO contacts (user_id, name, relationship, phone, callmebot_apikey)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, relationship, phone, callmebot_apikey, is_active, created_at`,
    [user_id, name, relationship || 'Other', phone, callmebot_apikey || null]
  );
  return rows[0];
}

async function update(id, userId, { name, relationship, phone, callmebot_apikey }) {
  const { rows } = await db.query(
    `UPDATE contacts
     SET name             = COALESCE($1, name),
         relationship     = COALESCE($2, relationship),
         phone            = COALESCE($3, phone),
         callmebot_apikey = $4,
         updated_at       = NOW()
     WHERE id = $5 AND user_id = $6
     RETURNING id, name, relationship, phone, callmebot_apikey, is_active, updated_at`,
    [name || null, relationship || null, phone || null, callmebot_apikey || null, id, userId]
  );
  return rows[0] || null;
}

async function remove(id, userId) {
  const { rowCount } = await db.query(
    `DELETE FROM contacts WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rowCount > 0;
}

module.exports = { findAllByUser, findById, create, update, remove };
