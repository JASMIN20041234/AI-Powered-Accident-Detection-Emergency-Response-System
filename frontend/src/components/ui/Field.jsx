/** Form field wrapper with consistent label + input styling */
export default function Field({ label, hint, children }) {
  return (
    <div className="mb-[18px]">
      {label && (
        <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-f mb-2">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-[11px] text-ink-f mt-[6px] leading-relaxed">{hint}</p>}
    </div>
  );
}

export const inputCls =
  'w-full bg-panel border border-line text-ink px-[14px] py-3 font-mono text-[13px] rounded outline-none focus:border-accent focus:bg-panel-2 transition-colors';
