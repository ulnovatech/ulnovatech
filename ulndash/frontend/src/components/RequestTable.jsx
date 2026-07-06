// src/components/RequestTable.jsx
import React from 'react';
import TypeBadge from './Badges';
import EngageActions from './EngageActions';

export default function RequestTable({ rows = [], loading = false, onRowClick = () => {} }) {
  if (loading) return <div className="p-6 text-center text-muted">Loading...</div>;
  if (!rows || rows.length === 0) return <div className="p-6 text-center text-muted">No requests</div>;

  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-900 text-gray-300">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Phone</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-left">Submitted</th>
            <th className="p-3 text-left">Engage</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.request_type}_${r.source_id}_${idx}`} className="border-t hover:bg-gray-900/40 cursor-pointer" onClick={() => onRowClick(r)}>
              <td className="p-3">{r.name || (r.email ? r.email : '—')}</td>
              <td className="p-3">{r.phone || '—'}</td>
              <td className="p-3"><TypeBadge type={r.request_type} /></td>
              <td className="p-3 truncate max-w-[48ch]">{r.description ? (r.description.length > 160 ? r.description.substring(0,160) + '…' : r.description) : '—'}</td>
              <td className="p-3">{r.submitted_at ? r.submitted_at.split(' ')[0] : '—'}</td>
              <td className="p-3">
                <EngageActions
                  phone={r.phone || null}
                  email={r.email || null}
                  whatsapp={r.whatsapp || r.phone || null}
                />
              </td>
              <td className="p-3 text-right">
                <button className="px-2 py-1 bg-gray-800 rounded">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
