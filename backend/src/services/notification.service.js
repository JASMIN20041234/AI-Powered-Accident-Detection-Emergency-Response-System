const callmebotProvider = require('./providers/callmebot.provider');
const twilioProvider    = require('./providers/twilio.provider');
const DispatchModel     = require('../models/dispatch.model');
const IncidentModel     = require('../models/incident.model');
const { emitToUser }    = require('../sockets');
const logger            = require('../utils/logger');

function getProvider() {
  return process.env.SMS_PROVIDER === 'twilio' ? twilioProvider : callmebotProvider;
}

function buildAlertMessage({ event_type, magnitude, latitude, longitude, created_at }) {
  const mapUrl =
    latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : '(GPS unavailable)';

  return `🚨 EMERGENCY ALERT 🚨

Accident detected by SENTINEL.

📍 Event: ${event_type}
💥 Impact: ${Number(magnitude).toFixed(2)}g
🕐 Time: ${new Date(created_at).toLocaleString()}
📌 Location: ${latitude ? Number(latitude).toFixed(5) : 'unknown'}, ${longitude ? Number(longitude).toFixed(5) : 'unknown'}

🗺️ Live map: ${mapUrl}

⚠️ The person did not respond within 30 seconds. Please call them or emergency services immediately.`;
}

/**
 * Dispatch emergency alerts to all contacts for an incident.
 * Skips contacts without an API key when using the CallMeBot provider.
 *
 * @param {{ incident: Object, contacts: Object[], userId: string }} opts
 * @returns {Promise<Object[]>} dispatch log entries
 */
async function dispatch({ incident, contacts, userId }) {
  const provider = getProvider();
  const isCallmebot = process.env.SMS_PROVIDER !== 'twilio';
  const message = buildAlertMessage(incident);
  const results = [];

  logger.info(`Dispatching incident ${incident.id} to ${contacts.length} contacts via ${isCallmebot ? 'CallMeBot' : 'Twilio'}`);

  for (const contact of contacts) {
    const hasKey = contact.callmebot_apikey?.trim();

    if (isCallmebot && !hasKey) {
      const log = await DispatchModel.create({
        incident_id:   incident.id,
        contact_id:    contact.id,
        contact_name:  contact.name,
        contact_phone: contact.phone,
        status:        'skipped',
      });
      results.push(log);
      continue;
    }

    // Add a small delay between sends to avoid provider rate limits
    if (results.length > 0) await new Promise((r) => setTimeout(r, 800));

    const result = await provider.send({ contact, message });

    const log = await DispatchModel.create({
      incident_id:   incident.id,
      contact_id:    contact.id,
      contact_name:  contact.name,
      contact_phone: contact.phone,
      status:        result.ok ? 'sent' : 'failed',
      error_message: result.ok ? null : result.note,
      sent_at:       result.ok ? new Date() : null,
    });
    results.push(log);
  }

  await IncidentModel.updateStatus(incident.id, 'dispatched');

  // Push real-time update to the operator via Socket.IO
  emitToUser(userId, 'dispatch:complete', { incident_id: incident.id, results });

  const sentCount = results.filter((r) => r.status === 'sent').length;
  logger.info(`Dispatch complete for incident ${incident.id}: ${sentCount}/${results.length} sent`);

  return results;
}

/**
 * Send a single test message to verify a contact's credentials.
 */
async function testSend({ phone, apikey }) {
  const provider = getProvider();
  return provider.send({
    contact: { phone: phone.replace(/\D/g, ''), callmebot_apikey: apikey?.trim() },
    message: '🧪 SENTINEL test — auto-dispatch is working. No emergency.',
  });
}

module.exports = { dispatch, testSend };
