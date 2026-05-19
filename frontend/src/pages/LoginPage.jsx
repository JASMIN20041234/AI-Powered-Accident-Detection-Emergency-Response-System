import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Field, { inputCls } from '../components/ui/Field';
import Btn from '../components/ui/Btn';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

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
      <div className="hidden md:flex flex-col justify-between p-14 border-r border-line relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,181,71,0.08), rgba(255,90,77,0.04)), #0f1218' }}>
        <div className="absolute inset-0"
          style={{ backgroundImage:'linear-gradient(rgba(255,181,71,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,181,71,0.06) 1px,transparent 1px)', backgroundSize:'40px 40px', maskImage:'radial-gradient(circle at 30% 40%, black, transparent 70%)' }} />
        <div className="font-serif font-black text-[28px] tracking-tight relative z-10">
          SENTINEL<span className="text-accent">.</span>
        </div>
        <div className="relative z-10">
          <h1 className="font-serif font-light text-[64px] leading-[0.95] tracking-[-0.04em] mb-6">
            Auto-<em className="italic font-medium text-accent not-italic">dispatch</em><br />when seconds<br />matter.
          </h1>
          <p className="text-ink-dim max-w-[380px] leading-relaxed">
            Real-time accident detection with live GPS and fully automatic WhatsApp emergency alerts — no taps required.
          </p>
        </div>
        <div className="relative z-10 flex justify-between text-ink-f text-[11px] uppercase tracking-[0.2em]">
          <span>v1.0 / PERN Stack</span><span>Powered by CallMeBot</span>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-14 bg-bg">
        <form onSubmit={handleSubmit} className="w-full max-w-[380px]">
          <div className="text-ink-f text-[11px] tracking-[0.2em] uppercase mb-6">01 — Authentication</div>
          <h2 className="font-serif font-medium text-[36px] tracking-tight mb-2">Sign in.</h2>
          <p className="text-ink-dim mb-9 leading-relaxed">Operator credentials required to manage contacts and monitor telemetry.</p>

          <Field label="Username">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className={inputCls} />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls} />
          </Field>

          <Btn type="submit" block disabled={loading}>{loading ? 'Authenticating…' : 'Authenticate →'}</Btn>
          {error && <p className="text-bad text-[11px] mt-3">{error}</p>}

          <div className="mt-6 p-[14px] bg-panel border border-dashed border-line-s rounded text-[11px] text-ink-dim leading-[1.7]">
            <b className="text-accent">DEMO CREDENTIALS</b><br />
            Username: <b className="text-accent">admin</b> &nbsp;·&nbsp; Password: <b className="text-accent">sentinel</b>
          </div>
        </form>
      </div>
    </div>
  );
}
