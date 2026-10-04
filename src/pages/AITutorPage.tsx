import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import { useMicrophone } from '../hooks/useMicrophone.ts';
import {
  AIConversation,
  AIMessage,
  DocumentRecord,
} from '../types.ts';
import {
  MessageSquare,
  Sparkles,
  Send,
  Plus,
  Trash2,
  BookOpen,
  CheckSquare,
  Copy,
  Check,
  Loader2,
  RotateCcw,
  Square,
  Mic,
  MicOff,
  Globe,
  MapPin,
  Menu,
  X,
  SquarePen,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileImage,
  Upload,
  ArrowRight,
  Volume2,
  VolumeX,
  Pause,
  Play,
  AlertCircle,
  ExternalLink,
  Headphones,
  Radio,
  RefreshCw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  StudymateThinkingCard,
  StudymateStreamingCard,
} from '../components/StudymateAIThinking.tsx';

/**
 * Clean markdown symbols for natural speech synthesis
 */
function cleanMarkdownForSpeech(markdown: string): string {
  if (!markdown) return '';
  return markdown
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[#*_~>]/g, '')
    .replace(/[-*+]\s+/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * PCM to Base64 encoder for Live API audio streaming
 */
function pcmToBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

function playAudioChunk(outputAudioCtx: AudioContext, base64Audio: string, nextStartTime: number) {
  try {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    const buffer = outputAudioCtx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = outputAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(outputAudioCtx.destination);

    const currentTime = outputAudioCtx.currentTime;
    const startTime = Math.max(currentTime, nextStartTime);
    source.start(startTime);
  } catch (e) {
    console.error('Audio playback error:', e);
  }
}

/**
 * Real-Time Gemini Live Audio Modal
 * - Never claims connected unless an actual live audio connection exists
 * - Explicit user gesture required to connect audio (never requests on modal open without click)
 * - Accurately detects AI Studio preview iframe and explains restrictions without fake permissions
 */
const VoiceModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const cleanupSession = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
    setStatus('idle');
    setErrorMessage('');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanupSession();
    } else {
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen, cleanupSession]);

  const startLiveSession = async () => {
    if (isIframe) {
      setStatus('error');
      setErrorMessage(
        "Live voice audio stream is restricted inside Google AI Studio's preview iframe sandbox. Use standard chat with voice dictation & speaker output below, or deploy to standalone HTTPS."
      );
      return;
    }

    setStatus('connecting');
    setErrorMessage('');
    nextStartTimeRef.current = 0;

    let ws: WebSocket | null = null;
    let inputCtx: AudioContext | null = null;
    let outputCtx: AudioContext | null = null;
    let stream: MediaStream | null = null;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('error');
        setErrorMessage('Microphone access is not supported by your browser.');
        return;
      }

      // Explicit user-triggered permission request
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        try {
          inputCtx = new AudioContext({ sampleRate: 16000 });
          outputCtx = new AudioContext({ sampleRate: 24000 });

          const source = inputCtx.createMediaStreamSource(stream!);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = pcmToBase64(inputData);
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ audio: pcmData }));
            }
          };

          source.connect(processor);
          processor.connect(inputCtx.destination);

          // Only claim connected when WebSocket is genuinely OPEN and audio stream is running
          setStatus('connected');
        } catch (setupErr: any) {
          console.warn('Live audio setup note:', setupErr);
          setStatus('error');
          setErrorMessage('Could not initialize audio processing context.');
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio && outputCtx) {
            playAudioChunk(outputCtx, data.audio, nextStartTimeRef.current);
          }
        } catch (err) {
          console.warn('Audio message parse warning:', err);
        }
      };

      ws.onerror = () => {
        setStatus('error');
        setErrorMessage('Failed to connect to real-time voice server.');
      };

      ws.onclose = () => {
        if (status === 'connected') {
          setStatus('idle');
        }
      };
    } catch (micErr: any) {
      console.warn('Live voice microphone permission note:', micErr?.name, micErr?.message);
      setStatus('error');
      const isDenied = micErr?.name === 'NotAllowedError' || micErr?.name === 'PermissionDeniedError';
      setErrorMessage(
        isDenied
          ? 'Microphone permission was denied by browser settings. Please allow microphone in your address bar.'
          : (micErr?.message || 'Failed to capture microphone audio.')
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#0e1320] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative my-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center shadow-inner">
            {isIframe ? (
              <MicOff className="w-10 h-10 text-slate-400" />
            ) : (
              <Mic className={`w-10 h-10 ${status === 'connected' ? 'text-cyan-400 animate-pulse' : 'text-slate-300'}`} />
            )}
          </div>
          {status === 'connected' && (
            <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" /> LIVE
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1">Gemini Live Voice Tutor</h3>

        {isIframe ? (
          <div className="text-left bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 mb-5 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-cyan-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" /> Preview Environment Notice
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Google AI Studio runs inside a secure sandbox iframe that restricts real-time duplex microphone streaming.
            </p>
            <div className="pt-1 text-[11px] text-slate-400 space-y-1">
              <p>• <strong className="text-white">Voice Dictation:</strong> Use the mic button in the chat box to dictate questions!</p>
              <p>• <strong className="text-white">Device Audio:</strong> StudyMate reads every response aloud through your speaker.</p>
              <p>• <strong className="text-white">Standalone:</strong> Full duplex live voice is available when deployed to standalone HTTPS.</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-4 px-2">
            {status === 'idle' && 'Click below to connect your microphone and speak with StudyMate in real-time.'}
            {status === 'connecting' && 'Connecting to real-time speech stream...'}
            {status === 'connected' && 'Speak naturally. Your AI tutor is listening and answering in real-time audio.'}
            {status === 'error' && (errorMessage || 'Connection failed.')}
          </p>
        )}

        {status === 'connected' && (
          <div className="flex items-center gap-1.5 h-8 mb-5">
            {[40, 75, 100, 60, 90, 45, 80, 55].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-cyan-400 rounded-full animate-bounce"
                style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        )}

        <div className="w-full flex flex-col gap-2">
          {isIframe ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition"
            >
              Use Chat Voice & Audio
            </button>
          ) : status === 'idle' || status === 'error' ? (
            <button
              onClick={startLiveSession}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Mic className="w-3.5 h-3.5" /> Start Live Voice Session
            </button>
          ) : (
            <button
              onClick={() => {
                cleanupSession();
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-md shadow-rose-600/20"
            >
              End Voice Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Microphone Permission Guidance & Recovery Modal
 */
interface MicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onDemoVoice?: () => void;
  onTypeInChat?: () => void;
  errorType: 'preview_restricted' | 'denied' | 'no_device' | 'unsupported' | null;
}

const MicPermissionModal: React.FC<MicModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onDemoVoice,
  onTypeInChat,
  errorType,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e1322] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4">
          <MicOff className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1.5">
          {errorType === 'preview_restricted' && 'Microphone in AI Studio Preview'}
          {errorType === 'denied' && 'Microphone Permission Blocked'}
          {errorType === 'no_device' && 'No Microphone Detected'}
          {errorType === 'unsupported' && 'Voice Input Unsupported in Browser'}
        </h3>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          {errorType === 'preview_restricted' && (
            <>
              Google AI Studio's preview window runs inside an embedded sandbox iframe. Browser security policy restricts
              hardware microphone access inside embedded iframes.
            </>
          )}
          {errorType === 'denied' && (
            <>
              Your browser blocked microphone access for this app. To talk to StudyMate, grant microphone access in your
              browser settings.
            </>
          )}
          {errorType === 'no_device' && (
            <>
              No audio input hardware was found on your device. Please plug in or connect a microphone or headset.
            </>
          )}
          {errorType === 'unsupported' && (
            <>
              Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.
            </>
          )}
        </p>

        {/* Informative Guidance Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2 mb-5">
          {errorType === 'preview_restricted' ? (
            <>
              <p className="font-semibold text-cyan-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5" /> What You Can Do:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li><strong className="text-white">Text Chat:</strong> 100% active right now. Type any study question below!</li>
                <li><strong className="text-white">Device Audio Output:</strong> StudyMate can read all answers aloud through your speaker.</li>
                <li><strong className="text-white">Standalone / Mobile:</strong> When opened directly on a normal HTTPS domain (or Android Chrome), native microphone prompts will appear automatically!</li>
              </ul>
            </>
          ) : errorType === 'denied' ? (
            <>
              <p className="font-semibold text-cyan-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5" /> How to Allow Microphone:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Tap the <strong className="text-white">lock or settings icon</strong> in the browser address bar.</li>
                <li>Set <strong className="text-white">Microphone</strong> to <span className="text-emerald-400 font-medium">Allow</span>.</li>
                <li>Tap <strong className="text-white">"Retry Permission"</strong> below.</li>
              </ul>
            </>
          ) : (
            <p className="text-[11px] text-slate-400">
              You can type your questions directly into the chat area at any time.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {errorType === 'denied' && (
            <button
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Permission
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              if (onTypeInChat) onTypeInChat();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/10"
          >
            Type Question in Text Box
          </button>

          {onDemoVoice && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDemoVoice();
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-medium transition flex items-center justify-center gap-1.5 border border-cyan-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" /> Test Voice Output (Simulated Spoken Query)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Custom 4-Point Spark Star Emblem
 * Clean, modern, original StudyMate identity
 */
const StudyMateSparkStar: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <div className="relative inline-flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-blue-500 to-amber-300 rounded-full blur-xl opacity-50 animate-pulse pointer-events-none" />
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} relative z-10 drop-shadow-md`}>
      <defs>
        <linearGradient id="smStarGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="35%" stopColor="#6366f1" />
          <stop offset="70%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        d="M24 2C24 14.15 14.15 24 2 24C14.15 24 24 33.85 24 46C24 33.85 33.85 24 46 24C33.85 24 24 14.15 24 2Z"
        fill="url(#smStarGrad)"
      />
    </svg>
  </div>
);

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?.id) return true;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

const STUDY_MODES = [
  { id: 'explain', label: 'Socratic Explainer', desc: 'Step-by-step conceptual intuition and analogies' },
  { id: 'exam-prep', label: 'Exam Drill', desc: 'High-yield points, common traps, and test strategy' },
  { id: 'step-by-step', label: 'Step-by-Step Solver', desc: 'Detailed methodical walkthrough without skipping calculations' },
  { id: 'quiz-me', label: 'Active Recall Quiz', desc: 'Interactive probing questions to test retention' },
  { id: 'summarize', label: 'Executive Summary', desc: 'Concise bullet points and core formulas' },
  { id: 'simplify', label: 'Plain Language (ELI5)', desc: 'Clear, jargon-free breakdown' },
];

interface AttachedFileItem {
  id?: string;
  name: string;
  size: number;
  type: string;
  uploading: boolean;
}

export const AITutorPage: React.FC = () => {
  const { user, profile, routeParams, navigateTo, openUpgradeModal, addToast } = useApp();

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);

  const [prompt, setPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('explain');
  const [selectedSubject, setSelectedSubject] = useState<string>('General');
  const [attachedDocId, setAttachedDocId] = useState<string>('');
  const [, setDocuments] = useState<DocumentRecord[]>([]);

  // Attached files state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([]);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Grounding & Live Voice
  const [enableSearch, setEnableSearch] = useState(false);
  const [enableMaps, setEnableMaps] = useState(false);
  const [latLng, setLatLng] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Microphone & Speech-to-Text State
  const mic = useMicrophone();
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'IDLE' | 'LISTENING' | 'USER_SPEAKING' | 'PROCESSING' | 'ANSWERING'>('IDLE');
  const [micErrorType, setMicErrorType] = useState<'preview_restricted' | 'denied' | 'no_device' | 'unsupported' | null>(null);
  const [isMicModalOpen, setIsMicModalOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const activeMicStreamRef = useRef<MediaStream | null>(null);
  const wasLastInputVoiceRef = useRef<boolean>(false);
  const voiceTranscriptRef = useRef<string>('');
  const hasUserSpokenRef = useRef<boolean>(false);

  // Text-to-Speech Output State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [activeSpokenMessageId, setActiveSpokenMessageId] = useState<string | null>(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Layout UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, setGeminiStatus] = useState<{ connected: boolean; model: string; message: string } | null>(null);
  const [errorState, setErrorState] = useState<{ message: string; lastFailedPrompt?: string } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleSendMessageRef = useRef<any>(null);

  const displayConversations = useMemo(() => dedupeById(conversations), [conversations]);
  const displayMessages = useMemo(() => dedupeById(messages), [messages]);

  // Dynamic user name greeting
  const displayName = useMemo(() => {
    if (user?.name && user.name.trim()) {
      return user.name.split(' ')[0];
    }
    return 'Mazhar';
  }, [user]);

  // Text to Speech playback function
  const speakMessage = useCallback((messageId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      addToast('Audio Output Notice', 'Speech synthesis is not supported on this browser.', 'info');
      setVoiceStatus('IDLE');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsSpeechPaused(false);
      setActiveSpokenMessageId(null);

      const cleaned = cleanMarkdownForSpeech(text);
      if (!cleaned) {
        setVoiceStatus('IDLE');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick the best natural English voice available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(
          (v) =>
            (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Aaron')) &&
            v.lang.startsWith('en')
        ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsSpeechPaused(false);
        setActiveSpokenMessageId(messageId);
        setVoiceStatus('ANSWERING');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
        setActiveSpokenMessageId(null);
        setVoiceStatus('IDLE');
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('SpeechSynthesis notice:', e);
        }
        setIsSpeaking(false);
        setIsSpeechPaused(false);
        setActiveSpokenMessageId(null);
        setVoiceStatus('IDLE');
        currentUtteranceRef.current = null;
      };

      utterance.onpause = () => {
        setIsSpeechPaused(true);
      };

      utterance.onresume = () => {
        setIsSpeechPaused(false);
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to speak message:', err);
      setIsSpeaking(false);
      setIsSpeechPaused(false);
      setActiveSpokenMessageId(null);
      setVoiceStatus('IDLE');
    }
  }, [addToast]);

  const pauseSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsSpeechPaused(true);
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsSpeechPaused(false);
    }
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsSpeechPaused(false);
      setActiveSpokenMessageId(null);
      setVoiceStatus('IDLE');
      currentUtteranceRef.current = null;
    }
  }, []);

  // Clean up timers, speech, microphone, and abort controllers
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (activeMicStreamRef.current) {
        activeMicStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, streamingText, isGenerating]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [convRes, docRes, statusRes] = await Promise.all([
          api.getConversations().catch(() => ({ conversations: [] })),
          api.getDocuments().catch(() => ({ documents: [] })),
          api.getAiStatus().catch(() => ({ connected: false, model: 'gemini-3.8-flash', message: 'Offline', provider: 'Google Gemini' })),
        ]);
        setConversations(dedupeById(convRes.conversations || []));
        setDocuments(docRes.documents || []);
        setGeminiStatus(statusRes);

        if (routeParams.convId) {
          setActiveConvId(routeParams.convId);
        } else if (convRes.conversations?.length > 0) {
          setActiveConvId(convRes.conversations[0].id);
        }

        if (routeParams.subject) {
          setSelectedSubject(routeParams.subject);
        }
        if (routeParams.docId) {
          setAttachedDocId(routeParams.docId);
          const found = docRes.documents?.find((d: DocumentRecord) => d.id === routeParams.docId);
          if (found) {
            setAttachedFiles([{ name: found.fileName, size: found.fileSize, type: 'document', uploading: false, id: found.id }]);
          }
        }
        if (routeParams.prompt) {
          setPrompt(routeParams.prompt);
        }
      } catch (err) {
        console.error('Failed to load tutor data:', err);
      }
    };
    loadInitialData();
  }, [routeParams.convId, routeParams.prompt, routeParams.subject, routeParams.docId]);

  // Load active conversation details
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    const fetchConv = async () => {
      try {
        const res = await api.getConversation(activeConvId);
        setMessages((prev) => {
          const fetched = res.messages || [];
          const fetchedIds = new Set(fetched.map((m) => m.id));
          const pendingTemp = prev.filter((m) => m.id.startsWith('temp-') && !fetchedIds.has(m.id));
          return dedupeById([...fetched, ...pendingTemp]);
        });
      } catch {
        addToast('Error', 'Could not load conversation messages', 'error');
      }
    };
    fetchConv();
  }, [activeConvId, addToast]);

  // Typing state tracker
  const handlePromptChange = (val: string) => {
    setPrompt(val);
    if (!isTyping) setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 1200);
  };

  // Safe stop for microphone recording without submitting
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (activeMicStreamRef.current) {
      activeMicStreamRef.current.getTracks().forEach((track) => track.stop());
      activeMicStreamRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Finish recording and send ONLY if actual user speech was captured
  const finishRecordingAndSend = useCallback(() => {
    const captured = voiceTranscriptRef.current.trim();
    const didSpeak = hasUserSpokenRef.current;

    // Stop recording first
    stopRecording();

    // Guard: ignore silence, noise, or zero captured words
    if (!didSpeak || !captured || captured.length < 2) {
      voiceTranscriptRef.current = '';
      hasUserSpokenRef.current = false;
      setVoiceStatus('IDLE');
      return;
    }

    // Only transition to PROCESSING after actual user speech has been captured!
    voiceTranscriptRef.current = '';
    hasUserSpokenRef.current = false;
    setVoiceStatus('PROCESSING');
    if (handleSendMessageRef.current) {
      handleSendMessageRef.current(undefined, captured);
    }
  }, [stopRecording]);

  // Speech Recognition (Speech to Text) with explicit permission flow & turn detection
  const toggleSpeechRecognition = async () => {
    // If currently listening, clicking the mic button either sends captured speech or cancels
    if (isListening) {
      if (hasUserSpokenRef.current && voiceTranscriptRef.current.trim().length >= 2) {
        finishRecordingAndSend();
      } else {
        stopRecording();
        voiceTranscriptRef.current = '';
        hasUserSpokenRef.current = false;
        setVoiceStatus('IDLE');
      }
      return;
    }

    const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

    // Check SpeechRecognition browser API
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setMicErrorType('unsupported');
      setIsMicModalOpen(true);
      return;
    }

    // Stop any ongoing speech synthesis before starting a new listening session
    stopSpeech();

    // CLEAR any stale/pending voice input before starting a new voice session
    voiceTranscriptRef.current = '';
    hasUserSpokenRef.current = false;
    setPrompt(''); // Do not use old question from chat history or input
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }

    // Step 1: Explicitly request permission via useMicrophone hook (asynchronously requests getUserMedia)
    const stream = await mic.requestPermission();
    if (!stream) {
      if (mic.errorType === 'iframe_blocked') {
        setMicErrorType('preview_restricted');
      } else if (mic.errorType === 'no_device') {
        setMicErrorType('no_device');
      } else if (mic.errorType === 'unsupported') {
        setMicErrorType('unsupported');
      } else {
        setMicErrorType('denied');
      }
      setIsMicModalOpen(true);
      setVoiceStatus('IDLE');
      return;
    }

    // Immediately stop tracks to free hardware for SpeechRecognition (especially on Android Chrome)
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });

    // Step 2: Initialize SpeechRecognition (Android Chrome & desktop compatibility)
    try {
      const recognition = new SpeechRecognitionConstructor();
      const isMobile =
        typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      recognition.continuous = !isMobile;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // 1. Clicking the microphone ONLY starts microphone listening.
      // 2. Do NOT send any text, question, empty message, or placeholder to Gemini when the mic starts.
      // 3. Do NOT call the AI model until actual user speech has been detected.
      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus('LISTENING');
        voiceTranscriptRef.current = '';
        hasUserSpokenRef.current = false;
        wasLastInputVoiceRef.current = true;
      };

      // User started speaking into the microphone
      recognition.onspeechstart = () => {
        hasUserSpokenRef.current = true;
        setVoiceStatus('USER_SPEAKING');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const cleaned = transcript.trim();
        // Ignore silence or single accidental noise characters
        if (cleaned.length > 0) {
          hasUserSpokenRef.current = true;
          voiceTranscriptRef.current = cleaned;
          setPrompt(cleaned); // Show exact transcript in the chat input box
          setIsTyping(true);
          setVoiceStatus('USER_SPEAKING');
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          if (isInsideIframe) {
            setMicErrorType('preview_restricted');
          } else {
            setMicErrorType('denied');
          }
          setIsMicModalOpen(true);
        } else if (event.error === 'no-speech') {
          // User said nothing: SILENCE.
          // Gemini must NOT generate an answer.
        } else if (event.error !== 'aborted') {
          console.warn('Speech recognition notice:', event.error);
        }
        setVoiceStatus('IDLE');
        voiceTranscriptRef.current = '';
        hasUserSpokenRef.current = false;
      };

      recognition.onend = () => {
        setIsListening(false);
        const captured = voiceTranscriptRef.current.trim();
        // 9. Gemini must answer ONLY that user's question.
        // 10. If the user says nothing, Gemini must NOT generate an answer.
        if (hasUserSpokenRef.current && captured.length >= 2) {
          setVoiceStatus('PROCESSING');
          voiceTranscriptRef.current = '';
          hasUserSpokenRef.current = false;
          handleSendMessage(undefined, captured);
        } else {
          // Silence or noise only -> transition to IDLE with no message sent
          setVoiceStatus('IDLE');
          voiceTranscriptRef.current = '';
          hasUserSpokenRef.current = false;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (startErr) {
      console.warn('Speech recognition launch error:', startErr);
      stopRecording();
      setVoiceStatus('IDLE');
      if (isInsideIframe) {
        setMicErrorType('preview_restricted');
      } else {
        setMicErrorType('unsupported');
      }
      setIsMicModalOpen(true);
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    if (streamingText) {
      const stoppedMsg: AIMessage = {
        id: `msg_${Date.now()}_stopped_a`,
        conversationId: activeConvId || 'conv_current',
        userId: profile?.userId || user?.id || 'user',
        role: 'assistant',
        content: streamingText + '\n\n*(Generation stopped by student)*',
        studyMode: selectedMode,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => dedupeById([...prev, stoppedMsg]));
      setStreamingText('');
    }
    addToast('Halted', 'AI generation stopped.', 'info');
  };

  // Start a new conversation
  const handleNewConversation = async () => {
    stopSpeech();
    try {
      const res = await api.createConversation({
        title: `Study Session: ${selectedSubject}`,
        subject: selectedSubject,
        mode: selectedMode,
      });
      setConversations((prev) => dedupeById([res.conversation, ...prev]));
      setActiveConvId(res.conversation.id);
      setMessages([]);
      setPrompt('');
      setAttachedDocId('');
      setAttachedFiles([]);
      setIsSidebarOpen(false);
      textareaRef.current?.focus();
    } catch {
      addToast('Error', 'Failed to create new conversation', 'error');
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    stopSpeech();
    try {
      await api.deleteConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        if (remaining.length > 0) {
          setActiveConvId(remaining[0].id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
      addToast('Conversation Deleted', '', 'info');
    } catch {
      addToast('Error', 'Failed to delete conversation', 'error');
    }
  };

  // Handle document file upload from "+" menu
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAttachMenuOpen(false);

    const tempItem: AttachedFileItem = {
      name: file.name,
      size: file.size,
      type: file.type || 'document',
      uploading: true,
    };
    setAttachedFiles([tempItem]);

    try {
      const res = await api.uploadDocument(file, selectedSubject);
      setAttachedDocId(res.document.id);
      setAttachedFiles([
        {
          id: res.document.id,
          name: res.document.fileName,
          size: res.document.fileSize,
          type: res.document.mimeType,
          uploading: false,
        },
      ]);
      setDocuments((prev) => [res.document, ...prev]);
      addToast('Document Attached! 📄', `${file.name} ready for AI study analysis.`, 'success');
    } catch (err: any) {
      console.error('File upload failed:', err);
      setAttachedFiles([]);
      setAttachedDocId('');
      const isQuota = err?.message && err.message.includes('limit');
      if (isQuota) {
        openUpgradeModal('You have reached your document upload limit. Upgrade to Pro for more uploads.');
      } else {
        addToast('Upload Error', err?.message || 'Failed to upload document.', 'error');
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedFiles([]);
    setAttachedDocId('');
    addToast('Attachment Removed', '', 'info');
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent, retryPrompt?: string) => {
    if (e) e.preventDefault();
    handleSendMessageRef.current = handleSendMessage;
    if (isGenerating) return;

    // Stop active speech playback when asking a new question
    stopSpeech();

    // If recording was active, stop recording now
    if (isListening) {
      stopRecording();
    }

    const messageText = (retryPrompt || prompt).trim();
    if (!messageText && attachedFiles.length === 0) {
      setVoiceStatus('IDLE');
      return;
    }

    const textToSend = messageText || `Please analyze and summarize the attached study material: ${attachedFiles[0]?.name}`;
    if (!textToSend.trim()) {
      setVoiceStatus('IDLE');
      return;
    }
    const shouldAutoSpeak = wasLastInputVoiceRef.current || autoSpeakEnabled;

    setErrorState(null);
    if (!retryPrompt) {
      setPrompt('');
      setIsTyping(false);
    }

    let convId = activeConvId;
    if (!convId) {
      try {
        const newC = await api.createConversation({
          title: textToSend.slice(0, 32) + '...',
          subject: selectedSubject,
          mode: selectedMode,
        });
        convId = newC.conversation.id;
        setConversations((prev) => dedupeById([newC.conversation, ...prev]));
        setActiveConvId(convId);
      } catch {
        addToast('Error', 'Could not initialize study session.', 'error');
        setVoiceStatus('IDLE');
        return;
      }
    }

    const tempUserMsg: AIMessage = {
      id: 'temp-' + Date.now(),
      conversationId: convId,
      userId: profile?.userId || user?.id || 'user',
      role: 'user',
      content: textToSend,
      studyMode: selectedMode,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => dedupeById([...prev, tempUserMsg]));
    setStreamingText('');
    setIsGenerating(true);
    if (shouldAutoSpeak) {
      setVoiceStatus('PROCESSING');
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const history = messages
      .filter((m) => !m.id.startsWith('temp-') && m.content && m.content.trim())
      .slice(-10)
      .map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      }));

    const studentLevel = profile?.educationLevel || 'High School / College';
    const studentProfilePayload = {
      name: user?.name,
      educationLevel: studentLevel,
      studyStyle: profile?.studyStyle,
      targetExam: profile?.upcomingExamDate,
      goals: profile?.goals,
      subjects: profile?.subjects,
    };

    try {
      const res = await api.sendChatMessageStream({
        conversationId: convId,
        message: textToSend,
        mode: selectedMode,
        subject: selectedSubject,
        documentId: attachedDocId || undefined,
        history,
        studentProfile: studentProfilePayload,
        enableSearch,
        enableMaps,
        latLng,
        signal: abortController.signal,
        onStart: (data) => {
          if (data.conversationId && data.conversationId !== activeConvId) {
            setActiveConvId(data.conversationId);
          }
        },
        onChunk: (_chunk, accumulated) => {
          setStreamingText(accumulated);
        },
      });

      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => m.id !== tempUserMsg.id && m.id !== res.userMessage.id && m.id !== res.assistantMessage.id
        );
        return dedupeById([...filtered, res.userMessage, res.assistantMessage]);
      });
      setStreamingText('');

      // Automatic spoken response flow
      if (shouldAutoSpeak && res.assistantMessage?.content) {
        speakMessage(res.assistantMessage.id, res.assistantMessage.content);
      } else {
        setVoiceStatus('IDLE');
      }
    } catch (streamErr: any) {
      if (abortController.signal.aborted) {
        setVoiceStatus('IDLE');
        return;
      }

      try {
        const res = await api.sendChatMessage({
          conversationId: convId,
          message: textToSend,
          mode: selectedMode,
          subject: selectedSubject,
          documentId: attachedDocId || undefined,
          history,
          studentProfile: studentProfilePayload,
          enableSearch,
          enableMaps,
          latLng,
        });

        setMessages((prev) => {
          const filtered = prev.filter(
            (m) => m.id !== tempUserMsg.id && m.id !== res.userMessage.id && m.id !== res.assistantMessage.id
          );
          return dedupeById([...filtered, res.userMessage, res.assistantMessage]);
        });
        setStreamingText('');

        if (shouldAutoSpeak && res.assistantMessage?.content) {
          speakMessage(res.assistantMessage.id, res.assistantMessage.content);
        } else {
          setVoiceStatus('IDLE');
        }
      } catch (err: any) {
        setVoiceStatus('IDLE');
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        setStreamingText('');
        const isQuota = err?.message && err.message.includes('Daily AI generation limit reached');
        if (isQuota) {
          openUpgradeModal('You have reached your daily free AI limit. Upgrade to Pro for 100 generations/day.');
        } else {
          const friendlyMsg = err?.message || 'Sorry, the AI tutor could not complete this answer right now. Please try again.';
          setErrorState({
            message: friendlyMsg,
            lastFailedPrompt: textToSend,
          });
          addToast('Tutor Error', 'Could not get AI answer. Please try again.', 'error');
        }
      }
    } finally {
      setIsGenerating(false);
      wasLastInputVoiceRef.current = false;
      abortControllerRef.current = null;
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('Copied to Clipboard', '', 'info');
  };

  const handleSaveAsNote = async (text: string, title: string) => {
    try {
      await api.createNote({
        title: `Tutor Note: ${title.slice(0, 35)}`,
        subject: selectedSubject,
        topic: selectedSubject,
        overview: text.slice(0, 150),
        contentMarkdown: text,
        keyConcepts: [selectedSubject],
        definitions: [],
        importantFacts: [],
        examples: [],
        keyTakeaways: [],
        reviewQuestions: [],
        isFavorite: false,
      });
      addToast('Saved to Study Library! 📚', 'Note created in your personal repository.', 'success');
    } catch {
      addToast('Error', 'Could not save note.', 'error');
    }
  };

  const subjects = profile?.subjects?.length ? profile.subjects : ['General', 'Biology', 'Chemistry', 'Calculus', 'Physics'];

  // Educational Quick Prompts for Welcome Screen
  const quickPrompts = [
    {
      title: 'Explain a Concept',
      desc: 'Deep Socratic breakdown with analogies',
      prompt: `Explain the fundamental mechanisms and principles of ${selectedSubject === 'General' ? 'Cellular Respiration' : selectedSubject} step-by-step.`,
      icon: <BookOpen className="w-4 h-4 text-cyan-400" />,
    },
    {
      title: 'Practice Quiz',
      desc: 'Test your understanding with 3 questions',
      prompt: `Quiz me with 3 high-yield questions on ${selectedSubject === 'General' ? 'Cellular Respiration' : selectedSubject} to test active recall.`,
      icon: <CheckSquare className="w-4 h-4 text-emerald-400" />,
    },
    {
      title: 'Summarize Material',
      desc: 'Executive summary with key takeaways',
      prompt: `Give me an executive summary with core definitions and bullet takeaways for ${selectedSubject === 'General' ? 'Organic Chemistry Reactions' : selectedSubject}.`,
      icon: <FileText className="w-4 h-4 text-purple-400" />,
    },
    {
      title: 'Exam Preparation',
      desc: 'Common pitfalls and trick questions',
      prompt: `What are the most common mistakes, pitfalls, and exam traps students face in ${selectedSubject === 'General' ? 'Calculus Integration' : selectedSubject}?`,
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    },
  ];

  const handleDemoVoice = () => {
    wasLastInputVoiceRef.current = true;
    const demoQuestion = `Can you explain cellular respiration and how ATP is generated step-by-step in ${selectedSubject}?`;
    setPrompt(demoQuestion);
    setVoiceStatus('PROCESSING');
    addToast('Voice Question Simulated 🎙️', 'StudyMate is answering and will read the response aloud.', 'info');
    handleSendMessage(undefined, demoQuestion);
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#07090e] text-slate-100 flex overflow-hidden relative">
      {/* Real-time Gemini Live Modal */}
      <VoiceModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />

      {/* Microphone Permission Flow & Guidance Modal */}
      <MicPermissionModal
        isOpen={isMicModalOpen}
        onClose={() => setIsMicModalOpen(false)}
        onRetry={toggleSpeechRecognition}
        onDemoVoice={handleDemoVoice}
        onTypeInChat={() => {
          setTimeout(() => textareaRef.current?.focus(), 50);
        }}
        errorType={micErrorType}
      />

      {/* Hidden File Input for Document Attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.txt,.md"
        className="hidden"
      />

      {/* Slide-out Sidebar Drawer (Mobile & Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#0c101b] border-r border-slate-800/80 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-white">Study Sessions</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewConversation}
              className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold flex items-center gap-1 transition shadow-sm"
              title="New study chat"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {displayConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No conversations yet. Start a new study chat!
            </div>
          ) : (
            displayConversations.map((c, cIdx) => (
              <div
                key={c.id || `conv-${cIdx}`}
                onClick={() => {
                  setActiveConvId(c.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left cursor-pointer transition flex items-center justify-between group text-xs ${
                  activeConvId === c.id
                    ? 'bg-slate-800/90 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="truncate pr-2">
                  <p className="truncate">{c.title || 'Untitled Session'}</p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">{c.subject}</p>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>AI Voice & Tutor</span>
          </div>
          <span className="text-emerald-400 font-medium">Ready</span>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main AI Tutor Workspace */}
      <main className="flex-1 flex flex-col bg-[#080b12] overflow-hidden relative">
        {/* Soft Ambient Background Gradient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-600/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

        {/* Top Minimal Header (Inspired by reference screenshot) */}
        <header className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800/60 bg-[#080b12]/80 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-3">
            {/* Left Hamburger Drawer Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/60 transition"
              title="Toggle study chats drawer"
              aria-label="Toggle study chats"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Model & Study Mode Dropdown (like 'Flash Extended ▾') */}
            <div className="relative">
              <button
                onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-slate-200 hover:text-white transition px-2 py-1 rounded-xl hover:bg-slate-800/50"
              >
                <span>StudyMate {selectedSubject !== 'General' ? `· ${selectedSubject}` : ''}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isModeDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-[#0e1322] border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Study Focus Mode
                  </div>
                  {STUDY_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setSelectedMode(mode.id);
                        setIsModeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                        selectedMode === mode.id
                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <div>
                        <p>{mode.label}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{mode.desc}</p>
                      </div>
                      {selectedMode === mode.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}

                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Subject
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-1">
                      {subjects.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setSelectedSubject(s);
                            setIsModeDropdownOpen(false);
                          }}
                          className={`px-2 py-1 text-xs rounded-lg text-left truncate transition ${
                            selectedSubject === s
                              ? 'bg-blue-600/30 text-blue-300 font-semibold'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Icons (Voice Toggle, New Chat & User Avatar) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Auto-Speak AI Responses Toggle */}
            <button
              onClick={() => {
                const next = !autoSpeakEnabled;
                setAutoSpeakEnabled(next);
                if (!next) stopSpeech();
                addToast(next ? 'Auto-Voice Enabled 🔊' : 'Voice Muted 🔇', next ? 'AI will speak responses aloud.' : 'AI responses will remain silent.', 'info');
              }}
              className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-medium ${
                autoSpeakEnabled
                  ? 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title={autoSpeakEnabled ? 'Auto-Speak is ON: AI reads answers aloud (Click to mute)' : 'Auto-Speak is OFF: Click to enable voice responses'}
            >
              {autoSpeakEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span className="hidden lg:inline text-[11px]">{autoSpeakEnabled ? 'Voice On' : 'Muted'}</span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={handleNewConversation}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/60 transition"
              title="Start fresh study chat"
              aria-label="New chat"
            >
              <SquarePen className="w-5 h-5" />
            </button>

            {/* User Avatar Circle (matching 'M' badge in reference screenshot) */}
            <div
              onClick={() => navigateTo('account')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-700 to-amber-900 border border-amber-600/40 text-amber-100 flex items-center justify-center font-bold text-xs sm:text-sm cursor-pointer hover:ring-2 hover:ring-cyan-400/50 transition shadow-inner"
              title={`${user?.name || displayName} - Account Settings`}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Global Spoken Answer Floating Bar (when voice is reading an answer aloud) */}
        {isSpeaking && (
          <div className="bg-cyan-950/80 border-b border-cyan-500/30 px-4 py-2 flex items-center justify-between text-xs text-cyan-200 z-20 backdrop-blur-md animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5 h-4">
                <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-medium">
                {isSpeechPaused ? 'Speech paused' : 'StudyMate reading answer aloud...'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {isSpeechPaused ? (
                <button
                  onClick={resumeSpeech}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium flex items-center gap-1"
                  title="Resume speaking"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume
                </button>
              ) : (
                <button
                  onClick={pauseSpeech}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium flex items-center gap-1"
                  title="Pause speaking"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              )}
              <button
                onClick={stopSpeech}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium flex items-center gap-1"
                title="Stop voice output"
              >
                <Square className="w-3 h-3 fill-current" /> Stop
              </button>
            </div>
          </div>
        )}

        {/* Message / Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 z-10 flex flex-col">
          {displayMessages.length === 0 ? (
            /* 1. MAIN WELCOME SCREEN (Directly inspired by reference screenshot) */
            <div className="my-auto max-w-2xl mx-auto w-full flex flex-col items-center justify-center text-center py-6 sm:py-10 animate-in fade-in duration-300">
              {/* Glowing Colorful Star Emblem */}
              <div className="mb-4 sm:mb-6">
                <StudyMateSparkStar className="w-12 h-12 sm:w-14 sm:h-14" />
              </div>

              {/* Dynamic Welcome Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-2 sm:mb-3">
                Ask anything, {displayName}!
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-8 sm:mb-10 leading-relaxed">
                What concept, assignment, or study material can I help you master today in{' '}
                <span className="text-cyan-400 font-medium">{selectedSubject}</span>?
              </p>

              {/* Educational Study Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full text-left max-w-xl">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(qp.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800/80 hover:border-cyan-500/40 transition group flex items-start gap-3 shadow-sm hover:shadow-cyan-500/5"
                  >
                    <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-cyan-500/10 transition shrink-0 mt-0.5">
                      {qp.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition">
                        {qp.title}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{qp.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 5. CONVERSATION STREAM */
            <div className="max-w-3xl sm:max-w-4xl mx-auto w-full space-y-6 pb-6">
              {displayMessages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isMessageSpoken = activeSpokenMessageId === msg.id && isSpeaking;

                return (
                  <div
                    key={msg.id || `msg-${index}`}
                    className={`flex items-start gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="p-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0 mt-1">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 transition shadow-sm ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-sm shadow-blue-500/10'
                          : 'bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-sm'
                      }`}
                    >
                      {/* Attached Document indicator if available */}
                      {isUser && attachedDocId && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-700/60 border border-blue-400/30 text-[11px] font-medium text-blue-100 mb-2">
                          <FileText className="w-3 h-3" />
                          <span>Attached Document</span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="prose prose-invert prose-sm max-w-none text-xs sm:text-sm leading-relaxed break-words">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* AI Tutor Actions on Assistant Messages */}
                      {!isUser && (
                        <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                          <span className="font-semibold text-cyan-400/80 uppercase text-[10px] tracking-wider">
                            {msg.studyMode || selectedMode} mode
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Real Voice Output Play / Pause / Stop button */}
                            {isMessageSpoken ? (
                              <div className="flex items-center gap-1">
                                {isSpeechPaused ? (
                                  <button
                                    onClick={resumeSpeech}
                                    className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition flex items-center gap-1 font-medium text-[11px]"
                                    title="Resume reading answer aloud"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>Resume</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={pauseSpeech}
                                    className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition flex items-center gap-1 font-medium text-[11px]"
                                    title="Pause reading answer aloud"
                                  >
                                    <Pause className="w-3 h-3" />
                                    <span>Pause</span>
                                  </button>
                                )}
                                <button
                                  onClick={stopSpeech}
                                  className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition flex items-center gap-1 font-medium text-[11px]"
                                  title="Stop audio playback"
                                >
                                  <Square className="w-3 h-3 fill-current" />
                                  <span>Stop</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => speakMessage(msg.id, msg.content)}
                                className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition flex items-center gap-1"
                                title="Read answer aloud through speaker"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Listen</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleCopy(msg.content, msg.id)}
                              className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1"
                              title="Copy answer"
                            >
                              {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                              onClick={() => handleSaveAsNote(msg.content, msg.content)}
                              className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1"
                              title="Save as Study Note"
                            >
                              <BookOpen className="w-3 h-3 text-cyan-400" />
                              <span>Save Note</span>
                            </button>

                            <button
                              onClick={() => navigateTo('quizzes', { openCreator: 'true', topic: selectedSubject, subject: selectedSubject })}
                              className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1"
                              title="Generate Quiz"
                            >
                              <CheckSquare className="w-3 h-3 text-amber-400" />
                              <span>Make Quiz</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Thinking state */}
              {isGenerating && !streamingText && (
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <StudymateThinkingCard studyMode={selectedMode} subject={selectedSubject} />
                </div>
              )}

              {/* Streaming state */}
              {isGenerating && streamingText && (
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0 mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <StudymateStreamingCard content={streamingText} studyMode={selectedMode} isStreaming={true} />
                </div>
              )}

              {/* Error state */}
              {errorState && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  <p className="font-semibold mb-1">Notice</p>
                  <p>{errorState.message}</p>
                  {errorState.lastFailedPrompt && (
                    <button
                      onClick={() => handleSendMessage(undefined, errorState.lastFailedPrompt)}
                      className="mt-2 px-3 py-1 rounded-lg bg-rose-600 text-white font-medium flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" /> Retry
                    </button>
                  )}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* 2 & 3 & 4. LARGE FLOATING AI CHAT / QUESTION AREA (Matching reference screenshot) */}
        <div className="p-3 sm:p-5 bg-gradient-to-t from-[#07090e] via-[#07090e]/95 to-transparent shrink-0 z-20">
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl sm:max-w-4xl mx-auto relative flex flex-col"
          >
            {/* Attachment Menu Popover (When '+' clicked) */}
            {isAttachMenuOpen && (
              <div className="absolute bottom-full left-2 mb-3 w-64 bg-[#0e1424] border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Attach Study Material</span>
                  <button onClick={() => setIsAttachMenuOpen(false)} className="text-slate-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = '.pdf';
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">Upload PDF</p>
                      <p className="text-[10px] text-slate-500">Textbooks, slides, papers</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = '.docx,.doc';
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">Upload Word Document</p>
                      <p className="text-[10px] text-slate-500">Notes, essays, assignments</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = '.pptx,.ppt';
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">Upload PowerPoint</p>
                      <p className="text-[10px] text-slate-500">Presentation decks, lecture slides</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = '.png,.jpg,.jpeg,.webp';
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <FileImage className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">Upload Image / Diagram</p>
                      <p className="text-[10px] text-slate-500">Formulas, charts, diagrams</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = '.txt,.md';
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">Upload Text File</p>
                      <p className="text-[10px] text-slate-500">Raw notes, markdown summaries</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Active Attachment Chips (shown above or inside input container) */}
            {attachedFiles.length > 0 && (
              <div className="flex items-center gap-2 mb-2 px-3 overflow-x-auto no-scrollbar">
                {attachedFiles.map((file, fIdx) => (
                  <div
                    key={fIdx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs text-white shadow-sm shrink-0"
                  >
                    {file.uploading ? (
                      <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="p-1 hover:text-rose-400 text-slate-400 transition"
                      title="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Real-time Voice Session Status Ribbon (IDLE -> LISTENING -> USER_SPEAKING -> PROCESSING -> ANSWERING) */}
            {voiceStatus !== 'IDLE' && (
              <div className="mb-2 px-4 py-2 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-xs text-cyan-200 shadow-xl backdrop-blur-md flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                {voiceStatus === 'LISTENING' && (
                  <>
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Listening...</span>
                        <span className="text-cyan-300/80 text-[11px] hidden sm:inline">Waiting for your voice question...</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        stopRecording();
                        voiceTranscriptRef.current = '';
                        hasUserSpokenRef.current = false;
                        setVoiceStatus('IDLE');
                      }}
                      className="px-2.5 py-1 rounded-xl text-slate-400 hover:text-white text-xs transition hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {voiceStatus === 'USER_SPEAKING' && (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-white shrink-0">Capturing Speech...</span>
                        <span className="text-rose-200/90 text-[11px] truncate hidden sm:inline max-w-xs font-mono">
                          {prompt ? `"${prompt}"` : 'Listening to your words...'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={finishRecordingAndSend}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs hover:opacity-95 transition shadow-sm flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Done Speaking
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopRecording();
                          voiceTranscriptRef.current = '';
                          hasUserSpokenRef.current = false;
                          setVoiceStatus('IDLE');
                        }}
                        className="px-2 py-1 rounded-xl text-slate-400 hover:text-white text-xs transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {voiceStatus === 'PROCESSING' && (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="font-semibold text-white">Processing...</span>
                      <span className="text-cyan-300/80 text-[11px] hidden sm:inline">StudyMate AI is analyzing your question</span>
                    </div>
                    <span className="text-[11px] text-cyan-400 font-medium animate-pulse">Generating answer...</span>
                  </>
                )}

                {voiceStatus === 'ANSWERING' && (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-0.5 h-3.5">
                        <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="font-semibold text-white">Answer generated</span>
                      <span className="text-cyan-300/80 text-[11px] hidden sm:inline">Speaking response aloud</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isSpeechPaused ? (
                        <button
                          type="button"
                          onClick={resumeSpeech}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium flex items-center gap-1 text-xs"
                          title="Resume speaking"
                        >
                          <Play className="w-3 h-3 fill-current" /> Resume
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={pauseSpeech}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium flex items-center gap-1 text-xs"
                          title="Pause speaking"
                        >
                          <Pause className="w-3 h-3" /> Pause
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopSpeech}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium flex items-center gap-1 text-xs"
                        title="Stop speaking"
                      >
                        <Square className="w-3 h-3 fill-current" /> Stop
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Main Rounded Input Box (Large pill shape inspired by reference screenshot) */}
            <div
              className={`w-full bg-[#101625]/95 border rounded-[30px] p-2 sm:p-2.5 flex items-center gap-2 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.6)] ${
                isTyping || isListening
                  ? 'border-cyan-400/70 shadow-[0_0_25px_rgba(56,189,248,0.2)]'
                  : 'border-slate-700/60 focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20'
              }`}
            >
              {/* Plus (+) Button on the Left */}
              <button
                type="button"
                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 ${
                  isAttachMenuOpen
                    ? 'bg-cyan-500/20 text-cyan-300 rotate-45'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Attach PDF, Word, PowerPoint, or Image"
                aria-label="Add attachment"
              >
                <Plus className="w-5 h-5 transition-transform" />
              </button>

              {/* Multi-line Question Input */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                disabled={isGenerating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isGenerating && (prompt.trim() || attachedFiles.length > 0)) {
                      handleSendMessage();
                    }
                  }
                }}
                placeholder={
                  voiceStatus === 'LISTENING'
                    ? '🎙️ Listening... waiting for you to speak...'
                    : voiceStatus === 'USER_SPEAKING'
                    ? '🎙️ Capturing speech: speak clearly...'
                    : isGenerating
                    ? 'StudyMate is crafting your explanation...'
                    : `Ask StudyMate in ${selectedSubject}...`
                }
                className="flex-1 bg-transparent text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none resize-none px-2 py-2 max-h-36 disabled:opacity-60 leading-relaxed font-normal"
              />

              {/* Right Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pr-1">
                {/* Speech-to-Text Microphone Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title={isListening ? 'Click to stop listening' : 'Dictate question (Speech to Text)'}
                  aria-label="Voice input"
                >
                  <Mic className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>

                {/* Gemini Live Real-Time Voice Tutor Button (Soundwave pill, matching screenshot) */}
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center gap-1 transition group shadow-sm"
                  title="Start live duplex voice conversation (Gemini Live API)"
                  aria-label="Live Voice Tutor"
                >
                  <div className="flex items-center gap-0.5 h-3.5">
                    <span className="w-0.5 h-3 bg-cyan-400 rounded-full group-hover:animate-pulse" />
                    <span className="w-0.5 h-4 bg-cyan-400 rounded-full group-hover:animate-pulse" />
                    <span className="w-0.5 h-2 bg-cyan-400 rounded-full group-hover:animate-pulse" />
                  </div>
                  <Headphones className="w-3.5 h-3.5 hidden sm:inline ml-0.5 opacity-80" />
                </button>

                {/* Clear Send or Stop Action */}
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center shadow-md shadow-rose-600/30"
                    title="Stop generating"
                    aria-label="Stop generation"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!prompt.trim() && attachedFiles.length === 0}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition ${
                      prompt.trim() || attachedFiles.length > 0
                        ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 hover:opacity-95 shadow-md shadow-cyan-500/25 cursor-pointer'
                        : 'text-slate-600 cursor-not-allowed hover:bg-transparent'
                    }`}
                    title="Send question"
                    aria-label="Send question"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Subtle Ribbon: Grounding Toggles, Voice Status & Keyboard Tip */}
            <div className="flex items-center justify-between px-3 pt-2 text-[11px] text-slate-500 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Search Grounding */}
                <button
                  type="button"
                  onClick={() => setEnableSearch(!enableSearch)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition text-[10px] font-medium ${
                    enableSearch
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Search the web for up-to-date academic sources"
                >
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>Google Search {enableSearch && '✓'}</span>
                </button>

                {/* Maps Grounding */}
                <button
                  type="button"
                  onClick={() => {
                    if (!enableMaps) {
                      setEnableMaps(true);
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setLatLng({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                            addToast('Maps Grounding Active', 'Using location for campus queries.', 'success');
                          },
                          () => addToast('Maps Grounding Active', 'Using default region.', 'info')
                        );
                      }
                    } else {
                      setEnableMaps(false);
                    }
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition text-[10px] font-medium ${
                    enableMaps
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Enable location-aware study queries"
                >
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Maps {enableMaps && '✓'}</span>
                </button>

                {/* Voice Output Status Indicator */}
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {autoSpeakEnabled ? 'Voice responses on' : 'Voice muted'}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-slate-500 text-[10px]">
                <span>Shift + Enter for new line</span>
                <span>•</span>
                <span>Enter to ask</span>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
