import React from 'react';
import { AlertTriangle, ChevronRight, Activity, Moon, Zap } from 'lucide-react';
import { ReadinessBadge, RiskBadge } from './Badges';

export function AthleteCard({ athlete, isSelected, onClick }) {
  const readiness = athlete.readiness_score ? parseFloat(athlete.readiness_score) : null;
  const isHighRisk = athlete.injury_risk === 'High';

  return (
    <div 
      className={`athlete-card ${isSelected ? 'selected' : ''} ${isHighRisk ? 'card-warning' : ''}`}
      onClick={onClick}
    >
      <div className="athlete-card-header">
        <div className="athlete-avatar">
          {athlete.first_name?.[0]}{athlete.last_name?.[0]}
        </div>
        <div className="athlete-meta">
          <h4 className="athlete-name">{athlete.athlete_name || `${athlete.first_name} ${athlete.last_name}`}</h4>
          <span className="athlete-team-sub">{athlete.team_name} • {athlete.sport_type || 'Athletics'}</span>
        </div>
        <ReadinessBadge score={readiness} size="md" />
      </div>

      <div className="athlete-stats-strip">
        <div className="stat-pill" title="Heart Rate Variability">
          <Activity size={13} className="text-cyan" />
          <span>{athlete.hrv_ms ? `${parseFloat(athlete.hrv_ms).toFixed(0)} ms` : '--'}</span>
        </div>
        <div className="stat-pill" title="Sleep Score">
          <Moon size={13} className="text-purple" />
          <span>{athlete.sleep_score ? `${parseFloat(athlete.sleep_score).toFixed(0)}%` : '--'}</span>
        </div>
        <div className="stat-pill" title="Fatigue Score (0-10)">
          <Zap size={13} className="text-amber" />
          <span>{athlete.fatigue_score ? `${parseFloat(athlete.fatigue_score).toFixed(1)}/10` : '--'}</span>
        </div>
      </div>

      <div className="athlete-card-footer">
        <RiskBadge risk={athlete.injury_risk} />
        {athlete.active_injury_count > 0 && (
          <span className="injury-indicator">
            <AlertTriangle size={12} />
            {athlete.active_injury_count} active
          </span>
        )}
        <div className="view-profile-btn">
          <span>Details</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}
