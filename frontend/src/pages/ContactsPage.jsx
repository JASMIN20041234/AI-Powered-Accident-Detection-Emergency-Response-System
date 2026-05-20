import { useState } from 'react';
import * as contactsApi from '../api/contacts.api';
import * as incidentsApi from '../api/incidents.api';
import ContactCard from '../components/contacts/ContactCard';
import ContactModal from '../components/contacts/ContactModal';
import Btn from '../components/ui/Btn';
import Toast from '../components/ui/Toast';
import useToast from '../hooks/useToast';

const SMS_PROVIDER = (import.meta.env.VITE_SMS_PROVIDER || 'twilio').toLowerCase();
const SMS_PROVIDER_LABEL = SMS_PROVIDER === 'twilio' ? 'Twilio WhatsApp' : 'CallMeBot';

export default function ContactsPage({ contacts, onContactsChange }) {
  const [modal, setModal] = useState(undefined); // undefined=closed | null=new | obj=edit
  const { toast, show }   = useToast();

  async function handleDelete(id) {
    if (!confirm('Delete this contact?')) return;
    try { await contactsApi.deleteContact(id); onContactsChange(); show('Contact deleted'); }
    catch { show('Delete failed'); }
  }

  async function handleTest(c) {
    if (SMS_PROVIDER !== 'twilio' && !c.callmebot_apikey) { show('No API key set for this contact'); return; }
    show(`Sending test to ${c.name}…`);
    try {
      const { data } = await incidentsApi.testSend(c.phone, c.callmebot_apikey);
      show(data.ok ? `Test sent to ${c.name} ✓` : `Issue: ${data.note}`);
    } catch { show('Test request failed'); }
  }

  return (
    <div className="p-4 md:p-7">
      <div className="flex items-start justify-between mb-6 pb-[18px] border-b border-line gap-3 flex-wrap">
        <div>
          <h1 className="font-serif font-normal text-[26px] md:text-[38px] tracking-tight leading-none">
            Emergency <em className="italic text-accent not-italic">contacts</em>.
          </h1>
          <p className="text-ink-f text-[11px] tracking-[0.2em] uppercase mt-2">Auto-dispatch through {SMS_PROVIDER_LABEL}</p>
        </div>
        <Btn onClick={() => setModal(null)}>+ Add Contact</Btn>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-16 text-ink-f">
          <div className="font-serif text-[72px] text-accent opacity-40 mb-3">∅</div>
          <div className="font-serif italic text-lg mb-3">No emergency contacts yet</div>
          <p>Add contacts to receive WhatsApp alerts. See the Setup Guide for instructions.</p>
        </div>
      ) : (
        <div className="grid gap-[14px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {contacts.map((c) => (
            <ContactCard key={c.id} contact={c}
              onEdit={()   => setModal(c)}
              onDelete={()  => handleDelete(c.id)}
              onTest={()    => handleTest(c)}
            />
          ))}
        </div>
      )}

      {modal !== undefined && (
        <ContactModal
          contact={modal}
          onSaved={() => { setModal(undefined); onContactsChange(); show(modal ? 'Contact updated' : 'Contact added'); }}
          onClose={() => setModal(undefined)}
          showToast={show}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}
