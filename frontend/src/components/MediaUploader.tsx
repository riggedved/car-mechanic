'use client';

import React, { useRef, useState } from 'react';
import { Camera, Mic, Video, X, Loader2, StopCircle, FileAudio, FileVideo, FileImage } from 'lucide-react';
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

  const [uploadError, setUploadError] = useState<string | null>(null);

  const showError = (msg: string) => {
    setUploadError(msg);
    setTimeout(() => setUploadError(null), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadMediaFile(file, sessionId);
      onMediaUploaded(res.media);
    } catch (err: any) {
      showError(err.message || 'Error uploading file.');
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
          showError(err.message || 'Error uploading recorded audio.');
        } finally {
          setIsUploading(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      showError('Microphone access denied or audio recording not supported in this browser.');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {uploadError && (
        <div className="form-error" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
          {uploadError}
        </div>
      )}

      {/* Media Action Bar */}
      <div className="media-actions">
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
          className="media-btn"
          title="Attach photo of dashboard, tire, oil leak, or brake rotor"
        >
          <Camera size={14} />
          <span>Photo</span>
        </button>

        {/* Audio Recording */}
        {isRecording ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={stopAudioRecording}
              className="media-btn media-btn-stop"
            >
              <StopCircle size={14} />
              <span>Stop & Analyze</span>
            </button>

            <div className="recording-bars">
              {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9].map((delay, i) => (
                <div
                  key={i}
                  className="recording-bar"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={startAudioRecording}
            className="media-btn"
            title="Record engine knock, belt squeal, or vibration noise"
          >
            <Mic size={14} />
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
          className="media-btn"
          title="Upload short video of exhaust smoke, wobble, or leak"
        >
          <Video size={14} />
          <span>Video</span>
        </button>

        {isUploading && (
          <div className="media-uploading">
            <Loader2 size={14} className="animate-spin" />
            <span>Uploading…</span>
          </div>
        )}
      </div>

      {/* Attached Media Chip */}
      {attachedMedia && (
        <div className="media-chip">
          {attachedMedia.file_type === 'image' && <FileImage size={15} style={{ color: 'var(--accent)' }} />}
          {attachedMedia.file_type === 'audio' && <FileAudio size={15} style={{ color: 'var(--status-info)' }} />}
          {attachedMedia.file_type === 'video' && <FileVideo size={15} style={{ color: 'var(--gray-600)' }} />}
          <span className="media-chip-name">
            {attachedMedia.original_name} ({formatSize(attachedMedia.file_size)})
          </span>
          <button
            type="button"
            onClick={onRemoveMedia}
            className="media-chip-remove"
            title="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
