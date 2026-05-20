import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Field, { inputCls } from '../components/ui/Field';
import Btn from '../components/ui/Btn';

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(username, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Invalid credentials'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Art panel */}
      <div className="hidden md:flex flex-col justify-start p-14 border-r border-line relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,181,71,0.08), rgba(255,90,77,0.04)), #0f1218' }}>
        <div className="absolute inset-0"
          style={{ backgroundImage:'linear-gradient(rgba(255,181,71,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,181,71,0.06) 1px,transparent 1px)', backgroundSize:'40px 40px', maskImage:'radial-gradient(circle at 30% 40%, black, transparent 70%)' }} />
        <div className="font-serif font-black text-[28px] tracking-tight relative z-10" style={{ color: '#e8e9ec' }}>
          SENTINEL<span className="text-accent">.</span>
        </div>
        <div className="relative z-10 my-auto">
          <h1 className="font-serif font-light text-[64px] leading-[0.95] tracking-[-0.04em] mb-6" style={{ color: '#e8e9ec' }}>
            Auto-<em className="italic font-medium text-accent not-italic">dispatch</em><br />when seconds<br />matter.
          </h1>
          <p className="max-w-[380px] leading-relaxed" style={{ color: '#8a93a6' }}>
            Real-time accident detection with live GPS and fully automatic WhatsApp emergency alerts — no taps required.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-14 bg-bg">
        <form onSubmit={handleSubmit} className="w-full max-w-[380px]">
          <h2 className="font-serif font-medium text-[36px] tracking-tight mb-2">Sign in.</h2>
          <p className="text-ink-dim mb-9 leading-relaxed">Operator credentials required to manage contacts and monitor telemetry.</p>

          <Field label="Username">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="off" className={inputCls} />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-f hover:text-ink transition-colors cursor-pointer bg-transparent border-none p-0"
                tabIndex={-1}
              >
                <EyeIcon open={showPwd} />
              </button>
            </div>
          </Field>

          <Btn type="submit" block disabled={loading}>{loading ? 'Authenticating…' : 'Authenticate →'}</Btn>
          {error && <p className="text-bad text-[11px] mt-3">{error}</p>}

        </form>
      </div>
    </div>
  );
}
