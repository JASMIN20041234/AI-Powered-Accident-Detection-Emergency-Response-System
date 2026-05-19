import { useState, useCallback, useRef } from 'react';

export default function useToast(duration = 3200) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((message) => {
    clearTimeout(timer.current);
    setToast(message);
    timer.current = setTimeout(() => setToast(null), duration);
  }, [duration]);

  return { toast, show };
}
