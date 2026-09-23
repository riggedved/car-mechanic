'use client';

import React, { useState } from 'react';
import { X, Search, FileText, Calendar, CheckCircle2, Inbox } from 'lucide-react';
import { Diagnosis, Booking } from '@/lib/api';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  diagnoses: Diagnosis[];
  bookings: Booking[];
  onSelectDiagnosis: (diag: Diagnosis) => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  diagnoses,
  bookings,
  onSelectDiagnosis,
}: HistoryDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredDiagnoses = diagnoses.filter(d =>
    d.issue_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings.filter(b =>
    b.booking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.service_requested.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'var(--status-crit)';
      case 'HIGH': return 'var(--status-high)';
      case 'MEDIUM': return 'var(--status-med)';
      default: return 'var(--status-low)';
    }
  };

  return (
    <div className="drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drawer-panel">
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={17} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Service Records
            </h3>
          </div>
          <button className="modal-close" onClick={onClose} style={{ position: 'static' }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.75rem',
            transition: 'border-color 0.15s ease'
          }}>
            <Search size={15} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search reports or bookings…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Content list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Confirmed Bookings Section */}
          <div>
            <h4 className="history-section-title">
              Appointments ({filteredBookings.length})
            </h4>

            {filteredBookings.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">
                  <Calendar size={28} />
                </div>
                <p>No appointments booked yet.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  Generate a diagnosis and book a service to see appointments here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredBookings.map((b) => (
                  <div key={b.id || b.booking_code} className="history-booking-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent)', fontSize: '0.85rem' }}>
                        {b.booking_code}
                      </span>
                      <span className="badge badge-low" style={{ fontSize: '0.6rem' }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.15rem' }}>
                      {b.service_requested}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      {b.preferred_date} · {b.preferred_time_slot}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnosis History Section */}
          <div>
            <h4 className="history-section-title">
              Inspection Reports ({filteredDiagnoses.length})
            </h4>

            {filteredDiagnoses.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">
                  <Inbox size={28} />
                </div>
                <p>No diagnostic reports yet.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  Describe your vehicle symptoms and generate a diagnosis.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredDiagnoses.map((diag, index) => (
                  <div
                    key={diag.id || index}
                    onClick={() => {
                      onSelectDiagnosis(diag);
                      onClose();
                    }}
                    className="history-diag-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                        Report #{filteredDiagnoses.length - index}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: getSeverityColor(diag.severity)
                      }}>
                        {diag.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.2rem' }}>
                      {diag.issue_title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {diag.summary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
