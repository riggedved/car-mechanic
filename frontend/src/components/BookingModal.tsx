'use client';

import React, { useState } from 'react';
import { Booking, Diagnosis, createBooking } from '@/lib/api';

interface BookingModalProps {
  diagnosis: Diagnosis | null;
  sessionId: string | null;
  vehicleInfo: string;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

const TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '11:30 AM - 01:30 PM',
  '02:00 PM - 04:00 PM',
  '04:30 PM - 06:30 PM'
];

export default function BookingModal({
  diagnosis,
  sessionId,
  vehicleInfo,
  onClose,
  onBookingSuccess,
}: BookingModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [carInfo, setCarInfo] = useState(vehicleInfo || '');
  
  const defaultService = diagnosis?.recommended_services?.[0]?.name || diagnosis?.issue_title || 'Vehicle Inspection & Repair';
  const [serviceRequested, setServiceRequested] = useState(defaultService);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];
  const [preferredDate, setPreferredDate] = useState(defaultDateStr);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: Partial<Booking> = {
        session: sessionId || undefined,
        diagnosis: diagnosis?.id || undefined,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        vehicle_info: carInfo || 'Unspecified vehicle',
        service_requested: serviceRequested,
        preferred_date: preferredDate,
        preferred_time_slot: preferredTimeSlot,
        customer_notes: notes,
      };

      const booking = await createBooking(payload);
      setConfirmedBooking(booking);
      onBookingSuccess(booking);
    } catch (err: any) {
      setError(err.message || 'Failed to submit appointment booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      id="booking-modal"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 14, 22, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: 520,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 107, 0, 0.15)',
          position: 'relative',
          padding: '1.75rem',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            color: '#94a3b8',
            padding: 4,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1c2028',
            border: '1px solid #1E293B',
          }}
          title="Close"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>

        {confirmedBooking ? (
          /* Confirmation Success Voucher */
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid var(--severity-low)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                color: 'var(--severity-low)',
                boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>check_circle</span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#dfe2ee',
                marginBottom: '0.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              Service Bay Reserved!
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '1.4rem' }}>
              Your repair appointment is locked in our master diagnostic schedule.
            </p>

            {/* Voucher Card */}
            <div
              style={{
                background: '#090D14',
                border: '1px solid #1E293B',
                borderRadius: 'var(--radius-lg)',
                padding: '1.2rem',
                textAlign: 'left',
                marginBottom: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #1E293B',
                  paddingBottom: '0.75rem',
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Booking Voucher Code
                  </span>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: '#ff6b00',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {confirmedBooking.booking_code}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(confirmedBooking.booking_code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#1c2028',
                    border: '1px solid #1E293B',
                    color: '#4cd7f6',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {copiedCode ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: 13 }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>
                    Vehicle:
                  </span>
                  <span style={{ color: '#dfe2ee', fontWeight: 600 }}>
                    {confirmedBooking.vehicle_info}
                  </span>
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>
                    Date & Time:
                  </span>
                  <span style={{ color: '#dfe2ee', fontWeight: 600 }}>
                    {confirmedBooking.preferred_date}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>
                  Requested Service:
                </span>
                <span style={{ color: '#4cd7f6', fontWeight: 600, fontSize: 13 }}>
                  {confirmedBooking.service_requested}
                </span>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  borderTop: '1px solid #1E293B',
                  paddingTop: '0.5rem',
                }}
              >
                Contact: <strong style={{ color: '#dfe2ee' }}>{confirmedBooking.customer_name}</strong> • {confirmedBooking.customer_phone}
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Please arrive 10 minutes prior to your selected service window. Booking details logged in system storage.
            </p>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#ff6b00',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                borderRadius: 'var(--radius-lg)',
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: '0 0 18px rgba(255, 107, 0, 0.45)',
              }}
            >
              Done & Return to Workshop
            </button>
          </div>
        ) : (
          /* Booking Form */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 107, 0, 0.15)',
                  border: '1px solid rgba(255, 107, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff6b00',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>car_repair</span>
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#dfe2ee',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Schedule Certified Inspection
                </h2>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4cd7f6' }}>
                  ASE Certified Workshop • Transparent INR Rates
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.65rem 0 1.25rem 0' }}>
              Reserve a diagnostic repair bay based on your vehicle's telemetry report.
            </p>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ffb4ab',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kushan Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
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

              {/* Phone & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
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
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="kushan@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
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

              {/* Vehicle Info */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                  Vehicle Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2022 Tata Safari XZA+"
                  value={carInfo}
                  onChange={(e) => setCarInfo(e.target.value)}
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

              {/* Primary Service Requested */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                  Primary Service / Repair Requested *
                </label>
                <input
                  type="text"
                  required
                  value={serviceRequested}
                  onChange={(e) => setServiceRequested(e.target.value)}
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

              {/* Preferred Date & Time Slots */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '0.45rem' }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
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
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                      Selected Slot
                    </label>
                    <div
                      style={{
                        padding: '0.65rem 0.75rem',
                        background: '#090D14',
                        border: '1px solid #1E293B',
                        borderRadius: 'var(--radius-sm)',
                        color: '#ff6b00',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {preferredTimeSlot}
                    </div>
                  </div>
                </div>

                {/* Slot Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = preferredTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setPreferredTimeSlot(slot)}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          background: isSelected ? 'rgba(255, 107, 0, 0.15)' : '#1c2028',
                          border: `1px solid ${isSelected ? '#ff6b00' : '#1E293B'}`,
                          color: isSelected ? '#ff6b00' : '#94a3b8',
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: isSelected ? 700 : 500,
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                  Workshop Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Grinding sound intensifies on steep deceleration."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#090D14',
                    border: '1px solid #1E293B',
                    borderRadius: 'var(--radius-sm)',
                    color: '#dfe2ee',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '0.65rem 1rem',
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
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.65rem 1.4rem',
                    background: '#ff6b00',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    boxShadow: '0 0 16px rgba(255, 107, 0, 0.45)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {loading && <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>refresh</span>}
                  <span>{loading ? 'Securing Bay...' : 'Confirm Appointment'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
