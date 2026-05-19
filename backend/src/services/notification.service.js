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
 * Builds the contentVariables object for Twilio approved templates.
 *
 * The active template (HXb5b62575e6e4ff6129ad7c8efe1f983e) uses two slots:
 *   {{1}} — location string  (lat, lng + Google Maps short link)
 *   {{2}} — time of accident (HH:MM AM/PM, DD Mon YYYY)
 *
 * Adjust the mapping below if your template uses different slot meanings.
 */
function buildContentVariables({ latitude, longitude, created_at }) {
  const hasGPS = latitude != null && longitude != null;
  const lat = hasGPS ? Number(latitude).toFixed(5) : null;
  const lng = hasGPS ? Number(longitude).toFixed(5) : null;

  const locationStr = hasGPS
    ? `${lat}, ${lng} — maps.google.com/?q=${lat},${lng}`
    : 'GPS unavailable';

  const when = new Date(created_at || Date.now());
  const timeStr = when.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // {{1}} = Time of Detection, {{2}} = Location  (matches sentinel_emergency_alert template)
  return { '1': timeStr, '2': locationStr };
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

  const contentVariables = buildContentVariables(incident);

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

    const result = await provider.send({ contact, message, contentVariables });

    const log = await DispatchModel.create({
      incident_id:   incident.id,
      contact_id:    contact.id,
      contact_name:  contact.name,
      contact_phone: contact.phone,
      status:        result.status || (result.ok ? 'sent' : 'failed'),
      error_message: result.note || null,
      sent_at:       result.ok && result.status !== 'pending' ? new Date() : null,
    });
    results.push(log);
  }

  await IncidentModel.updateStatus(incident.id, 'dispatched');

  // Push real-time update to the operator via Socket.IO
  emitToUser(userId, 'dispatch:complete', { incident_id: incident.id, results });

  const sentCount = results.filter((r) => r.status === 'sent').length;
  const pendingCount = results.filter((r) => r.status === 'pending').length;
  logger.info(`Dispatch complete for incident ${incident.id}: ${sentCount}/${results.length} sent, ${pendingCount} pending`);

  return results;
}

/**
 * Send a single test message to verify a contact's credentials.
 */
async function testSend({ phone, apikey }) {
  const provider = getProvider();
  // Use dummy GPS data so template slots are populated
  const testVariables = buildContentVariables({
    latitude:   17.385044,
    longitude:  78.486671,
    created_at: new Date(),
  });
  return provider.send({
    contact:          { phone: phone.replace(/\D/g, ''), callmebot_apikey: apikey?.trim() },
    message:          '🧪 SENTINEL test — auto-dispatch is working. No emergency.',
    contentVariables: testVariables,
  });
}

module.exports = { dispatch, testSend };
