export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-panel-2 border border-line-s text-ink px-5 py-3 rounded text-[12px] animate-fadeIn max-w-[90vw] shadow-xl">
      {message}
    </div>
  );
}
