import React, { useState } from 'react';
import { api } from '../services/api';
import { X, UserCheck } from 'lucide-react';

export function AddCoachModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    speciality: 'Strength & Conditioning',
    cert_level: 'CSCS',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.createCoach(formData);
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
            <UserCheck size={20} className="text-cyan" />
            <h3>Add New Coach</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="modal-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-2">
            <div className="form-field">
              <label>First Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Marcus"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Last Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Vance"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field full-col">
            <label>Professional Email</label>
            <input
              type="email"
              required
              placeholder="e.g. coach.name@sportscience.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Speciality Area</label>
              <input
                type="text"
                required
                placeholder="e.g. Neuromuscular Conditioning"
                value={formData.speciality}
                onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Certification Level</label>
              <input
                type="text"
                placeholder="e.g. CSCS, ACSM-EP"
                value={formData.cert_level}
                onChange={(e) => setFormData({ ...formData, cert_level: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating Coach...' : 'Register Coach'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
