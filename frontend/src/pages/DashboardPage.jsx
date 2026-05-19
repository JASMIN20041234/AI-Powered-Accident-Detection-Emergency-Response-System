import { useState, useEffect } from 'react';
import useGPS from '../hooks/useGPS';
import useAccelerometer from '../hooks/useAccelerometer';
import useToast from '../hooks/useToast';
import LiveMap from '../components/dashboard/LiveMap';
import AccelerometerPanel from '../components/dashboard/AccelerometerPanel';
import AlertOverlay from '../components/dashboard/AlertOverlay';
import DispatchOverlay from '../components/dashboard/DispatchOverlay';
import Toast from '../components/ui/Toast';
import Btn from '../components/ui/Btn';
import * as incidentsApi from '../api/incidents.api';

const SMS_PROVIDER = (import.meta.env.VITE_SMS_PROVIDER || 'twilio').toLowerCase();
const SMS_PROVIDER_LABEL = SMS_PROVIDER === 'twilio' ? 'Twilio WhatsApp' : 'CallMeBot';
const isDispatchReady = (contact) => (
  SMS_PROVIDER === 'twilio' ? Boolean(contact.phone) : Boolean(contact.callmebot_apikey)
);

export default function DashboardPage({ contacts, setGpsStatus, pendingScenario, onScenarioConsumed }) {
  const { location, status: gpsStatus, statusMessage, refresh } = useGPS();
  const [alertActive, setAlertActive]   = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [dispatch, setDispatch]         = useState(null); // null | {results,done}
  const [recenter, setRecenter]         = useState(0);
  const [sysStatus, setSysStatus]       = useState({ label:'Operational', cls:'text-good' });
  const { toast, show } = useToast();
  const { accel, magnitude, spike } = useAccelerometer({ paused: alertActive });

  useEffect(() => { setGpsStatus?.(gpsStatus); }, [gpsStatus]);

  // Run scenario piped in from SimulatorPage
  useEffect(() => {
    if (pendingScenario && !alertActive) {
      onScenarioConsumed?.();
      spike(pendingScenario.mag, (peak) => triggerDetection(pendingScenario.event, peak));
    }
  }, [pendingScenario]);

  function triggerDetection(eventName, mag) {
    if (alertActive) return;
    setAlertActive(true);
    setCurrentEvent({ name: eventName, mag });
    setSysStatus({ label: 'ALERT — Awaiting confirmation', cls: 'text-bad' });
  }

  async function handleCancel() {
    setAlertActive(false);
    setSysStatus({ label: 'Operational', cls: 'text-good' });
    show('Alert cancelled — you reported safe');
    try {
      await incidentsApi.createIncident({
        event_type: currentEvent.name, magnitude: currentEvent.mag,
        latitude: location.lat, longitude: location.lng, accuracy: location.accuracy,
        status: 'cancelled',
      });
    } catch { /* non-critical */ }
  }

  async function handleExpired() {
    setAlertActive(false);
    setSysStatus({ label: 'Dispatching…', cls: 'text-warn' });

    let incidentId = null;
    try {
      const { data } = await incidentsApi.createIncident({
        event_type: currentEvent.name, magnitude: currentEvent.mag,
        latitude: location.lat, longitude: location.lng, accuracy: location.accuracy,
        status: 'detected',
      });
      incidentId = data.id;
    } catch { /* fall through */ }

    const pending = contacts.map((c) => ({ ...c, status: isDispatchReady(c) ? 'sending' : 'skipped' }));
    setDispatch({ results: pending, done: false });

    if (incidentId) {
      try {
        const { data } = await incidentsApi.dispatchAlert(incidentId);
        setDispatch({ results: data.results, done: true });
      } catch { setDispatch((s) => ({ ...s, done: true })); }
    } else {
      setDispatch((s) => ({ ...s, done: true }));
    }

    setSysStatus({ label: 'Operational', cls: 'text-good' });
  }

  async function handleTestSend() {
    const ready = contacts.filter(isDispatchReady);
    if (!ready.length) { show('No dispatch-ready contacts configured'); return; }
    show(`Sending test to ${ready.length} contact(s)…`);
    for (const c of ready) {
      try { await incidentsApi.testSend(c.phone, c.callmebot_apikey); } catch { /* non-critical */ }
    }
    show(`Test dispatched to ${ready.length} contact(s) ✓`);
  }

  const readyCount = contacts.filter(isDispatchReady).length;

  return (
    <div className="p-7">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 pb-[18px] border-b border-line gap-[18px] flex-wrap">
        <div>
          <h1 className="font-serif font-normal text-[38px] tracking-tight leading-none">Live <em className="italic text-accent not-italic">telemetry</em>.</h1>
          <p className="text-ink-f text-[11px] tracking-[0.2em] uppercase mt-2">Real GPS · Auto-Dispatch via WhatsApp</p>
        </div>
        <div className="flex gap-[10px] flex-wrap">
          <Btn sm ghost onClick={() => setRecenter((n) => n + 1)}>↻ Recenter</Btn>
          <Btn sm ghost onClick={refresh}>⟳ Refresh GPS</Btn>
          <Btn sm danger onClick={() => spike(3.6, (p) => triggerDetection('Manual trigger', p))}>⚠ Trigger Accident</Btn>
        </div>
      </div>

      {/* GPS Banner */}
      <div className={`flex items-center gap-[14px] p-[14px] rounded-md border mb-[18px] ${gpsStatus === 'good' ? 'border-good bg-good/[0.06]' : gpsStatus === 'bad' ? 'border-bad bg-bad/[0.08]' : 'border-accent bg-accent/[0.08]'}`}>
        <span className={`font-serif text-[28px] ${gpsStatus === 'good' ? 'text-good' : gpsStatus === 'bad' ? 'text-bad' : 'text-accent'}`}>
          {gpsStatus === 'good' ? '✓' : gpsStatus === 'bad' ? '✕' : '◉'}
        </span>
        <p className="text-[12px] leading-relaxed text-ink-dim">{statusMessage}</p>
      </div>

      {/* 2-col grid */}
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Map — flex-col so the map fills whatever height the sidebar dictates */}
        <div className="bg-panel border border-line rounded-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-line shrink-0">
            <h3 className="font-serif font-medium text-base">Live Location</h3>
            <span className="text-[10px] tracking-[0.2em] uppercase text-ink-f">OpenStreetMap · CARTO</span>
          </div>
          <div className="flex-1 min-h-[320px]">
            <LiveMap location={location} recenterTrigger={recenter} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-[18px]">
          {/* Status stats */}
          <div className="bg-panel border border-line rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-line">
              <h3 className="font-serif font-medium text-base">System Status</h3>
              <span className={`text-[10px] tracking-[0.2em] uppercase font-medium ${sysStatus.cls}`}>{sysStatus.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-line">
              {[
                { label:'GPS Latitude',  value: location.lat?.toFixed(5) ?? '—', mono:true },
                { label:'GPS Longitude', value: location.lng?.toFixed(5) ?? '—', mono:true },
                { label:'Accuracy', value: location.accuracy ? `±${Math.round(location.accuracy)}m` : '—', mono:true,
                  delta: !location.accuracy ? 'awaiting fix' : location.accuracy < 50 ? 'high precision' : location.accuracy < 200 ? 'good precision' : 'low precision',
                  deltaClass: !location.accuracy ? 'text-ink-dim' : location.accuracy < 50 ? 'text-good' : location.accuracy < 200 ? 'text-ink-dim' : 'text-warn' },
                { label:'Contacts', value: String(contacts.length),
                  delta: contacts.length === 0 ? 'none configured' : `${readyCount}/${contacts.length} auto-ready`,
                  deltaClass: contacts.length === 0 ? 'text-warn' : readyCount === contacts.length ? 'text-good' : 'text-warn' },
              ].map(({ label, value, mono, delta, deltaClass }) => (
                <div key={label} className="bg-panel p-[18px]">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-ink-f mb-2">{label}</div>
                  <div className={`font-medium ${mono ? 'font-mono text-base break-all' : 'font-serif text-[28px] tracking-tight'}`}>{value}</div>
                  {delta && <div className={`text-[11px] mt-1 ${deltaClass}`}>{delta}</div>}
                </div>
              ))}
            </div>
          </div>

          <AccelerometerPanel accel={accel} magnitude={magnitude} />

          {/* Auto-dispatch info */}
          <div className="bg-panel border border-line rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-line">
              <h3 className="font-serif font-medium text-base">Auto-Dispatch</h3>
              <span className="text-[10px] tracking-[0.2em] uppercase text-ink-f">{SMS_PROVIDER_LABEL}</span>
            </div>
            <div className="p-[18px]">
              <p className="text-[12px] text-ink-dim leading-relaxed mb-3">
                When countdown expires, alerts dispatch <b className="text-accent">automatically</b> server-side — no CORS, no taps.
              </p>
              <Btn sm ghost block onClick={handleTestSend}>⚡ Send Test Message Now</Btn>
            </div>
          </div>
        </div>
      </div>

      {alertActive && <AlertOverlay event={currentEvent} location={location} contacts={contacts} onCancel={handleCancel} onExpired={handleExpired} />}
      {dispatch && <DispatchOverlay results={dispatch.results} done={dispatch.done} onClose={() => setDispatch(null)} location={location} event={currentEvent} />}
      <Toast message={toast} />
    </div>
  );
}
