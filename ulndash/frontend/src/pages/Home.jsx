import React, { useEffect, useState } from 'react';
import { CompaniesAPI } from '../services/api';

export default function Home() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
  async function fetchStats() {
    try {
      const stats = await CompaniesAPI.stats();
      setStats(stats);
    } catch (err) {
      console.error(err);
    }
  }
  fetchStats();
}, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-3 bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">Overview</h2>
        {stats ? (
          <div className="flex gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Total leads</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Contacted</div>
              <div className="text-2xl font-bold">{stats.contacted}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Converted</div>
              <div className="text-2xl font-bold">{stats.converted}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Conversion %</div>
              <div className="text-2xl font-bold">{stats.conversion_rate}%</div>
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </div>
  );
}
