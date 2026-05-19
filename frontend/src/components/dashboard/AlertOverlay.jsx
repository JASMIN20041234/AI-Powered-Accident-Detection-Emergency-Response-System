import { useEffect, useRef, useState } from 'react';

const CIRC     = 439.82;
const DURATION = 30;

export default function AlertOverlay({ event, location, contacts, onCancel, onExpired }) {
  const [remaining, setRemaining] = useState(DURATION);
  const [offset, setOffset]       = useState(0);

  // Keep a ref so the expiry effect always calls the latest onExpired
  // without needing it as a dependency (avoids stale-closure issues)
  const onExpiredRef = useRef(onExpired);
  useEffect(() => { onExpiredRef.current = onExpired; });

  useEffect(() => {
    setRemaining(DURATION);
    requestAnimationFrame(() => setOffset(CIRC));

    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(id); return 0; }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // Fire onExpired AFTER render completes — never inside a state updater
  useEffect(() => {
    if (remaining === 0) onExpiredRef.current();
  }, [remaining]);

  const readyCount = contacts.filter((c) => c.callmebot_apikey).length;

  return (
    <div className="fixed inset-0 bg-bg/[0.92] backdrop-blur-lg z-[1000] flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-panel border border-accent-2 rounded-lg max-w-[520px] w-full overflow-hidden shadow-[0_0_60px_rgba(255,90,77,0.3)]">

        <div className="flex items-center gap-3 px-6 py-3 text-white text-[11px] tracking-[0.3em] uppercase font-bold animate-strip-flash">
          <span className="w-[10px] h-[10px] bg-white rounded-full animate-blink" />
          Impact Detected — Severity High
        </div>

        <div className="p-7">
          <h2 className="font-serif font-medium text-[32px] tracking-tight mb-2">Are you okay?</h2>
          <p className="text-ink-dim mb-6 text-sm leading-relaxed">
            A high-impact event was detected. Alerts will{' '}
            <b className="text-accent-2">dispatch automatically</b> when countdown ends.
          </p>

          {/* Ring */}
          <div className="relative w-40 h-40 mx-auto mb-5">
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="#232a3d" strokeWidth="6" />
              <circle cx="80" cy="80" r="70" fill="none" stroke="#ff5a4d" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
                className="countdown-fill"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-serif font-medium text-[56px] text-accent-2 leading-none">
              {remaining}
            </div>
          </div>

          {/* Meta */}
          <div className="bg-bg-2 border border-line rounded p-[14px] mb-5 text-[12px] space-y-2">
            {[
              ['Event',         event?.name ?? '—'],
              ['Magnitude',     event ? `${event.mag.toFixed(2)} g` : '—'],
              ['Location',      location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'NO GPS FIX'],
              ['Dispatching to', `${readyCount} of ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <span className="text-ink-f uppercase tracking-[0.1em] text-[10px]">{k}</span>
                <span className="text-right">{v}</span>
              </div>
            ))}
          </div>

          <button onClick={onCancel}
            className="w-full py-3 rounded font-mono text-[12px] tracking-[0.15em] uppercase font-medium cursor-pointer border-none"
            style={{ background: '#4ade80', color: '#0a2615' }}>
            I'M SAFE — CANCEL ALERT
          </button>
        </div>
      </div>
    </div>
  );
}
