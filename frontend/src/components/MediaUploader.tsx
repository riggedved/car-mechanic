'use client';

import React, { useRef, useState } from 'react';
import { uploadMediaFile, UploadedMedia } from '@/lib/api';

interface MediaUploaderProps {
  sessionId: string | null;
  onMediaUploaded: (media: UploadedMedia) => void;
  attachedMedia: UploadedMedia | null;
  onRemoveMedia: () => void;
  disabled?: boolean;
}

export default function MediaUploader({
  sessionId,
  onMediaUploaded,
  attachedMedia,
  onRemoveMedia,
  disabled,
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadMediaFile(file, sessionId);
      onMediaUploaded(res.media);
    } catch (err: any) {
      alert(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `engine_acoustic_${Date.now()}.webm`, { type: 'audio/webm' });

        try {
          setIsUploading(true);
          const res = await uploadMediaFile(file, sessionId);
          onMediaUploaded(res.media);
        } catch (err: any) {
          alert(err.message || 'Error uploading recorded audio.');
        } finally {
          setIsUploading(false);
          setIsRecording(false);
          setRecordingSeconds(0);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or audio recording not supported in this browser.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '100%' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Media Preview Chip if attached */}
      {attachedMedia && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-lg)',
            background: '#1c2028',
            border: '1px solid #1E293B',
            color: '#dfe2ee',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            maxWidth: '100%',
            width: 'fit-content',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {attachedMedia.file_type === 'image' && (
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ff6b00' }}>
              photo_camera
            </span>
          )}
          {attachedMedia.file_type === 'audio' && (
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#06B6D4' }}>
              graphic_eq
            </span>
          )}
          {attachedMedia.file_type === 'video' && (
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#4cd7f6' }}>
              videocam
            </span>
          )}

          <span
            style={{
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}
          >
            {attachedMedia.original_name}
          </span>
          <span style={{ color: '#94a3b8', fontSize: 10 }}>
            {formatSize(attachedMedia.file_size)}
          </span>

          <button
            type="button"
            onClick={onRemoveMedia}
            style={{
              color: '#94a3b8',
              display: 'flex',
              padding: 2,
              borderRadius: '50%',
              marginLeft: 4,
            }}
            title="Remove attachment"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              close
            </span>
          </button>
        </div>
      )}

      {/* Uploading Status */}
      {isUploading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: '#ff6b00',
            paddingLeft: '0.25rem',
          }}
        >
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 14 }}>
            refresh
          </span>
          <span>Uploading diagnostic media for multimodal analysis...</span>
        </div>
      )}

      {/* Media Trigger Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {/* Photo Button */}
        <button
          type="button"
          disabled={disabled || isUploading || isRecording}
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'image/*';
              fileInputRef.current.click();
            }
          }}
          style={{
            padding: '0.5rem',
            borderRadius: 'var(--radius-xl)',
            background: '#262a33',
            color: '#dfe2ee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #31353e',
          }}
          title="Inspect Photo (Dashboard lights, brake rotors, leaks)"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, display: 'block' }}>
            photo_camera
          </span>
        </button>

        {/* Audio Recording Button */}
        {isRecording ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-xl)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--severity-critical)',
              color: '#ef4444',
            }}
          >
            <button
              type="button"
              onClick={stopAudioRecording}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#ef4444',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
              }}
              title="Stop Recording"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                stop_circle
              </span>
              <span>Stop ({recordingSeconds}s)</span>
            </button>

            {/* Waveform indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
              {[0.2, 0.6, 1.0, 0.4, 0.8].map((delay, i) => (
                <div
                  key={i}
                  style={{
                    width: 2.5,
                    height: 12,
                    background: '#ef4444',
                    borderRadius: 2,
                    animation: 'waveBar 0.8s ease-in-out infinite alternate',
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={startAudioRecording}
            id="record-sound-btn"
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-xl)',
              background: '#262a33',
              color: 'var(--telemetry-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #31353e',
            }}
            title="Record Sound (Engine knock, belt squeal, exhaust rumble)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, display: 'block' }}>
              mic
            </span>
          </button>
        )}

        {/* Video Button */}
        <button
          type="button"
          disabled={disabled || isUploading || isRecording}
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'video/*';
              fileInputRef.current.click();
            }
          }}
          style={{
            padding: '0.5rem',
            borderRadius: 'var(--radius-xl)',
            background: '#262a33',
            color: '#dfe2ee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #31353e',
          }}
          title="Upload Video (Exhaust smoke, fluid leak, wheel vibration)"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, display: 'block' }}>
            videocam
          </span>
        </button>
      </div>
    </div>
  );
}
