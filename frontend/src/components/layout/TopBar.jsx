import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const NAV = [
  { to: '/',          label: 'Dashboard',   end: true },
  { to: '/contacts',  label: 'Contacts' },
  { to: '/history',   label: 'History' },
  { to: '/simulator', label: 'AI Simulator' },
  { to: '/setup',     label: 'Setup Guide' },
];

const GPS_DOT = {
  good:    'bg-good shadow-[0_0_8px_#4ade80] animate-pulse-good',
  bad:     'bg-bad  shadow-[0_0_8px_#ef4444]',
  pending: 'bg-warn',
};

export default function TopBar({ gpsStatus }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-bg-2 border-b border-line">
      {/* Top row — logo + actions */}
      <div className="flex items-center justify-between px-4 md:px-7 py-3 gap-3">
        <div className="font-serif font-black text-xl tracking-tight shrink-0">
          SENTINEL<span className="text-accent">.</span>
        </div>

        <div className="flex items-center gap-2 text-ink-dim text-[11px] tracking-[0.1em] uppercase">
          <span className={`w-2 h-2 rounded-full shrink-0 ${GPS_DOT[gpsStatus] || GPS_DOT.pending}`} />
          <span className="hidden sm:inline">{user?.username} · Online</span>

          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 flex items-center justify-center rounded border border-line-s bg-transparent hover:bg-panel transition-colors cursor-pointer text-base shrink-0"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="px-3 py-2 text-[11px] tracking-[0.15em] uppercase font-mono border border-line-s rounded bg-transparent text-ink hover:bg-panel-2 hover:text-accent transition-colors cursor-pointer shrink-0"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Nav strip — scrollable on mobile */}
      <nav className="flex gap-1 overflow-x-auto px-4 md:px-7 pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        {NAV.map(({ to, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            className={({ isActive }) =>
              `shrink-0 px-[14px] py-[6px] rounded text-[11px] tracking-[0.15em] uppercase font-mono transition-colors border-none bg-transparent cursor-pointer
               ${isActive ? 'text-accent bg-panel' : 'text-ink-dim hover:text-ink hover:bg-panel'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
