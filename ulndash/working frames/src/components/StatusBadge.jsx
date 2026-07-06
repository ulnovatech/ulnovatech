import React from 'react';
export default function StatusBadge({value}) {
  const colors = {
    not_contacted: 'bg-gray-200 text-gray-800',
    contacted: 'bg-blue-200 text-blue-800',
    interested: 'bg-emerald-200 text-emerald-800',
    in_negotiation: 'bg-amber-200 text-amber-800',
    rejected: 'bg-rose-200 text-rose-800',
    closed_won: 'bg-green-300 text-green-900',
    closed_lost: 'bg-red-300 text-red-900',
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-200'}`}>{(value||'').replace('_',' ')}</span>;
}
