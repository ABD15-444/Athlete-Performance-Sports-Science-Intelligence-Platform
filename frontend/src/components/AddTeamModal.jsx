import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Trophy } from 'lucide-react';

export function AddTeamModal({ coaches, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    team_name: '',
    sport_type: 'Basketball',
    coach_id: coaches[0]?.coach_id || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.createTeam(formData);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Trophy size={20} className="text-cyan" />
            <h3>Create New Squad / Team</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="modal-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field full-col">
            <label>Squad / Team Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Phoenix Rising"
              value={formData.team_name}
              onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Sport Type</label>
              <input
                type="text"
                required
                placeholder="e.g. Soccer, Basketball, Rowing"
                value={formData.sport_type}
                onChange={(e) => setFormData({ ...formData, sport_type: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Assign Head Coach</label>
              <select
                value={formData.coach_id}
                onChange={(e) => setFormData({ ...formData, coach_id: e.target.value })}
                required
              >
                {coaches.map((c) => (
                  <option key={c.coach_id} value={c.coach_id}>
                    {c.full_name || `${c.first_name} ${c.last_name}`} ({c.speciality || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating Team...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
