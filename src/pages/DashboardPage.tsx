import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import {
  UserAnalytics,
  StudyPlan,
  StudyTask,
  Note,
  Quiz,
} from '../types.ts';
import {
  Sparkles,
  Flame,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckSquare,
  Layers,
  MessageSquare,
  FileText,
  Calendar,
  Play,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, profile, usage, navigateTo, startStudyTimer, addToast } = useApp();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const [analyticsRes, plannerRes, notesRes] = await Promise.all([
        api.getAnalytics().catch(() => null),
        api.getStudyPlan().catch(() => ({ tasks: [] })),
        api.getNotes().catch(() => ({ notes: [] })),
      ]);
      if (analyticsRes) setAnalytics(analyticsRes);
      if (plannerRes?.tasks) setTasks(plannerRes.tasks);
      if (notesRes?.notes) setRecentNotes(notesRes.notes);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      await api.toggleTask(taskId, !currentCompleted);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !currentCompleted } : t))
      );
      if (!currentCompleted) {
        addToast('Task Completed! 🎉', '+25 XP gained. Great focus!', 'success');
      }
    } catch {
      addToast('Error', 'Failed to update task.', 'error');
    }
  };

  const streak = usage?.currentStreakDays || 1;
  const xp = usage?.xp || 100;
  const targetMinutes = profile?.dailyTargetMinutes || 45;
  const studiedMinutesToday = usage?.totalStudyMinutes || 25;
  const progressPct = Math.min(100, Math.round((studiedMinutesToday / targetMinutes) * 100));

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Greeting & Stats Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Scholar'}!
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Primary Goal: <span className="text-slate-200 font-semibold">{profile?.goals?.[0] || 'Exam Excellence'}</span>
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Streak */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Streak</p>
                <p className="text-sm font-bold text-white">{streak} Days</p>
              </div>
            </div>

            {/* XP */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Experience</p>
                <p className="text-sm font-bold text-white">{xp} XP</p>
              </div>
            </div>

            {/* Daily Study Progress */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Daily Target</p>
                <p className="text-sm font-bold text-white">
                  {studiedMinutesToday}/{targetMinutes}m ({progressPct}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Launcher Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => navigateTo('ai-tutor')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition text-left group"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 w-fit mb-2 group-hover:scale-110 transition">
              <MessageSquare className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Ask AI Tutor</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Socratic assistance</p>
          </button>

          <button
            onClick={() => navigateTo('library', { openGenerator: 'note' })}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition text-left group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-2 group-hover:scale-110 transition">
              <BookOpen className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Create Note</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Structured outlines</p>
          </button>

          <button
            onClick={() => navigateTo('quizzes', { openCreator: 'true' })}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition text-left group"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 w-fit mb-2 group-hover:scale-110 transition">
              <CheckSquare className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">New Quiz</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Adaptive drills</p>
          </button>

          <button
            onClick={() => navigateTo('flashcards', { openCreator: 'true' })}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition text-left group"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 w-fit mb-2 group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Review Decks</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Spaced repetition</p>
          </button>

          <button
            onClick={() => navigateTo('library', { tab: 'docs' })}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition text-left group"
          >
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 w-fit mb-2 group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Upload PDF</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Extract & Q&A</p>
          </button>

          <button
            onClick={() => navigateTo('study-planner')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 transition text-left group"
          >
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 w-fit mb-2 group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Study Planner</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Weekly roadmap</p>
          </button>
        </div>

        {/* Main Grid: Today's Tasks & Diagnostic Weak Spots */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Today's Tasks & Recent Materials */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Study Tasks */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Today's Study Plan</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 rounded-full">
                    {tasks.filter((t) => t.completed).length}/{tasks.length} Done
                  </span>
                </div>
                <button
                  onClick={() => navigateTo('study-planner')}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Manage Planner <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-2.5">
                {tasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No scheduled tasks for today. Click below to add tasks or generate a weekly plan!
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition ${
                        task.completed
                          ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                          : 'bg-slate-950 border-slate-800/90 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task.id, task.completed)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                            task.completed
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-700 hover:border-blue-500 text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="truncate">
                          <p className={`text-xs font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                            {task.topic}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="text-blue-400 font-medium">{task.subject}</span>
                            <span>•</span>
                            <span>{task.targetMinutes} minutes</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startStudyTimer()}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 text-emerald-400" /> Start
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Study Materials */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Recent Study Materials</h3>
                <button
                  onClick={() => navigateTo('library')}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  View Library <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {recentNotes.slice(0, 4).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => navigateTo('library', { noteId: note.id })}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="text-blue-400 font-medium">{note.subject}</span>
                      <span className="text-[10px]">
                        {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition truncate">
                      {note.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {note.overview || 'Structured revision note with key definitions and formulas.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Weak Topics Diagnostic & Subject Mastery */}
          <div className="space-y-6">
            {/* Weak Topics Diagnostic Alert */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>Diagnostic Weak Spots</span>
              </div>
              <h3 className="text-sm font-bold text-white">Concepts Needing Review</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Based on your recent quiz attempts, these topics show an error rate above 35%.
              </p>

              <div className="mt-4 space-y-2.5">
                {analytics?.weakTopics && analytics.weakTopics.length > 0 ? (
                  analytics.weakTopics.map((item, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{item.topic}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.subject} • {100 - item.errorRate}% Accuracy
                        </p>
                      </div>
                      <button
                        onClick={() => navigateTo('ai-tutor', { prompt: `Quiz me intensely on ${item.topic} in ${item.subject}` })}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition"
                      >
                        Drill Now
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 text-center text-xs text-slate-400">
                    No critical weak spots detected! Keep challenging yourself with harder quizzes.
                  </div>
                )}
              </div>
            </div>

            {/* Subject Mastery Progress Bars */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-white">Subject Mastery</h3>
                <button
                  onClick={() => navigateTo('progress')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Full Report
                </button>
              </div>

              <div className="space-y-3.5">
                {analytics?.subjectProgress && analytics.subjectProgress.length > 0 ? (
                  analytics.subjectProgress.map((sm) => (
                    <div key={sm.subject}>
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span className="text-slate-200">{sm.subject}</span>
                        <span className="text-slate-400 font-mono">{sm.accuracy}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${sm.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Complete quizzes to generate subject mastery metrics.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
