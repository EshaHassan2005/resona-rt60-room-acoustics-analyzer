import React from 'react';
import { X, Clock, Trash2, ArrowUpRight, Download, FileText, CheckCircle2 } from 'lucide-react';
import logo1 from '../assets/logo1.png';

export default function SavedReportsModal({
  isOpen,
  onClose,
  savedReports = [],
  onLoadReport,
  onDeleteReport,
  onClearAll,
  onExportJSON,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop no-print" onClick={onClose}>
      <div
        className="modal-container saved-reports-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '92%' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="brand-logo-icon" style={{ flexShrink: 0 }}>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.35rem', margin: 0 }}>
                Saved Calculations History
              </h2>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--color-text-dim)',
                  margin: '4px 0 0 0',
                }}
              >
                Stores up to your last 3 calculations locally for instant recall and comparison.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ marginTop: '16px', maxHeight: '65vh', overflowY: 'auto' }}>
          {savedReports.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                color: 'var(--color-text-muted)',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px dashed var(--glass-border)',
              }}
            >
              <FileText size={44} style={{ opacity: 0.35, marginBottom: '12px' }} />
              <h4 style={{ color: 'var(--color-cream)', marginBottom: '6px' }}>No Saved Calculations Yet</h4>
              <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto' }}>
                Run an acoustic diagnostic in the generator and click <strong>"Save Calculation"</strong> to store your room parameters here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--glass-border)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-dim)',
                }}
              >
                <span>
                  Showing {savedReports.length} of 3 stored calculations (Slot {savedReports.length}/3)
                </span>
                {savedReports.length > 0 && (
                  <button
                    onClick={onClearAll}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Trash2 size={13} /> Clear All
                  </button>
                )}
              </div>

              {savedReports.map((item, index) => {
                const dateStr = item.timestamp
                  ? new Date(item.timestamp).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                  : 'Recent Session';

                return (
                  <div
                    key={item.id || index}
                    className="saved-report-card"
                    style={{
                      background: 'var(--glass-card)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      padding: '16px',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              background: 'rgba(74, 222, 128, 0.15)',
                              color: 'var(--color-accent-emerald)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Slot #{index + 1}
                          </span>
                          <h4 style={{ color: 'var(--color-cream)', margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                            {item.roomLabel || item.roomType || 'Acoustic Space'}
                          </h4>
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginTop: '4px',
                          }}
                        >
                          <Clock size={12} />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      {/* Action buttons for this item */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          className="btn-pill-secondary"
                          onClick={() => onExportJSON(item)}
                          title="Download JSON for this calculation"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.76rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <Download size={13} /> JSON
                        </button>
                        <button
                          className="btn-pill-primary"
                          onClick={() => {
                            onLoadReport(item);
                            onClose();
                          }}
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.76rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <ArrowUpRight size={14} /> Restore
                        </button>
                        <button
                          onClick={() => onDeleteReport(item.id || index)}
                          title="Delete this record"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#f87171',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Metric Pills */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                        gap: '8px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.7rem' }}>
                          Dimensions
                        </span>
                        <strong style={{ color: 'var(--color-cream)' }}>
                          {item.lengthM}m × {item.widthM}m × {item.heightM}m ({item.volumeM3} m³)
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.7rem' }}>
                          Measured RT60
                        </span>
                        <strong style={{ color: 'var(--color-accent-emerald)' }}>
                          {item.results?.measuredT20 ? `${item.results.measuredT20}s` : 'N/A'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.7rem' }}>
                          Target RT60
                        </span>
                        <strong style={{ color: 'var(--color-accent-amber)' }}>
                          {item.results?.target ? `${item.results.target}s` : 'N/A'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.7rem' }}>
                          Treatment Area
                        </span>
                        <strong style={{ color: 'var(--color-cream)' }}>
                          {item.results?.neededArea ? `${item.results.neededArea} m²` : '0 m²'}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
            Data persists on this device across browser restarts.
          </span>
          <button className="btn-pill-secondary" onClick={onClose} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
