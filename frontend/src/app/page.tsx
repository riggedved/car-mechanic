'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import MediaUploader from '@/components/MediaUploader';
import DiagnosisCard from '@/components/DiagnosisCard';
import BookingModal from '@/components/BookingModal';
import HistoryDrawer from '@/components/HistoryDrawer';
import {
  ChatMessage,
  UploadedMedia,
  Diagnosis,
  Booking,
  VehicleInfo,
  sendChatMessage,
  requestDiagnosis
} from '@/lib/api';
import {
  Send,
  ShieldCheck,
  Sparkles,
  FileText,
  Volume2,
  CheckCircle,
  Activity,
  Layers,
  HelpCircle,
  Disc,
  Zap,
  Thermometer,
  Wind
} from 'lucide-react';

const COMMON_OBD_CODES = [
  { code: 'P0300', title: 'Random / Multiple Cylinder Misfire', desc: 'Fouled spark plugs, bad ignition coils, or vacuum leak.' },
  { code: 'P0420', title: 'Catalytic Converter System Efficiency Below Threshold', desc: 'Exhaust leak, O2 sensor failure, or worn cat substrate.' },
  { code: 'P0171', title: 'System Too Lean (Bank 1)', desc: 'Dirty MAF sensor, vacuum leak, or weak fuel pump.' },
  { code: 'P0442', title: 'EVAP System Small Leak Detected', desc: 'Loose or cracked fuel filler cap or purge valve stick.' },
  { code: 'P0115', title: 'Engine Coolant Temperature Sensor Malfunction', desc: 'Faulty ECT sensor or thermostat stuck open.' },
  { code: 'P0500', title: 'Vehicle Speed Sensor (VSS) Malfunction', desc: 'Speedometer erratic or ABS wheel speed sensor failure.' }
];

