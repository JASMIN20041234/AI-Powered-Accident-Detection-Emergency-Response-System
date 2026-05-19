function Panel({ title, children }) {
  return (
    <div className="bg-panel border border-line rounded-md overflow-hidden">
      <div className="px-[18px] py-[14px] border-b border-line">
        <h3 className="font-serif font-medium text-base">{title}</h3>
      </div>
      <div className="p-[18px] text-ink-dim text-[13px] leading-[1.7]">{children}</div>
    </div>
  );
}

export default function SetupGuidePage() {
  return (
    <div className="p-7">
      <div className="mb-6 pb-[18px] border-b border-line">
        <h1 className="font-serif font-normal text-[38px] tracking-tight leading-none">
          Setup <em className="italic text-accent not-italic">guide</em>.
        </h1>
        <p className="text-ink-f text-[11px] tracking-[0.2em] uppercase mt-2">How to enable auto-dispatch and connect hardware</p>
      </div>

      <div className="grid gap-[18px] md:grid-cols-2">
        <Panel title="How auto-dispatch works">
          <p className="mb-[14px]">SENTINEL uses the free <b className="text-accent">CallMeBot</b> API (or <b className="text-accent">Twilio</b> in production) to send WhatsApp messages <b className="text-ink">server-side</b> — eliminating the browser CORS issue from the original prototype.</p>
          <p className="mb-[14px]">Each contact performs a <b className="text-ink">one-time setup</b> on their phone. After setup they receive an API key that SENTINEL uses to dispatch alerts.</p>
          <p>Switch providers by setting <code className="bg-bg-2 px-1 rounded font-mono text-[11px] text-accent">SMS_PROVIDER=twilio</code> in <code className="bg-bg-2 px-1 rounded font-mono text-[11px]">.env</code>.</p>
        </Panel>

        <Panel title="Setup steps per contact">
          <ol className="list-decimal pl-5 space-y-[10px]">
            <li>Save <code className="font-mono bg-bg-2 px-1 rounded text-accent text-[11px]">+34 644 51 95 23</code> as a phone contact (any name).</li>
            <li>Open WhatsApp and send: <code className="font-mono bg-bg-2 px-1 rounded text-[11px]">I allow callmebot to send me messages</code></li>
            <li>Bot replies within ~2 min with: <i>"Your APIKEY is XXXXXXX"</i></li>
            <li>Add the contact in SENTINEL with their phone number and that API key.</li>
            <li>They'll receive emergency alerts automatically from the server.</li>
          </ol>
        </Panel>
      </div>

      <div className="mt-[18px]">
        <Panel title="ESP32 / GPS-GSM Hardware Integration">
          <p className="mb-[14px]">The backend includes a <b className="text-accent">device telemetry API</b> ready for ESP32 integration. No code changes needed — just POST sensor data:</p>
          <div className="bg-bg-2 border border-line rounded p-[14px] font-mono text-[12px] space-y-[6px] mb-[14px]">
            <div><span className="text-accent">POST</span> <span className="text-ink">/api/devices/register</span>   <span className="text-ink-f">— register your device (once)</span></div>
            <div><span className="text-accent">POST</span> <span className="text-ink">/api/telemetry</span>            <span className="text-ink-f">— stream accel + GPS readings</span></div>
            <div><span className="text-good">GET</span>  <span className="text-ink">/api/devices</span>              <span className="text-ink-f">— list registered devices</span></div>
          </div>
          <p className="mb-[14px]">When the server receives telemetry with <b className="text-ink">magnitude &gt; 2.5g</b>, it creates an incident record and pushes a real-time alert to the operator via <b className="text-accent">Socket.IO</b> — the browser shows the alert immediately, no polling.</p>
          <div className="bg-bg-2 border border-line rounded p-[14px] font-mono text-[12px] text-ink-dim">
            {`// Minimal ESP32 payload (JSON over HTTPS)\n{\n  "device_id": "ESP32-A4B2",\n  "accel_x": 1.23,\n  "accel_y": -4.56,\n  "accel_z": 0.91,\n  "latitude": 17.38501,\n  "longitude": 78.48670,\n  "battery_level": 87\n}`}
          </div>
        </Panel>
      </div>
    </div>
  );
}
