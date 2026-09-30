'use client';

import React, { useState } from 'react';
import { Diagnosis } from '@/lib/api';

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  vehicleSummary?: string;
  onBookClick: (diagnosis: Diagnosis) => void;
}

export default function DiagnosisCard({
  diagnosis,
  vehicleSummary,
  onBookClick,
}: DiagnosisCardProps) {
  const [copied, setCopied] = useState(false);

  const getSeverityData = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL':
        return {
          label: 'CRITICAL FAULT (95% URGENCY)',
          urgencyPercent: 95,
          color: 'var(--severity-critical)',
          bgTint: 'rgba(239, 68, 68, 0.12)',
          borderColor: 'rgba(239, 68, 68, 0.35)',
          intervention: 'Immediate Intervention Required',
        };
      case 'HIGH':
        return {
          label: 'HIGH PRIORITY (78% URGENCY)',
          urgencyPercent: 78,
          color: 'var(--severity-high)',
          bgTint: 'rgba(245, 158, 11, 0.12)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          intervention: 'Prompt Rectification Advised',
        };
      case 'MEDIUM':
        return {
          label: 'MEDIUM ATTENTION (50% URGENCY)',
          urgencyPercent: 50,
          color: 'var(--severity-medium)',
          bgTint: 'rgba(234, 179, 8, 0.12)',
          borderColor: 'rgba(234, 179, 8, 0.35)',
          intervention: 'Scheduled Service Recommended',
        };
      default:
        return {
          label: 'LOW RISK (25% URGENCY)',
          urgencyPercent: 25,
          color: 'var(--severity-low)',
          bgTint: 'rgba(16, 185, 129, 0.12)',
          borderColor: 'rgba(16, 185, 129, 0.35)',
          intervention: 'Nominal Operating Parameters',
        };
    }
  };

  const sev = getSeverityData(diagnosis.severity);
  const reportCode = diagnosis.id ? `#DX-${diagnosis.id.replace(/-/g, '').slice(0, 5).toUpperCase()}` : '#DX-99042';

  const handleCopy = () => {
    const servicesText = diagnosis.recommended_services
      ? diagnosis.recommended_services.map(s => ` - ${s.name}: ${s.estimated_cost} (${s.urgency})`).join('\n')
      : '';
    const causesText = diagnosis.probable_causes
      ? diagnosis.probable_causes.map((c, i) => ` 0${i + 1}. ${c}`).join('\n')
      : '';

    const text = [
      `TORQUE DVI REPORT ${reportCode}`,
      `Issue: ${diagnosis.issue_title}`,
      `Severity: ${diagnosis.severity} (${sev.urgencyPercent}% Urgency)`,
      `Vehicle: ${vehicleSummary || 'Active Vehicle'}`,
      `Estimated Cost: ${diagnosis.estimated_cost_range || 'N/A'}`,
      `\nSummary:\n${diagnosis.summary}`,
      causesText ? `\nProbable Causes:\n${causesText}` : '',
      servicesText ? `\nRecommended Services:\n${servicesText}` : '',
      diagnosis.safety_warning ? `\nSAFETY ADVISORY:\n${diagnosis.safety_warning}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section
      id="dvi-report-section"
      style={{
        background: '#111827',
        border: '1px solid #1E293B',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.7)',
        animation: 'fadeIn 0.3s ease-out',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Anodized Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, #ff6b00, ${sev.color})`,
        }}
      />

      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 107, 0, 0.15)',
                color: '#ff6b00',
                border: '1px solid rgba(255, 107, 0, 0.3)',
                letterSpacing: '0.06em',
              }}
            >
              {reportCode}
            </span>
            {vehicleSummary && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: '#94a3b8',
                  letterSpacing: '0.04em',
                }}
              >
                {vehicleSummary}
              </span>
            )}
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#dfe2ee',
              letterSpacing: '-0.02em',
              marginTop: '0.35rem',
            }}
          >
            {diagnosis.issue_title || 'Digital Vehicle Inspection & Estimate'}
          </h2>
        </div>

        {/* Severity Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: sev.bgTint,
            border: `1px solid ${sev.borderColor}`,
            color: sev.color,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: sev.color,
              boxShadow: `0 0 8px ${sev.color}`,
              display: 'inline-block',
            }}
          />
          <span>{sev.label}</span>
        </div>
      </div>

      {/* Urgency Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          }}
        >
          <span style={{ color: '#dfe2ee', fontWeight: 600 }}>
            {diagnosis.issue_title}
          </span>
          <span style={{ color: sev.color, fontWeight: 700 }}>
            {sev.intervention}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 6,
            background: '#1c2028',
            borderRadius: 9999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${sev.urgencyPercent}%`,
              background: `linear-gradient(90deg, #ff6b00, ${sev.color})`,
              borderRadius: 9999,
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      </div>

      {/* Summary Narrative */}
      {diagnosis.summary && (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            lineHeight: '22px',
            color: '#cbd5e1',
          }}
        >
          {diagnosis.summary}
        </p>
      )}

      {/* Probable Causes Grid */}
      {diagnosis.probable_causes && diagnosis.probable_causes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#94a3b8',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            Identified Root Causes
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.65rem',
            }}
          >
            {diagnosis.probable_causes.map((cause, idx) => (
              <div
                key={idx}
                style={{
                  background: '#1c2028',
                  border: '1px solid #1E293B',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ff6b00',
                      letterSpacing: '0.04em',
                    }}
                  >
                    0{idx + 1} // CAUSE
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      color: sev.color,
                      textTransform: 'uppercase',
                    }}
                  >
                    {idx === 0 ? 'PRIMARY' : 'SECONDARY'}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    lineHeight: '18px',
                    color: '#dfe2ee',
                  }}
                >
                  {cause}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Rectification Schedule */}
      {diagnosis.recommended_services && diagnosis.recommended_services.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.4rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#94a3b8',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            Recommended Rectification Schedule
          </span>
          <div
            style={{
              overflowX: 'auto',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #1E293B',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#1c2028',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#94a3b8',
                    borderBottom: '1px solid #1E293B',
                  }}
                >
                  <th style={{ padding: '0.65rem 1rem' }}>Service Item</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Urgency</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Cost (INR)</th>
                </tr>
              </thead>
              <tbody>
                {diagnosis.recommended_services.map((srv, idx) => {
                  const isImmediate = srv.urgency?.toLowerCase().includes('immediate') || srv.urgency?.toLowerCase().includes('critical');
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #1E293B',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#dfe2ee' }}>{srv.name}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: isImmediate ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isImmediate ? 'var(--severity-critical)' : 'var(--telemetry-amber)',
                            border: `1px solid ${isImmediate ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {srv.urgency || 'SCHEDULED'}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#dfe2ee',
                        }}
                      >
                        {srv.estimated_cost}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Warning */}
      {diagnosis.safety_warning && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#ffb4ab',
            fontSize: 12,
            lineHeight: '18px',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: '#ef4444', flexShrink: 0 }}
          >
            warning
          </span>
          <span>
            <strong style={{ color: '#ef4444' }}>SAFETY WARNING: </strong>
            {diagnosis.safety_warning}
          </span>
        </div>
      )}

      {/* Price Summary & Action Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Estimated Total Repair Cost
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ff6b00',
                letterSpacing: '-0.02em',
              }}
            >
              {diagnosis.estimated_cost_range || '₹0'}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              Taxes & Labor included
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-lg)',
              background: '#1c2028',
              border: '1px solid #1E293B',
              color: '#dfe2ee',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
            }}
            title="Print Inspection Report"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              print
            </span>
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-lg)',
              background: '#1c2028',
              border: '1px solid #1E293B',
              color: copied ? '#4cd7f6' : '#dfe2ee',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
            }}
            title="Copy Report to Clipboard"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => onBookClick(diagnosis)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: '#ff6b00',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              boxShadow: '0 0 16px rgba(255, 107, 0, 0.45)',
            }}
            title="Reserve Repair Bay with Certified Mechanic"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              car_repair
            </span>
            <span>Book Certified Mechanic</span>
          </button>
        </div>
      </div>
    </section>
  );
}
