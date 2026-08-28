import React, { useState } from 'react';
import { X, Send, CheckCircle2, MessageSquare, User, Mail, Phone, Home } from 'lucide-react';

export default function ContactModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomType: 'studio',
    roomDimensions: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      // Auto reset after 3 seconds if needed
    }, 3000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close Modal"
        >
          <X size={20} />
        </button>

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <MessageSquare size={20} color="var(--color-light-sage)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
              ACOUSTIC ADVISORY
            </span>
          </div>
          <h3 className="modal-title">Contact Our Acoustic Counselors</h3>
          <p className="modal-subtitle">
            Get personalized room diagnosis, 3D acoustic simulation, and treatment layout blueprints tailored for your space.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '36px 12px' }}>
            <CheckCircle2 size={56} color="var(--color-accent-emerald)" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ fontSize: '1.4rem', color: 'var(--color-cream)', marginBottom: '8px' }}>
              Consultation Request Received!
            </h4>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 24px' }}>
              Our senior acoustic engineers will review your room specs and contact you within 24 hours with a custom acoustic plan.
            </p>
            <button
              className="btn-pill-primary"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
            >
              Back to RESONA
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-grid" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@studio.com"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select
                  className="form-select"
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                >
                  <option value="studio">Music Recording Studio</option>
                  <option value="cinema">Home Theater / Cinema</option>
                  <option value="podcast">Broadcast / Voiceover Booth</option>
                  <option value="office">Conference / Commercial Office</option>
                  <option value="other">Custom Architectural Project</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Approx. Dimensions (L × W × H)</label>
                <input
                  type="text"
                  placeholder="e.g. 5m × 4m × 2.8m"
                  className="form-input"
                  value={formData.roomDimensions}
                  onChange={(e) => setFormData({ ...formData, roomDimensions: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Specific Acoustic Challenges / Goals</label>
              <textarea
                rows="3"
                className="form-textarea"
                placeholder="e.g. Flutter echo around mixing position, boomy low end at 80Hz, sound leakage to adjacent rooms..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              ></textarea>
            </div>

            <div style={{ marginTop: '8px' }}>
              <button
                type="submit"
                className="btn-pill-primary"
                style={{ width: '100%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Send size={18} />
                REQUEST CONSULTATION
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
