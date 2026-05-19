const logger = require('../../utils/logger');

const ENDPOINT = process.env.CALLMEBOT_ENDPOINT || 'https://api.callmebot.com/whatsapp.php';

/**
 * Sends a WhatsApp message via CallMeBot (free, personal use).
 * @param {Object} opts
 * @param {Object} opts.contact  — must have .phone and .callmebot_apikey
 * @param {string} opts.message
 * @returns {{ ok: boolean, note: string }}
 */
async function send({ contact, message }) {
  const { phone, callmebot_apikey: apikey } = contact;

  if (!phone || !apikey) {
    return { ok: false, note: 'missing phone or apikey' };
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set('phone',  phone);
  url.searchParams.set('text',   message);
  url.searchParams.set('apikey', apikey);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(20_000),
    });

    if (res.ok) {
      logger.debug(`CallMeBot → +${phone}: sent`);
      return { ok: true, note: 'sent' };
    }

    const body = await res.text();
    logger.warn(`CallMeBot → +${phone}: HTTP ${res.status} — ${body.slice(0, 120)}`);
    return { ok: false, note: body.slice(0, 200) };
  } catch (err) {
    const note = err.name === 'TimeoutError' ? 'request timed out' : err.message;
    logger.error(`CallMeBot → +${phone}: ${note}`);
    return { ok: false, note };
  }
}

module.exports = { send };
