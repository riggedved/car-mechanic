'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Clock, Car, Phone, Mail, User, ShieldCheck, Loader2, Copy, Check } from 'lucide-react';
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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div style={{
        background: '#0c1527',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: 540,
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 30px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(37, 99, 235, 0.25)',
        position: 'relative',
        padding: '1.85rem',
        animation: 'fadeIn 0.25s ease-out'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            color: 'var(--text-muted)',
            padding: 6,
            borderRadius: '50%',
            display: 'flex',
            background: 'rgba(30, 41, 59, 0.5)'
          }}
        >
          <X size={18} />
        </button>

        {confirmedBooking ? (
          /* Confirmation Success Voucher */
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid var(--status-low)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--status-low)',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
            }}>
              <CheckCircle2 size={40} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
              Service Bay Reserved!
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Your appointment is confirmed with our ASE Master Certified mechanic workshop.
            </p>

            {/* Digital Voucher Card */}
            <div style={{
              background: 'rgba(10, 17, 34, 0.9)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Voucher</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {confirmedBooking.booking_code}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyCode(confirmedBooking.booking_code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#93c5fd',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {copiedCode ? <Check size={14} color="var(--accent-cyan)" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>Vehicle:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{confirmedBooking.vehicle_info}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>Slot:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{confirmedBooking.preferred_date}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>Scheduled Service:</span>
                <span style={{ color: 'var(--accent-blue-light)', fontWeight: 600 }}>{confirmedBooking.service_requested}</span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(59, 130, 246, 0.15)', paddingTop: '0.5rem' }}>
                Contact: <strong style={{ color: '#fff' }}>{confirmedBooking.customer_name}</strong> • {confirmedBooking.customer_phone}
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '1.4rem', lineHeight: 1.4 }}>
              A confirmation record has been logged in the SQLite backend. Please arrive 10 minutes prior to your selected service window.
            </p>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.8rem',
                background: 'linear-gradient(135deg, #2563eb, #0284c7)',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                fontSize: '0.92rem',
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)'
              }}
            >
              Done & Return to Workshop
            </button>
          </div>
        ) : (
          /* Booking Form */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  Schedule Mechanic Inspection
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                  Certified Technicians • Transparent INR (₹) Rates
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.75rem 0 1.25rem 0' }}>
              Lock in your prioritized workshop bay appointment based on the generated diagnostic report.
            </p>

            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#fda4af',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <User size={13} /> Full Name *
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
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Phone & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <Phone size={13} /> Contact Phone *
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
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <Mail size={13} /> Email
                  </label>
                  <input
                    type="email"
                    placeholder="kushan@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <Car size={13} /> Vehicle Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2019 Tata Nexon / Honda City"
                  value={carInfo}
                  onChange={(e) => setCarInfo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Service Requested */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
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
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Date & Time Slot */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      <Calendar size={13} /> Preferred Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: '#fff',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      <Clock size={13} /> Slot Selected
                    </label>
                    <div style={{
                      padding: '0.65rem 0.75rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {preferredTimeSlot}
                    </div>
                  </div>
                </div>

                {/* Quick Time Slot Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPreferredTimeSlot(slot)}
                      style={{
                        padding: '0.28rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        background: preferredTimeSlot === slot ? 'rgba(59, 130, 246, 0.3)' : 'rgba(15, 23, 42, 0.7)',
                        border: `1px solid ${preferredTimeSlot === slot ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                        color: preferredTimeSlot === slot ? '#fff' : 'var(--text-muted)',
                        fontSize: '0.73rem',
                        fontWeight: 600
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Special Workshop Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Squeal happens when steering left; please also check coolant level."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '0.7rem 1.25rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.86rem',
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
                    gap: '0.5rem',
                    padding: '0.75rem 1.6rem',
                    background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                    color: '#fff',
                    fontWeight: 800,
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.88rem',
                    boxShadow: '0 0 20px rgba(37, 99, 235, 0.45)',
                  }}
                >
                  {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
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
