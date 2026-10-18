// API client service for Athlete Intelligence Platform
// Points to the Express backend via VITE_API_URL or defaults to http://localhost:3001

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => fetchJson('/api/health'),

  // Athletes
  getAthletes: (params = {}) => {
    const query = new URLSearchParams();
    if (params.team_id) query.append('team_id', params.team_id);
    if (params.injury_risk) query.append('injury_risk', params.injury_risk);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchJson(`/api/athletes${qs}`);
  },

  getAthleteById: (id) => fetchJson(`/api/athletes/${id}`),

  createAthlete: (athleteData) =>
    fetchJson('/api/athletes', {
      method: 'POST',
      body: JSON.stringify(athleteData),
    }),

  // Biometrics
  logBiometrics: (athleteId, biometricData) =>
    fetchJson(`/api/athletes/${athleteId}/biometrics`, {
      method: 'POST',
      body: JSON.stringify(biometricData),
    }),

  // Teams
  getTeams: () => fetchJson('/api/teams'),
  getTeamOverview: (teamId) => fetchJson(`/api/teams/${teamId}/overview`),
  createTeam: (teamData) =>
    fetchJson('/api/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    }),

  // Coaches
  getCoaches: () => fetchJson('/api/coaches'),
  createCoach: (coachData) =>
    fetchJson('/api/coaches', {
      method: 'POST',
      body: JSON.stringify(coachData),
    }),

  // Sessions
  getSessions: (limit = 20) => fetchJson(`/api/sessions?limit=${limit}`),
  getSessionById: (id) => fetchJson(`/api/sessions/${id}`),
  createSession: (sessionData) =>
    fetchJson('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    }),
  logAthleteSession: (sessionId, sessionData) =>
    fetchJson(`/api/sessions/${sessionId}/athletes`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    }),

  // Injuries
  getInjuries: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.severity) query.append('severity', params.severity);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchJson(`/api/injuries${qs}`);
  },
  getAthleteInjuries: (athleteId) => fetchJson(`/api/athletes/${athleteId}/injuries`),
  createInjury: (athleteId, injuryData) =>
    fetchJson(`/api/athletes/${athleteId}/injury`, {
      method: 'POST',
      body: JSON.stringify(injuryData),
    }),
  updateInjuryStatus: (injuryId, statusData) =>
    fetchJson(`/api/injuries/${injuryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    }),
};
