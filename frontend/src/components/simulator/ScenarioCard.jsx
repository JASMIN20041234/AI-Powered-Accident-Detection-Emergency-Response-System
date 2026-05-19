export default function ScenarioCard({ scenario, index, onClick }) {
  return (
    <div onClick={onClick}
      className="bg-panel border border-line rounded-md p-5 cursor-pointer relative overflow-hidden hover:border-accent hover:-translate-y-[2px] transition-all">
      <div className="absolute top-3 right-4 font-serif font-black text-[48px] text-line-s leading-none select-none">
        {String(index + 1).padStart(2, '0')}
      </div>
      <h4 className="font-serif font-medium text-[18px] tracking-tight mb-2 relative">{scenario.name}</h4>
      <p className="text-ink-dim text-[12px] leading-relaxed mb-[14px] relative">{scenario.desc}</p>
      <div className="flex gap-3 text-[10px] text-ink-f uppercase tracking-[0.1em] relative">
        <span>Peak: <b className="text-accent font-medium">{scenario.mag}g</b></span>
        <span>{scenario.severity}</span>
      </div>
    </div>
  );
}
