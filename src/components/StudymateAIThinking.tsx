import React, { useEffect, useState } from 'react';
import { Sparkles, Compass, Lightbulb, BookOpen, Layers, Cpu, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * Studymate AI Core Visual Avatar
 * A unique concentric academic synthesis nexus with breathing pulse and rotating flowing light ring.
 */
export const StudymateAIAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  isThinking?: boolean;
  className?: string;
}> = ({ size = 'md', isThinking = false, className = '' }) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const ringInset = {
    sm: 'p-[1.5px]',
    md: 'p-[2px]',
    lg: 'p-[2.5px]',
  };

  return (
    <div
      className={`relative rounded-2xl flex items-center justify-center select-none shrink-0 ${sizeMap[size]} ${className}`}
      aria-label="StudyMat AI Companion"
    >
      {/* Outer Ambient Glow Aura */}
      {isThinking && (
        <div className="absolute inset-0 rounded-2xl bg-cyan-500/30 blur-lg animate-pulse pointer-events-none" />
      )}

      {/* Outer Flowing Conic Light Ring */}
      <div
        className={`absolute inset-0 rounded-2xl ${ringInset[size]} overflow-hidden ${
          isThinking ? 'animate-spin' : ''
        }`}
        style={{
          animationDuration: '6s',
          background: isThinking
            ? 'conic-gradient(from 0deg, #38bdf8, #6366f1, #3b82f6, #a855f7, #38bdf8)'
            : 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #6366f1 100%)',
        }}
      >
        <div className="w-full h-full rounded-[14px] bg-slate-950" />
      </div>

      {/* Inner Breathing Core */}
      <div
        className={`relative z-10 w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-[13px] bg-gradient-to-br from-slate-900 via-slate-950 to-[#07090e] flex items-center justify-center border border-white/15 shadow-inner ${
          isThinking ? 'animate-pulse' : ''
        }`}
      >
        <svg
          className="w-1/2 h-1/2 text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="6" r="2.2" fill="currentColor" />
          <circle cx="6" cy="17" r="2.2" fill="currentColor" />
          <circle cx="18" cy="17" r="2.2" fill="currentColor" />
          <path d="M12 8.2v3.6M7.8 15.5l2.7-2.3M16.2 15.5l-2.7-2.3" stroke="rgba(147,197,253,0.9)" strokeWidth="1.8" />
          <circle cx="12" cy="13.2" r="1.4" fill="#38bdf8" />
        </svg>
      </div>
    </div>
  );
};

/**
 * Studymate AI Thinking State Visual
 * A clean, minimal, and professional cognitive pulse indicator.
 */
export const StudymateThinkingCard: React.FC<{
  studyMode?: string;
  subject?: string;
}> = ({ studyMode = 'explain', subject = 'General' }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  const stages = [
    'Synthesizing pedagogical concepts...',
    'Structuring explanation & analogies...',
    'Applying active learning logic...',
    'Formatting high-yield takeaways...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % stages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [stages.length]);

  return (
    <div
      className="flex justify-start w-full transition-all duration-300 ease-out py-2"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md shadow-lg">
        <StudymateAIAvatar size="sm" isThinking={true} />
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-white tracking-wide">StudyMat Tutor</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs text-cyan-300 font-medium animate-pulse">{stages[phaseIndex]}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Studymate Live Streaming Answer Card
 * Polished glassmorphic container with glowing left accent bar and smooth cursor.
 */
export const StudymateStreamingCard: React.FC<{
  content: string;
  studyMode?: string;
  isStreaming?: boolean;
}> = ({ content, studyMode = 'explain', isStreaming = true }) => {
  return (
    <div className="flex justify-start w-full">
      <div className="max-w-2xl sm:max-w-3xl w-full rounded-3xl p-5 sm:p-6 shadow-xl bg-slate-900/95 border border-slate-800/90 text-slate-200 rounded-bl-sm backdrop-blur-xl relative overflow-hidden">
        {/* Subtle left glow indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-500" />

        {/* Header with Active AI Avatar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2.5">
            <StudymateAIAvatar size="sm" isThinking={isStreaming} />
            <span className="font-bold text-white tracking-wide">
              StudyMat Socratic Tutor
            </span>
            {isStreaming && (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-cyan-300 font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Synthesizing response...
              </span>
            )}
          </div>
          <span className="text-slate-500 text-[11px]">Just now</span>
        </div>

        {/* Content Rendering with Live Cursor */}
        <div className="text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none break-words relative">
          <ReactMarkdown>{content}</ReactMarkdown>
          {isStreaming && (
            <span
              className="inline-block w-2.5 h-4 ml-1 rounded-xs bg-gradient-to-b from-cyan-400 to-blue-500 animate-studymate-cursor align-middle shadow-[0_0_10px_rgba(56,189,248,0.9)]"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Animated Typing & Cursor Effect for the input container
 */
export const StudymateTypingBadge: React.FC<{
  isTyping: boolean;
  charCount: number;
}> = ({ isTyping, charCount }) => {
  if (!isTyping && charCount === 0) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300 ${
        isTyping
          ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm'
          : 'bg-slate-900 border border-slate-800 text-slate-400'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isTyping ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'
        }`}
      />
      <span>{isTyping ? 'Drafting query...' : `${charCount} chars`}</span>
    </div>
  );
};
