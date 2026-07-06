// src/pages/Analytics.jsx
import React, { useEffect, useState } from "react";
import LineChartNeon from "../components/LineChartNeon";

export default function Analytics() {
  const [gaData, setGaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const metrics = [
    { title: "Active Users", key: "activeUsers" },
    { title: "New Users", key: "newUsers" },
    { title: "Sessions", key: "sessions" },
    { title: "Avg. Session Duration", key: "averageSessionDuration" },
    { title: "Page Views", key: "pageViews" },
    { title: "Engaged Sessions", key: "engagedSessions" },
    { title: "Bounce Rate", key: "bounceRate" }
  ];

  // Map metric keys to Y-axis labels/units
  const metricLabels = {
    activeUsers: "Users",
    newUsers: "Users",
    sessions: "Sessions",
    pageViews: "Views",
    averageSessionDuration: "Minutes",
    engagedSessions: "Sessions",
    bounceRate: "Bounce Rate (%)"
  };

  useEffect(() => {
    async function loadGA() {
      try {
        const gaUrl = import.meta.env.VITE_GA_API_URL || '/api/analytics/ga';
        const res = await fetch(gaUrl, { credentials: 'include' });
        if (!res.ok) throw new Error("Failed to load GA data");
        const data = await res.json();
        if (data?.error) throw new Error(data.error);
        setGaData(data);
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadGA();
  }, []);

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted">
        Loading GA data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-900/40 text-rose-300 p-3 rounded">
        Error: {error}
      </div>
    );
  }

  if (!gaData.length) {
    return <div className="text-muted">No GA data available</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Google Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics.map((metric) => {
          const chartData = gaData.map((row, idx) => {
            let value = parseFloat(row[metric.key]) || 0;

            // Convert Avg. Session Duration from seconds → minutes
            if (metric.key === "averageSessionDuration") value = value / 60;

            // Bounce Rate already in %, no conversion needed
            return {
              time: row.date || `Day ${idx + 1}`,
              value
            };
          });

          return (
            <div key={metric.key} className="card">
              <h3 className="text-lg font-semibold mb-3">
                {metric.title} — Last 30 days
              </h3>
              <LineChartNeon
                data={chartData}
                dataKey="value"
                yLabel={metricLabels[metric.key]} // Pass the proper Y-axis label/unit
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
