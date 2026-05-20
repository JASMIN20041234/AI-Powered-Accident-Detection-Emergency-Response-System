import { useState, useEffect } from 'react';
import * as incidentsApi from '../api/incidents.api';
import Btn from '../components/ui/Btn';
import Toast from '../components/ui/Toast';
import useToast from '../hooks/useToast';

function LogRow({ incident }) {
  const logs    = incident.dispatch_logs || [];
  const sent    = logs.filter((l) => l.status === 'sent').length;
  const dispatched = incident.status === 'dispatched';

  return (
    <div className="bg-panel px-4 py-4 flex items-center gap-3 border-b border-line last:border-b-0">
      <div className={`w-9 h-9 rounded-full bg-bg-2 border flex items-center justify-center font-serif font-bold shrink-0 ${dispatched ? 'border-accent-2 text-accent-2' : 'border-line-s text-ink-f'}`}>
        {dispatched ? '!' : 'x'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-serif text-[14px] md:text-[15px] mb-[2px] truncate">{incident.event_type} · {Number(incident.magnitude).toFixed(2)}g</div>
        <div className="text-[11px] text-ink-f">
          {new Date(incident.created_at).toLocaleString()}
          {incident.latitude && <span className="hidden sm:inline"> · {Number(incident.latitude).toFixed(4)}, {Number(incident.longitude).toFixed(4)}</span>}
        </div>
        {logs.length > 0 && <div className="text-[11px] text-good mt-1">{sent}/{logs.length} delivered</div>}
      </div>
      <span className={`shrink-0 text-[10px] tracking-[0.2em] uppercase px-[10px] py-1 rounded-full border ${dispatched ? 'text-accent-2 border-accent-2' : 'text-ink-dim border-line-s'}`}>
        {incident.status}
      </span>
    </div>
  );
}

export default function HistoryPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const { toast, show }           = useToast();

  async function load() {
    try { const { data } = await incidentsApi.getIncidents(); setIncidents(data); }
    catch { show('Failed to load history'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function clearAll() {
    if (!confirm('Clear all incident logs?')) return;
    try { await incidentsApi.clearIncidents(); setIncidents([]); show('Logs cleared'); }
    catch { show('Clear failed'); }
  }

  return (
    <div className="p-4 md:p-7">
      <div className="flex items-start justify-between mb-6 pb-[18px] border-b border-line gap-3 flex-wrap">
        <div>
          <h1 className="font-serif font-normal text-[26px] md:text-[38px] tracking-tight leading-none">
            Incident <em className="italic text-accent not-italic">history</em>.
          </h1>
          <p className="text-ink-f text-[11px] tracking-[0.2em] uppercase mt-2">Every event with dispatch outcome and delivery status</p>
        </div>
        <Btn sm ghost onClick={clearAll}>Clear All</Btn>
      </div>

      {loading ? (
        <div className="text-center py-16 text-ink-f">Loading…</div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-16 text-ink-f">
          <div className="font-serif text-[72px] text-accent opacity-40 mb-3">∅</div>
          <div className="font-serif italic text-lg mb-3">No incidents recorded</div>
          <p>Trigger an event from the dashboard or simulator to see it here.</p>
        </div>
      ) : (
        <div className="bg-panel border border-line rounded-md overflow-hidden">
          {incidents.map((inc) => <LogRow key={inc.id} incident={inc} />)}
        </div>
      )}
      <Toast message={toast} />
    </div>
  );
}
