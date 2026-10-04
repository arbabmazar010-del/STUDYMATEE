import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  MessageSquare,
  BookOpen,
  CheckSquare,
  Layers,
  Calendar,
  FileText,
  BarChart3,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const { navigateTo, isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState<'tutor' | 'notes' | 'quizzes' | 'flashcards' | 'planner' | 'docs'>('tutor');

  const featureTabs = [
    { id: 'tutor', label: 'AI Socratic Tutor', icon: MessageSquare },
    { id: 'notes', label: 'Master Notes', icon: BookOpen },
    { id: 'quizzes', label: 'Adaptive Quizzes', icon: CheckSquare },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'planner', label: 'Exam Planner', icon: Calendar },
    { id: 'docs', label: 'PDF & Document OCR', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Capabilities & Pedagogy
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for Deeper Understanding
          </h1>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            StudyMat blends frontier artificial intelligence with proven cognitive science principles: active recall, spaced repetition, and Socratic inquiry.
          </p>
        </div>

        {/* Interactive Feature Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {featureTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feature Detail Showcase Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 mb-16 shadow-2xl">
          {activeTab === 'tutor' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Multi-Mode Pedagogy</span>
                <h3 className="text-2xl font-bold text-white mt-1">Socratic AI Tutor with 7 Study Modes</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                  Unlike generic chatbots that simply dump answers, StudyMat acts as a patient academic tutor. Select your preferred mode depending on whether you need a conceptual overview, an exam-style drill, or a simplified breakdown.
                </p>
                <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span><strong>Explain Mode:</strong> Deep conceptual intuition with vivid real-world analogies.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span><strong>Simplify (ELI5):</strong> Jargon-free explanations for introductory students.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span><strong>Step-by-Step:</strong> Methodical problem breakdown without skipping calculations.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span><strong>Quiz Me:</strong> Socratic questioning that forces you to explain back concepts.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span><strong>Exam Prep:</strong> Grading rubric secrets, trick questions, and test traps.</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={() => navigateTo('ai-tutor')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide shadow-md flex items-center gap-2"
                  >
                    <span>Launch AI Tutor</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 font-mono text-xs text-slate-300 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-500">
                  <span>AI Tutor Workspace</span>
                  <span className="text-blue-400">Mode: QUIZ ME</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-slate-200">
                  <strong>Student:</strong> "I always mix up SN1 and SN2 reaction solvents."
                </div>
                <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-lg text-blue-200 leading-relaxed font-sans text-xs">
                  <strong>StudyMat Tutor:</strong> "Let's test this intuitively! In an SN2 reaction, the nucleophile must attack directly in one quick step. If you surround that nucleophile with protic hydrogen-bonding water molecules, what happens to its attack speed?"
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Recall Outlines</span>
                <h3 className="text-2xl font-bold text-white mt-1">Master Study Note Generator</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                  Turn sprawling lecture slides or textbook excerpts into structured, high-yield revision notes. StudyMat automatically extracts core definitions, formulas, and tests your understanding with built-in review questions.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Executive Overview & Key Concept Pillars</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Strict Academic Terminology & Definitions Dictionary</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Mathematical Formulas, Governing Laws, and Boundary Conditions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Active Recall Review Questions for post-reading evaluation</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={() => navigateTo('library')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-md flex items-center gap-2"
                  >
                    <span>Generate Notes in Library</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 text-xs text-slate-300 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white">Calculus: Fundamental Theorem</span>
                  <span className="text-emerald-400 font-semibold">Structured Note</span>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">1. Definitions:</p>
                  <p className="text-slate-400 pl-2 border-l-2 border-emerald-500">
                    <strong>Antiderivative:</strong> A function F whose derivative equals f on an open interval I.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">2. Governing Equation:</p>
                  <div className="p-2 bg-slate-900 rounded font-mono text-emerald-300 text-center">
                    ∫[a, b] f(x) dx = F(b) - F(a)
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Exam Simulation</span>
                <h3 className="text-2xl font-bold text-white mt-1">Adaptive Diagnostic Quizzes</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                  Active testing is proven to produce 3x higher retention than passive reading. StudyMat generates tailored quizzes from any topic, subject, or uploaded PDF file with instant diagnostic scoring.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Multiple Choice, True/False, and Short Answer question types</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Configurable difficulty levels: Easy, Medium, and Exam-Hard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Detailed pedagogical explanations for correct and incorrect choices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Real-time score calculation, XP gamification, and error tracking</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={() => navigateTo('quizzes')}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs tracking-wide shadow-md flex items-center gap-2"
                  >
                    <span>Try Practice Quizzes</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 text-xs text-slate-300 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white">Question 3 of 5</span>
                  <span className="text-amber-400 font-mono">Timer: 01:45</span>
                </div>
                <p className="font-semibold text-slate-200">
                  In photosynthesis, where do the light-independent reactions (Calvin Cycle) take place?
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300">A) Thylakoid lumen</div>
                  <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 font-semibold">
                    B) Chloroplast stroma ✓
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300">C) Mitochondrial matrix</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Spaced Repetition</span>
                <h3 className="text-2xl font-bold text-white mt-1">Smart Active Recall Flashcards</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                  Study decks with smooth 3D flip card interactions. Rate each card as "Mastered" or "Need Review" to optimize retention and beat the Ebbinghaus forgetting curve.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Instant AI Deck generation from notes, topics, or PDF chapters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Interactive 3D card flip with keyboard shortcuts (Space / Click)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Mastery progress tracking across every subject deck</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={() => navigateTo('flashcards')}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wide shadow-md flex items-center gap-2"
                  >
                    <span>Practice Flashcards</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Card 2 of 10 • Front</span>
                <p className="text-base font-bold text-white">What is the rate-limiting enzyme of Glycolysis?</p>
                <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 italic">
                  [Click to Flip for Answer]
                </div>
              </div>
            </div>
          )}

          {activeTab === 'planner' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Exam Roadmap</span>
                <h3 className="text-2xl font-bold text-white mt-1">Personalized Weekly Study Planner</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                  Tell StudyMat your target exam dates and daily study bandwidth. It automatically synthesizes a manageable 7-day schedule with daily tasks, durations, and subject rotations.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400" />
                    <span>Automated weekly task schedule generated in 1 click</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400" />
                    <span>Interactive task completion checklist that awards study XP</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400" />
                    <span>Add custom personal tasks and adjust target durations</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={() => navigateTo('study-planner')}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs tracking-wide shadow-md flex items-center gap-2"
                  >
                    <span>Build Your Study Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 text-xs text-slate-300 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-white font-bold">
                  <span>Weekly Target: 10 Hours</span>
                  <span className="text-rose-400 font-semibold">Today's Focus</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-blue-400 font-semibold">Organic Chemistry</span>
                    <p className="text-white">SN1 & SN2 Stereochemistry Drills</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">35 mins</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-semibold">Molecular Biology</span>
                    <p className="text-white">Krebs Cycle Regulation Review</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">45 mins</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Document Intelligence</span>
                <h3 className="text-2xl font-bold text-white mt-1">PDF & Lecture Notes Ingestion</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                  Upload PDF slide decks, research papers, or markdown lecture notes. StudyMat extracts full text and allows you to interrogate documents with AI Q&A, generate summaries, and build instant quizzes.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span>Upload PDFs, Markdown files, and TXT documents up to 15MB</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span>Extract key concepts and generate 5 styles of summaries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span>Ground AI Tutor answers directly in your professor's lecture slides</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={() => navigateTo('library')}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs tracking-wide shadow-md flex items-center gap-2"
                  >
                    <span>Upload Documents in Library</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 text-center space-y-3">
                <FileText className="w-10 h-10 text-sky-400 mx-auto" />
                <p className="text-sm font-bold text-white">Lecture_Slides_Week_4.pdf</p>
                <p className="text-xs text-slate-400">Parsed 28 pages • Ready for AI Q&A and Quiz generation</p>
                <div className="inline-flex gap-2 pt-2">
                  <span className="px-2.5 py-1 bg-slate-800 rounded text-[11px] text-slate-300 font-semibold">1-Click Summarize</span>
                  <span className="px-2.5 py-1 bg-blue-600/30 text-blue-300 rounded text-[11px] font-semibold">Make 10-Q Quiz</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
