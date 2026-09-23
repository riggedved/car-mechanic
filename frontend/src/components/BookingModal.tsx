'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Clock, Car, Phone, Mail, User, Loader2, Copy, Check } from 'lucide-react';
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
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel" style={{ maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem' }}>
        {/* Close Button */}
        <button className="modal-close" onClick={onClose} aria-label="Close booking modal">
          <X size={16} />
        </button>

        {confirmedBooking ? (
          /* Confirmation Success */
          <div className="booking-success">
            <div className="booking-success-icon">
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Appointment Confirmed!
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your appointment has been booked with our certified mechanic workshop.
            </p>

            {/* Voucher Card */}
            <div className="booking-voucher">
              <div className="booking-voucher-header">
                <div>
                  <span className="booking-voucher-label">Booking Code</span>
                  <div className="booking-voucher-code">{confirmedBooking.booking_code}</div>
                </div>
                <button
                  onClick={() => handleCopyCode(confirmedBooking.booking_code)}
                  className="btn btn-secondary btn-sm"
                >
                  {copiedCode ? <Check size={13} style={{ color: 'var(--status-low)' }} /> : <Copy size={13} />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="booking-voucher-grid">
                <div>
                  <span className="booking-voucher-label">Vehicle</span>
                  <span className="booking-voucher-value">{confirmedBooking.vehicle_info}</span>
                </div>
                <div>
                  <span className="booking-voucher-label">Date</span>
                  <span className="booking-voucher-value">{confirmedBooking.preferred_date}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                <span className="booking-voucher-label">Service</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{confirmedBooking.service_requested}</span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                Contact: <strong style={{ color: 'var(--text-primary)' }}>{confirmedBooking.customer_name}</strong> · {confirmedBooking.customer_phone}
              </div>
            </div>

            <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Please arrive 10 minutes prior to your selected service window.
            </p>

            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Done
            </button>
          </div>
        ) : (
          /* Booking Form */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.2rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: 'var(--accent-muted)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
              }}>
                <Calendar size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Schedule Service
                </h2>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>
                  Certified Technicians · Transparent Rates
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.65rem 0 1.15rem 0', lineHeight: 1.5 }}>
              Book your prioritized workshop appointment based on the diagnostic report.
            </p>

            {error && (
              <div className="form-error" style={{ marginBottom: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label"><User size={13} /> Full Name *</label>
                <input
                  className="input"
                  type="text"
                  required
                  placeholder="e.g. Kushan Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              {/* Phone & Email */}
              <div className="form-row two-col" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label"><Phone size={13} /> Phone *</label>
                  <input
                    className="input"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><Mail size={13} /> Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="email@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="form-group">
                <label className="form-label"><Car size={13} /> Vehicle Details</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. 2019 Tata Nexon"
                  value={carInfo}
                  onChange={(e) => setCarInfo(e.target.value)}
                />
              </div>

              {/* Service Requested */}
              <div className="form-group">
                <label className="form-label">Service / Repair Requested *</label>
                <input
                  className="input"
                  type="text"
                  required
                  value={serviceRequested}
                  onChange={(e) => setServiceRequested(e.target.value)}
                />
              </div>

              {/* Date & Time Slot */}
              <div className="form-row two-col" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label"><Calendar size={13} /> Preferred Date *</label>
                  <input
                    className="input"
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><Clock size={13} /> Preferred Time Slot *</label>
                  <select
                    className="input"
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Workshop Notes (Optional)</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="e.g. Squeal when steering left; please also check coolant level."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  <span>{loading ? 'Booking…' : 'Confirm Appointment'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
