import React from 'react';

const STYLES = {
  not_contacted: 'bg-slate-600/40 text-slate-200 border-slate-500/50',
  contacted: 'bg-sky-600/30 text-sky-200 border-sky-500/50',
  qualified: 'bg-amber-600/30 text-amber-200 border-amber-500/50',
  converted_to_company: 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50',
};

const LABELS = {
  not_contacted: 'Not contacted',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted_to_company: 'Converted',
};

export default function ProspectStatusBadge({ status }) {
  const key = STYLES[status] ? status : 'not_contacted';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STYLES[key]}`}
    >
      {LABELS[key] || status}
    </span>
  );
}
