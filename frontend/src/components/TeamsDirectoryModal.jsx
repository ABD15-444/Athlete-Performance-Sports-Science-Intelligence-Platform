import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Users, Trophy, UserCheck, ShieldAlert, ChevronRight } from 'lucide-react';
import { ReadinessBadge, RiskBadge } from './Badges';

export function TeamsDirectoryModal({ onClose, onSelectAthlete }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamDetail, setTeamDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await api.getTeams();
        setTeams(data);
        if (data.length > 0) {
          setSelectedTeamId(data[0].team_id);
        }
      } catch (err) {
        console.error('Failed to load teams directory:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) return;
    const fetchOverview = async () => {
      try {
        setDetailLoading(true);
        const overview = await api.getTeamOverview(selectedTeamId);
        setTeamDetail(overview);
      } catch (err) {
        console.error('Failed to load team overview:', err);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchOverview();
  }, [selectedTeamId]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container directory-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Trophy size={20} className="text-cyan" />
            <h3>Squads & Coaching Directory</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="directory-layout">
          {/* Left: Teams List */}
          <div className="directory-sidebar">
            <div className="directory-list-header">
              <span>All Teams ({teams.length})</span>
            </div>
            <div className="directory-teams-list">
              {teams.map((t) => (
                <div
                  key={t.team_id}
                  className={`directory-team-item ${selectedTeamId === t.team_id ? 'active' : ''}`}
                  onClick={() => setSelectedTeamId(t.team_id)}
                >
                  <div className="team-item-info">
                    <h4>{t.team_name}</h4>
                    <span className="team-item-sub">{t.sport_type} • Coach: {t.coach_name}</span>
                  </div>
                  <span className="roster-count-badge">{t.athlete_count || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Selected Team Detail */}
          <div className="directory-main-panel">
            {detailLoading ? (
              <div className="directory-loading">Loading squad profile...</div>
            ) : teamDetail ? (
              <div className="directory-team-content">
                <div className="directory-team-banner">
                  <div>
                    <h3 className="team-banner-title">{teamDetail.team_name}</h3>
                    <p className="team-banner-sport">{teamDetail.sport_type} Department</p>
                  </div>
                  <div className="team-banner-coach">
                    <UserCheck size={16} className="text-cyan" />
                    <div>
                      <strong>{teamDetail.coach_name}</strong>
                      <span>{teamDetail.coach_speciality || 'Head Coach'} ({teamDetail.coach_cert_level || 'Certified'})</span>
                    </div>
                  </div>
                </div>

                <div className="directory-stats-row">
                  <div className="dir-stat-box">
                    <span className="dir-stat-label">Avg Readiness</span>
                    <span className="dir-stat-val text-cyan">
                      {teamDetail.avg_readiness !== null ? `${parseFloat(teamDetail.avg_readiness).toFixed(1)}/100` : '--'}
                    </span>
                  </div>
                  <div className="dir-stat-box">
                    <span className="dir-stat-label">Roster Size</span>
                    <span className="dir-stat-val">{teamDetail.athlete_count || 0}</span>
                  </div>
                  <div className="dir-stat-box">
                    <span className="dir-stat-label">Active Injuries</span>
                    <span className="dir-stat-val text-amber">{teamDetail.total_active_injuries || 0}</span>
                  </div>
                </div>

                <div className="directory-roster-section">
                  <div className="roster-section-heading">
                    <h4>Assigned Athletes ({teamDetail.athletes?.length || 0})</h4>
                  </div>

                  {(!teamDetail.athletes || teamDetail.athletes.length === 0) ? (
                    <div className="empty-subtext">No athletes registered in this squad yet.</div>
                  ) : (
                    <div className="directory-athletes-table">
                      {teamDetail.athletes.map((ath) => (
                        <div
                          key={ath.athlete_id}
                          className="directory-athlete-row"
                          onClick={() => {
                            if (onSelectAthlete) onSelectAthlete(ath.athlete_id);
                            onClose();
                          }}
                        >
                          <div className="ath-name-col">
                            <strong>{ath.full_name || `${ath.first_name} ${ath.last_name}`}</strong>
                            <span>{ath.height_cm ? `${ath.height_cm} cm` : ''} • {ath.weight_kg ? `${ath.weight_kg} kg` : ''}</span>
                          </div>

                          <div className="ath-readiness-col">
                            <ReadinessBadge score={ath.readiness_score} size="sm" />
                          </div>

                          <div className="ath-risk-col">
                            <RiskBadge risk={ath.injury_risk} />
                          </div>

                          <div className="ath-injury-col">
                            {ath.active_injury_count > 0 ? (
                              <span className="injury-indicator">
                                <ShieldAlert size={12} /> {ath.active_injury_count} active
                              </span>
                            ) : (
                              <span className="healthy-indicator">Healthy</span>
                            )}
                          </div>

                          <div className="ath-arrow-col">
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
