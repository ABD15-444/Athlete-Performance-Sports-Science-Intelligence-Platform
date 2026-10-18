import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { AthleteCard } from './components/AthleteCard';
import { AthleteDetail } from './components/AthleteDetail';
import { TeamOverview } from './components/TeamOverview';
import { TeamReadinessBarChart } from './components/TeamReadinessBarChart';
import { AddAthleteModal } from './components/AddAthleteModal';
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  Search,
  Filter,
  ShieldAlert,
  X
} from 'lucide-react';
import './App.css';

export function App() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamOverview, setTeamOverview] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const [detailedAthlete, setDetailedAthlete] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 1. Initial Load: Fetch teams and athletes
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [teamsData, athletesData] = await Promise.all([
        api.getTeams(),
        api.getAthletes(),
      ]);

      setTeams(teamsData);
      setAthletes(athletesData);

      if (teamsData.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsData[0].team_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to Athlete Intelligence API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Fetch Team Overview when selected team changes
  useEffect(() => {
    if (!selectedTeam) return;

    const fetchOverview = async () => {
      try {
        const overview = await api.getTeamOverview(selectedTeam);
        setTeamOverview(overview);
      } catch (err) {
        console.error('Error fetching team overview:', err);
      }
    };

    fetchOverview();
  }, [selectedTeam]);

  // 3. Fetch full athlete details when clicked
  const handleSelectAthlete = async (athleteId) => {
    setSelectedAthleteId(athleteId);
    setDetailLoading(true);
    try {
      const fullProfile = await api.getAthleteById(athleteId);
      setDetailedAthlete(fullProfile);
    } catch (err) {
      console.error('Failed to load athlete profile:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRefreshData = async () => {
    await loadInitialData();
    if (selectedTeam) {
      const ov = await api.getTeamOverview(selectedTeam);
      setTeamOverview(ov);
    }
    if (selectedAthleteId) {
      const fullProfile = await api.getAthleteById(selectedAthleteId);
      setDetailedAthlete(fullProfile);
    }
  };

  // High Injury Risk Athletes for the global alert banner
  const highRiskAthletes = athletes.filter((a) => a.injury_risk === 'High');

  // Filtered athletes based on active squad, search query, and risk level
  const displayedAthletes = athletes.filter((a) => {
    const matchesTeam = selectedTeam ? a.team_id === selectedTeam : true;
    const athleteName = (a.athlete_name || `${a.first_name} ${a.last_name}`).toLowerCase();
    const matchesSearch = athleteName.includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'All' ? true : a.injury_risk === riskFilter;

    return matchesTeam && matchesSearch && matchesRisk;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Connecting to Athlete Intelligence Platform...</p>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="brand-title">ATHLETE INTELLIGENCE</h1>
            <p className="brand-subtitle">Sports Science & Live AI Readiness Platform</p>
          </div>
        </div>

        <div className="nav-actions">
          <div className="system-status-indicator" title="Connected to PostgreSQL Database">
            <span className="pulse-dot" />
            <span>PostgreSQL 18 Live</span>
          </div>

          <button className="btn-secondary" onClick={handleRefreshData} title="Refresh Live Data">
            <RefreshCw size={14} /> Refresh
          </button>

          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={15} /> Add Athlete
          </button>
        </div>
      </header>

      {/* Global Alert Banner for High Risk Athletes */}
      {highRiskAthletes.length > 0 && (
        <div className="alert-banner">
          <div className="alert-banner-content">
            <ShieldAlert size={18} className="text-amber" />
            <span>
              <strong>Overtraining / High Risk Warning:</strong> {highRiskAthletes.length} athlete(s) flagged for elevated fatigue or acute injury penalty:
            </span>
            {highRiskAthletes.map((a) => (
              <span
                key={a.athlete_id}
                className="alert-athlete-tag"
                onClick={() => handleSelectAthlete(a.athlete_id)}
              >
                {a.athlete_name} ({a.readiness_score ? parseFloat(a.readiness_score).toFixed(1) : '--'})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="main-content">
        {/* Team Overview & Top KPIs */}
        <TeamOverview
          overview={teamOverview}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
          teams={teams}
        />

        {/* Readiness Distribution Bar Chart */}
        <TeamReadinessBarChart
          athletes={displayedAthletes}
          onSelectAthlete={handleSelectAthlete}
        />

        {/* Roster Grid Header with Controls */}
        <div className="roster-header-bar">
          <div className="roster-title-group">
            <h3>Squad Roster & Performance Profiles</h3>
            <p>Click on an athlete card to open their biometric trend telemetry and manage injuries</p>
          </div>

          <div className="roster-filter-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search athlete by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>

        {/* Athletes Cards Grid */}
        <div className="athletes-grid">
          {displayedAthletes.map((athlete) => (
            <AthleteCard
              key={athlete.athlete_id}
              athlete={athlete}
              isSelected={selectedAthleteId === athlete.athlete_id}
              onClick={() => handleSelectAthlete(athlete.athlete_id)}
            />
          ))}
        </div>
      </main>

      {/* Athlete Detail Sliding Drawer / Modal */}
      {selectedAthleteId && detailedAthlete && (
        <div className="detail-modal-backdrop" onClick={() => setSelectedAthleteId(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <AthleteDetail
              athlete={detailedAthlete}
              onClose={() => setSelectedAthleteId(null)}
              onRefresh={handleRefreshData}
            />
          </div>
        </div>
      )}

      {/* Add Athlete Modal */}
      {isAddModalOpen && (
        <AddAthleteModal
          teams={teams}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={handleRefreshData}
        />
      )}
    </div>
  );
}

export default App;
