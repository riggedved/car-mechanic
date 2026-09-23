'use client';

import React, { useState } from 'react';
import { ShieldCheck, Car, Clock, RotateCcw, ChevronDown, Volume2, VolumeX, Sparkles, Fuel } from 'lucide-react';
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
  const [year, setYear] = useState(vehicle.year || '');
  const [make, setMake] = useState(vehicle.make || '');
  const [model, setModel] = useState(vehicle.model || '');
  const [mileage, setMileage] = useState(vehicle.mileage || '');
  const [fuelType, setFuelType] = useState('Petrol');

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVehicle({ year, make, model, mileage });
    setShowVehicleModal(false);
  };

  const vehicleDisplay = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');

  return (
    <header style={{
      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
      background: 'rgba(7, 13, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.85rem 1.75rem',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)',
            border: '1px solid rgba(147, 197, 253, 0.3)'
          }}>
            <ShieldCheck size={24} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 40%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                APEX <span style={{ color: 'var(--accent-cyan)' }}>DIAGNOSTICS</span>
              </h1>
              <div className="blue-pulse-dot" title="Virtual Master Tech Online" />
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>ASE Certified Master Diagnostic AI</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-cyan)' }}>INR (₹) Estimates</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* OBD-II Quick Tool */}
          <button
            onClick={onOpenObdLibrary}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              background: 'rgba(30, 58, 138, 0.25)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
            title="OBD-II Fault Code Lookup"
          >
            <Sparkles size={14} />
            <span>OBD-II Codes</span>
          </button>

          {/* Voice Assistant Toggle */}
          <button
            onClick={onToggleVoice}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              background: voiceEnabled ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
              border: `1px solid ${voiceEnabled ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
              borderRadius: '50%',
              color: voiceEnabled ? 'var(--accent-cyan)' : 'var(--text-dim)',
            }}
            title={voiceEnabled ? 'Voice readout enabled' : 'Voice readout muted'}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Active Vehicle Badge */}
          <button
            onClick={() => setShowVehicleModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.95rem',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-blue)',
              borderRadius: 'var(--radius-full)',
              color: '#fff',
              fontSize: '0.82rem',
              boxShadow: '0 0 14px rgba(59, 130, 246, 0.15)'
            }}
            title="Configure Active Vehicle"
          >
            <Car size={16} color="var(--accent-cyan)" />
            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {vehicleDisplay || 'Select Car'}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.9rem',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              color: '#fff',
              fontSize: '0.82rem',
            }}
          >
            <Clock size={15} color="var(--accent-blue-light)" />
            <span>Records</span>
            {historyCount > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.7rem',
                fontWeight: 800,
                width: 18,
                height: 18,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)'
              }}>
                {historyCount}
              </span>
            )}
          </button>

          {/* New Diagnostic Reset */}
          <button
            onClick={onNewSession}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-full)',
              color: '#fda4af',
              fontSize: '0.82rem',
            }}
            title="Start new troubleshooting session"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Vehicle Config Modal */}
      {showVehicleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0c1527',
            border: '1px solid var(--border-blue-bright)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: 460,
            padding: '1.75rem',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(59, 130, 246, 0.25)',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <Car color="var(--accent-cyan)" size={22} />
              Garage Vehicle Profile
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Providing accurate make and model specifics lets the diagnostic engine cross-reference model-specific technical service bulletins.
            </p>

            {/* Quick Make Chips */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                Quick Brand Select
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {COMMON_MAKES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMake(m)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: make.toLowerCase() === m.toLowerCase() ? 'rgba(59, 130, 246, 0.35)' : 'rgba(15, 23, 42, 0.8)',
                      border: `1px solid ${make.toLowerCase() === m.toLowerCase() ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                      color: make.toLowerCase() === m.toLowerCase() ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: 600
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2021"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Make</label>
                  <input
                    type="text"
                    placeholder="e.g. Tata / Hyundai"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Model & Trim</label>
                  <input
                    type="text"
                    placeholder="e.g. Nexon XZ+ / City ZX"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Powertrain</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="EV">Electric (EV)</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Odometer Mileage</label>
                <input
                  type="text"
                  placeholder="e.g. 42,000 km"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.4rem',
                    background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  Save Vehicle Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
