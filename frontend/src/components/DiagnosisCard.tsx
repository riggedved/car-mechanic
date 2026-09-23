'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, Calendar, Printer, Share2, Check } from 'lucide-react';
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
          badge: <span className="badge badge-critical"><ShieldAlert size={12} /> Critical</span>,
          urgencyScore: 95,
          color: 'var(--status-crit)',
          barBg: '#dc2626',
          warningClass: 'critical'
        };
      case 'HIGH':
        return {
          badge: <span className="badge badge-high"><AlertCircle size={12} /> High</span>,
          urgencyScore: 78,
          color: 'var(--status-high)',
          barBg: '#dc2626',
          warningClass: ''
        };
      case 'MEDIUM':
        return {
          badge: <span className="badge badge-medium"><AlertCircle size={12} /> Medium</span>,
          urgencyScore: 50,
          color: 'var(--status-med)',
          barBg: '#d97706',
          warningClass: ''
        };
      default:
        return {
          badge: <span className="badge badge-low"><CheckCircle2 size={12} /> Low</span>,
          urgencyScore: 25,
          color: 'var(--status-low)',
          barBg: '#059669',
          warningClass: ''
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
    <div className="diagnosis-card">
      {/* Left Accent Bar */}
      <div className="diagnosis-accent-bar" style={{ background: sevInfo.barBg }} />

      {/* Header Bar */}
      <div className="diagnosis-header">
        <div>
          <div className="diagnosis-label">
            <span>Diagnostic Report</span>
            {sevInfo.badge}
            <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>Verified</span>
          </div>
          <h3 className="diagnosis-title">
            {diagnosis.issue_title}
          </h3>
        </div>

        <div className="diagnosis-actions">
          <button onClick={handleShare} className="btn btn-secondary btn-sm" title="Copy Report to Clipboard">
            {copied ? <Check size={13} style={{ color: 'var(--status-low)' }} /> : <Share2 size={13} />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <button onClick={handlePrint} className="btn btn-secondary btn-sm" title="Print or Save PDF">
            <Printer size={13} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Urgency Gauge */}
      <div className="diagnosis-gauge">
        <div className="diagnosis-gauge-header">
          <span className="text-small" style={{ fontWeight: 600 }}>Urgency Index</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: sevInfo.color }}>
            {sevInfo.urgencyScore}%
          </span>
        </div>
        <div className="diagnosis-gauge-track">
          <div
            className="diagnosis-gauge-fill"
            style={{ width: `${sevInfo.urgencyScore}%`, background: sevInfo.barBg }}
          />
        </div>
      </div>

      {/* Summary */}
      <p className="diagnosis-summary">{diagnosis.summary}</p>

      {/* Probable Causes */}
      {diagnosis.probable_causes && diagnosis.probable_causes.length > 0 && (
        <div className="diagnosis-causes">
          <h4 className="text-section-title" style={{ marginBottom: '0.45rem', color: 'var(--text-muted)' }}>
            Root Cause Analysis
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {diagnosis.probable_causes.map((cause, idx) => (
              <div key={idx} className="diagnosis-cause-item">
                <div className="diagnosis-cause-num">{idx + 1}</div>
                <span>{cause}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Services */}
      {diagnosis.recommended_services && diagnosis.recommended_services.length > 0 && (
        <div className="diagnosis-services">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <h4 className="text-section-title" style={{ color: 'var(--text-muted)' }}>
              Recommended Services (INR ₹)
            </h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--status-low)', fontWeight: 600 }}>
              Save ~35% vs Dealerships
            </span>
          </div>
          <div>
            {diagnosis.recommended_services.map((srv, idx) => (
              <div key={idx} className="diagnosis-service-row">
                <div>
                  <span className="diagnosis-service-name">{srv.name}</span>
                  {srv.urgency && (
                    <span
                      className="diagnosis-service-urgency"
                      style={{
                        color: srv.urgency.toLowerCase().includes('immediate') ? 'var(--status-high)' : 'var(--text-dim)'
                      }}
                    >
                      · {srv.urgency}
                    </span>
                  )}
                </div>
                <span className="diagnosis-service-cost">{srv.estimated_cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Warning */}
      {diagnosis.safety_warning && (
        <div className={`diagnosis-warning ${sevInfo.warningClass}`}>
          <strong>Safety Advisory:</strong> {diagnosis.safety_warning}
        </div>
      )}

      {/* Footer & CTA */}
      <div className="diagnosis-footer">
        {diagnosis.estimated_cost_range && (
          <div>
            <span className="diagnosis-cost-total">Estimated Total</span>
            <div className="diagnosis-cost-value">{diagnosis.estimated_cost_range}</div>
          </div>
        )}

        <button
          onClick={() => onBookClick(diagnosis)}
          className="btn btn-primary"
          style={{ marginLeft: 'auto' }}
        >
          <Calendar size={17} strokeWidth={2.4} />
          <span>Book Mechanic</span>
        </button>
      </div>
    </div>
  );
}
