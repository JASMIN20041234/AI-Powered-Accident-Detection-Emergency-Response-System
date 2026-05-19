const STATUS = {
  pending: 'text-warn  border-warn',
  sending: 'text-accent border-accent',
  sent:    'text-good  border-good',
  failed:  'text-bad   border-bad',
  skipped: 'text-ink-dim border-line-s',
};

const LABEL = {
  pending: 'queued',
  sending: 'sending...',
  sent:    'sent',
  failed:  'failed',
  skipped: 'skipped',
};

function Badge({ status }) {
  return (
    <span className={`text-[10px] tracking-[0.15em] uppercase px-[10px] py-1 rounded-full border inline-flex items-center gap-[6px] ${STATUS[status] || ''}`}>
      {status === 'sending' && <span className="w-[10px] h-[10px] border-2 border-line-s border-t-accent rounded-full animate-spin inline-block" />}
      {LABEL[status] || status}
    </span>
  );
}

/** Builds a free wa.me share URL — no API key needed */
function buildWALink({ phone, location, event, time }) {
  const lat   = location?.lat;
  const lng   = location?.lng;
  const hasGPS = lat != null && lng != null;

  const mapUrl = hasGPS
    ? `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`
    : null;

  const lines = [
    '🚨 *SENTINEL Emergency Alert*',
    '',
    `A possible accident has been detected${event ? ` (${event.name}, ${event.mag.toFixed(2)}g)` : ''}.`,
    'Immediate attention required.',
    '',
    hasGPS ? `📍 *Location:*\n${lat.toFixed(5)}, ${lng.toFixed(5)}\n${mapUrl}` : '📍 Location: GPS unavailable',
    '',
    `🕐 *Time:* ${time}`,
    '',
    '⚠️ Please call this person now or contact emergency services immediately.',
    '',
    '— SENTINEL Auto-Dispatch System',
  ];

  const text = encodeURIComponent(lines.join('\n'));

  // If a phone number is given, open chat directly with that contact
  const base = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}`
    : 'https://wa.me';

  return `${base}?text=${text}`;
}

export default function DispatchOverlay({ results, done, onClose, location, event }) {
  const now     = new Date().toLocaleString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const sent    = results.filter((r) => r.status === 'sent').length;
  const pending = results.filter((r) => r.status === 'pending').length;
  const failed  = results.filter((r) => r.status === 'failed').length;
  const total   = results.filter((r) => r.status !== 'skipped').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  const broadcastLink = buildWALink({ location, event, time: now });

  return (
    <div className="fixed inset-0 bg-bg/[0.94] backdrop-blur-lg z-[1001] flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-panel border border-line-s rounded-lg max-w-[560px] w-full overflow-hidden">

        <div className="px-6 py-3 bg-wa text-[#06270f] text-[11px] tracking-[0.3em] uppercase font-bold">
          {done ? `Complete — ${sent}/${total} delivered` : 'Dispatching emergency alerts...'}
        </div>

        <div className="p-6 pb-7">
          <h2 className="font-serif font-medium text-[28px] tracking-tight mb-2">
            {done ? 'Dispatch checked.' : 'Sending alerts.'}
          </h2>
          <p className="text-ink-dim text-[13px] leading-relaxed mb-5">
            {done
              ? `Delivered: ${sent}. Pending: ${pending}. Failed: ${failed}.${skipped ? ` Skipped: ${skipped}.` : ''}`
              : 'Auto-dispatching via notification service. This may take a few seconds.'}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-5 text-ink-f">No contacts configured.</div>
          ) : (
            <div className="border border-line rounded overflow-hidden mb-[18px]">
              {results.map((r, i) => {
                const phone = r.contact_phone || r.phone;
                const isFailed = r.status === 'failed' || r.status === 'skipped';
                const waLink = isFailed
                  ? buildWALink({ phone, location, event, time: now })
                  : null;

                return (
                  <div key={i} className={`flex items-center justify-between px-[14px] py-3 gap-3 ${i < results.length - 1 ? 'border-b border-line' : ''}`}>
                    <div className="min-w-0">
                      <div className="font-medium text-[13px]">{r.contact_name || r.name}</div>
                      <div className="text-ink-f text-[11px]">+{phone}</div>
                      {r.error_message && (
                        <div className="text-bad text-[10px] mt-1 max-w-[300px] break-words">{r.error_message}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Per-contact WhatsApp share for failed/skipped entries */}
                      {waLink && done && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Share alert directly to +${phone} on WhatsApp`}
                          className="inline-flex items-center gap-1 px-[10px] py-1 rounded-full border border-[#25D366] text-[#25D366] text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-[#25D366]/10 transition-colors no-underline">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Share
                        </a>
                      )}
                      <Badge status={r.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Broadcast share — opens WhatsApp, user picks any contact */}
          {done && (
            <a
              href={broadcastLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded font-mono text-[12px] tracking-[0.15em] uppercase font-medium no-underline mb-3"
              style={{ background: '#25D366', color: '#06270f' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share Live Location on WhatsApp
            </a>
          )}

          <button onClick={onClose} disabled={!done}
            className="w-full py-3 rounded font-mono text-[12px] tracking-[0.15em] uppercase font-medium cursor-pointer border-none bg-accent text-bg hover:bg-[#ffc875] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
