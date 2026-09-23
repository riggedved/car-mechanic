'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Car, Clock, RotateCcw, ChevronDown, Volume2, VolumeX, Sparkles, Menu, X } from 'lucide-react';
import { VehicleInfo } from '@/lib/api';

interface HeaderProps {
  vehicle: VehicleInfo;
  onUpdateVehicle: (v: VehicleInfo) => void;
  onNewSession: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenObdLibrary: () => void;
}

const COMMON_MAKES = [
  'Tata', 'Mahindra', 'Maruti Suzuki', 'Hyundai', 'Honda', 
  'Toyota', 'Kia', 'Volkswagen', 'Skoda', 'BMW', 'Mercedes-Benz'
];

export default function Header({
  vehicle,
  onUpdateVehicle,
  onNewSession,
  onOpenHistory,
  historyCount,
  voiceEnabled,
  onToggleVoice,
  onOpenObdLibrary,
}: HeaderProps) {
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [year, setYear] = useState(vehicle.year || '');
  const [make, setMake] = useState(vehicle.make || '');
  const [model, setModel] = useState(vehicle.model || '');
  const [mileage, setMileage] = useState(vehicle.mileage || '');
  const [fuelType, setFuelType] = useState('Petrol');

  useEffect(() => {
    setYear(vehicle.year || '');
    setMake(vehicle.make || '');
    setModel(vehicle.model || '');
    setMileage(vehicle.mileage || '');
  }, [vehicle.year, vehicle.make, vehicle.model, vehicle.mileage]);

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVehicle({ year, make, model, mileage });
    setShowVehicleModal(false);
  };

  const vehicleDisplay = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Brand */}
        <div className="app-brand">
          <div className="app-brand-icon">
            <ShieldCheck size={19} strokeWidth={2.5} />
          </div>
          <div>
            <div className="app-brand-text">
              APEX<span>.</span>
            </div>
            <div className="app-brand-sub">Automotive Diagnostics</div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="header-actions header-desktop-actions">
          {/* Active Vehicle Button */}
          <button
            onClick={() => setShowVehicleModal(true)}
            className={`header-vehicle-btn ${vehicleDisplay ? 'is-set' : ''}`}
            title="Configure Active Vehicle"
          >
            <Car size={15} style={{ color: 'var(--accent)' }} />
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {vehicleDisplay || 'Set Vehicle'}
            </span>
            <ChevronDown size={13} style={{ color: 'var(--text-dim)' }} />
          </button>

          {/* OBD-II Fault Codes */}
          <button
            onClick={onOpenObdLibrary}
            className="btn btn-secondary btn-sm"
            title="OBD-II Fault Code Lookup"
          >
            <Sparkles size={14} />
            <span>OBD-II Codes</span>
          </button>

          {/* Records & History */}
          <button
            onClick={onOpenHistory}
            className="btn btn-secondary btn-sm"
            title="View Diagnostic & Booking History"
          >
            <Clock size={14} />
            <span>Records</span>
            {historyCount > 0 && (
              <span className="header-badge-count">{historyCount}</span>
            )}
          </button>

          {/* Voice Readout Toggle */}
          <button
            onClick={onToggleVoice}
            className={`btn-icon ${voiceEnabled ? 'active' : ''}`}
            title={voiceEnabled ? 'Voice readout enabled (click to mute)' : 'Voice readout muted (click to enable)'}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* New Diagnostic Session */}
          <button
            onClick={onNewSession}
            className="btn btn-secondary btn-sm"
            title="Start fresh troubleshooting session"
          >
            <RotateCcw size={13} />
            <span>New Session</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="btn-icon header-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="header-mobile-menu">
          <button
            onClick={() => { setShowVehicleModal(true); setMobileMenuOpen(false); }}
            className={`header-vehicle-btn ${vehicleDisplay ? 'is-set' : ''}`}
          >
            <Car size={15} style={{ color: 'var(--accent)' }} />
            <span>{vehicleDisplay || 'Set Vehicle'}</span>
          </button>

          <button
            onClick={() => { onOpenObdLibrary(); setMobileMenuOpen(false); }}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={14} />
            <span>OBD-II Codes</span>
          </button>

          <button
            onClick={() => { onOpenHistory(); setMobileMenuOpen(false); }}
            className="btn btn-secondary btn-sm"
          >
            <Clock size={14} />
            <span>Records ({historyCount})</span>
          </button>

          <button
            onClick={() => { onToggleVoice(); setMobileMenuOpen(false); }}
            className="btn btn-secondary btn-sm"
          >
            {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
          </button>

          <button
            onClick={() => { onNewSession(); setMobileMenuOpen(false); }}
            className="btn btn-secondary btn-sm"
          >
            <RotateCcw size={13} />
            <span>New Session</span>
          </button>
        </div>
      )}

      {/* Vehicle Config Modal */}
      {showVehicleModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowVehicleModal(false); }}>
          <div className="modal-panel" style={{ maxWidth: 460, padding: '1.5rem' }}>
            <button
              className="modal-close"
              onClick={() => setShowVehicleModal(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.3rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'var(--accent-muted)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
              }}>
                <Car size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Vehicle Profile
                </h3>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>
                  Set your vehicle for accurate diagnostics
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.6rem 0 1rem 0', lineHeight: 1.5 }}>
              Providing accurate make and model lets the diagnostic engine cross-reference model-specific service bulletins.
            </p>

            {/* Quick Make Chips */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Quick Select Brand</label>
              <div className="vehicle-modal-makes">
                {COMMON_MAKES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMake(m)}
                    className={`chip ${make.toLowerCase() === m.toLowerCase() ? 'active' : ''}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input className="input" type="text" placeholder="e.g. 2021" value={year} onChange={(e) => setYear(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Make</label>
                  <input className="input" type="text" placeholder="e.g. Tata / Hyundai" value={make} onChange={(e) => setMake(e.target.value)} />
                </div>
              </div>

              <div className="form-row two-col" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">Model & Trim</label>
                  <input className="input" type="text" placeholder="e.g. Nexon XZ+" value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Powertrain</label>
                  <select className="input" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="EV">Electric (EV)</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Odometer Reading</label>
                <input className="input" type="text" placeholder="e.g. 42,000 km" value={mileage} onChange={(e) => setMileage(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowVehicleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
