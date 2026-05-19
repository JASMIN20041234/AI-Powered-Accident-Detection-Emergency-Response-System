const logger = require('../../utils/logger');

let _client = null;

function getClient() {
  if (_client) return _client;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)');
  }
  const twilio = require('twilio');
  _client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return _client;
}

/**
 * Sends a WhatsApp message via Twilio (production-ready).
 * Contacts need to have their phone prefixed with 'whatsapp:+'.
 *
 * @param {Object} opts
 * @param {Object} opts.contact  — must have .phone
 * @param {string} opts.message
 * @returns {{ ok: boolean, note: string }}
 */
async function send({ contact, message }) {
  const { phone } = contact;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const to   = `whatsapp:+${phone}`;

  try {
    const msg = await getClient().messages.create({ from, to, body: message });
    logger.debug(`Twilio → ${to}: sid=${msg.sid} status=${msg.status}`);
    return { ok: true, note: msg.sid };
  } catch (err) {
    logger.error(`Twilio → ${to}: ${err.message}`);
    return { ok: false, note: err.message };
  }
}

module.exports = { send };
