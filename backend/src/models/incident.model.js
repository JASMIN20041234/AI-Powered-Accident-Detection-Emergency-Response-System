const db = require('../config/db');

async function findAllByUser(userId) {
  const { rows } = await db.query(
    `SELECT
       i.id, i.event_type, i.magnitude, i.latitude, i.longitude,
       i.accuracy, i.status, i.created_at,
       COALESCE(
         json_agg(
           json_build_object(
             'id',            dl.id,
             'contact_name',  dl.contact_name,
             'contact_phone', dl.contact_phone,
             'status',        dl.status,
             'sent_at',       dl.sent_at
           ) ORDER BY dl.created_at
         ) FILTER (WHERE dl.id IS NOT NULL),
         '[]'::json
       ) AS dispatch_logs
     FROM incidents i
     LEFT JOIN dispatch_logs dl ON dl.incident_id = i.id
     WHERE i.user_id = $1
     GROUP BY i.id
     ORDER BY i.created_at DESC
     LIMIT 100`,
    [userId]
  );
  return rows;
}

async function findById(id, userId) {
  const { rows } = await db.query(
    `SELECT * FROM incidents WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rows[0] || null;
}

async function create({ user_id, event_type, magnitude, latitude, longitude, accuracy, status }) {
  const { rows } = await db.query(
    `INSERT INTO incidents (user_id, event_type, magnitude, latitude, longitude, accuracy, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [user_id, event_type, magnitude, latitude || null, longitude || null, accuracy || null, status || 'detected']
  );
  return rows[0];
}

async function updateStatus(id, status) {
  const { rows } = await db.query(
    `UPDATE incidents SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] || null;
}

async function removeAllByUser(userId) {
  await db.query(`DELETE FROM incidents WHERE user_id = $1`, [userId]);
}

module.exports = { findAllByUser, findById, create, updateStatus, removeAllByUser };
