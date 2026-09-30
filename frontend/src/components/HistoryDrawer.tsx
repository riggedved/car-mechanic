'use client';

import React, { useState } from 'react';
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

  return (
    <div
      id="records-drawer"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 14, 22, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          height: '100%',
          background: '#0a0e16',
          borderLeft: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-15px 0 45px rgba(0, 0, 0, 0.8), 0 0 35px rgba(255, 107, 0, 0.1)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#111827',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ff6b00', fontSize: 22 }}>
              history
            </span>
            <h3
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#dfe2ee',
                letterSpacing: '-0.02em',
              }}
            >
              Diagnostic Records
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              color: '#94a3b8',
              display: 'flex',
              padding: 4,
              borderRadius: '50%',
              background: '#1c2028',
              border: '1px solid #1E293B',
            }}
            title="Close Drawer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #1E293B', background: '#0f131c' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#090D14',
              border: '1px solid #1E293B',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.85rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: 16 }}>
              search
            </span>
            <input
              type="text"
              placeholder="Search reports or bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#dfe2ee',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Content Lists */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Confirmed Appointments */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
              }}
            >
              <h4
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: '#ff6b00',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                Confirmed Appointments ({filteredBookings.length})
              </h4>
            </div>

            {filteredBookings.length === 0 ? (
              <p style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                No appointment bookings found.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredBookings.map((b) => (
                  <div
                    key={b.id || b.booking_code}
                    style={{
                      background: '#111827',
                      border: '1px solid #1E293B',
                      borderRadius: 'var(--radius-lg)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          color: '#ff6b00',
                          fontSize: 13,
                        }}
                      >
                        {b.booking_code}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: 'var(--severity-low)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#dfe2ee', fontWeight: 600 }}>
                      {b.service_requested}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      {b.preferred_date} • {b.preferred_time_slot}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspection Reports Section */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
              }}
            >
              <h4
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: '#4cd7f6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                Inspection Reports ({filteredDiagnoses.length})
              </h4>
            </div>

            {filteredDiagnoses.length === 0 ? (
              <p style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                No diagnostic reports compiled yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredDiagnoses.map((diag, index) => {
                  const isCrit = diag.severity === 'CRITICAL';
                  const isHigh = diag.severity === 'HIGH';
                  const isMed = diag.severity === 'MEDIUM';
                  const sevColor = isCrit ? 'var(--severity-critical)' : isHigh ? 'var(--severity-high)' : isMed ? 'var(--severity-medium)' : 'var(--severity-low)';
                  const reportId = diag.id ? `#DX-${diag.id.replace(/-/g, '').slice(0, 5).toUpperCase()}` : `#DX-000${filteredDiagnoses.length - index}`;

                  return (
                    <div
                      key={diag.id || index}
                      onClick={() => {
                        onSelectDiagnosis(diag);
                        onClose();
                      }}
                      style={{
                        background: '#111827',
                        border: '1px solid #1E293B',
                        borderRadius: 'var(--radius-lg)',
                        padding: '0.85rem 1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ff6b00';
                        e.currentTarget.style.transform = 'translateX(-3px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#1E293B';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6b00', fontWeight: 700 }}>
                          {reportId}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            fontWeight: 700,
                            color: sevColor,
                            textTransform: 'uppercase',
                          }}
                        >
                          {diag.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#dfe2ee', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {diag.issue_title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#94a3b8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {diag.summary}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
