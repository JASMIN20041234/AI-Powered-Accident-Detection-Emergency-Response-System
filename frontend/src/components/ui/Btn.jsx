/**
 * Reusable button with variant support.
 * variant: 'primary' | 'ghost' | 'danger' | 'wa'
 */
const VARIANTS = {
  primary: 'bg-accent text-bg hover:bg-[#ffc875]',
  ghost:   'bg-transparent border border-line-s text-ink hover:bg-panel-2 hover:text-accent',
  danger:  'bg-accent-2 text-white hover:bg-[#ff7466]',
  wa:      'bg-wa text-[#06270f] hover:bg-[#2ee47a]',
};

export default function Btn({ children, variant = 'primary', sm, block, disabled, onClick, type = 'button', className = '' }) {
  const size  = sm ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-[12px]';
  const width = block ? 'w-full' : '';
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-mono tracking-[0.15em] uppercase rounded border-none cursor-pointer transition-colors
        ${VARIANTS[variant]} ${size} ${width} disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
