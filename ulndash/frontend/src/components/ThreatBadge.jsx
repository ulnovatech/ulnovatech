import React from 'react';

const STYLES = {
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  critical: 'bg-rose-600/30 text-rose-200 border-rose-500/50',
};

export default function ThreatBadge({ level = 'medium' }) {
  const key = STYLES[level] ? level : 'medium';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STYLES[key]}`}>
      {key}
    </span>
  );
}
