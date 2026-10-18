import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export function TeamReadinessBarChart({ athletes, onSelectAthlete }) {
  if (!athletes || athletes.length === 0) {
    return null;
  }

  const data = athletes.map((a) => {
    const score = a.readiness_score ? parseFloat(a.readiness_score) : 0;
    return {
      id: a.athlete_id,
      name: a.athlete_name?.split(' ')[0] || a.first_name,
      fullName: a.athlete_name || `${a.first_name} ${a.last_name}`,
      readiness: score,
      risk: a.injury_risk,
      activeInjuries: a.active_injury_count,
    };
  });

  const getBarColor = (score) => {
    if (score >= 75) return 'var(--ready-high)';
    if (score >= 50) return 'var(--ready-mid)';
    return 'var(--ready-low)';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-date">{item.fullName}</p>
          <div className="tooltip-row">
            <span>Readiness Score:</span>
            <strong style={{ color: getBarColor(item.readiness) }}>{item.readiness.toFixed(1)}/100</strong>
          </div>
          <div className="tooltip-row">
            <span>Injury Risk:</span>
            <strong>{item.risk}</strong>
          </div>
          {item.activeInjuries > 0 && (
            <div className="tooltip-row text-amber">
              <span>Active Injuries:</span>
              <strong>{item.activeInjuries}</strong>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="section-card chart-card">
      <div className="section-card-header">
        <div>
          <h4>Roster Readiness Distribution</h4>
          <p className="section-card-sub">Comparative readiness benchmark across current squad athletes</p>
        </div>
        <div className="chart-legend-dots">
          <span className="legend-item"><span className="dot dot-high" /> &ge;75 Optimal</span>
          <span className="legend-item"><span className="dot dot-mid" /> 50-74 Moderate</span>
          <span className="legend-item"><span className="dot dot-low" /> &lt;50 Critical</span>
        </div>
      </div>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} ticks={[0, 25, 50, 75, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
            <ReferenceLine y={75} stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="rgba(245, 158, 11, 0.3)" strokeDasharray="3 3" />
            <Bar 
              dataKey="readiness" 
              radius={[4, 4, 0, 0]}
              onClick={(entry) => onSelectAthlete && onSelectAthlete(entry.id)}
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.id}`} fill={getBarColor(entry.readiness)} cursor="pointer" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
