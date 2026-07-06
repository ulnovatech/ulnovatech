// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import KPICard from '../components/KPICard';
import LineChartNeon from '../components/LineChartNeon';
import { CompaniesAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState({ stats: true, activity: true, industries: true });
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const s = await CompaniesAPI.stats();
        setStats(s);
      } catch (e) {
        console.error('Failed to load stats', e);
        setError(e.message || 'Stats error');
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    }

    async function loadActivity() {
      try {
        // Request last 30 days (backend will return array of {time, value})
        const act = await CompaniesAPI.activity({ range: '30d' });
        // allow both {data: [...]} and direct array responses
        setActivity(act.data || act);
      } catch (e) {
        console.error('Failed to load activity', e);
      } finally {
        setLoading(prev => ({ ...prev, activity: false }));
      }
    }

    async function loadIndustries() {
      try {
        const top = await CompaniesAPI.topIndustries();
        setIndustries(top.data || top);
      } catch (e) {
        console.error('Failed to load industries', e);
      } finally {
        setLoading(prev => ({ ...prev, industries: false }));
      }
    }

    loadStats();
    loadActivity();
    loadIndustries();
  }, []);

  const loadingAny = loading.stats || loading.activity || loading.industries;

  // KPI data mapping
  const kpis = [
    {
      title: 'Total Leads',
      value: stats ? stats.total : '—',
      delta: stats && stats.previous_total_diff ? stats.previous_total_diff : null
    },
    {
      title: 'Contacted',
      value: stats ? stats.contacted : '—',
      delta: stats && stats.previous_contacted_diff ? stats.previous_contacted_diff : null
    },
    {
      title: 'Convertions',
      value: stats ? stats.converted : '—',
      delta: stats && stats.previous_converted_diff ? stats.previous_converted_diff : null
    },
    {
      title: 'Conversion Rate',
      value: stats ? `${stats.conversion_rate}%` : '—',
      delta: stats && stats.previous_rate_diff ? stats.previous_rate_diff : null
    }
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-900/40 text-rose-300 p-3 rounded">Error: {error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <KPICard key={k.title} title={k.title} value={k.value} delta={k.delta || ''} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Activity — Last 30 days</h3>
                <div className="text-sm text-muted">Engagement & conversions</div>
              </div>
              <div className="text-sm text-muted">Range: 30d</div>
            </div>

            {loading.activity ? (
              <div className="h-[300px] flex items-center justify-center text-muted">Loading chart...</div>
            ) : activity && activity.length > 0 ? (
              // activity should be an array of { time: 'YYYY-MM-DD' or 'Day N', value: number }
              <LineChartNeon data={activity} dataKey="value" />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted">No activity data</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h4 className="text-sm font-semibold mb-3">Top industries</h4>
            {loading.industries ? (
              <div className="text-muted">Loading...</div>
            ) : industries && industries.length > 0 ? (
              <div className="flex flex-col gap-2">
                {industries.map((ind, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="text-sm">{ind.industry || ind.name}</div>
                    <div className="text-sm font-bold">{ind.count ?? ind.value ?? '-'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted">No industry data</div>
            )}
          </div>

          <div className="card">
            <h4 className="text-sm font-semibold mb-3">Recent activity</h4>
            {/* This block could call /api/companies?sort=last_contact_date&dir=desc&per_page=5 */}
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small inline component to fetch & display recent companies interactions (simplified) */
function RecentActivity() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await CompaniesAPI.list({ sort: 'last_contact_date', dir: 'desc', per_page: 5 });
        const data = res.data || res;
        if (mounted) setRows(data);
      } catch (e) {
        console.error('RecentActivity load failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!rows) return <div className="text-muted">Loading...</div>;
  if (rows.length === 0) return <div className="text-muted">No recent activity</div>;

  return (
    <ul className="space-y-3 text-sm text-muted">
      {rows.map(r => (
        <li key={r.id}>
          <div className="flex justify-between">
            <div className="truncate max-w-[220px]">{r.name} — <span className="text-white font-medium">{r.contact_method}</span></div>
            <div className="text-xs text-gray-400">{r.last_contact_date || '—'}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// import React from 'react'
// import KPICard from '../components/KPICard'
// import LineChartNeon from '../components/LineChartNeon'
// import sample from '../sample-data'

// export default function Dashboard(){
//   // sample KPIs
//   const kpis = [
//     {title: 'Total Leads', value: '1,248', delta: '+4.3%'},
//     {title: 'Contacted', value: '612', delta: '+2.1%'},
//     {title: 'Converted', value: '94', delta: '+0.6%'},
//     {title: 'Conversion Rate', value: '7.55%', delta: '+0.12%'},
//   ]

//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         {kpis.map(k => <KPICard key={k.title} {...k} />)}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2">
//           <div className="card">
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <h3 className="text-lg font-semibold">Activity — Last 30 days</h3>
//                 <div className="text-sm text-muted">Engagement & conversions</div>
//               </div>
//               <div className="text-sm text-muted">Range: 30d</div>
//             </div>
//             <LineChartNeon data={sample.activity} dataKey="value" />
//           </div>
//         </div>

//         <div className="space-y-4">
//           <div className="card">
//             <h4 className="text-sm font-semibold mb-3">Top industries</h4>
//             <div className="flex flex-col gap-2">
//               <div className="flex items-center justify-between">
//                 <div className="text-sm">Restaurants</div>
//                 <div className="text-sm font-bold">312</div>
//               </div>
//               <div className="flex items-center justify-between">
//                 <div className="text-sm">E-commerce</div>
//                 <div className="text-sm font-bold">210</div>
//               </div>
//               <div className="flex items-center justify-between">
//                 <div className="text-sm">Agencies</div>
//                 <div className="text-sm font-bold">126</div>
//               </div>
//             </div>
//           </div>

//           <div className="card">
//             <h4 className="text-sm font-semibold mb-3">Recent activity</h4>
//             <ul className="space-y-3 text-sm text-muted">
//               <li>Hamza — Contacted (WhatsApp) <span className="text-white">· 2h</span></li>
//               <li>Mezo Noir — Replied <span className="text-white">· 1d</span></li>
//               <li>Import completed: 120 leads <span className="text-white">· 3d</span></li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
