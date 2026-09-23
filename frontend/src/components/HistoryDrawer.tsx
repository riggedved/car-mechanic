'use client';

import React, { useState } from 'react';
import { X, Search, FileText, Calendar, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';
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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 90,
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        height: '100%',
        background: '#090f1d',
        borderLeft: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-15px 0 45px rgba(0, 0, 0, 0.8), 0 0 35px rgba(37, 99, 235, 0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
              Diagnostics & Service Logs
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: '50%', background: 'rgba(30, 41, 59, 0.4)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid rgba(30, 41, 59, 0.6)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.85rem'
          }}>
            <Search size={15} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Search reports or bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '0.82rem',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Content list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Confirmed Bookings Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <h4 style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                Confirmed Appointments ({filteredBookings.length})
              </h4>
            </div>

            {filteredBookings.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                No appointment bookings found.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredBookings.map((b) => (
                  <div
                    key={b.id || b.booking_code}
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.9rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                        {b.booking_code}
                      </span>
                      <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600, marginBottom: '0.2rem' }}>
                      {b.service_requested}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {b.preferred_date} • {b.preferred_time_slot}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnosis History Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <h4 style={{ fontSize: '0.78rem', color: 'var(--accent-blue-light)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                Inspection Reports ({filteredDiagnoses.length})
              </h4>
            </div>

            {filteredDiagnoses.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                No diagnostic reports generated yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredDiagnoses.map((diag, index) => (
                  <div
                    key={diag.id || index}
                    onClick={() => {
                      onSelectDiagnosis(diag);
                      onClose();
                    }}
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                      e.currentTarget.style.transform = 'translateX(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Report #{filteredDiagnoses.length - index}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: diag.severity === 'CRITICAL' ? '#f43f5e' :
                               diag.severity === 'HIGH' ? '#818cf8' :
                               diag.severity === 'MEDIUM' ? 'var(--accent-cyan)' : 'var(--status-low)'
                      }}>
                        {diag.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#fff', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {diag.issue_title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
