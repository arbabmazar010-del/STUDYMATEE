import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  MessageSquare,
  BookOpen,
  CheckSquare,
  Layers,
  Calendar,
  BarChart3,
  ShieldCheck,
  BrainCircuit,
  FileText,
  Clock,
  Zap,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigateTo, isAuthenticated, demoLogin } = useApp();

  // Interactive Live Demo preview
  const [demoTopic, setDemoTopic] = useState('Cellular Respiration');
  const [demoMode, setDemoMode] = useState<'explain' | 'quiz' | 'flashcard'>('explain');

  const demoExamples = [
    { name: 'Cellular Respiration', subject: 'Biology' },
    { name: 'Taylor Series & Limits', subject: 'Calculus' },
    { name: 'Supply & Demand Shifts', subject: 'Economics' },
    { name: 'SN2 Reaction Mechanisms', subject: 'Chemistry' },
  ];

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden border-b border-slate-800/80">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack AI Study Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Master Any Subject with Your Personalized{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">
                AI Study Companion
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Understand complex textbooks, generate structured active-recall notes, practice adaptive quizzes with diagnostic error tracking, and prepare for high-stakes exams.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
                >
                  <span>Go to Study Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigateTo('signup')}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
                  >
                    <span>Start Studying Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => demoLogin('pro')}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>Try Pro Scholar Demo</span>
                  </button>
                </>
              )}
            </div>

            {/* Academic Credibility Badges */}
            <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Grounded in Active Recall
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" /> Socratic Learning Modes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Spaced Repetition Scheduling
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> Isolated User Libraries
              </span>
            </div>
          </div>

          {/* Interactive Live Demo Preview Box */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl p-5 md:p-7 backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5" /> Interactive Study Sandbox
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">Experience StudyMat in Action</h3>
              </div>

              {/* Mode switch pills */}
              <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  onClick={() => setDemoMode('explain')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    demoMode === 'explain' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Socratic Explanation
                </button>
                <button
                  onClick={() => setDemoMode('quiz')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    demoMode === 'quiz' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Practice Quiz
                </button>
                <button
                  onClick={() => setDemoMode('flashcard')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    demoMode === 'flashcard' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Active Recall Card
                </button>
              </div>
            </div>

            {/* Quick Topic Chips */}
            <div className="flex flex-wrap items-center gap-2 py-3 text-xs">
              <span className="text-slate-400 font-medium">Select Topic:</span>
              {demoExamples.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => setDemoTopic(ex.name)}
                  className={`px-2.5 py-1 rounded-lg border transition ${
                    demoTopic === ex.name
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 font-semibold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {ex.name} <span className="text-slate-400 font-normal">({ex.subject})</span>
                </button>
              ))}
            </div>

            {/* Dynamic Output Box */}
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5 mt-2 text-sm leading-relaxed text-slate-200">
              {demoMode === 'explain' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>StudyMat Socratic Breakdown: {demoTopic}</span>
                  </div>
                  <p className="text-slate-300">
                    {demoTopic === 'Cellular Respiration' &&
                      'Cellular respiration is the biochemical mechanism by which cells convert biochemical energy from glucose into ATP, and then release waste products. It operates across three distinct stages: Glycolysis (cytoplasm), Krebs Cycle (mitochondrial matrix), and Oxidative Phosphorylation (inner membrane). The electrochemical proton gradient created across the inner mitochondrial membrane powers ATP synthase via chemiosmosis.'}
                    {demoTopic === 'Taylor Series & Limits' &&
                      'A Taylor series represents a differentiable function as an infinite sum of polynomial terms evaluated at a single center point a. By matching higher-order derivatives (f(a), f’(a), f’’(a)...), polynomial approximations like Maclaurin expansions allow analytical solutions to differential equations and rapid asymptotic limit evaluations.'}
                    {demoTopic === 'Supply & Demand Shifts' &&
                      'Market equilibrium occurs where quantity supplied equals quantity demanded at price P*. An exogenous increase in production costs causes an upward/leftward supply shift, raising equilibrium price and lowering equilibrium quantity. Distinguish carefully between shifts in the whole curve versus movements along the curve caused solely by price changes.'}
                    {demoTopic === 'SN2 Reaction Mechanisms' &&
                      'An SN2 reaction is a bimolecular nucleophilic substitution where bond-making and bond-breaking occur simultaneously in a single concerted step. The nucleophile attacks the electrophilic carbon from 180° opposite the leaving group, causing a mandatory complete inversion of stereochemical configuration (Walden Inversion).'}
                  </p>
                  <div className="p-3 bg-blue-950/20 rounded-lg border border-blue-900/40 text-xs text-blue-200 flex items-center justify-between">
                    <span>💡 High-Yield Exam Tip: Always verify boundary conditions and check conservation laws.</span>
                    <button
                      onClick={() => navigateTo('ai-tutor')}
                      className="font-bold underline hover:text-white flex items-center gap-1 shrink-0 ml-2"
                    >
                      Ask AI Tutor <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {demoMode === 'quiz' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-amber-400 flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" /> Sample Diagnostic Question
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">Medium Difficulty</span>
                  </div>
                  <p className="font-semibold text-white">
                    {demoTopic === 'Cellular Respiration' &&
                      'Which component of the electron transport chain receives electrons directly from FADH2 without pumping protons into the intermembrane space?'}
                    {demoTopic === 'Taylor Series & Limits' &&
                      'What is the third non-zero term of the Maclaurin expansion of sin(x)?'}
                    {demoTopic === 'Supply & Demand Shifts' &&
                      'If consumer income falls and the equilibrium price of good X increases, good X is categorized as:'}
                    {demoTopic === 'SN2 Reaction Mechanisms' &&
                      'Which of the following solvents produces the highest reaction rate for an SN2 substitution?'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-blue-500/50 cursor-pointer">
                      A) {demoTopic === 'Cellular Respiration' ? 'Complex I' : demoTopic === 'Taylor Series & Limits' ? 'x^3 / 6' : demoTopic === 'Supply & Demand Shifts' ? 'Normal Good' : 'Ethanol (Polar Protic)'}
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/50 text-emerald-200 font-semibold cursor-pointer">
                      B) {demoTopic === 'Cellular Respiration' ? 'Complex II (Succinate Dehydrogenase) ✓' : demoTopic === 'Taylor Series & Limits' ? 'x^5 / 120 ✓' : demoTopic === 'Supply & Demand Shifts' ? 'Inferior Good ✓' : 'Acetone (Polar Aprotic) ✓'}
                    </div>
                  </div>
                </div>
              )}

              {demoMode === 'flashcard' && (
                <div className="p-6 rounded-xl bg-slate-900 border border-slate-700/80 text-center space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Active Recall Card</span>
                  <p className="text-base font-bold text-white">
                    {demoTopic === 'Cellular Respiration' && 'What is the theoretical yield of ATP generated per glucose molecule under aerobic respiration in eukaryotic cells?'}
                    {demoTopic === 'Taylor Series & Limits' && 'State the formula for the nth derivative term in a Taylor series centered at x = a.'}
                    {demoTopic === 'Supply & Demand Shifts' && 'How does a price ceiling set below the equilibrium price affect consumer surplus and deadweight loss?'}
                    {demoTopic === 'SN2 Reaction Mechanisms' && 'Why do tertiary haloalkanes fail to react via an SN2 mechanism?'}
                  </p>
                  <p className="text-xs text-slate-400 italic pt-2">Click below or enter StudyMat to flip card and test active recall.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Functional Modules Bento Grid */}
      <section className="py-20 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Complete Study Ecosystem</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
              Everything You Need to Ace Your Exams
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Integrated study tools designed around cognitive science principles to eliminate passive reading and maximize retention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: AI Socratic Tutor */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Socratic Tutor</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Chat with an intelligent tutor equipped with 7 pedagogical study modes: Explain, Simplify, Step-by-Step, Quiz Me, Summarize, Exam Prep, and Practice Drills.
              </p>
              <button
                onClick={() => navigateTo('ai-tutor')}
                className="mt-4 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Launch Tutor <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Structured Notes Generator */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Master Note Generator</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Generate structured, revision-ready notes formatted with Overview, Key Concepts, Terminology Definitions, Formulas, Real Examples, and Review Questions.
              </p>
              <button
                onClick={() => navigateTo('library')}
                className="mt-4 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Explore Notes <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Adaptive Quizzes */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Adaptive Practice Quizzes</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Practice multiple-choice, true/false, and short answer questions with detailed explanations for every option and automated scoring with XP rewards.
              </p>
              <button
                onClick={() => navigateTo('quizzes')}
                className="mt-4 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Take a Quiz <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 4: Flashcards */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Spaced Repetition Decks</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Study with 3D flip cards organizing your subjects. Mark items as "Mastered" or "Need Review" to optimize your cognitive recall curve.
              </p>
              <button
                onClick={() => navigateTo('flashcards')}
                className="mt-4 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                Study Decks <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 5: AI Study Planner */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Exam Planner</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Feed in your exam date and daily available hours. StudyMat calculates a balanced weekly task schedule distributed evenly across your courses.
              </p>
              <button
                onClick={() => navigateTo('study-planner')}
                className="mt-4 text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                Plan Schedule <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 6: Diagnostic Analytics */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Weak Topic Diagnostics</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                StudyMat tracks every quiz mistake and pinpoints your vulnerable conceptual topics before test day, prescribing focused mini-drills.
              </p>
              <button
                onClick={() => navigateTo('progress')}
                className="mt-4 text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                View Analytics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The 3-Step Active Learning Cycle */}
      <section className="py-20 bg-[#0c0f17] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Pedagogical Workflow</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-2">
              From Raw Confusion to Exam Mastery
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Transform passive reading into permanent retention with a 3-step cognitive loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative">
              <span className="text-3xl font-black text-blue-500/30">01</span>
              <h3 className="text-lg font-bold text-white mt-2">Ingest & Synthesize</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Upload lecture slide PDFs, textbook chapters, or prompt any difficult topic. StudyMat parses the material and generates clean, structured study outlines.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative">
              <span className="text-3xl font-black text-indigo-500/30">02</span>
              <h3 className="text-lg font-bold text-white mt-2">Active Recall Drills</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Rather than re-reading notes, generate adaptive quizzes and flashcards. Force your brain to retrieve knowledge, cementing synaptic pathways.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative">
              <span className="text-3xl font-black text-emerald-500/30">03</span>
              <h3 className="text-lg font-bold text-white mt-2">Target Weak Spots</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Review your mastery diagnostic dashboard. StudyMat highlights topics with high error rates, automatically scheduling targeted practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-b from-[#0c0f17] to-slate-950 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-900/30 via-slate-900 to-indigo-950/30 border border-blue-500/30 shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Start Studying Better Today
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Transform Your Study Habits?
            </h2>
            <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Join thousands of students who study smarter, memorize faster, and walk into midterm and final exams with complete confidence.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigateTo('signup')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition"
              >
                Create Free Account
              </button>
              <button
                onClick={() => demoLogin('pro')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 transition"
              >
                Instant Pro Demo
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
