const db = require('../config/db');

async function create({ incident_id, contact_id, contact_name, contact_phone, status, error_message, sent_at }) {
  const { rows } = await db.query(
    `INSERT INTO dispatch_logs
       (incident_id, contact_id, contact_name, contact_phone, status, error_message, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, contact_name, contact_phone, status, error_message, sent_at`,
    [incident_id, contact_id || null, contact_name, contact_phone, status, error_message || null, sent_at || null]
  );
  return rows[0];
}

async function findByIncident(incidentId) {
  const { rows } = await db.query(
    `SELECT id, contact_name, contact_phone, status, error_message, sent_at, created_at
     FROM dispatch_logs WHERE incident_id = $1 ORDER BY created_at`,
    [incidentId]
  );
  return rows;
}

module.exports = { create, findByIncident };
