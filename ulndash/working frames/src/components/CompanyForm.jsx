import React, { useEffect, useState } from 'react';

const empty = { name:'', industry:'', website_url:'', has_website:0, location:'', contact_person:'', contact_method:'whatsapp', status:'not_contacted', priority:'medium', last_contact_date:'', notes:'' };

export default function CompanyForm({ open, initial=null, onClose, onSubmit }) {
  const [form, setForm] = useState(empty);
  useEffect(()=> {
    if (initial) setForm({ ...empty, ...initial, has_website: initial.has_website ? 1 : 0 });
    else setForm(empty);
  }, [initial, open]);

  if (!open) return null;
  function update(k, v){ setForm(prev=>({...prev, [k]: v})); }
  function submit(e){ e.preventDefault(); if (!form.name.trim()) return alert('Name required'); onSubmit({...form, has_website: Number(form.has_website)}); }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
      <form onSubmit={submit} className="bg-white w-full max-w-2xl p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{initial ? 'Edit Company' : 'Add Company'}</h3>
          <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-100 rounded">Close</button>
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Company name" value={form.name} onChange={e=>update('name', e.target.value)} required />
        <div className="grid grid-cols-2 gap-2">
          <input className="border rounded px-3 py-2" placeholder="Industry" value={form.industry} onChange={e=>update('industry', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Website URL" value={form.website_url} onChange={e=>update('website_url', e.target.value)} />
          <select className="border rounded px-3 py-2" value={form.has_website} onChange={e=>update('has_website', Number(e.target.value))}>
            <option value={0}>No site</option>
            <option value={1}>Has site</option>
          </select>
          <input className="border rounded px-3 py-2" placeholder="Location" value={form.location} onChange={e=>update('location', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Contact person" value={form.contact_person} onChange={e=>update('contact_person', e.target.value)} />
          <select className="border rounded px-3 py-2" value={form.contact_method} onChange={e=>update('contact_method', e.target.value)}>
            {['phone','whatsapp','email','social'].map(m=> <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="border rounded px-3 py-2" value={form.status} onChange={e=>update('status', e.target.value)}>
            {['not_contacted','contacted','interested','in_negotiation','rejected','closed_won','closed_lost'].map(s=> <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <input type="date" className="border rounded px-3 py-2" value={form.last_contact_date || ''} onChange={e=>update('last_contact_date', e.target.value)} />
        </div>
        <textarea className="border rounded px-3 py-2 w-full" rows={4} placeholder="Notes" value={form.notes} onChange={e=>update('notes', e.target.value)} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">{initial ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
}
