import { useState, useCallback, useRef, useEffect } from 'react';

export type MicPermissionStatus = 'idle' | 'requesting' | 'granted' | 'denied';

export type MicErrorType =
  | 'iframe_blocked'
  | 'denied'
  | 'no_device'
  | 'unsupported'
  | null;

export interface UseMicrophoneReturn {
  status: MicPermissionStatus;
  errorType: MicErrorType;
  errorMessage: string | null;
  isIframe: boolean;
  hasMediaDevicesSupport: boolean;
  hasSpeechRecognitionSupport: boolean;
  hasSpeechSynthesisSupport: boolean;
  stream: MediaStream | null;
  requestPermission: () => Promise<MediaStream | null>;
  stopStream: () => void;
  reset: () => void;
}

/**
 * Robust permission management hook for microphone access.
 * - Handles navigator.mediaDevices.getUserMedia asynchronously
 * - Manages state for 'idle', 'requesting', 'granted', and 'denied'
 * - Detects AI Studio preview / iframe restrictions without faking permission
 * - Only triggers permission prompt upon explicit user interaction (mic button click)
 * - Android Chrome and desktop browser compatible
 */
export function useMicrophone(): UseMicrophoneReturn {
  const [status, setStatus] = useState<MicPermissionStatus>('idle');
  const [errorType, setErrorType] = useState<MicErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const activeStreamRef = useRef<MediaStream | null>(null);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const hasMediaDevicesSupport =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  const hasSpeechRecognitionSupport =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const hasSpeechSynthesisSupport =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stopStream = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      activeStreamRef.current = null;
    }
    setStream(null);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setStatus('idle');
    setErrorType(null);
    setErrorMessage(null);
  }, [stopStream]);

  // Clean up any remaining tracks on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  /**
   * Request microphone permission explicitly via user gesture.
   * NEVER called automatically on page load.
   */
  const requestPermission = useCallback(async (): Promise<MediaStream | null> => {
    // Check hardware/API support first
    if (!hasMediaDevicesSupport) {
      setStatus('denied');
      setErrorType('unsupported');
      setErrorMessage('Microphone recording is not supported in this browser environment.');
      return null;
    }

    setStatus('requesting');
    setErrorType(null);
    setErrorMessage(null);

    try {
      // Direct browser permission prompt
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = mediaStream;
      setStream(mediaStream);
      setStatus('granted');
      setErrorType(null);
      setErrorMessage(null);
      return mediaStream;
    } catch (err: any) {
      console.warn('Microphone permission check result:', err?.name, err?.message);
      setStatus('denied');
      stopStream();

      const errorName = err?.name || '';
      const isSecurityOrPermissionError =
        errorName === 'NotAllowedError' ||
        errorName === 'PermissionDeniedError' ||
        errorName === 'SecurityError';

      // Detect AI Studio preview iframe sandbox block
      if (isIframe && isSecurityOrPermissionError) {
        setErrorType('iframe_blocked');
        setErrorMessage(
          'Microphone access is restricted by the Google AI Studio preview environment sandbox. Text chat and audio playback are fully active.'
        );
        return null;
      }

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setErrorType('denied');
        setErrorMessage(
          'Microphone access was denied. Please allow microphone access in your browser address bar permissions and retry.'
        );
        return null;
      }

      if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setErrorType('no_device');
        setErrorMessage('No microphone device was detected on your hardware.');
        return null;
      }

      if (errorName === 'NotSupportedError') {
        setErrorType('unsupported');
        setErrorMessage('Audio recording is not supported by your browser.');
        return null;
      }

      setErrorType('denied');
      setErrorMessage(err?.message || 'Could not access microphone.');
      return null;
    }
  }, [hasMediaDevicesSupport, isIframe, stopStream]);

  return {
    status,
    errorType,
    errorMessage,
    isIframe,
    hasMediaDevicesSupport,
    hasSpeechRecognitionSupport,
    hasSpeechSynthesisSupport,
    stream,
    requestPermission,
    stopStream,
    reset,
  };
}
