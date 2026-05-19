const CAP = 4;

function Axis({ label, value }) {
  return (
    <div className="bg-bg-2 border border-line rounded p-3 text-center">
      <div className="font-serif font-bold text-[14px] text-accent mb-1">{label}</div>
      <div className="font-mono text-xl font-medium">{value.toFixed(2)}</div>
      <div className="h-1 bg-line rounded mt-2 overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-200 origin-left"
          style={{ transform: `scaleX(${Math.min(1, Math.abs(value) / CAP)})` }}
        />
      </div>
    </div>
  );
}

export default function AccelerometerPanel({ accel, magnitude }) {
  return (
    <div className="bg-panel border border-line rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-line">
        <h3 className="font-serif font-medium text-base">Accelerometer</h3>
        <span className="text-[10px] tracking-[0.2em] uppercase text-ink-f">Threshold: 2.5g</span>
      </div>
      <div className="p-[18px]">
        <div className="grid grid-cols-3 gap-3">
          <Axis label="X" value={accel.x} />
          <Axis label="Y" value={accel.y} />
          <Axis label="Z" value={accel.z} />
        </div>
        <div className="flex justify-between text-[11px] mt-[14px]">
          <span className="text-ink-f uppercase tracking-[0.1em]">Magnitude</span>
          <span className="font-medium">{magnitude.toFixed(2)} g</span>
        </div>
      </div>
    </div>
  );
}
