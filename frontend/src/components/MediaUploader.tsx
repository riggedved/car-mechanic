'use client';

import React, { useRef, useState } from 'react';
import { Camera, Mic, Video, X, Loader2, StopCircle, FileAudio, FileVideo, FileImage, Radio } from 'lucide-react';
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
  disabled
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `engine_sound_${Date.now()}.webm`, { type: 'audio/webm' });

        try {
          setIsUploading(true);
          const res = await uploadMediaFile(file, sessionId);
          onMediaUploaded(res.media);
        } catch (err: any) {
          alert(err.message || 'Error uploading recorded audio.');
        } finally {
          setIsUploading(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or audio recording not supported in this browser.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Media Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
        {/* Photo Upload Button */}
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(30, 58, 138, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--accent-cyan)',
            fontSize: '0.78rem',
            fontWeight: 600,
          }}
          title="Attach photo of dashboard code, tire tread, oil leak, or brake rotor"
        >
          <Camera size={15} />
          <span>Inspect Photo</span>
        </button>

        {/* Audio Recording / Upload Button */}
        {isRecording ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={stopAudioRecording}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(244, 63, 94, 0.2)',
                border: '1px solid rgba(244, 63, 94, 0.6)',
                color: '#f43f5e',
                fontSize: '0.78rem',
                fontWeight: 700,
                boxShadow: '0 0 15px rgba(244, 63, 94, 0.3)'
              }}
            >
              <StopCircle size={15} />
              <span>Stop & Analyze</span>
            </button>

            {/* Pulsing Visualizer Bars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 18 }}>
              {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9].map((delay, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: 14,
                    background: '#f43f5e',
                    borderRadius: 2,
                    animation: `waveBar 0.8s ease-in-out infinite alternate`,
                    animationDelay: `${delay}s`
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(30, 58, 138, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--accent-blue-light)',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
            title="Record engine knock, belt squeal, or vibration noise"
          >
            <Mic size={15} />
            <span>Record Sound</span>
          </button>
        )}

        {/* Video Upload Button */}
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(30, 58, 138, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#a5b4fc',
            fontSize: '0.78rem',
            fontWeight: 600,
          }}
          title="Upload short video of exhaust smoke, wobble, or leak"
        >
          <Video size={15} />
          <span>Upload Video</span>
        </button>

        {isUploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: 'var(--accent-cyan)' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Diagnostic upload in progress...</span>
          </div>
        )}
      </div>

      {/* Attached Media Chip */}
      {attachedMedia && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.4rem 0.85rem',
          background: 'rgba(30, 58, 138, 0.35)',
          border: '1px solid rgba(96, 165, 250, 0.45)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: '#e0f2fe',
          maxWidth: '100%',
          width: 'fit-content',
          boxShadow: '0 0 12px rgba(56, 189, 248, 0.15)'
        }}>
          {attachedMedia.file_type === 'image' && <FileImage size={16} color="var(--accent-cyan)" />}
          {attachedMedia.file_type === 'audio' && <FileAudio size={16} color="var(--accent-blue-light)" />}
          {attachedMedia.file_type === 'video' && <FileVideo size={16} color="#c084fc" />}
          <span style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {attachedMedia.original_name} ({formatSize(attachedMedia.file_size)})
          </span>
          <button
            type="button"
            onClick={onRemoveMedia}
            style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 2 }}
            title="Remove attachment"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
