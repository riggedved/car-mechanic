'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import MediaUploader from '@/components/MediaUploader';
import DiagnosisCard from '@/components/DiagnosisCard';
import BookingModal from '@/components/BookingModal';
import HistoryDrawer from '@/components/HistoryDrawer';
import FormattedMessage from '@/components/FormattedMessage';
import {
  ChatMessage,
  UploadedMedia,
  Diagnosis,
  Booking,
  VehicleInfo,
  sendChatMessage,
  requestDiagnosis
} from '@/lib/api';

const COMMON_OBD_CODES = [
  { code: 'P0300', title: 'Random / Multiple Cylinder Misfire', desc: 'Fouled spark plugs, bad ignition coils, or vacuum leak.' },
  { code: 'P0420', title: 'Catalytic Converter System Efficiency Below Threshold', desc: 'Exhaust leak, O2 sensor failure, or worn catalytic substrate.' },
  { code: 'P0171', title: 'System Too Lean (Bank 1)', desc: 'Dirty MAF sensor, vacuum leak, or weak fuel pump.' },
  { code: 'P0442', title: 'EVAP System Small Leak Detected', desc: 'Loose or cracked fuel filler cap or purge valve stick.' },
  { code: 'P0115', title: 'Engine Coolant Temperature Sensor Malfunction', desc: 'Faulty ECT sensor or thermostat stuck open.' },
  { code: 'P0500', title: 'Vehicle Speed Sensor (VSS) Malfunction', desc: 'Speedometer erratic or ABS wheel speed sensor failure.' }
];

const QUICK_STARTERS = [
  {
    title: 'Brakes & Rotors',
    sub: 'Squeal & shudder',
    icon: 'disc_full',
    color: '#ff6b00',
    query: 'My front brakes are squealing and grinding when I stop'
  },
  {
    title: 'Engine & Starter',
    sub: 'No-crank click',
    icon: 'power',
    color: '#06B6D4',
    query: "Engine won't start, rapid clicking when turning key"
  },
  {
    title: 'Cooling & Steam',
    sub: 'High temp redline',
    icon: 'thermostat',
    color: '#F59E0B',
    query: 'Temperature gauge is in the red and white steam from bonnet'
  },
  {
    title: 'AC & Climate',
    sub: 'Warm air at idle',
    icon: 'mode_fan',
    color: '#4cd7f6',
    query: 'AC is blowing warm ambient air instead of chilled air at idle'
  },
];

