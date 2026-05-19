import Btn from '../ui/Btn';

const SMS_PROVIDER = (import.meta.env.VITE_SMS_PROVIDER || 'twilio').toLowerCase();

export default function ContactCard({ contact, onEdit, onDelete, onTest }) {
  const isReady = SMS_PROVIDER === 'twilio' ? !!contact.phone : !!contact.callmebot_apikey;

  return (
    <div className="bg-panel border border-line rounded-md p-[18px] hover:border-line-s transition-colors">
      <div className="font-serif font-medium text-xl tracking-tight mb-1">{contact.name}</div>
      <div className="text-[10px] tracking-[0.2em] uppercase text-ink-f mb-[14px]">{contact.relationship}</div>
      <div className="text-[14px] text-accent mb-2 font-mono">+{contact.phone}</div>
      <span className={`text-[10px] tracking-[0.15em] uppercase px-2 py-1 rounded-full border inline-block mb-[14px] ${isReady ? 'text-good border-good bg-good/10' : 'text-warn border-warn bg-warn/10'}`}>
        {isReady ? 'Auto-send ready' : 'Missing dispatch setup'}
      </span>
      <div className="flex gap-2 flex-wrap">
        <Btn sm ghost onClick={onEdit}>Edit</Btn>
        <Btn sm ghost onClick={onTest}>Test</Btn>
        <Btn sm ghost onClick={onDelete}>Delete</Btn>
      </div>
    </div>
  );
}
