import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  BrainCircuit,
  ShieldCheck,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <GraduationCap className="w-3.5 h-3.5" /> Pedagogical Philosophy
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How Cognitive Science Powers StudyMat
          </h1>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Most study tools encourage passive cramming—highlighting text and re-reading notes until illusions of competence appear. StudyMat is built from ground up around cognitive science research.
          </p>
        </div>

        {/* 4 Cognitive Science Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center mb-4 font-bold">
              01
            </div>
            <h3 className="text-lg font-bold text-white">Active Recall (Retrieval Practice)</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Decades of psychological research (Roediger & Karpicke, 2006) demonstrate that testing yourself produces significantly greater long-term retention than repeated study sessions. When your brain actively retrieves a fact or solves a problem from memory, neural connections are reinforced. StudyMat enforces retrieval practice via adaptive quizzes and flashcards.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center mb-4 font-bold">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Ebbinghaus Spaced Repetition</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Without review, humans forget up to 70% of new information within 24 hours. Spaced repetition interrupts this natural decay curve by scheduling reviews at mathematically expanding intervals. StudyMat organizes your review decks and daily schedule to present concepts right before you forget them.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mb-4 font-bold">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Socratic Inquiry (The Feynman Technique)</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Richard Feynman taught that if you cannot explain a concept in plain terms without jargon, you do not truly understand it. StudyMat's Socratic AI Tutor doesn't simply give away homework answers; it asks guiding questions that reveal misconceptions and prompt you to construct the solution yourself.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center mb-4 font-bold">
              04
            </div>
            <h3 className="text-lg font-bold text-white">Interleaving & Metacognitive Feedback</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Blocking single topics creates false confidence. Mixing different subjects and question types (interleaving) trains your brain to discriminate between problem archetypes. StudyMat's diagnostic analytics track mistake frequency and error types to provide truthful metacognitive feedback.
            </p>
          </div>
        </div>

        {/* Academic Integrity & Honor Code */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">StudyMat Academic Integrity & Honor Code</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            StudyMat is engineered as a cognitive amplifier, not an automated cheating shortcut. We adhere strictly to institutional honor codes:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-5 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>We teach methodology and underlying theorems rather than simply outputting answer keys.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Student lecture uploads and private notes are completely isolated and never exposed to other users.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Diagnostic testing helps students locate genuine weaknesses prior to invigilated exams.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Every AI response is grounded in factual curriculum textbooks and scientific consensus.</span>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center">
          <button
            onClick={() => navigateTo('signup')}
            className="px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition"
          >
            Join StudyMat Today
          </button>
        </div>
      </div>
    </div>
  );
};
