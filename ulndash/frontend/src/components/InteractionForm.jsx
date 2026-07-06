import React, { useState } from 'react';

export default function InteractionForm({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ channel:'whatsapp', outcome:'no_reply', notes:'' });
  if (!open) return null;
  function update(k,v){ setForm(prev=>({...prev,[k]:v})); }
  function submit(e){ e.preventDefault(); onSubmit(form); setForm({ channel:'whatsapp', outcome:'no_reply', notes:'' }); }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
      <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow max-w-md w-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Log Interaction</h3>
          <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-100 rounded">Close</button>
        </div>
        <select className="border rounded px-3 py-2 w-full mb-2" value={form.channel} onChange={e=>update('channel', e.target.value)}>
          {['phone','whatsapp','email','social','in_person'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select className="border rounded px-3 py-2 w-full mb-2" value={form.outcome} onChange={e=>update('outcome', e.target.value)}>
          {['no_reply','positive','neutral','negative','follow_up'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <textarea className="border rounded px-3 py-2 w-full mb-2" rows={4} placeholder="Notes" value={form.notes} onChange={e=>update('notes', e.target.value)} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 bg-gray-100 rounded">Cancel</button>
          <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </form>
    </div>
  );
}