const FLEET_MAKES = [
  'Tata', 'Mahindra', 'Maruti Suzuki', 'Hyundai', 'Honda', 
  'Toyota', 'Kia', 'Volkswagen', 'Skoda', 'BMW', 'Mercedes-Benz'
];

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<UploadedMedia | null>(null);
  const [vehicle, setVehicle] = useState<VehicleInfo>({ year: '', make: '', model: '', mileage: '' });

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [isSending, setIsSending] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Modals & Drawers
  const [bookingDiagnosis, setBookingDiagnosis] = useState<Diagnosis | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isObdModalOpen, setIsObdModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Format timestamp helper
  const formatTime = (isoString?: string) => {
    try {
      const d = isoString ? new Date(isoString) : new Date();
      return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} IST`;
    } catch {
      return '16:40 IST';
    }
  };

  // Initialize session or set default welcome message
  useEffect(() => {
    const savedSession = localStorage.getItem('mechanic_session_id');
    if (savedSession) {
      setSessionId(savedSession);
    }

    const savedVehicle = localStorage.getItem('mechanic_vehicle');
    if (savedVehicle) {
      try {
        setVehicle(JSON.parse(savedVehicle));
      } catch {}
    }

    setMessages([
      {
        id: 'welcome-msg',
        session: savedSession || '',
        sender: 'mechanic',
        message:
          "Welcome to TORQUE AI. I'm Mac, your Senior Master Automotive Diagnostic Technician.\n\n" +
          "What vehicle trouble can I troubleshoot with you today? Describe any symptom—brake grinding, coolant leaks, starter clicking, or dashboard fault codes. " +
          "You can also attach inspection photos, record live engine sounds via microphone, or upload video clips.",
        is_ai_generated: false,
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleUpdateVehicle = (newVehicle: VehicleInfo) => {
    setVehicle(newVehicle);
    localStorage.setItem('mechanic_vehicle', JSON.stringify(newVehicle));
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, diagnoses, isSending]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() && !attachedMedia) return;

    const currentMedia = attachedMedia;
    setInputText('');
    setAttachedMedia(null);
    setIsSending(true);

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session: sessionId || '',
      sender: 'user',
      message: textToSend || `[Attached ${currentMedia?.file_type} for inspection]`,
      media_detail: currentMedia || undefined,
      is_ai_generated: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await sendChatMessage(
        sessionId,
        textToSend,
        currentMedia?.id,
        vehicle
      );

      if (!sessionId && response.session_id) {
        setSessionId(response.session_id);
        localStorage.setItem('mechanic_session_id', response.session_id);
      }

      if (response.vehicle_info) {
        setVehicle((prev) => ({
          ...prev,
          make: response.vehicle_info.make || prev.make,
          model: response.vehicle_info.model || prev.model,
          year: response.vehicle_info.year || prev.year,
          mileage: response.vehicle_info.mileage || prev.mileage,
        }));
      }

      setMessages((prev) => [...prev, response.mechanic_message]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          session: sessionId || '',
          sender: 'mechanic',
          message: `Notice: ${err.message || 'Could not reach mechanic service. Please verify backend server is running.'}`,
          is_ai_generated: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateDiagnosis = async () => {
    if (!sessionId && messages.length <= 1) {
      alert("Please discuss your vehicle symptoms with the technician first.");
      return;
    }

    try {
      setIsDiagnosing(true);
      const activeSession = sessionId || 'new-session';
      const diagnosis = await requestDiagnosis(activeSession);
      setDiagnoses((prev) => [diagnosis, ...prev]);

      const diagNoticeMsg: ChatMessage = {
        id: `diag-notice-${Date.now()}`,
        session: activeSession,
        sender: 'mechanic',
        message: `📋 Digital Vehicle Inspection Report #${diagnosis.id.slice(0, 6)} generated with repair estimates in INR (₹). Review the findings below and click 'Book Certified Mechanic' to schedule a prioritized workshop bay inspection.`,
        is_ai_generated: diagnosis.ai_generated,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, diagNoticeMsg]);

      setTimeout(() => {
        const reportElem = document.getElementById('dvi-report-section');
        reportElem?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `notice-${Date.now()}`,
          session: sessionId || '',
          sender: 'mechanic',
          message: `ℹ️ ${err.message || 'Please describe what symptoms your vehicle is experiencing before compiling a repair diagnostic report.'}`,
          is_ai_generated: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleNewSession = () => {
    localStorage.removeItem('mechanic_session_id');
    localStorage.removeItem('mechanic_vehicle');
    setSessionId(null);
    setAttachedMedia(null);
    setDiagnoses([]);
    setVehicle({ year: '', make: '', model: '', mileage: '' });
    setMessages([
      {
        id: 'new-welcome',
        session: '',
        sender: 'mechanic',
        message: "New diagnostic telemetry bay initialized. What vehicle trouble can I troubleshoot for you today?",
        is_ai_generated: false,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const handleBookClick = (diag: Diagnosis) => {
    setBookingDiagnosis(diag);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  const vehicleSummary = [vehicle.year, vehicle.make, vehicle.model, vehicle.mileage ? `(${vehicle.mileage})` : ''].filter(Boolean).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Fixed Sticky Header */}
      <Header
        vehicle={vehicle}
        onUpdateVehicle={handleUpdateVehicle}
        onNewSession={handleNewSession}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={diagnoses.length + bookings.length}
        onOpenObdLibrary={() => setIsObdModalOpen(true)}
      />

      {/* Main Workspace (Offset for fixed 64px header) */}
      <main style={{ width: '100%', paddingTop: 64, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingBottom: 220 }}>
          
          {/* Minimalist Quick Brand Strip */}
          <section
            style={{
              width: '100%',
              borderBottom: '1px solid rgba(38, 42, 51, 0.6)',
              background: 'rgba(10, 14, 22, 0.75)',
              padding: '0.5rem 0',
            }}
          >
            <div
              style={{
                maxWidth: 896,
                margin: '0 auto',
                padding: '0 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#94a3b8',
                  flexShrink: 0,
                  fontWeight: 600,
                }}
              >
                Active Fleet Make:
              </span>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: 2,
                }}
              >
                {FLEET_MAKES.map((m) => {
                  const isActive = vehicle.make?.toLowerCase() === m.toLowerCase();
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        const updatedMake = vehicle.make?.toLowerCase() === m.toLowerCase() ? '' : m;
                        handleUpdateVehicle({ ...vehicle, make: updatedMake });
                      }}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        background: isActive ? '#ff6b00' : '#1c2028',
                        color: isActive ? '#fff' : '#94a3b8',
                        border: `1px solid ${isActive ? '#ff6b00' : '#262a33'}`,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        fontWeight: isActive ? 700 : 500,
                        flexShrink: 0,
                        boxShadow: isActive ? '0 0 10px rgba(255, 107, 0, 0.35)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Focused Workspace Container */}
          <div
            style={{
              maxWidth: 896,
              width: '100%',
              margin: '0 auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Quick Diagnostic Starters (Minimalist Pill Grid - 4 cards) */}
            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.5rem',
              }}
            >
              {QUICK_STARTERS.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(cat.query)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(38, 42, 51, 0.5)',
                    border: '1px solid rgba(49, 53, 62, 0.6)',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = cat.color;
                    e.currentTarget.style.background = 'rgba(49, 53, 62, 0.8)';
                    e.currentTarget.style.boxShadow = `0 0 14px ${cat.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(49, 53, 62, 0.6)';
                    e.currentTarget.style.background = 'rgba(38, 42, 51, 0.5)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, color: cat.color, flexShrink: 0 }}
                  >
                    {cat.icon}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#dfe2ee',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {cat.title}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#94a3b8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {cat.sub}
                    </span>
                  </div>
                </button>
              ))}
            </section>

            {/* Chat Stream Messages */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      animation: 'fadeIn 0.2s ease-out',
                      width: '100%',
                    }}
                  >
                    {isUser ? (
                      /* User Message Bubble */
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, maxWidth: '90%' }}>
                        <div
                          style={{
                            background: '#181c24',
                            border: '1px solid #262a33',
                            maxWidth: 580,
                            borderRadius: '16px 16px 4px 16px',
                            padding: '1rem',
                            color: '#dfe2ee',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                          }}
                        >
                          <FormattedMessage content={msg.message} />

                          {/* Media attachments */}
                          {msg.media_detail && (
                            <div
                              style={{
                                marginTop: '0.75rem',
                                paddingTop: '0.75rem',
                                borderTop: '1px solid #262a33',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                              }}
                            >
                              {msg.media_detail.file_type === 'image' && (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.65rem',
                                    borderRadius: 'var(--radius-lg)',
                                    background: '#0a0e16',
                                    border: '1px solid #262a33',
                                  }}
                                >
                                  <img
                                    src={msg.media_detail.file_url}
                                    alt={msg.media_detail.original_name}
                                    style={{ width: 26, height: 26, borderRadius: 4, objectFit: 'cover' }}
                                  />
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#dfe2ee', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {msg.media_detail.original_name}
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--severity-critical)', fontWeight: 700 }}>
                                    Attached
                                  </span>
                                </div>
                              )}

                              {msg.media_detail.file_type === 'audio' && (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.65rem',
                                    borderRadius: 'var(--radius-lg)',
                                    background: '#0a0e16',
                                    border: '1px solid #262a33',
                                  }}
                                >
                                  <span className="material-symbols-outlined" style={{ color: '#06B6D4', fontSize: 16 }}>
                                    graphic_eq
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#dfe2ee', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {msg.media_detail.original_name}
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6b00', fontWeight: 700 }}>
                                    Acoustic
                                  </span>
                                </div>
                              )}

                              {msg.media_detail.file_type === 'video' && (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.65rem',
                                    borderRadius: 'var(--radius-lg)',
                                    background: '#0a0e16',
                                    border: '1px solid #262a33',
                                  }}
                                >
                                  <span className="material-symbols-outlined" style={{ color: '#4cd7f6', fontSize: 16 }}>
                                    videocam
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#dfe2ee', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {msg.media_detail.original_name}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', paddingRight: 4 }}>
                          {formatTime(msg.created_at)} • Vehicle Owner
                        </span>
                      </div>
                    ) : (
                      /* AI Mechanic (Mac) Bubble */
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, maxWidth: '90%' }}>
                        <div
                          style={{
                            background: '#111827',
                            border: '1px solid #1E293B',
                            borderRadius: '16px 16px 16px 4px',
                            padding: '1.25rem',
                            color: '#dfe2ee',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.85rem',
                            maxWidth: 680,
                          }}
                        >
                          {/* AI Header Line */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingBottom: '0.65rem',
                              borderBottom: '1px solid #1E293B',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  background: 'rgba(255, 107, 0, 0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ff6b00',
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                  verified
                                </span>
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#dfe2ee' }}>
                                Mac (Senior Master Tech)
                              </span>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                }}
                              >
                                {msg.is_ai_generated ? 'Multimodal Inspection' : 'Master Certified'}
                              </span>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8' }}>
                              {formatTime(msg.created_at)}
                            </span>
                          </div>

                          {/* Message Body with Markdown formatting */}
                          <FormattedMessage content={msg.message} />

                          {/* Metric Readouts Card when diagnosis is ready */}
                          {diagnoses.length > 0 && msg.id.includes('diag') && (
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '0.5rem',
                                padding: '0.25rem 0',
                              }}
                            >
                              <div style={{ background: '#1c2028', padding: '0.65rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>
                                  SEVERITY
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--severity-critical)' }}>
                                  {diagnoses[0].severity}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--telemetry-amber)', display: 'block' }}>
                                  Urgency Index
                                </span>
                              </div>
                              <div style={{ background: '#1c2028', padding: '0.65rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>
                                  EST. COST
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: '#ff6b00' }}>
                                  {diagnoses[0].estimated_cost_range || '₹0'}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#94a3b8', display: 'block' }}>
                                  INR (₹)
                                </span>
                              </div>
                              <div style={{ background: '#1c2028', padding: '0.65rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>
                                  SERVICES
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: '#4cd7f6' }}>
                                  {diagnoses[0].recommended_services?.length || 1} ITEM
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#94a3b8', display: 'block' }}>
                                  Verified OEM
                                </span>
                              </div>
                            </div>
                          )}

                          {/* In-Message DVI Report Callout Bar */}
                          {diagnoses.length > 0 && (
                            <div
                              style={{
                                paddingTop: '0.65rem',
                                borderTop: '1px solid #1E293B',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8' }}>
                                Diagnostic inspection & repair quote compiled below
                              </span>
                              <a
                                href="#dvi-report-section"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.45rem 0.85rem',
                                  borderRadius: 'var(--radius-lg)',
                                  background: '#ff6b00',
                                  color: '#fff',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  textDecoration: 'none',
                                  boxShadow: '0 0 10px rgba(255, 107, 0, 0.35)',
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                  assignment
                                </span>
                                <span>Review DVI Report</span>
                              </a>
                            </div>
                          )}
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', paddingLeft: 4 }}>
                          AI Master Diagnostic Model v4.28
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* In-Flight Analyzing Indicator */}
              {isSending && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    color: '#4cd7f6',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    background: '#111827',
                    border: '1px solid #1E293B',
                    borderRadius: 'var(--radius-lg)',
                    width: 'fit-content',
                  }}
                >
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16, color: '#06B6D4' }}>
                    refresh
                  </span>
                  <span>Senior master technician analyzing mechanical parameters...</span>
                </div>
              )}

              {/* DVI Inspection Report Card */}
              {diagnoses.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <DiagnosisCard
                    diagnosis={diagnoses[0]}
                    vehicleSummary={vehicleSummary}
                    onBookClick={handleBookClick}
                  />
                </div>
              )}

              <div ref={messagesEndRef} />
            </section>

            {/* Quick Action Bar for Diagnostic Synthesis */}
            {diagnoses.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(17, 24, 39, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid #1E293B',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.65rem 1rem',
                  gap: '0.75rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#06B6D4' }}>
                    description
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Ready for a formal inspection estimate?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateDiagnosis}
                  disabled={isDiagnosing}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 1rem',
                    background: '#ff6b00',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 11,
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 0 14px rgba(255, 107, 0, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>
                    auto_awesome
                  </span>
                  <span>{isDiagnosing ? 'Synthesizing...' : 'Generate Full Diagnostic Report'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sleek Floating Minimalist Console Bar (Fixed bottom-4) */}
      <div
        className="chat-composer-bar"
        style={{
          position: 'fixed',
          bottom: 46,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '94%',
          maxWidth: 768,
          zIndex: 40,
        }}
      >
        <div
          style={{
            background: 'rgba(10, 14, 22, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(38, 42, 51, 0.8)',
            borderRadius: 'var(--radius-2xl)',
            padding: '0.5rem 0.65rem',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85), 0 0 20px rgba(255, 107, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {/* Integrated Media Controller & Attached Preview */}
          <MediaUploader
            sessionId={sessionId}
            onMediaUploaded={(media) => setAttachedMedia(media)}
            attachedMedia={attachedMedia}
            onRemoveMedia={() => setAttachedMedia(null)}
            disabled={isSending}
          />

          {/* Text Input Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: '#1c2028',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid #262a33',
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  attachedMedia
                    ? `Explain symptoms with attached ${attachedMedia.file_type}...`
                    : "Describe car sound, warning light, or mechanical fault..."
                }
                disabled={isSending}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#dfe2ee',
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isSending || (!inputText.trim() && !attachedMedia)}
              style={{
                padding: '0.5rem 1.15rem',
                borderRadius: 'var(--radius-xl)',
                background: isSending || (!inputText.trim() && !attachedMedia) ? '#262a33' : '#ff6b00',
                color: isSending || (!inputText.trim() && !attachedMedia) ? '#94a3b8' : '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                flexShrink: 0,
                boxShadow: isSending || (!inputText.trim() && !attachedMedia) ? 'none' : '0 0 14px rgba(255, 107, 0, 0.45)',
                transition: 'all 0.15s',
              }}
              title="Send to Technician"
            >
              <span>Send</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                north_east
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Industrial Telemetry Footer - Fixed at bottom */}
      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 34,
          background: '#0a0e16',
          borderTop: '1px solid #1E293B',
          padding: '0 1.25rem',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            color: '#94a3b8',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#dfe2ee', fontWeight: 600 }}>TORQUE INDUSTRIAL PROTOCOL CAN-FD 2.0B</span>
            <span className="hidden-mobile">LATENCY: 1.2ms // SECURE HARDWARE ENCLAVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <span className="hidden-mobile">DIAGNOSTIC ENGINE: NEURAL-TECH v4.28</span>
            <span style={{ color: '#ff6b00', fontWeight: 700 }}>SYSTEM HEALTH: NOMINAL</span>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          diagnosis={bookingDiagnosis}
          sessionId={sessionId}
          vehicleInfo={vehicleSummary}
          onClose={() => setIsBookingModalOpen(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Diagnosis & Booking Records Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        diagnoses={diagnoses}
        bookings={bookings}
        onSelectDiagnosis={(diag) => {
          setBookingDiagnosis(diag);
          const elem = document.getElementById('dvi-report-section');
          elem?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* OBD-II Fault Code Lookup Modal */}
      {isObdModalOpen && (
        <div
          id="obd-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 14, 22, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={() => setIsObdModalOpen(false)}
        >
          <div
            style={{
              background: '#111827',
              border: '1px solid #1E293B',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: 520,
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(6, 182, 212, 0.2)',
              animation: 'fadeIn 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#4cd7f6', fontSize: 22 }}>
                  memory
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#dfe2ee',
                    letterSpacing: '-0.02em',
                  }}
                >
                  OBD-II Fault Code Scanner
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsObdModalOpen(false)}
                style={{ color: '#94a3b8', padding: 4 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Select a Diagnostic Trouble Code (DTC) to query the master technician for probable causes, sensor freeze frames, and repair guidance:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {COMMON_OBD_CODES.map((item) => (
                <div
                  key={item.code}
                  onClick={() => {
                    setIsObdModalOpen(false);
                    handleSendMessage(`My vehicle is triggering OBD-II code ${item.code}: ${item.title}. What should I inspect first?`);
                  }}
                  style={{
                    background: '#1c2028',
                    border: '1px solid #1E293B',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#06B6D4';
                    e.currentTarget.style.background = '#262a33';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1E293B';
                    e.currentTarget.style.background = '#1c2028';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: '#06B6D4',
                        fontSize: 13,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.code}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: '#ff6b00',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      Inspect →
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#dfe2ee', marginBottom: 2 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
