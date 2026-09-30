'use client';

import React, { useState, useEffect } from 'react';
import { VehicleInfo } from '@/lib/api';

interface HeaderProps {
  vehicle: VehicleInfo;
  onUpdateVehicle: (v: VehicleInfo) => void;
  onNewSession: () => void;
  onOpenHistory: () => void;
  historyCount: number;
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
  onOpenObdLibrary,
}: HeaderProps) {
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [year, setYear] = useState(vehicle.year || '');
  const [make, setMake] = useState(vehicle.make || '');
  const [model, setModel] = useState(vehicle.model || '');
  const [mileage, setMileage] = useState(vehicle.mileage || '');

  // Keep state in sync with external prop changes
  useEffect(() => {
    setYear(vehicle.year || '');
    setMake(vehicle.make || '');
    setModel(vehicle.model || '');
    setMileage(vehicle.mileage || '');
  }, [vehicle]);

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVehicle({ year, make, model, mileage });
    setShowVehicleModal(false);
  };

  const vehicleName = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
  const vehicleMileage = vehicle.mileage ? `${vehicle.mileage}` : '';

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          zIndex: 50,
          background: 'rgba(10, 14, 22, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1E293B',
          boxShadow: '0 1px 8px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            height: '100%',
            maxWidth: 1320,
            margin: '0 auto',
            padding: '0 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          {/* Brand & Master Tech Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255, 107, 0, 0.12)',
                  border: '1px solid rgba(255, 107, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff6b00',
                  boxShadow: '0 0 12px rgba(255, 107, 0, 0.25)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  terminal
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: '#dfe2ee',
                  }}
                >
                  TORQUE
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.25rem',
                    fontWeight: 400,
                    letterSpacing: '-0.03em',
                    color: '#ff6b00',
                  }}
                >
                  AI
                </span>
              </div>
            </div>

            {/* Master Tech Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                paddingLeft: '0.75rem',
                borderLeft: '1px solid #262a33',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
              }}
              className="hidden-mobile-sm"
            >
              <span className="green-led" />
              <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                Mac <span style={{ color: '#dfe2ee' }}>(Master Tech)</span>
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
            {/* Active Vehicle Button */}
            <button
              type="button"
              onClick={() => setShowVehicleModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                background: '#262a33',
                border: '1px solid #31353e',
                color: '#dfe2ee',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                maxWidth: 240,
                overflow: 'hidden',
              }}
              title="Configure Vehicle Profile"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: '#ff6b00', flexShrink: 0 }}
              >
                directions_car
              </span>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                }}
              >
                {vehicleName || 'Select Car'}
              </span>
              {vehicleMileage && (
                <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }} className="hidden-mobile">
                  • {vehicleMileage}
                </span>
              )}
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: '#94a3b8', flexShrink: 0 }}
              >
                expand_more
              </span>
            </button>

            {/* OBD-II Codes Button */}
            <button
              type="button"
              onClick={onOpenObdLibrary}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                background: '#1c2028',
                border: '1px solid #1E293B',
                color: '#4cd7f6',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
              title="OBD-II Diagnostic Trouble Codes"
              className="hidden-mobile"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                memory
              </span>
              <span>OBD-II Codes</span>
            </button>

            {/* Records Drawer Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                background: '#1c2028',
                border: '1px solid #1E293B',
                color: '#dfe2ee',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
              title="Inspection Records & Appointments"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                history
              </span>
              <span className="hidden-mobile-sm">Records</span>
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: 9999,
                  background: '#262a33',
                  color: '#ff6b00',
                  fontWeight: 800,
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid rgba(255, 107, 0, 0.3)',
                }}
              >
                {historyCount}
              </span>
            </button>

            {/* New Diagnostic Session Reset */}
            <button
              type="button"
              onClick={onNewSession}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: '#ff6b00',
                color: '#fff',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                boxShadow: '0 0 12px rgba(255, 107, 0, 0.35)',
              }}
              title="Initialize new diagnostic session"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add
              </span>
              <span>New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Vehicle Profile Modal */}
      {showVehicleModal && (
        <div
          id="vehicle-edit-drawer"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 14, 22, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#111827',
              border: '1px solid #1E293B',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: 480,
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 107, 0, 0.15)',
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#ff6b00', fontSize: 24 }}>
                  directions_car
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#dfe2ee',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Active Fleet Vehicle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                style={{ color: '#94a3b8', padding: 4 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Setting vehicle specifics enables the AI diagnostic engine to cross-reference model-specific technical service bulletins (TSBs).
            </p>

            {/* Quick Brand Select */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#94a3b8',
                  display: 'block',
                  marginBottom: '0.45rem',
                  fontWeight: 600,
                }}
              >
                Quick Make Select
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {COMMON_MAKES.map((m) => {
                  const isSelected = make.toLowerCase() === m.toLowerCase();
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMake(m)}
                      style={{
                        padding: '0.28rem 0.7rem',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? '#ff6b00' : '#1c2028',
                        color: isSelected ? '#fff' : '#dfe2ee',
                        border: `1px solid ${isSelected ? '#ff6b00' : '#262a33'}`,
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: isSelected ? 700 : 500,
                        boxShadow: isSelected ? '0 0 10px rgba(255, 107, 0, 0.4)' : 'none',
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2022"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#090D14',
                      border: '1px solid #1E293B',
                      borderRadius: 'var(--radius-sm)',
                      color: '#dfe2ee',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    Make
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tata / Mahindra"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#090D14',
                      border: '1px solid #1E293B',
                      borderRadius: 'var(--radius-sm)',
                      color: '#dfe2ee',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  Model & Trim
                </label>
                <input
                  type="text"
                  placeholder="e.g. Safari XZA+ Dark / Nexon EV"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#090D14',
                    border: '1px solid #1E293B',
                    borderRadius: 'var(--radius-sm)',
                    color: '#dfe2ee',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  Odometer Mileage
                </label>
                <input
                  type="text"
                  placeholder="e.g. 38,450 km"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#090D14',
                    border: '1px solid #1E293B',
                    borderRadius: 'var(--radius-sm)',
                    color: '#dfe2ee',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    color: '#94a3b8',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.4rem',
                    background: '#ff6b00',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    boxShadow: '0 0 16px rgba(255, 107, 0, 0.45)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Save Vehicle Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
