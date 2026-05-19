import { useState, useEffect } from 'react';
import * as contactsApi from '../../api/contacts.api';
import * as incidentsApi from '../../api/incidents.api';
import Field, { inputCls } from '../ui/Field';
import Btn from '../ui/Btn';

const RELS = ['Family', 'Friend', 'Spouse', 'Doctor', 'Police', 'Other'];

export default function ContactModal({ contact, onSaved, onClose, showToast }) {
  const editing = !!contact;
  const [form, setForm]       = useState({ name:'', relationship:'Family', phone:'', callmebot_apikey:'' });
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (contact) setForm({ name: contact.name, relationship: contact.relationship, phone: contact.phone, callmebot_apikey: contact.callmebot_apikey || '' });
  }, [contact]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function save() {
    if (!form.name.trim() || !form.phone.trim()) return showToast('Name and phone are required');
    setSaving(true);
    try {
      if (editing) await contactsApi.updateContact(contact.id, form);
      else         await contactsApi.createContact(form);
      onSaved();
    } catch (err) {
      showToast(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  }

  async function test() {
    if (!form.phone || !form.callmebot_apikey) return showToast('Enter phone and API key to test');
    setTesting(true);
    try {
      const { data } = await incidentsApi.testSend(form.phone, form.callmebot_apikey);
      showToast(data.ok ? 'Test fired ✓ — check WhatsApp' : `Issue: ${data.note}`);
    } catch { showToast('Test request failed'); }
    finally { setTesting(false); }
  }

  return (
    <div className="fixed inset-0 bg-bg/[0.85] backdrop-blur-md z-[1100] flex items-center justify-center p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-panel border border-line-s rounded-lg max-w-[520px] w-full flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-line">
          <h3 className="font-serif font-medium text-[22px] tracking-tight">{editing ? 'Edit contact' : 'Add contact'}</h3>
          <button onClick={onClose} className="text-ink-dim text-xl bg-transparent border-none cursor-pointer hover:text-ink">×</button>
        </div>

        <div className="p-[22px] overflow-y-auto space-y-1">
          <div className="bg-bg-2 border border-line rounded p-[14px] text-[12px] leading-relaxed mb-4">
            <p className="font-serif font-medium text-[14px] text-accent mb-2">One-time CallMeBot setup (per contact)</p>
            <ol className="list-decimal pl-5 text-ink-dim space-y-1">
              <li>Save <code className="bg-panel px-1 rounded text-accent font-mono">+34 644 51 95 23</code> as a phone contact</li>
              <li>Send WhatsApp: <b className="text-ink">"I allow callmebot to send me messages"</b></li>
              <li>Bot replies with your API key</li>
              <li>Paste that key below</li>
            </ol>
          </div>

          <Field label="Full name">
            <input type="text" value={form.name} onChange={set('name')} className={inputCls} />
          </Field>

          <Field label="Relationship">
            <select value={form.relationship} onChange={set('relationship')} className={inputCls}>
              {RELS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>

          <Field label="WhatsApp number (country code, no +)" hint="India: 91XXXXXXXXXX · USA: 1XXXXXXXXXX · UK: 44XXXXXXXXXX">
            <input type="text" value={form.phone} onChange={set('phone')} placeholder="e.g. 919876543210" className={inputCls} />
          </Field>

          <Field label="CallMeBot API key" hint="Leave blank to skip during auto-dispatch">
            <input type="text" value={form.callmebot_apikey} onChange={set('callmebot_apikey')} placeholder="e.g. 1234567" className={inputCls} />
          </Field>
        </div>

        <div className="flex gap-[10px] justify-end px-[22px] py-[14px] border-t border-line">
          <Btn sm ghost onClick={test}    disabled={testing}>{testing ? 'Testing…' : 'Test Send'}</Btn>
          <Btn sm ghost onClick={onClose}>Cancel</Btn>
          <Btn sm       onClick={save}    disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </div>
    </div>
  );
}
