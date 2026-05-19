import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { to: '/',          label: 'Dashboard',    end: true },
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
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-7 py-[14px] border-b border-line bg-bg-2 sticky top-0 z-50 gap-3 flex-wrap">
      <div className="font-serif font-black text-xl tracking-tight">
        SENTINEL<span className="text-accent">.</span>
      </div>

      <nav className="flex gap-1 flex-wrap">
        {NAV.map(({ to, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            className={({ isActive }) =>
              `px-[14px] py-2 rounded text-[11px] tracking-[0.15em] uppercase font-mono transition-colors border-none bg-transparent cursor-pointer
               ${isActive ? 'text-accent bg-panel' : 'text-ink-dim hover:text-ink hover:bg-panel'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 text-ink-dim text-[11px] tracking-[0.1em] uppercase">
        <span className={`w-2 h-2 rounded-full ${GPS_DOT[gpsStatus] || GPS_DOT.pending}`} />
        <span>{user?.username} · Online</span>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="px-3 py-2 text-[11px] tracking-[0.15em] uppercase font-mono border border-line-s rounded bg-transparent text-ink hover:bg-panel-2 hover:text-accent transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
