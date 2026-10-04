import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Check,
  Target,
  BrainCircuit,
  Compass,
} from 'lucide-react';

const EDUCATION_LEVELS = [
  'High School (AP / IB / SAT)',
  'Undergraduate (College / University)',
  'Graduate (Master’s / Ph.D.)',
  'Pre-Med / Medical Student',
  'Law Student',
  'Professional / Lifelong Learner',
];

const AVAILABLE_SUBJECTS = [
  'Biology & Physiology',
  'General & Organic Chemistry',
  'Calculus & Linear Algebra',
  'Physics & Mechanics',
  'Computer Science & Algorithms',
  'Economics & Micro/Macro',
  'World History & Politics',
  'Psychology & Neuroscience',
  'Business & Finance',
  'English Literature',
];

const STUDY_STYLES = [
  { id: 'socratic', title: 'Socratic Dialogue', desc: 'Active questioning that leads you toward intuition' },
  { id: 'feynman', title: 'Feynman Technique', desc: 'Distill concepts into ultra-simple analogies' },
  { id: 'active-recall', title: 'Drill & Active Recall', desc: 'Frequent testing, practice problems, and flashcards' },
  { id: 'step-by-step', title: 'Step-by-Step Derivations', desc: 'Never skip math or logical steps in proofs' },
];

export const OnboardingPage: React.FC = () => {
  const { profile, updateProfile, navigateTo, addToast } = useApp();

  const [step, setStep] = useState(1);
  const [educationLevel, setEducationLevel] = useState(profile?.educationLevel || EDUCATION_LEVELS[1]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(profile?.subjects?.length ? profile.subjects : ['Biology & Physiology', 'General & Organic Chemistry']);
  const [primaryGoal, setPrimaryGoal] = useState(profile?.goals?.[0] || 'Score High on Final Exams');
  const [studyStyle, setStudyStyle] = useState(profile?.studyStyle || 'socratic');
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(profile?.dailyTargetMinutes || 45);
  const [upcomingExamDate, setUpcomingExamDate] = useState(profile?.upcomingExamDate || '2026-11-20');
  const [isSaving, setIsSaving] = useState(false);

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        educationLevel,
        subjects: selectedSubjects,
        goals: [primaryGoal],
        studyStyle,
        dailyTargetMinutes,
        upcomingExamDate,
      });
      addToast('Onboarding Completed! 🚀', 'Your personalized academic dashboard is calibrated.', 'success');
      navigateTo('dashboard');
    } catch {
      addToast('Error', 'Failed to save preferences.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        {/* Step Counter Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {step}
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Step {step} of 4: Personalized Academic Calibration
            </span>
          </div>
          <button
            onClick={() => navigateTo('dashboard')}
            className="text-xs text-slate-500 hover:text-slate-300 font-semibold"
          >
            Skip for now
          </button>
        </div>

        {/* Step 1: Education Level & Main Goal */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white">What is your current academic stage?</h2>
              <p className="text-xs text-slate-400 mt-1">
                StudyMat adjusts vocabulary depth and exam rigor to match your coursework level.
              </p>
            </div>

            <div className="grid gap-2.5">
              {EDUCATION_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEducationLevel(level)}
                  className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between ${
                    educationLevel === level
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{level}</span>
                  {educationLevel === level && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">What is your primary milestone right now?</label>
              <input
                type="text"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                placeholder="e.g. Master Organic Chemistry II, MCAT Prep, GPA Boost..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <span>Continue</span> <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Subject Focus Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Select your primary subjects</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose the disciplines you want StudyMat to index, organize notes for, and generate practice drills.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {AVAILABLE_SUBJECTS.map((sub) => {
                const isSelected = selectedSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{sub}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <span>Continue</span> <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pedagogy & Socratic Style */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white">How do you learn best?</h2>
              <p className="text-xs text-slate-400 mt-1">
                Select your preferred tutoring personality and pedagogical framework.
              </p>
            </div>

            <div className="grid gap-3">
              {STUDY_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStudyStyle(st.id)}
                  className={`p-4 rounded-xl border text-left transition flex items-start justify-between ${
                    studyStyle === st.id
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{st.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{st.desc}</p>
                  </div>
                  {studyStyle === st.id && <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <span>Continue</span> <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Daily Commitment & Exam Date */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Set your daily commitment</h2>
              <p className="text-xs text-slate-400 mt-1">
                Consistent daily sessions yield 3x higher retention than last-minute cramming.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Daily Study Target</label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDailyTargetMinutes(mins)}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                        dailyTargetMinutes === mins
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mins} min/day
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Exam or Milestone Date</label>
                <input
                  type="date"
                  value={upcomingExamDate}
                  onChange={(e) => setUpcomingExamDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/20"
              >
                {isSaving ? 'Calibrating...' : 'Enter Study Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
