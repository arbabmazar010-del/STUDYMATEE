import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  User,
  GraduationCap,
  Zap,
  Sparkles,
  LogOut,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, profile, subscription, usage, updateProfile, openUpgradeModal, logout, addToast } = useApp();

  const [educationLevel, setEducationLevel] = useState(profile?.educationLevel || 'Undergraduate');
  const [primaryGoal, setPrimaryGoal] = useState(profile?.goals?.[0] || 'Ace Upcoming Exams');
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(profile?.dailyTargetMinutes || 45);
  const [upcomingExamDate, setUpcomingExamDate] = useState(profile?.upcomingExamDate || '2026-11-15');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        educationLevel,
        goals: [primaryGoal],
        dailyTargetMinutes,
        upcomingExamDate,
      });
      addToast('Profile Updated! ✅', 'Study settings saved successfully.', 'success');
    } catch {
      addToast('Error', 'Failed to save changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const planTier = subscription?.plan || 'free';
  const maxGenerations = usage?.aiGenerationsLimit || 10;
  const currentGenerations = usage?.aiGenerationsToday || 0;
  const genPct = Math.min(100, Math.round((currentGenerations / maxGenerations) * 100));

  const maxDocs = usage?.documentsLimit || 3;
  const currentDocs = usage?.documentsUploaded || 0;
  const docPct = Math.min(100, Math.round((currentDocs / maxDocs) * 100));

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Ribbon */}
        <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Account & Subscription</h1>
            <p className="text-xs text-slate-400 mt-1">Manage personal academic settings, limits, and billing</p>
          </div>

          <button
            onClick={logout}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* Subscription Tier Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-purple-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-wider">
                {planTier} Plan Active
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {subscription?.status === 'active' ? '● Verified Subscription' : 'Active'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {planTier === 'free' ? 'StudyMat Basic Free Tier' : `${planTier.toUpperCase()} Scholar Membership`}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {planTier === 'free'
                ? 'Upgrade to unlock 100 daily AI generations, unlimited quizzes, and full OCR textbook extraction.'
                : 'Enjoy unrestricted Socratic AI tutoring, advanced spaced repetition algorithms, and priority support.'}
            </p>
          </div>

          {planTier === 'free' && (
            <button
              onClick={() => openUpgradeModal()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/20 shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Upgrade to Pro</span>
            </button>
          )}
        </div>

        {/* Daily Quotas & Meters */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* AI Generations Meter */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Daily AI Generations
              </span>
              <span className="text-slate-400 font-mono">
                {currentGenerations} / {maxGenerations} Used
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  genPct > 90 ? 'bg-rose-500' : 'bg-blue-500'
                }`}
                style={{ width: `${genPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">Resets every 24 hours at midnight UTC.</p>
          </div>

          {/* Documents Uploaded Meter */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> Document Storage
              </span>
              <span className="text-slate-400 font-mono">
                {currentDocs} / {maxDocs} Files
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  docPct > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${docPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">Pro unlocks up to 25 documents with deep OCR.</p>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" /> Personal Academic Profile
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Student Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Academic Education Level</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="High School (AP / IB / SAT)">High School (AP / IB / SAT)</option>
                  <option value="Undergraduate (College / University)">Undergraduate (College / University)</option>
                  <option value="Graduate (Master’s / Ph.D.)">Graduate (Master’s / Ph.D.)</option>
                  <option value="Pre-Med / Medical Student">Pre-Med / Medical Student</option>
                  <option value="Law Student">Law Student</option>
                  <option value="Professional / Lifelong Learner">Professional / Lifelong Learner</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Daily Study Target</label>
                <select
                  value={dailyTargetMinutes}
                  onChange={(e) => setDailyTargetMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value={30}>30 Minutes / Day</option>
                  <option value={45}>45 Minutes / Day</option>
                  <option value={60}>60 Minutes / Day</option>
                  <option value={90}>90 Minutes / Day</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Primary Academic Goal</label>
                <input
                  type="text"
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  placeholder="e.g. Ace finals, Boost GPA, MCAT Prep..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Exam Date</label>
                <input
                  type="date"
                  value={upcomingExamDate}
                  onChange={(e) => setUpcomingExamDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
