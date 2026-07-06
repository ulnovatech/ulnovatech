import React, { useEffect, useState } from 'react';
import { CompaniesAPI } from '../services/api';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  useEffect(()=> {
    CompaniesAPI.stats().then(setStats).catch(()=>{});
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="text-lg font-semibold">KPIs</h3>
        {stats ? (
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Total</div>
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
        ) : <div>Loading...</div>}
      </div>
    </div>
  );
}
