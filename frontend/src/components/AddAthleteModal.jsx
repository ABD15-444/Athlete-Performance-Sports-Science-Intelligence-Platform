import React, { useState } from 'react';
import { api } from '../services/api';
import { X, UserPlus } from 'lucide-react';

export function AddAthleteModal({ teams, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    team_id: teams[0]?.team_id || '',
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '2001-05-15',
    height_cm: 185,
    weight_kg: 82,
    position_name: 'Forward',
    contact_phone: '+1-555-0999',
    contact_name: 'Emergency Guardian',
    relationship: 'Parent',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        team_id: formData.team_id,
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        dob: formData.dob,
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        positions: [formData.position_name],
        emergency_contacts: [
          {
            contact_phone: formData.contact_phone,
            contact_name: formData.contact_name,
            relationship: formData.relationship,
          },
        ],
      };

      await api.createAthlete(payload);
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
            <UserPlus size={20} className="text-cyan" />
            <h3>Register New Athlete</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="modal-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field full-col">
            <label>Assigned Squad / Team</label>
            <select
              value={formData.team_id}
              onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
              required
            >
              {teams.map((t) => (
                <option key={t.team_id} value={t.team_id}>
                  {t.team_name} ({t.sport_type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Primary Position</label>
              <input
                type="text"
                required
                value={formData.position_name}
                onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Date of Birth</label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Height (cm)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
              />
            </div>
          </div>

          <div className="form-section-title">Emergency Contact Details</div>
          <div className="form-grid-2">
            <div className="form-field">
              <label>Contact Name</label>
              <input
                type="text"
                required
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Phone Number</label>
              <input
                type="tel"
                required
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Athlete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
