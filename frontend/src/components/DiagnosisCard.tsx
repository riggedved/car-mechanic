'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, Calendar, Printer, Share2, Wrench, Check } from 'lucide-react';
import { Diagnosis } from '@/lib/api';

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  onBookClick: (diagnosis: Diagnosis) => void;
}

export default function DiagnosisCard({ diagnosis, onBookClick }: DiagnosisCardProps) {
  const [copied, setCopied] = useState(false);

  const getSeverityInfo = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          badge: <span className="badge badge-critical"><ShieldAlert size={13} /> Critical Severity</span>,
          urgencyScore: 95,
          color: '#f43f5e',
          accentBg: 'rgba(244, 63, 94, 0.15)',
          barBg: 'linear-gradient(90deg, #3b82f6, #f43f5e)'
        };
      case 'HIGH':
        return {
          badge: <span className="badge badge-high"><AlertCircle size={13} /> High Priority</span>,
          urgencyScore: 78,
          color: '#818cf8',
          accentBg: 'rgba(99, 102, 241, 0.15)',
          barBg: 'linear-gradient(90deg, #3b82f6, #818cf8)'
        };
      case 'MEDIUM':
        return {
          badge: <span className="badge badge-medium"><AlertCircle size={13} /> Medium Attention</span>,
          urgencyScore: 50,
          color: 'var(--accent-cyan)',
          accentBg: 'rgba(14, 165, 233, 0.15)',
          barBg: 'linear-gradient(90deg, #1d4ed8, #0ea5e9)'
        };
      default:
        return {
          badge: <span className="badge badge-low"><CheckCircle2 size={13} /> Low Risk</span>,
          urgencyScore: 25,
          color: 'var(--status-low)',
          accentBg: 'rgba(16, 185, 129, 0.12)',
          barBg: 'linear-gradient(90deg, #0284c7, #10b981)'
        };
    }
  };

  const sevInfo = getSeverityInfo(diagnosis.severity);

  const handleShare = () => {
    const text = `Apex Diagnosis Report: ${diagnosis.issue_title}\nSeverity: ${diagnosis.severity}\nEstimated Cost: ${diagnosis.estimated_cost_range}\n${diagnosis.summary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      background: 'rgba(12, 21, 39, 0.88)',
      border: '1px solid rgba(59, 130, 246, 0.35)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.4rem',
      marginTop: '1.25rem',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(37, 99, 235, 0.15)',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)'
    }}>
      {/* Top Cyber Stripe */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: sevInfo.barBg
      }} />

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.9rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Master Diagnostic Inspection Report
            </span>
            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
              ASE Verified
            </span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            {diagnosis.issue_title}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {sevInfo.badge}

          <button
            onClick={handleShare}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem'
            }}
            title="Copy Report to Clipboard"
          >
            {copied ? <Check size={14} color="var(--accent-cyan)" /> : <Share2 size={14} />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem'
            }}
            title="Print or Save PDF"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Urgency Health Gauge Meter */}
      <div style={{
        background: 'rgba(10, 17, 34, 0.7)',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Mechanical Urgency Index
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: sevInfo.color }}>
            {sevInfo.urgencyScore}% / 100
          </span>
        </div>
        <div style={{ height: 6, background: '#1e293b', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${sevInfo.urgencyScore}%`,
            background: sevInfo.barBg,
            borderRadius: 999,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>
      </div>

      {/* Summary */}
      <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.15rem' }}>
        {diagnosis.summary}
      </p>

      {/* Probable Causes Checklist */}
      {diagnosis.probable_causes && diagnosis.probable_causes.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.78rem', color: 'var(--accent-blue-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', fontWeight: 700 }}>
            Root Cause Analysis
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {diagnosis.probable_causes.map((cause, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  fontSize: '0.86rem',
                  color: '#e2e8f0',
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(59, 130, 246, 0.12)'
                }}
              >
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: 'rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  marginTop: 2
                }}>
                  {idx + 1}
                </div>
                <span>{cause}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Services Table & Estimates (INR ₹) */}
      {diagnosis.recommended_services && diagnosis.recommended_services.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Recommended Workshop Services (INR ₹)
            </h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--status-low)', fontWeight: 600 }}>
              Save ~35% vs OEM Dealerships
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {diagnosis.recommended_services.map((srv, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(10, 17, 34, 0.7)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  fontSize: '0.88rem'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{srv.name}</span>
                  {srv.urgency && (
                    <span style={{
                      marginLeft: '0.6rem',
                      fontSize: '0.72rem',
                      color: srv.urgency.toLowerCase().includes('immediate') ? '#f43f5e' : 'var(--accent-blue-light)',
                      fontWeight: 600
                    }}>
                      • {srv.urgency}
                    </span>
                  )}
                </div>
                <span style={{
                  fontWeight: 800,
                  color: 'var(--accent-cyan)',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {srv.estimated_cost}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Warning Box */}
      {diagnosis.safety_warning && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.08)',
          borderLeft: '4px solid #f43f5e',
          padding: '0.85rem 1rem',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          color: '#fda4af',
          lineHeight: 1.5,
          border: '1px solid rgba(244, 63, 94, 0.2)',
          borderLeftWidth: 4
        }}>
          <strong>Safety Advisory:</strong> {diagnosis.safety_warning}
        </div>
      )}

      {/* Footer & "Book Certified Mechanic" CTA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingTop: '0.85rem',
        borderTop: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        {diagnosis.estimated_cost_range && (
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Estimated Total:</span>
            <strong style={{
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              textShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
            }}>
              {diagnosis.estimated_cost_range}
            </strong>
          </div>
        )}

        <button
          onClick={() => onBookClick(diagnosis)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.8rem 1.6rem',
            background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.92rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 0 25px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s',
            marginLeft: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 35px rgba(37, 99, 235, 0.75)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(37, 99, 235, 0.5)';
          }}
        >
          <Calendar size={18} strokeWidth={2.4} />
          <span>Book Certified Mechanic</span>
        </button>
      </div>
    </div>
  );
}
