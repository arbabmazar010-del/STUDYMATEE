import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import {
  Quiz,
  QuizQuestion,
  QuizAttempt,
} from '../types.ts';
import {
  CheckSquare,
  Sparkles,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  Loader2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuizzesPage: React.FC = () => {
  const { profile, routeParams, navigateTo, openUpgradeModal, addToast } = useApp();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Active Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(routeParams.openCreator === 'true');
  const [topic, setTopic] = useState(routeParams.topic || '');
  const [subject, setSubject] = useState(routeParams.subject || profile?.subjects?.[0] || 'General');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'short_answer'>('multiple_choice');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchQuizzes = async () => {
    try {
      const res = await api.getQuizzes();
      setQuizzes(res.quizzes || []);
      setAttempts(res.attempts || []);

      if (routeParams.quizId && res.quizzes) {
        const found = res.quizzes.find((q) => q.id === routeParams.quizId);
        if (found) startQuiz(found);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [routeParams.quizId]);

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setLatestAttempt(null);
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    // Build answer payload
    const answersPayload = activeQuiz.questions.map((q: QuizQuestion) => ({
      questionId: q.id,
      userAnswer: selectedAnswers[q.id] || '',
    }));

    setIsSubmitting(true);
    try {
      const res = await api.submitQuiz(activeQuiz.id, answersPayload);
      setIsSubmitted(true);
      setLatestAttempt(res.attempt);
      setAttempts([res.attempt, ...attempts]);

      if (res.attempt.percentage >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        addToast('Brilliant Score! 🌟', `You scored ${res.attempt.score}/${res.attempt.totalQuestions} (${res.attempt.percentage}%).`, 'success');
      } else {
        addToast('Quiz Completed! 🎯', `You scored ${res.attempt.score}/${res.attempt.totalQuestions}. Review explanations below.`, 'info');
      }
    } catch {
      addToast('Error', 'Failed to submit quiz', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const res = await api.generateQuiz({
        topic,
        subject,
        numQuestions,
        difficulty,
        questionType,
      });

      setQuizzes([res.quiz, ...quizzes]);
      setIsCreateModalOpen(false);
      setTopic('');
      startQuiz(res.quiz);
      addToast('Quiz Generated! 🚀', `Prepared ${res.quiz.questions.length} adaptive practice questions.`, 'success');
    } catch (err: any) {
      if (err.message && err.message.includes('Daily AI generation limit reached')) {
        openUpgradeModal('Daily AI generation limit reached. Upgrade to Pro for unlimited quizzes.');
      } else {
        addToast('Generation Failed', err.message || 'Error creating quiz', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteQuiz(id);
      setQuizzes(quizzes.filter((q) => q.id !== id));
      if (activeQuiz?.id === id) setActiveQuiz(null);
      addToast('Quiz Deleted', '', 'info');
    } catch {
      addToast('Error', 'Failed to delete quiz', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Active Quiz Runner */}
        {activeQuiz ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Quiz Banner & Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-bold uppercase">
                    {activeQuiz.subject} • {activeQuiz.difficulty}
                  </span>
                  <span className="text-xs text-slate-500">
                    Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">{activeQuiz.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Exit Quiz
                </button>
                <button
                  onClick={() => startQuiz(activeQuiz)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>

            {/* Questions Stepper Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              {activeQuiz.questions.map((q: QuizQuestion, i: number) => {
                const isAnswered = !!selectedAnswers[q.id];
                const isCurrent = currentQuestionIndex === i;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                        : isAnswered
                        ? 'bg-slate-800 text-slate-200 border border-slate-700'
                        : 'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Current Question Display */}
            {!isSubmitted ? (
              <div className="space-y-6 pt-2">
                {(() => {
                  const currentQ = activeQuiz.questions[currentQuestionIndex];
                  return (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                          Topic: {currentQ.topic}
                        </p>
                        <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                          {currentQ.question}
                        </h3>
                      </div>

                      {/* Options */}
                      <div className="space-y-2.5">
                        {currentQ.options?.map((opt: string, idx: number) => {
                          const isSelected = selectedAnswers[currentQ.id] === opt;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectAnswer(currentQ.id, opt)}
                              className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-600/20 border-blue-500 text-white'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                                }`}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <button
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                          className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40"
                        >
                          Previous
                        </button>

                        {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                          <button
                            onClick={() => setCurrentQuestionIndex((prev) => Math.min(activeQuiz.questions.length - 1, prev + 1))}
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <span>Next Question</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={handleSubmitQuiz}
                            disabled={isSubmitting}
                            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            <span>Submit & Grade Quiz</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Results & Review View */
              <div className="space-y-6 pt-2">
                {/* Score Summary Box */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Quiz Graded</span>
                    <h3 className="text-2xl font-extrabold text-white mt-1">
                      {latestAttempt?.score} of {latestAttempt?.totalQuestions} Correct ({latestAttempt?.percentage}%)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {latestAttempt && latestAttempt.percentage >= 80
                        ? 'Outstanding performance! You have demonstrated solid concept retention.'
                        : 'Review the detailed explanations below to reinforce weak conceptual gaps.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startQuiz(activeQuiz)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md"
                    >
                      Retake Quiz
                    </button>
                    <button
                      onClick={() => setActiveQuiz(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
                    >
                      Back to Quizzes
                    </button>
                  </div>
                </div>

                {/* Detailed Answers Review */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Answer Review & Explanations</h4>
                  {activeQuiz.questions.map((q: QuizQuestion, idx: number) => {
                    const userAns = selectedAnswers[q.id] || '(No Answer)';
                    const isCorrect = userAns === q.correctAnswer;
                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border ${
                          isCorrect ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs font-semibold text-slate-400">
                            Question {idx + 1}: {q.topic}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white mb-3">{q.question}</h4>

                        <div className="grid sm:grid-cols-2 gap-2 text-xs mb-3">
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Your Selection:</span>
                            <span className={isCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                              {userAns}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Correct Solution:</span>
                            <span className="text-emerald-400 font-semibold">{q.correctAnswer}</span>
                          </div>
                        </div>

                        {q.explanation && (
                          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                            <span className="font-bold text-blue-400">Pedagogical Explanation: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Main Quiz Directory & Past Attempts */
          <div className="space-y-8">
            {/* Header Ribbon */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Adaptive Quiz Center</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Active recall drills, instant pedagogical explanations, and retention tracking
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Adaptive Quiz</span>
              </button>
            </div>

            {/* Quizzes Grid */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Available Practice Quizzes</h3>

              {quizzes.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 space-y-3">
                  <CheckSquare className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-sm font-semibold">No practice quizzes in your repository yet.</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition"
                  >
                    Generate Your First Quiz
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold">
                            {quiz.subject}
                          </span>
                          <button
                            onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition"
                            title="Delete quiz"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition">
                          {quiz.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Topic: {quiz.topic} • {quiz.questions.length} Questions
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {quiz.difficulty} Level
                        </span>
                        <button
                          onClick={() => startQuiz(quiz)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          <Play className="w-3 h-3" /> Practice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Attempts History */}
            {attempts.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-base font-bold text-white">Recent Quiz Attempts & Scores</h3>
                <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
                  {attempts.slice(0, 5).map((att) => (
                    <div key={att.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{att.quizTitle}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {att.subject} • Completed {new Date(att.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            att.percentage >= 80 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {att.percentage}%
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {att.score}/{att.totalQuestions} points
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quiz Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> Create AI Practice Quiz
            </h3>
            <p className="text-xs text-slate-400">
              Generate a personalized quiz tailored to your target subject and difficulty level.
            </p>

            <form onSubmit={handleGenerateQuiz} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Topic or Concept</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Glycolysis, Organic Synthesis, Linear Independence..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
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
                  <label className="block font-semibold text-slate-300 mb-1">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="easy">Easy (Fundamentals)</option>
                    <option value="medium">Medium (Standard Exam)</option>
                    <option value="hard">Hard (Advanced / Tricky)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Question Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Number of Questions</label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={3}>3 Questions (Quick Drill)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={10}>10 Questions (Deep Exam Prep)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !topic.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold transition flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isGenerating ? 'Generating Quiz...' : 'Create Quiz'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
