import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area
} from 'recharts'

export default function LineChartNeon({
  data,       // live data from parent
  dataKey = 'value',
  stroke = '#8b5cf6',
  yLabel = '', // <-- new prop for Y-axis label/unit
}) {
  if (!data || data.length === 0) {
    return (
      <div className="card chart-wrap flex items-center justify-center text-gray-500 h-[280px]">
        No data available
      </div>
    )
  }

  return (
    <div className="card chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.3} />
              <stop offset="95%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          
          <XAxis 
            dataKey="time" 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'Date', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 12 }}
          />

          <YAxis 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
          />

          <Tooltip
            contentStyle={{
              background: '#0d0f12',
              border: '1px solid #222',
              borderRadius: '0.5rem',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.5)',
              color: '#fff',
            }}
            formatter={(value) => {
              if (yLabel === 'Minutes') return value.toFixed(1) + ' min';
              if (yLabel === 'Bounce Rate (%)') return value.toFixed(1) + '%';
              return value;
            }}
          />

          {/* Optional area glow */}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="none"
            fill="url(#lineGradient)"
          />

          {/* Main line */}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
