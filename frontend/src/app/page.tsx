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
  requestDiagnosis,
  getSessionHistory,
  updateSessionVehicle,
  resolveMediaUrl
} from '@/lib/api';
import {
  Send,
  ShieldCheck,
  Sparkles,
  FileText,
  Disc,
  Zap,
  Thermometer,
  Wind,
  X,
  Loader2,
  AlertCircle
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
  const [toastNotice, setToastNotice] = useState<{ message: string; type: 'warning' | 'error' | 'info' } | null>(null);

  // Modals & Drawers
  const [bookingDiagnosis, setBookingDiagnosis] = useState<Diagnosis | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isObdModalOpen, setIsObdModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session or restore previous session history
  useEffect(() => {
    const defaultWelcome: ChatMessage = {
      id: 'welcome-msg',
      session: '',
      sender: 'mechanic',
      message:
        "Hello! I'm Mac, your senior automotive diagnostic technician. What vehicle can I help you inspect today?\n\n" +
        "Describe any mechanical trouble—brake grinding, coolant leaks, starter clicking, or warning codes. " +
        "You can also attach inspection photos, record live engine sounds with your microphone, or upload a video clip.",
      is_ai_generated: false,
      created_at: new Date().toISOString(),
    };

    const savedSession = localStorage.getItem('mechanic_session_id');

    if (!savedSession) {
      setMessages([defaultWelcome]);
      return;
    }

    setSessionId(savedSession);

    // Fetch complete saved session context from Django backend
    const restoreSession = async () => {
      try {
        const history = await getSessionHistory(savedSession);
        if (history) {
          if (history.messages && history.messages.length > 0) {
            setMessages(history.messages);
          } else {
            setMessages([{ ...defaultWelcome, session: savedSession }]);
          }

          if (history.diagnoses && history.diagnoses.length > 0) {
            setDiagnoses(history.diagnoses);
          }

          if (history.bookings && history.bookings.length > 0) {
            setBookings(history.bookings);
          }

          if (history.vehicle_make || history.vehicle_model || history.vehicle_year || history.vehicle_mileage) {
            setVehicle({
              make: history.vehicle_make || '',
              model: history.vehicle_model || '',
              year: history.vehicle_year || '',
              mileage: history.vehicle_mileage || '',
            });
          }
        }
      } catch (err) {
        console.warn('Could not restore previous session:', err);
        setMessages([{ ...defaultWelcome, session: savedSession }]);
      }
    };

    restoreSession();
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
      setToastNotice({
        message: "Please describe your vehicle's mechanical symptoms or warning codes first so Mac can evaluate the issue.",
        type: 'warning'
      });
      setTimeout(() => setToastNotice(null), 5000);
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
        message: `📋 I've compiled a diagnostic report for your vehicle below with estimated repair costs in INR (₹). Review the findings and click 'Book Mechanic' to schedule a workshop inspection.`,
        is_ai_generated: diagnosis.ai_generated,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, diagNoticeMsg]);
      speakText("Diagnosis report generated with repair estimates in Indian Rupees.");
    } catch (err: any) {
      setToastNotice({
        message: err.message || 'Failed to synthesize diagnosis report.',
        type: 'error'
      });
      setTimeout(() => setToastNotice(null), 5000);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleNewSession = () => {
    localStorage.removeItem('mechanic_session_id');
    setSessionId(null);
    setAttachedMedia(null);
    setDiagnoses([]);
    setBookings([]);
    setVehicle({ year: '', make: '', model: '', mileage: '' });
    setMessages([
      {
        id: 'new-welcome',
        session: '',
        sender: 'mechanic',
        message: "New diagnostic session started. What vehicle trouble can I help you with today?",
        is_ai_generated: false,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const handleUpdateVehicle = async (v: VehicleInfo) => {
    setVehicle(v);
    if (sessionId) {
      try {
        await updateSessionVehicle(sessionId, v);
      } catch (err) {
        console.warn('Could not persist vehicle to session:', err);
      }
    }
  };

  const handleBookClick = (diag: Diagnosis) => {
    setBookingDiagnosis(diag);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  const vehicleSummary = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');

  const canSend = inputText.trim() || attachedMedia;

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        vehicle={vehicle}
        onUpdateVehicle={handleUpdateVehicle}
        onNewSession={handleNewSession}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={diagnoses.length + bookings.length}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onOpenObdLibrary={() => setIsObdModalOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="chat-layout">
        <main className="chat-main">
          {/* Scrollable Conversation Stream */}
          <div className="chat-stream">
            {/* Chat Messages Feed */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`msg-row ${isUser ? 'is-user' : 'is-ai'}`}
                >
                  {/* Sender Tag */}
                  <div className="msg-sender">
                    {!isUser && <ShieldCheck size={12} style={{ color: 'var(--accent)' }} />}
                    <span>{isUser ? 'You' : 'Mac — Senior Technician'}</span>
                    {!isUser && (
                      <span className={`msg-tag ${msg.is_ai_generated ? 'ai' : 'rule'}`}>
                        {msg.is_ai_generated ? 'AI Analysis' : 'Certified Tech'}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`msg-bubble ${isUser ? 'user' : 'ai'}`}>
                    {msg.message}

                    {/* Media Attachments Preview inside bubble */}
                    {msg.media_detail && (
                      <div className="msg-media-preview">
                        {msg.media_detail.file_type === 'image' && (
                          <div className="msg-media-img">
                            <img
                              src={resolveMediaUrl(msg.media_detail.file_url)}
                              alt={msg.media_detail.original_name}
                            />
                          </div>
                        )}
                        {msg.media_detail.file_type === 'audio' && (
                          <div className="msg-media-audio">
                            <div className="msg-media-audio-label">
                              Engine Sound Recording:
                            </div>
                            <audio controls src={resolveMediaUrl(msg.media_detail.file_url)} />
                          </div>
                        )}
                        {msg.media_detail.file_type === 'video' && (
                          <div className="msg-media-video">
                            <video controls src={resolveMediaUrl(msg.media_detail.file_url)} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Diagnostic Starters - placed naturally after welcome greeting */}
            {messages.length <= 1 && (
              <div className="starter-panel">
                <div className="starter-header">
                  <span className="text-section-title" style={{ color: 'var(--accent)' }}>
                    Quick Diagnostics
                  </span>
                  <span className="text-dim">Click to start</span>
                </div>
                <p className="text-small" style={{ marginBottom: '0.65rem' }}>
                  Select a common symptom or describe your vehicle's issue below:
                </p>
                <div className="starter-grid">
                  {CATEGORY_CHIPS.map((cat, idx) => {
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(cat.query)}
                        className="starter-chip"
                      >
                        <div className="starter-chip-icon">
                          <IconComponent size={14} />
                        </div>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* In-Chat Diagnosis Report */}
            {diagnoses.length > 0 && (
              <div style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
                <DiagnosisCard
                  diagnosis={diagnoses[0]}
                  onBookClick={handleBookClick}
                />
              </div>
            )}

            {/* Typing Indicator */}
            {isSending && (
              <div className="typing-indicator">
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
                <span>Mac is analyzing…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Toast Notification Banner */}
          {toastNotice && (
            <div
              className="form-error"
              style={{
                background: toastNotice.type === 'warning' ? '#fffbeb' : undefined,
                borderColor: toastNotice.type === 'warning' ? '#fde68a' : undefined,
                color: toastNotice.type === 'warning' ? '#92400e' : undefined,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8rem',
                padding: '0.5rem 0.8rem'
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{toastNotice.message}</span>
            </div>
          )}

          {/* Quick Action Bar for Diagnostic Synthesis */}
          <div className="diag-action-bar">
            <div className="diag-action-bar-label">
              <FileText size={15} style={{ color: 'var(--accent)' }} />
              <span className="text-small">
                {messages.length <= 1 ? 'Discuss symptoms to compile full report' : 'Ready for a full diagnostic report?'}
              </span>
            </div>
            <button
              onClick={handleGenerateDiagnosis}
              disabled={isDiagnosing}
              className={`btn btn-primary btn-sm ${isDiagnosing ? 'btn-loading' : ''}`}
            >
              {isDiagnosing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{isDiagnosing ? 'Generating…' : 'Generate Diagnostic Report'}</span>
            </button>
          </div>

          {/* Interactive Input Bar */}
          <div className="chat-input-bar">
            {/* Media Uploader Row */}
            <MediaUploader
              sessionId={sessionId}
              onMediaUploaded={(media) => setAttachedMedia(media)}
              attachedMedia={attachedMedia}
              onRemoveMedia={() => setAttachedMedia(null)}
              disabled={isSending}
            />

            {/* Text Input Row */}
            <div className="chat-input-row">
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
                    ? `Describe this ${attachedMedia.file_type}…`
                    : "Describe your car issue — sounds, warning lights, leaks…"
                }
                disabled={isSending}
                className="chat-input-field"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isSending || !canSend}
                className={`chat-send-btn ${isSending || !canSend ? 'disabled' : 'enabled'}`}
                title="Send message"
              >
                <Send size={17} />
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
          setIsBookingModalOpen(true);
        }}
      />

      {/* OBD-II Fault Code Lookup Modal */}
      {isObdModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsObdModalOpen(false); }}>
          <div className="modal-panel" style={{ maxWidth: 500, padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setIsObdModalOpen(false)} aria-label="Close">
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 'var(--radius-md)',
                background: 'var(--accent-muted)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
              }}>
                <Sparkles size={18} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                OBD-II Code Scanner
              </h3>
            </div>
            <p className="text-small" style={{ margin: '0.5rem 0 1rem 0' }}>
              Click any Diagnostic Trouble Code to query the technician for probable causes and fixes:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {COMMON_OBD_CODES.map((item) => (
                <div
                  key={item.code}
                  onClick={() => {
                    setIsObdModalOpen(false);
                    handleSendMessage(`My car is showing OBD-II code ${item.code}: ${item.title}. What should I inspect?`);
                  }}
                  className="obd-item"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span className="obd-item-code">{item.code}</span>
                    <span className="obd-item-action">Inspect →</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
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
