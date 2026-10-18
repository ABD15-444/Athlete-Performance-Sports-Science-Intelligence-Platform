import React, { useState } from 'react';
import {
  X,
  Heart,
  Activity,
  Moon,
  Zap,
  Droplet,
  Wind,
  ShieldAlert,
  User,
  PlusCircle,
  Clock,
  Phone,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { ReadinessBadge, RiskBadge } from './Badges';
import { BiometricTrendChart } from './BiometricTrendChart';
import { api } from '../services/api';
import { generateSportsScienceInsights } from '../services/aiIntelligence';

export function AthleteDetail({ athlete, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'log_biometrics' | 'log_injury'
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form states for quick logging
  const [biometricForm, setBiometricForm] = useState({
    heart_rate: 62,
    hrv_ms: 75,
    sleep_score: 80,
    sleep_hours: 8,
    vo2_max: 52,
    fatigue_score: 4.0,
    hydration_pct: 85,
  });

  const [injuryForm, setInjuryForm] = useState({
    injury_type: 'Hamstring Strain',
    body_part: 'Right Thigh',
    severity: 'Moderate',
    status: 'Active',
    expected_recovery_days: 14,
    notes: 'Logged during high-intensity sprint training',
  });

  const readiness = athlete.readiness?.readiness_score 
    ? parseFloat(athlete.readiness.readiness_score) 
    : 0;

  const handleBiometricSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.logBiometrics(athlete.athlete_id, biometricForm);
      setNotification({
        type: res.overtraining_alert ? 'alert' : 'success',
        message: res.overtraining_alert 
          ? 'Biometrics logged! ⚠️ Overtraining Alert Triggered (Fatigue/Sleep threshold exceeded).'
          : 'Biometrics recorded successfully! Live Readiness recalculated.',
      });
      if (onRefresh) onRefresh();
      setActiveTab('overview');
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInjurySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createInjury(athlete.athlete_id, injuryForm);
      setNotification({
        type: 'success',
        message: 'Injury recorded! Athlete Readiness score dynamically penalized in real-time.',
      });
      if (onRefresh) onRefresh();
      setActiveTab('overview');
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearInjury = async (injuryId) => {
    try {
      await api.updateInjuryStatus(injuryId, { status: 'Cleared' });
      setNotification({
        type: 'success',
        message: 'Injury cleared! Penalty removed from readiness formula.',
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="athlete-detail-panel">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-athlete-info">
          <div className="detail-avatar">
            {athlete.first_name?.[0]}{athlete.last_name?.[0]}
          </div>
          <div>
            <h2 className="detail-name">{athlete.full_name || `${athlete.first_name} ${athlete.last_name}`}</h2>
            <div className="detail-subtags">
              <span>{athlete.team_name}</span>
              <span>•</span>
              <span>{athlete.sport_type}</span>
              {athlete.positions?.length > 0 && (
                <>
                  <span>•</span>
                  <span>{athlete.positions.join(', ')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="detail-header-actions">
          <ReadinessBadge score={readiness} size="lg" showLabel />
          <button className="close-btn" onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Intelligence Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'log_biometrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('log_biometrics')}
        >
          + Log Biometrics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'log_injury' ? 'active' : ''}`}
          onClick={() => setActiveTab('log_injury')}
        >
          + Record Injury
        </button>
      </div>

      {notification && (
        <div className={`notification-toast toast-${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}><X size={14} /></button>
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Quick Stats Grid */}
          <div className="stats-metric-grid">
            <div className="stat-box">
              <div className="stat-label"><Activity size={14} className="text-cyan" /> HRV Score</div>
              <div className="stat-value">{athlete.readiness?.hrv_ms ? `${parseFloat(athlete.readiness.hrv_ms).toFixed(0)} ms` : '--'}</div>
              <div className="stat-note">Optimal range: 65-100+ ms</div>
            </div>
            <div className="stat-box">
              <div className="stat-label"><Moon size={14} className="text-purple" /> Sleep Quality</div>
              <div className="stat-value">{athlete.readiness?.sleep_score ? `${parseFloat(athlete.readiness.sleep_score).toFixed(0)}%` : '--'}</div>
              <div className="stat-note">Weight: 30% of Readiness</div>
            </div>
            <div className="stat-box">
              <div className="stat-label"><Zap size={14} className="text-amber" /> Fatigue Index</div>
              <div className="stat-value">{athlete.readiness?.fatigue_score ? `${parseFloat(athlete.readiness.fatigue_score).toFixed(1)} / 10` : '--'}</div>
              <div className="stat-note">&gt; 7 triggers overtraining flag</div>
            </div>
            <div className="stat-box">
              <div className="stat-label"><Droplet size={14} className="text-blue" /> Hydration</div>
              <div className="stat-value">{athlete.readiness?.hydration_pct ? `${parseFloat(athlete.readiness.hydration_pct).toFixed(0)}%` : '--'}</div>
              <div className="stat-note">Weight: 20% of Readiness</div>
            </div>
          </div>

          {/* AI Intelligence & Sports Science Insights */}
          {(() => {
            const aiData = generateSportsScienceInsights(athlete, athlete.biometric_logs || []);
            return (
              <div className="section-card ai-insights-card">
                <div className="section-card-header">
                  <div className="ai-title-group">
                    <Sparkles size={16} className="text-cyan" />
                    <h4>AI Sports Science Analysis & Prescription</h4>
                  </div>
                  <span className="ai-engine-tag">Autonomous Vagal & Workload Model</span>
                </div>

                <div className="ai-prescription-box">
                  <span className="prescription-badge">Today's Load Guidance</span>
                  <p className="prescription-text">{aiData.trainingPrescription}</p>
                </div>

                {aiData.insights.length > 0 && (
                  <div className="ai-insights-list">
                    {aiData.insights.map((item, idx) => (
                      <div key={idx} className={`ai-insight-item insight-${item.type}`}>
                        <div className="insight-header">
                          <span className="insight-tag">{item.tag}</span>
                          <span className="insight-title">{item.title}</span>
                        </div>
                        <p className="insight-msg">{item.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Biometric Trend Chart */}
          <BiometricTrendChart logs={athlete.biometric_logs || []} />

          {/* Active Injuries Section */}
          <div className="section-card">
            <div className="section-card-header">
              <h4>Active & Past Injury Records</h4>
              <RiskBadge risk={athlete.readiness?.injury_risk} />
            </div>

            {(!athlete.injury_records || athlete.injury_records.length === 0) ? (
              <p className="empty-subtext">No injury records found. Athlete is cleared for full load.</p>
            ) : (
              <div className="injury-list">
                {athlete.injury_records.map((inj) => (
                  <div key={inj.injury_id} className={`injury-item injury-severity-${inj.severity?.toLowerCase()}`}>
                    <div className="injury-main">
                      <div className="injury-title">
                        <strong>{inj.injury_type}</strong>
                        <span className="injury-loc">({inj.body_part})</span>
                        <span className={`status-pill status-${inj.status?.toLowerCase()}`}>{inj.status}</span>
                      </div>
                      <p className="injury-desc">Severity: <strong>{inj.severity}</strong> {inj.notes ? `• ${inj.notes}` : ''}</p>
                    </div>
                    {inj.status === 'Active' && (
                      <button 
                        className="btn-clear-injury"
                        onClick={() => handleClearInjury(inj.injury_id)}
                        title="Mark injury as Cleared"
                      >
                        <CheckCircle2 size={14} /> Clear Penalty
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Training Sessions */}
          <div className="section-card">
            <div className="section-card-header">
              <h4>Recent Training Sessions & RPE</h4>
            </div>

            {(!athlete.training_sessions || athlete.training_sessions.length === 0) ? (
              <p className="empty-subtext">No training sessions recorded yet.</p>
            ) : (
              <div className="session-mini-table">
                {athlete.training_sessions.slice(0, 5).map((s) => (
                  <div key={s.session_id} className="session-mini-row">
                    <span className="session-date">{new Date(s.session_date).toLocaleDateString()}</span>
                    <span className="session-type">{s.session_type}</span>
                    <span className="session-dur">{s.duration_min} mins</span>
                    <span className="session-rpe">RPE {s.rpe ?? '--'}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Log Biometrics Form */}
      {activeTab === 'log_biometrics' && (
        <form className="modal-form" onSubmit={handleBiometricSubmit}>
          <div className="form-info-banner">
            <Activity size={16} />
            <span>Posting daily biometrics recalculates the PostgreSQL <strong>Athlete_Readiness</strong> view automatically.</span>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Resting Heart Rate (bpm)</label>
              <input
                type="number"
                min="30"
                max="220"
                value={biometricForm.heart_rate}
                onChange={(e) => setBiometricForm({ ...biometricForm, heart_rate: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="form-field">
              <label>HRV (ms)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="300"
                value={biometricForm.hrv_ms}
                onChange={(e) => setBiometricForm({ ...biometricForm, hrv_ms: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-field">
              <label>Sleep Quality Score (0-100)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={biometricForm.sleep_score}
                onChange={(e) => setBiometricForm({ ...biometricForm, sleep_score: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-field">
              <label>Sleep Hours (0-24)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={biometricForm.sleep_hours}
                onChange={(e) => setBiometricForm({ ...biometricForm, sleep_hours: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-field">
              <label>Fatigue Index (0-10, &gt;7 flags overtraining)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={biometricForm.fatigue_score}
                onChange={(e) => setBiometricForm({ ...biometricForm, fatigue_score: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-field">
              <label>Hydration Level (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={biometricForm.hydration_pct}
                onChange={(e) => setBiometricForm({ ...biometricForm, hydration_pct: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setActiveTab('overview')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Recording...' : 'Commit Biometric Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Record Injury Form */}
      {activeTab === 'log_injury' && (
        <form className="modal-form" onSubmit={handleInjurySubmit}>
          <div className="form-info-banner warning">
            <ShieldAlert size={16} />
            <span>Active injuries apply penalties (Minor: -10, Moderate: -20, Severe: -40) to the live AI readiness score.</span>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Injury Type</label>
              <input
                type="text"
                value={injuryForm.injury_type}
                onChange={(e) => setInjuryForm({ ...injuryForm, injury_type: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label>Body Part</label>
              <input
                type="text"
                value={injuryForm.body_part}
                onChange={(e) => setInjuryForm({ ...injuryForm, body_part: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label>Severity Tier</label>
              <select
                value={injuryForm.severity}
                onChange={(e) => setInjuryForm({ ...injuryForm, severity: e.target.value })}
              >
                <option value="Minor">Minor (-10 pts)</option>
                <option value="Moderate">Moderate (-20 pts)</option>
                <option value="Severe">Severe (-40 pts)</option>
              </select>
            </div>
            <div className="form-field">
              <label>Expected Recovery (Days)</label>
              <input
                type="number"
                value={injuryForm.expected_recovery_days}
                onChange={(e) => setInjuryForm({ ...injuryForm, expected_recovery_days: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-field full-col">
              <label>Clinical Notes</label>
              <textarea
                rows="3"
                value={injuryForm.notes}
                onChange={(e) => setInjuryForm({ ...injuryForm, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setActiveTab('overview')}>Cancel</button>
            <button type="submit" className="btn-primary btn-danger" disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Injury & Apply Penalty'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
