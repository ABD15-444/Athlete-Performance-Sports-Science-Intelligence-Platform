import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export function BiometricTrendChart({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="empty-chart-state">
        <p>No biometric trend logs recorded yet for this athlete.</p>
      </div>
    );
  }

  // Format data chronological for time series (logs come DESC from API)
  const chartData = [...logs].reverse().map((item) => {
    const dateObj = new Date(item.recorded_at);
    const dateFormatted = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
    return {
      date: dateFormatted,
      fullDate: dateObj.toLocaleDateString(),
      sleepScore: item.sleep_score ? parseFloat(item.sleep_score) : null,
      hrv: item.hrv_ms ? parseFloat(item.hrv_ms) : null,
      // Scale Fatigue (0-10) to 0-100 so it overlays cleanly on Sleep & HRV
      fatigueScaled: item.fatigue_score ? parseFloat(item.fatigue_score) * 10 : null,
      fatigueRaw: item.fatigue_score ? parseFloat(item.fatigue_score) : null,
      heartRate: item.heart_rate,
      hydration: item.hydration_pct ? parseFloat(item.hydration_pct) : null,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-date">{data.fullDate}</p>
          <div className="tooltip-row">
            <span className="dot dot-sleep" />
            <span>Sleep Score:</span>
            <strong>{data.sleepScore ?? '--'}%</strong>
          </div>
          <div className="tooltip-row">
            <span className="dot dot-hrv" />
            <span>HRV:</span>
            <strong>{data.hrv ?? '--'} ms</strong>
          </div>
          <div className="tooltip-row">
            <span className="dot dot-fatigue" />
            <span>Fatigue:</span>
            <strong>{data.fatigueRaw ?? '--'} / 10</strong>
          </div>
          {data.heartRate && (
            <div className="tooltip-row">
              <span className="dot dot-hr" />
              <span>Resting HR:</span>
              <strong>{data.heartRate} bpm</strong>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-wrapper">
      <div className="chart-header-row">
        <div>
          <h4 className="chart-title">14-Day Biometric Physiology Trend</h4>
          <p className="chart-subtitle">Sleep Score vs HRV (ms) vs Fatigue Index (×10 scaled)</p>
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              ticks={[0, 25, 50, 75, 100]} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
              iconType="circle"
            />
            <Line
              type="monotone"
              name="Sleep Quality (%)"
              dataKey="sleepScore"
              stroke="#a855f7"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#a855f7' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              name="HRV (ms)"
              dataKey="hrv"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#06b6d4' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              name="Fatigue Index (×10)"
              dataKey="fatigueScaled"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 2.5, fill: '#f59e0b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
