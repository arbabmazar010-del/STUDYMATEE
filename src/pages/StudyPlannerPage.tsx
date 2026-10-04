import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import {
  StudyPlan,
  StudyTask,
} from '../types.ts';
import {
  Calendar,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  Play,
  Trash2,
  RotateCcw,
  ChevronRight,
  Award,
  Loader2,
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const StudyPlannerPage: React.FC = () => {
  const { profile, startStudyTimer, openUpgradeModal, addToast } = useApp();

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  // Generator & Custom Task Modals
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Generator form
  const [examDate, setExamDate] = useState(profile?.upcomingExamDate || '2026-11-15');
  const [dailyMinutes, setDailyMinutes] = useState(profile?.dailyTargetMinutes || 60);
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom Task form
  const [newTaskDay, setNewTaskDay] = useState('Monday');
  const [newTaskSubject, setNewTaskSubject] = useState(profile?.subjects?.[0] || 'General');
  const [newTaskTopic, setNewTaskTopic] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(45);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const fetchPlanner = async () => {
    try {
      const res = await api.getStudyPlan();
      if (res.plan) setPlan(res.plan);
      setTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load study plan:', err);
    }
  };

  useEffect(() => {
    fetchPlanner();
  }, []);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      await api.toggleTask(taskId, !currentCompleted);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !currentCompleted } : t))
      );
      if (!currentCompleted) {
        addToast('Task Completed! 🎉', '+25 XP recorded for your streak.', 'success');
      }
    } catch {
      addToast('Error', 'Failed to update task state', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      addToast('Task Removed', '', 'info');
    } catch {
      addToast('Error', 'Failed to remove task', 'error');
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await api.generateStudyPlan({
        subjects: profile?.subjects || ['Biology', 'Chemistry', 'Calculus'],
        examDate,
        dailyMinutes,
        goals: profile?.goals || ['Exam Excellence'],
        studyStyle: profile?.studyStyle || 'Socratic & Active Recall',
      });

      setPlan(res.plan);
      setTasks(res.tasks || []);
      setIsGenModalOpen(false);
      addToast('Study Roadmap Generated! 🗺️', 'Custom weekly distributed schedule ready.', 'success');
    } catch (err: any) {
      if (err.message && err.message.includes('Daily AI generation limit reached')) {
        openUpgradeModal('Daily AI generation limit reached. Upgrade to Pro for unlimited schedule planning.');
      } else {
        addToast('Generation Failed', err.message || 'Error creating schedule', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTopic.trim()) return;

    setIsAddingTask(true);
    try {
      const res = await api.addCustomTask({
        dayOfWeek: newTaskDay,
        subject: newTaskSubject,
        topic: newTaskTopic,
        targetMinutes: newTaskMinutes,
      });

      setTasks([...tasks, res.task]);
      setIsAddTaskModalOpen(false);
      setNewTaskTopic('');
      addToast('Task Scheduled! 📌', `${res.task.topic} added to ${newTaskDay}.`, 'success');
    } catch {
      addToast('Error', 'Failed to add custom task', 'error');
    } finally {
      setIsAddingTask(false);
    }
  };

  const dayTasks = tasks.filter((t) => t.dayOfWeek.toLowerCase() === selectedDay.toLowerCase());
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">AI Study Roadmap & Planner</h1>
            <p className="text-xs text-slate-400 mt-1">
              Spaced study allocations, daily focus tasks, and exam timeline tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddTaskModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
            <button
              onClick={() => setIsGenModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
            >
              <Sparkles className="w-4 h-4" /> AI Generate Schedule
            </button>
          </div>
        </div>

        {/* Progress Overview Banner */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Weekly Target Progress</span>
            <h3 className="text-xl font-extrabold text-white mt-1">
              {completedCount} of {totalCount} Tasks Completed ({overallPct}%)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Exam Date: {profile?.upcomingExamDate || 'Not scheduled'}
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>0%</span>
              <span>100% Target</span>
            </div>
          </div>
        </div>

        {/* Days of Week Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {DAYS_OF_WEEK.map((day) => {
            const count = tasks.filter((t) => t.dayOfWeek.toLowerCase() === day.toLowerCase()).length;
            const isSelected = selectedDay.toLowerCase() === day.toLowerCase();
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{day}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tasks List for Selected Day */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{selectedDay}'s Scheduled Focus</h3>

          {dayTasks.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 space-y-2">
              <Calendar className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs font-medium">No study tasks scheduled for {selectedDay}.</p>
              <button
                onClick={() => {
                  setNewTaskDay(selectedDay);
                  setIsAddTaskModalOpen(true);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                + Add a task to this day
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                    task.completed
                      ? 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                      : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 ${
                        task.completed
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-700 hover:border-blue-500 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div className="truncate">
                      <p className={`text-sm font-bold ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.topic}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="text-blue-400 font-medium">{task.subject}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.targetMinutes} minutes
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startStudyTimer()}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400" /> Start
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Schedule Generator Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> Generate Weekly Schedule
            </h3>
            <p className="text-xs text-slate-400">
              StudyMat uses cognitive spaced intervals to distribute topic drills across your week.
            </p>

            <form onSubmit={handleGeneratePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Exam Date</label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Daily Study Target</label>
                <select
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={30}>30 Minutes / Day</option>
                  <option value={45}>45 Minutes / Day</option>
                  <option value={60}>60 Minutes / Day</option>
                  <option value={90}>90 Minutes / Day</option>
                  <option value={120}>120 Minutes / Day (Intensive)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGenModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold transition flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isGenerating ? 'Structuring...' : 'Generate Roadmap'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Task Modal */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" /> Add Custom Study Task
            </h3>

            <form onSubmit={handleAddCustomTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Day of Week</label>
                <select
                  value={newTaskDay}
                  onChange={(e) => setNewTaskDay(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                <select
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                >
                  {profile?.subjects?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Topic / Chapter to Cover</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Practice Problems, Review Krebs Cycle..."
                  value={newTaskTopic}
                  onChange={(e) => setNewTaskTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Duration (Minutes)</label>
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={newTaskMinutes}
                  onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingTask || !newTaskTopic.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold transition shadow-md"
                >
                  {isAddingTask ? 'Adding...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
