// src/components/RequestFilter.jsx
import React from 'react';

const TYPES = [
  { key: '', label: 'All' },
  { key: 'appdev', label: 'App Dev' },
  { key: 'graphdes', label: 'Graphic Design' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'webdesign', label: 'Web Design' },
  { key: 'website_order', label: 'Website Orders' },
  { key: 'contactus', label: 'Contact Us' },
  { key: 'newsletter', label: 'Newsletter' },
];

export default function RequestFilter({ value = {}, onChange }) {
  const update = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="flex gap-2 items-center">
      <input
        type="search"
        placeholder="Search name, phone, email..."
        value={value.q || ''}
        onChange={e => update({ q: e.target.value, page:1 })}
        className="px-3 py-2 bg-gray-900 border border-gray-800 rounded placeholder:text-gray-500"
      />
      <select value={value.type || ''} onChange={e => update({ type: e.target.value, page:1 })} className="px-3 py-2 bg-gray-900 border border-gray-800 rounded">
        {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
      </select>
      <select value={value.sort || 'submitted_at'} onChange={e => update({ sort: e.target.value })} className="px-3 py-2 bg-gray-900 border border-gray-800 rounded">
        <option value="submitted_at">Newest</option>
        <option value="name">Name</option>
        <option value="type">Type</option>
      </select>
      <select value={value.dir || 'desc'} onChange={e => update({ dir: e.target.value })} className="px-3 py-2 bg-gray-900 border border-gray-800 rounded">
        <option value="desc">Desc</option>
        <option value="asc">Asc</option>
      </select>
      <button onClick={() => onChange({ type:'', q:'', sort:'submitted_at', dir:'desc' })} className="px-3 py-2 bg-gray-800 rounded">Reset</button>
    </div>
  )
}
