import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CompaniesAPI } from '../services/api';
import InteractionForm from '../components/InteractionForm';
import StatusBadge from '../components/StatusBadge';

export default function CompanyDetail(){
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [open, setOpen] = useState(false);

  async function load(){
    try {
      const c = await CompaniesAPI.get(id);
      setCompany(c);
      const it = await CompaniesAPI.listInteractions(id);
      setInteractions(it.data || []);
    } catch (e) { alert(e.message); }
  }
  useEffect(()=> { load(); }, [id]);

  async function addInteraction(payload) {
    await CompaniesAPI.createInteraction({ ...payload, company_id: id });
    setOpen(false);
    load();
  }

  if (!company) return <div>Loading...</div>;
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow flex justify-between">
        <div>
          <h2 className="text-xl font-semibold">{company.name}</h2>
          <div className="text-sm text-gray-500">{company.industry} • {company.location}</div>
        </div>
        <div className="text-right">
          <StatusBadge value={company.status} />
          <div className="text-sm text-gray-500 mt-2">Last contact: {company.last_contact_date || '—'}</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Interactions</h3>
        <button onClick={()=>setOpen(true)} className="px-3 py-2 bg-blue-600 text-white rounded">Log Interaction</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        {interactions.length === 0 && <div className="text-gray-500">No interactions yet</div>}
        {interactions.map(it => (
          <div key={it.id} className="border p-3 rounded">
            <div className="flex justify-between">
              <div className="text-sm text-gray-600">{it.channel} • {it.outcome}</div>
              <div className="text-sm text-gray-400">{it.happened_at}</div>
            </div>
            <div className="mt-2">{it.notes}</div>
          </div>
        ))}
      </div>

      <InteractionForm open={open} onClose={()=>setOpen(false)} onSubmit={addInteraction} />
    </div>
  );
}
