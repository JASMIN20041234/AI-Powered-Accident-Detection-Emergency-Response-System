const logger = require('../../utils/logger');

let _client = null;

const TERMINAL_FAILURE_STATUSES = new Set(['failed', 'undelivered']);
const DELIVERY_SUCCESS_STATUSES = new Set(['sent', 'delivered', 'read']);
const TRANSIENT_STATUSES = new Set(['accepted', 'queued', 'sending']);

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

function normalizePhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  const defaultCountryCode = String(process.env.TWILIO_DEFAULT_COUNTRY_CODE || '').replace(/\D/g, '');

  if (!digits) return null;
  if (defaultCountryCode && digits.length === 10) return `${defaultCountryCode}${digits}`;
  return digits;
}

function statusNote(msg) {
  return [
    msg.sid,
    `status=${msg.status}`,
    msg.errorCode ? `errorCode=${msg.errorCode}` : null,
    msg.errorMessage ? `error=${msg.errorMessage}` : null,
  ].filter(Boolean).join(' ');
}

async function waitForDeliveryStatus(sid) {
  const client = getClient();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1500));

    const msg = await client.messages(sid).fetch();
    if (TERMINAL_FAILURE_STATUSES.has(msg.status) || DELIVERY_SUCCESS_STATUSES.has(msg.status)) {
      return msg;
    }
  }

  return client.messages(sid).fetch();
}

/**
 * Sends a WhatsApp message via Twilio.
 *
 * Template mode is used when TWILIO_CONTENT_SID is set. Free-text mode is
 * only usable inside the WhatsApp 24-hour customer care window or sandbox.
 */
async function send({ contact, message, contentVariables }) {
  const phone = normalizePhone(contact.phone);
  if (!phone) return { ok: false, status: 'failed', note: 'missing WhatsApp phone number' };

  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const to = `whatsapp:+${phone}`;
  const contentSid = process.env.TWILIO_CONTENT_SID;

  const params = contentSid
    ? {
        from,
        to,
        contentSid,
        contentVariables: JSON.stringify(contentVariables || {}),
      }
    : {
        from,
        to,
        body: message,
      };

  try {
    const created = await getClient().messages.create(params);
    logger.info(`Twilio -> ${to}: sid=${created.sid} initial=${created.status} mode=${contentSid ? 'template' : 'freetext'}`);

    const msg = TRANSIENT_STATUSES.has(created.status)
      ? await waitForDeliveryStatus(created.sid)
      : created;
    const note = statusNote(msg);

    if (TERMINAL_FAILURE_STATUSES.has(msg.status)) {
      logger.error(`Twilio -> ${to}: ${note}`);
      return { ok: false, status: 'failed', note };
    }

    if (DELIVERY_SUCCESS_STATUSES.has(msg.status)) {
      logger.info(`Twilio -> ${to}: ${note}`);
      return { ok: true, status: 'sent', note };
    }

    logger.warn(`Twilio -> ${to}: still pending after provider check: ${note}`);
    return { ok: true, status: 'pending', note };
  } catch (err) {
    const note = [err.message, err.code ? `code=${err.code}` : null, err.moreInfo].filter(Boolean).join(' ');
    logger.error(`Twilio -> ${to}: ${note}`);
    return { ok: false, status: 'failed', note };
  }
}

module.exports = { send };
