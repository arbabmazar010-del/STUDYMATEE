import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import {
  UserAnalytics,
  Achievement,
} from '../types.ts';
import {
  BarChart3,
  Award,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Brain,
  ShieldCheck,
  Target,
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const { usage, profile, navigateTo } = useApp();

  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [anRes, achRes] = await Promise.all([
          api.getAnalytics().catch(() => null),
          api.getAchievements().catch(() => ({ achievements: [] })),
        ]);
        if (anRes) setAnalytics(anRes);
        setAchievements(achRes.achievements || []);
      } catch (err) {
        console.error('Failed to load progress analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const streak = usage?.currentStreakDays || 1;
  const xp = usage?.xp || 100;
  const studyMinutes = usage?.totalStudyMinutes || 45;
  const avgAcc = analytics?.avgAccuracy || 80;

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Academic Analytics & Mastery</h1>
            <p className="text-xs text-slate-400 mt-1">
              Cognitive progress, subject performance diagnostics, and milestone achievements
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
              Level {Math.floor(xp / 100) + 1} Scholar
            </span>
          </div>
        </div>

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Study Streak</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{streak} Days</p>
            <p className="text-[11px] text-emerald-400 font-medium">Keep momentum alive</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Overall Accuracy</span>
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{avgAcc}%</p>
            <p className="text-[11px] text-slate-400">Across all completed quizzes</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Time Invested</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{studyMinutes} min</p>
            <p className="text-[11px] text-slate-400">Recorded focus sessions</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total XP Earned</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{xp} XP</p>
            <p className="text-[11px] text-purple-400 font-medium">Next rank in {100 - (xp % 100)} XP</p>
          </div>
        </div>

        {/* Diagnostic Weak Spots & Subject Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Subject Mastery Performance */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-400" /> Subject Mastery Breakdown
              </h3>
            </div>

            <div className="space-y-4">
              {analytics?.subjectProgress && analytics.subjectProgress.length > 0 ? (
                analytics.subjectProgress.map((sm) => (
                  <div key={sm.subject} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-200">{sm.subject}</span>
                      <span className="text-slate-400 font-mono">
                        {sm.accuracy}% Accuracy ({sm.quizzesTaken} Drills)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${sm.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  Complete quizzes in different subjects to calibrate mastery models.
                </p>
              )}
            </div>
          </div>

          {/* Diagnostic Weak Topics Alert */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Diagnostic Focus Priorities
              </h3>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Error Rate &gt; 35%</span>
            </div>

            <div className="space-y-3">
              {analytics?.weakTopics && analytics.weakTopics.length > 0 ? (
                analytics.weakTopics.map((item, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{item.topic}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.subject} • Error Rate: {item.errorRate}%
                      </p>
                    </div>
                    <button
                      onClick={() => navigateTo('ai-tutor', { prompt: `Give me a deep conceptual intuition and 3 practice questions for ${item.topic}` })}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition"
                    >
                      AI Review
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-xl bg-slate-950 text-center text-xs text-slate-400">
                  No high-error topics detected! Your conceptual grasp is balanced.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Milestone Achievements */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" /> Academic Badges & Milestones
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Earn badges through consistent study and quiz excellence</p>
            </div>
            <span className="text-xs font-mono text-purple-400">
              {achievements.filter((a) => a.unlockedAt).length}/{achievements.length} Unlocked
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach) => {
              const isUnlocked = !!ach.unlockedAt;
              const pct = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));
              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-2xl border transition ${
                    isUnlocked
                      ? 'bg-slate-950 border-purple-500/30'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {ach.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                        {isUnlocked && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{ach.description}</p>

                      <div className="mt-3 space-y-1">
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isUnlocked ? 'bg-emerald-500' : 'bg-purple-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Progress</span>
                          <span>
                            {ach.progress}/{ach.maxProgress}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
