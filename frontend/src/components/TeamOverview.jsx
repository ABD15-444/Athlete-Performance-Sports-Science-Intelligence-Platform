import React from 'react';
import { Users, AlertTriangle, ShieldCheck, TrendingUp, Trophy } from 'lucide-react';

export function TeamOverview({ overview, selectedTeam, onSelectTeam, teams }) {
  if (!overview) return null;

  const avgReadiness = overview.roster_summary?.avg_readiness 
    ? parseFloat(overview.roster_summary.avg_readiness) 
    : 0;

  let readinessTierColor = 'var(--ready-high)';
  if (avgReadiness < 50) readinessTierColor = 'var(--ready-low)';
  else if (avgReadiness < 75) readinessTierColor = 'var(--ready-mid)';

  return (
    <div className="team-overview-container">
      {/* Team Selector Strip */}
      <div className="team-selector-strip">
        <div className="selector-label">
          <Trophy size={16} className="text-cyan" />
          <span>Active Squad:</span>
        </div>
        <div className="team-pill-group">
          {teams.map((t) => (
            <button
              key={t.team_id}
              className={`team-pill ${selectedTeam === t.team_id ? 'active' : ''}`}
              onClick={() => onSelectTeam(t.team_id)}
            >
              {t.team_name} ({t.sport_type})
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Team Avg Readiness</span>
            <TrendingUp size={16} className="text-cyan" />
          </div>
          <div className="kpi-body">
            <span className="kpi-value" style={{ color: readinessTierColor }}>
              {avgReadiness.toFixed(1)}
            </span>
            <span className="kpi-sub">/ 100 AI Score</span>
          </div>
          <div className="kpi-progress-bar">
            <div 
              className="kpi-progress-fill" 
              style={{ width: `${Math.min(avgReadiness, 100)}%`, background: readinessTierColor }}
            />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Roster Size</span>
            <Users size={16} className="text-blue" />
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{overview.roster_summary?.total_athletes || 0}</span>
            <span className="kpi-sub">Athletes Tracked</span>
          </div>
          <p className="kpi-footer-text">Head Coach: {overview.coach?.name || 'Assigned Staff'}</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Injuries</span>
            <AlertTriangle size={16} className="text-amber" />
          </div>
          <div className="kpi-body">
            <span className="kpi-value text-amber">{overview.roster_summary?.total_active_injuries || 0}</span>
            <span className="kpi-sub">Penalized Athletes</span>
          </div>
          <p className="kpi-footer-text">
            {overview.roster_summary?.total_active_injuries > 0 
              ? 'Readiness scores penalized via DB View' 
              : '100% Roster Healthy'}
          </p>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Squad Health Status</span>
            <ShieldCheck size={16} className="text-emerald" />
          </div>
          <div className="kpi-body">
            <span className="kpi-value text-emerald">
              {overview.roster_summary?.total_active_injuries === 0 ? 'Full Ready' : 'Managed Load'}
            </span>
          </div>
          <p className="kpi-footer-text">Real-time Biometrics Synchronized</p>
        </div>
      </div>
    </div>
  );
}
