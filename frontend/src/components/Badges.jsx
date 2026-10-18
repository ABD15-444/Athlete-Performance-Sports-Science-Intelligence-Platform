import React from 'react';

export function ReadinessBadge({ score, size = 'md', showLabel = false }) {
  const numScore = parseFloat(score);

  let tierClass = 'ready-tier-low';
  let label = 'Low Readiness';
  let color = 'var(--ready-low)';

  if (numScore >= 75) {
    tierClass = 'ready-tier-high';
    label = 'Optimal';
    color = 'var(--ready-high)';
  } else if (numScore >= 50) {
    tierClass = 'ready-tier-mid';
    label = 'Moderate';
    color = 'var(--ready-mid)';
  }

  const sizeClasses = {
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg',
    xl: 'badge-xl',
  };

  return (
    <div className={`readiness-badge ${tierClass} ${sizeClasses[size] || 'badge-md'}`}>
      <span className="badge-score-value">{isNaN(numScore) ? '--' : numScore.toFixed(1)}</span>
      {showLabel && <span className="badge-score-label">{label}</span>}
    </div>
  );
}

export function RiskBadge({ risk }) {
  const riskClass = 
    risk === 'High' ? 'risk-badge-high' :
    risk === 'Moderate' ? 'risk-badge-moderate' : 'risk-badge-low';

  return (
    <span className={`risk-badge ${riskClass}`}>
      <span className="risk-dot" />
      {risk || 'Low'} Risk
    </span>
  );
}
