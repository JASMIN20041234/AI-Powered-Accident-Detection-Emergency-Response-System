import { useState, useEffect, useRef } from 'react';

export default function useAccelerometer({ paused = false } = {}) {
  const [accel, setAccel]         = useState({ x: 0, y: 0, z: 1 });
  const [magnitude, setMagnitude] = useState(1);
  const timerRef = useRef(null);

  function tick() {
    const x = (Math.random() - 0.5) * 0.3;
    const y = (Math.random() - 0.5) * 0.3;
    const z = 1 + (Math.random() - 0.5) * 0.2;
    const mag = Math.sqrt(x * x + y * y + z * z);
    setAccel({ x, y, z });
    setMagnitude(mag);
  }

  /** Animate a spike pattern and call onDone(peakMag) when finished. */
  function spike(peakMag, onDone) {
    let step = 0;
    const total = 14;
    let peak = 0;
    const id = setInterval(() => {
      step++;
      const t = step / total;
      const d = (t - 0.5) * 4;
      const bell = Math.exp(-(d * d));
      const p    = peakMag * bell;
      const sign = step % 2 === 0 ? 1 : -1;
      const x = (Math.random() * 0.6 + 0.4) * p * sign * 0.7;
      const y = (Math.random() * 0.6 + 0.4) * p * sign * 0.8;
      const z = 1 + Math.random() * 0.4 * p;
      const mag = Math.sqrt(x * x + y * y + z * z);
      peak = Math.max(peak, mag);
      setAccel({ x, y, z });
      setMagnitude(mag);
      if (step >= total) { clearInterval(id); onDone?.(peak); }
    }, 60);
  }

  useEffect(() => {
    if (paused) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(tick, 800);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  return { accel, magnitude, spike };
}
