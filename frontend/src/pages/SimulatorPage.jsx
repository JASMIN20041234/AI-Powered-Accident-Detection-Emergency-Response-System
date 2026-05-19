import ScenarioCard from '../components/simulator/ScenarioCard';

const SCENARIOS = [
  { name:'Highway Collision',    desc:'Sudden high-impact frontal collision at speed.',           mag:4.8, severity:'high',     event:'High-impact collision'  },
  { name:'Side Impact (T-bone)', desc:'Lateral force from an intersection collision.',             mag:3.9, severity:'high',     event:'Side-impact collision'  },
  { name:'Rollover Event',       desc:'Vehicle rollover — multi-axis chaotic readings.',           mag:5.2, severity:'critical', event:'Vehicle rollover'       },
  { name:'Minor Fender Bender', desc:'Low-speed impact. Near threshold — cancellable.',           mag:2.7, severity:'low',     event:'Minor fender bender'    },
  { name:'Pothole (False +)',    desc:'Sharp bump triggers detection. Demonstrates cancel flow.', mag:2.6, severity:'low',     event:'Suspected jolt'         },
  { name:'Two-Wheeler Crash',    desc:'Motorcycle accident — high X and Y spikes from fall.',     mag:4.1, severity:'high',     event:'Two-wheeler accident'   },
];

export default function SimulatorPage({ onRunScenario }) {
  return (
    <div className="p-7">
      <div className="mb-6 pb-[18px] border-b border-line">
        <h1 className="font-serif font-normal text-[38px] tracking-tight leading-none">
          AI accident <em className="italic text-accent not-italic">simulator</em>.
        </h1>
        <p className="text-ink-f text-[11px] tracking-[0.2em] uppercase mt-2">Replay realistic scenarios — full pipeline with real GPS and server-side dispatch</p>
      </div>

      <div className="bg-panel border border-line rounded-md p-[18px] mb-5">
        <p className="text-ink-dim text-[12px] leading-[1.7]">
          Each scenario feeds synthetic accelerometer data. If magnitude exceeds 2.5g, the emergency workflow activates using your real GPS location, giving you 30 seconds to cancel before alerts auto-dispatch from the server.
        </p>
      </div>

      <div className="grid gap-[14px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {SCENARIOS.map((s, i) => (
          <ScenarioCard key={s.name} scenario={s} index={i} onClick={() => onRunScenario(s)} />
        ))}
      </div>
    </div>
  );
}
