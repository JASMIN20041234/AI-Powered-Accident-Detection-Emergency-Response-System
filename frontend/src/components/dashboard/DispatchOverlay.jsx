const STATUS = {
  pending: 'text-warn  border-warn',
  sending: 'text-accent border-accent',
  sent:    'text-good  border-good',
  failed:  'text-bad   border-bad',
  skipped: 'text-ink-dim border-line-s',
};
const LABEL = { pending:'queued', sending:'sending…', sent:'✓ sent', failed:'✕ failed', skipped:'no key · skipped' };

function Badge({ status }) {
  return (
    <span className={`text-[10px] tracking-[0.15em] uppercase px-[10px] py-1 rounded-full border inline-flex items-center gap-[6px] ${STATUS[status] || ''}`}>
      {status === 'sending' && <span className="w-[10px] h-[10px] border-2 border-line-s border-t-accent rounded-full animate-spin inline-block" />}
      {LABEL[status] || status}
    </span>
  );
}

export default function DispatchOverlay({ results, done, onClose }) {
  const sent    = results.filter((r) => r.status === 'sent').length;
  const total   = results.filter((r) => r.status !== 'skipped').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  return (
    <div className="fixed inset-0 bg-bg/[0.94] backdrop-blur-lg z-[1001] flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-panel border border-line-s rounded-lg max-w-[560px] w-full overflow-hidden">

        <div className="px-6 py-3 bg-wa text-[#06270f] text-[11px] tracking-[0.3em] uppercase font-bold">
          {done ? `✓ Complete — ${sent}/${total} delivered` : '⚡ Dispatching emergency alerts…'}
        </div>

        <div className="p-6 pb-7">
          <h2 className="font-serif font-medium text-[28px] tracking-tight mb-2">
            {done ? 'Alerts dispatched.' : 'Sending alerts.'}
          </h2>
          <p className="text-ink-dim text-[13px] leading-relaxed mb-5">
            {done
              ? `Sent to ${sent} contact${sent !== 1 ? 's' : ''} via WhatsApp.${skipped ? ` ${skipped} skipped (no API key).` : ''}`
              : 'Auto-dispatching via notification service. This may take 5–15 seconds.'}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-5 text-ink-f">No contacts configured.</div>
          ) : (
            <div className="border border-line rounded overflow-hidden mb-[18px]">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center justify-between px-[14px] py-3 gap-3 ${i < results.length - 1 ? 'border-b border-line' : ''}`}>
                  <div>
                    <div className="font-medium text-[13px]">{r.contact_name || r.name}</div>
                    <div className="text-ink-f text-[11px]">+{r.contact_phone || r.phone}</div>
                  </div>
                  <Badge status={r.status} />
                </div>
              ))}
            </div>
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
