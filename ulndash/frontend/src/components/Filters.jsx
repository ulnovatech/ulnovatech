import React, { useEffect, useState } from 'react';

export default function Filters({ onChange, initial = {} }) {
  const [state, setState] = useState({
    q: initial.q || '',
    status: initial.status || '',
    has_website: initial.has_website ?? '',
    location: initial.location || '',
    industry: initial.industry || '',
    sort: initial.sort || 'created_at',
    dir: initial.dir || 'desc',
  });

  useEffect(()=> onChange?.(state), [state]);

  function update(k, v) { setState(prev => ({ ...prev, [k]: v })); }

  return (
    <div className="p-2 shadow flex flex-wrap gap-1 items-center mb-2 text-sm">
      <input className="bg-blue-950 px-1 py-1" placeholder="Search name or notes" value={state.q} onChange={e=>update('q', e.target.value)} />
      <select className="bg-blue-950 px-1 py-1" value={state.status} onChange={e=>update('status', e.target.value)}>
        <option value="">All status</option>
        {['not_contacted','contacted','interested','in_negotiation','rejected','closed_won','closed_lost'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
      </select>
      <select className="bg-blue-950 px-1 py-1" value={state.has_website} onChange={e=>update('has_website', e.target.value)}>
        <option value="">Website?</option>
        <option value="1">Has site</option>
        <option value="0">No site</option>
      </select>
      <input className="bg-blue-950 px-1 py-1" placeholder="Location" value={state.location} onChange={e=>update('location', e.target.value)} />
      <input className="bg-blue-950 px-1 py-1" placeholder="Industry" value={state.industry} onChange={e=>update('industry', e.target.value)} />
      <select className="bg-blue-950 px-1 py-1" value={state.sort} onChange={e=>update('sort', e.target.value)}>
        {['created_at','name','status','location','last_contact_date'].map(s => <option key={s} value={s}>Sort: {s}</option>)}
      </select>
      <select className="bg-blue-950 px-1 py-1" value={state.dir} onChange={e=>update('dir', e.target.value)}>
        <option value="desc">Desc</option>
        <option value="asc">Asc</option>
      </select>
    </div>
  );
}
