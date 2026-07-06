// src/components/Badges.jsx
import React from 'react';

export default function TypeBadge({ type }) {
  const map = {
    appdev: ['App Dev', 'bg-purple-700 text-white'],
    graphdes: ['Graphic', 'bg-pink-700 text-white'],
    marketing: ['Marketing', 'bg-teal-700 text-white'],
    webdesign: ['Web Design', 'bg-blue-700 text-white'],
    website_order: ['Order', 'bg-green-700 text-white'],
    contactus: ['Contact', 'bg-yellow-600 text-black'],
    newsletter: ['Newsletter', 'bg-gray-600 text-white'],
    '': ['Unknown', 'bg-gray-600 text-white']
  };
  const [label, cls] = map[type] || ['Unknown', 'bg-gray-600 text-white'];
  return <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{label}</span>;
}