const CATEGORY_CHIPS = [
  { label: 'Brakes & Rotors', icon: Disc, query: 'My front brakes are squealing and grinding when I stop' },
  { label: 'Engine & Starter', icon: Zap, query: 'Engine won\'t start, rapid clicking when turning key' },
  { label: 'Cooling & Steam', icon: Thermometer, query: 'Temperature gauge is in the red and white steam from bonnet' },
  { label: 'AC & Climate', icon: Wind, query: 'AC is blowing warm ambient air instead of chilled air at idle' },
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
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Modals & Drawers
  const [bookingDiagnosis, setBookingDiagnosis] = useState<Diagnosis | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isObdModalOpen, setIsObdModalOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session or set default welcome message
  useEffect(() => {
    const savedSession = localStorage.getItem('mechanic_session_id');
    if (savedSession) {
      setSessionId(savedSession);
    }

    setMessages([
      {
        id: 'welcome-msg',
        session: savedSession || '',
        sender: 'mechanic',
        message:
          "Hello! I'm Mac, your senior automotive diagnostic technician. What vehicle can I help you inspect today?\n\n" +
          "Describe any mechanical trouble—brake grinding, coolant leaks, starter clicking, or warning codes. " +
          "You can also attach inspection photos, record live engine sounds with your microphone, or upload a video clip.",
        is_ai_generated: false,
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  // Voice speech synthesis
  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#•⚠️🚨💡]/g, '').slice(0, 250);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
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
      message: textToSend || `[Attached ${currentMedia?.file_type}]`,
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
      speakText(response.mechanic_message.message);
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
      setShowReport(true);

      const diagNoticeMsg: ChatMessage = {
        id: `diag-notice-${Date.now()}`,
        session: activeSession,
        sender: 'mechanic',
        message: `📋 I've compiled an official diagnostic report for your vehicle below with estimated repair costs in INR (₹). Review the findings and click 'Book Certified Mechanic' to schedule a prioritized workshop bay inspection.`,
        is_ai_generated: diagnosis.ai_generated,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, diagNoticeMsg]);
      speakText("Diagnosis report generated with repair estimates in Indian Rupees.");
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `notice-${Date.now()}`,
          session: sessionId || '',
          sender: 'mechanic',
          message: `ℹ️ ${err.message || 'Please describe what symptoms or trouble your vehicle is experiencing before generating a repair diagnostic report.'}`,
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
    setSessionId(null);
    setAttachedMedia(null);
    setDiagnoses([]);
    setVehicle({ year: '', make: '', model: '', mileage: '' });
    setMessages([
      {
        id: 'new-welcome',
        session: '',
        sender: 'mechanic',
        message: "New diagnostic bay initialized. What vehicle trouble can I troubleshoot for you today?",
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

  const vehicleSummary = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Header */}
      <Header
        vehicle={vehicle}
        onUpdateVehicle={(v) => setVehicle(v)}
        onNewSession={handleNewSession}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={diagnoses.length + bookings.length}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onOpenObdLibrary={() => setIsObdModalOpen(true)}
      />

      {/* Main Layout Container */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 1020,
          margin: '0 auto',
          width: '100%',
          padding: '1rem 1.25rem',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Scrollable Conversation Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '0.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            paddingBottom: '1rem',
          }}>
            {/* Quick Diagnostic Category Chips */}
            {messages.length <= 1 && (
              <div style={{
                background: 'rgba(12, 21, 39, 0.75)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.4rem',
                margin: '0.5rem 0',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Instant Diagnostic Diagnostic Starters
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Click an issue to test
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
                  Select a common mechanical symptom or type your car's symptoms below:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.55rem' }}>
                  {CATEGORY_CHIPS.map((cat, idx) => {
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(cat.query)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.65rem 0.95rem',
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: 'var(--radius-md)',
                          color: '#e2e8f0',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                          e.currentTarget.style.background = 'rgba(30, 58, 138, 0.35)';
                          e.currentTarget.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.7)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(59, 130, 246, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-cyan)'
                        }}>
                          <IconComponent size={15} />
                        </div>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat Messages Feed */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.25s ease-out'
                  }}
                >
                  {/* Sender Tag */}
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    marginBottom: '0.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0 0.5rem'
                  }}>
                    {!isUser && <ShieldCheck size={13} color="var(--accent-cyan)" />}
                    <span>{isUser ? 'Vehicle Owner' : 'Senior Master Technician'}</span>
                    {!isUser && (
                      <span style={{
                        fontSize: '0.64rem',
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: msg.is_ai_generated ? 'rgba(56, 189, 248, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: msg.is_ai_generated ? 'var(--accent-cyan)' : 'var(--accent-blue-light)',
                        border: `1px solid ${msg.is_ai_generated ? 'rgba(56, 189, 248, 0.35)' : 'rgba(59, 130, 246, 0.3)'}`
                      }}>
                        {msg.is_ai_generated ? 'Multimodal Inspection' : 'Rule Guardrail'}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      maxWidth: '84%',
                      padding: '0.95rem 1.25rem',
                      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isUser
                        ? 'linear-gradient(135deg, #1d4ed8 0%, #0369a1 100%)'
                        : 'rgba(12, 21, 39, 0.85)',
                      border: `1px solid ${isUser ? 'rgba(147, 197, 253, 0.4)' : 'rgba(59, 130, 246, 0.22)'}`,
                      color: '#fff',
                      fontSize: '0.92rem',
                      lineHeight: 1.6,
                      boxShadow: isUser ? '0 4px 20px rgba(37, 99, 235, 0.35)' : '0 4px 20px rgba(0, 0, 0, 0.4)',
                      whiteSpace: 'pre-wrap',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    {msg.message}

                    {/* Media Attachments Preview inside bubble */}
                    {msg.media_detail && (
                      <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                        {msg.media_detail.file_type === 'image' && (
                          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxWidth: 380, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <img
                              src={msg.media_detail.file_url}
                              alt={msg.media_detail.original_name}
                              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 290, objectFit: 'cover' }}
                            />
                          </div>
                        )}
                        {msg.media_detail.file_type === 'audio' && (
                          <div style={{
                            background: 'rgba(7, 13, 26, 0.75)',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                          }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginBottom: 4, fontWeight: 600 }}>
                              Recorded Engine Acoustic Waveform:
                            </div>
                            <audio controls src={msg.media_detail.file_url} style={{ width: '100%', height: 38 }} />
                          </div>
                        )}
                        {msg.media_detail.file_type === 'video' && (
                          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxWidth: 380, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <video controls src={msg.media_detail.file_url} style={{ width: '100%', maxHeight: 270 }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* In-Chat Diagnosis Report */}
            {diagnoses.length > 0 && showReport && (
              <div style={{ position: 'relative', animation: 'fadeIn 0.35s ease-out' }}>
                <button
                  onClick={() => setShowReport(false)}
                  title="Close Report"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 10,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    lineHeight: 1,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
                  }}
                >
                  ✕
                </button>
                <DiagnosisCard
                  diagnosis={diagnoses[0]}
                  onBookClick={handleBookClick}
                />
              </div>
            )}

            {/* Typing / Analyzing Indicator */}
            {isSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem', color: 'var(--accent-blue-light)', fontSize: '0.85rem' }}>
                <Activity size={16} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
                <span>Senior technician analyzing mechanical parameters...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Bar for Diagnostic Synthesis */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(12, 21, 39, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.55rem 0.95rem',
            marginBottom: '0.65rem',
            gap: '0.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Detailed enough symptoms?
              </span>
            </div>
            <button
              onClick={handleGenerateDiagnosis}
              disabled={isDiagnosing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.95rem',
                background: 'linear-gradient(135deg, #1d4ed8, #0284c7)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 0 16px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Sparkles size={14} />
              <span>{isDiagnosing ? 'Synthesizing...' : 'Generate Full Diagnostic Report (₹)'}</span>
            </button>
          </div>

          {/* Interactive Input Bar */}
          <div style={{
            background: 'rgba(12, 21, 39, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: 'var(--radius-xl)',
            padding: '0.85rem 1rem',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(37, 99, 235, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}>
            {/* Media Uploader Row */}
            <MediaUploader
              sessionId={sessionId}
              onMediaUploaded={(media) => setAttachedMedia(media)}
              attachedMedia={attachedMedia}
              onRemoveMedia={() => setAttachedMedia(null)}
              disabled={isSending}
            />

            {/* Text Input Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                    ? `Explain where this ${attachedMedia.file_type} was recorded or how it behaves...`
                    : "Describe car sound, warning light, fluid leak, or mechanical fault..."
                }
                disabled={isSending}
                style={{
                  flex: 1,
                  padding: '0.8rem 1.15rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
                }}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isSending || (!inputText.trim() && !attachedMedia)}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 'var(--radius-lg)',
                  background: isSending || (!inputText.trim() && !attachedMedia)
                    ? 'rgba(30, 41, 59, 0.5)'
                    : 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                  color: isSending || (!inputText.trim() && !attachedMedia)
                    ? 'var(--text-dim)'
                    : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  boxShadow: isSending || (!inputText.trim() && !attachedMedia)
                    ? 'none'
                    : '0 0 20px rgba(37, 99, 235, 0.5)'
                }}
                title="Send Message to Technician"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </main>
      </div>

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

      {/* Diagnosis & Booking History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        diagnoses={diagnoses}
        bookings={bookings}
        onSelectDiagnosis={(diag) => {
          setBookingDiagnosis(diag);
        }}
      />

      {/* OBD-II Fault Code Lookup Modal */}
      {isObdModalOpen && (
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
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: 520,
            padding: '1.75rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(37, 99, 235, 0.25)',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  OBD-II Fault Code Scanner
                </h3>
              </div>
              <button
                onClick={() => setIsObdModalOpen(false)}
                style={{ color: 'var(--text-muted)', padding: 4 }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Click any Diagnostic Trouble Code (DTC) below to automatically query the master technician for probable causes and fixes:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {COMMON_OBD_CODES.map((item) => (
                <div
                  key={item.code}
                  onClick={() => {
                    setIsObdModalOpen(false);
                    handleSendMessage(`My car is showing OBD-II code ${item.code}: ${item.title}. What should I inspect?`);
                  }}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                    e.currentTarget.style.background = 'rgba(30, 58, 138, 0.35)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.7)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                      {item.code}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-blue-light)', fontWeight: 600 }}>
                      Inspect →
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
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
