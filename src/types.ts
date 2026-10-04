export type AppRoute =
  | 'home'
  | 'features'
  | 'pricing'
  | 'about'
  | 'contact'
  | 'login'
  | 'signup'
  | 'onboarding'
  | 'dashboard'
  | 'ai-tutor'
  | 'library'
  | 'quizzes'
  | 'flashcards'
  | 'study-planner'
  | 'progress'
  | 'account';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  educationLevel: string;
  subjects: string[];
  goals: string[];
  studyStyle: string;
  dailyTargetMinutes: number;
  upcomingExamDate?: string;
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
  avatarUrl?: string;
}

export interface UserSubscription {
  userId: string;
  plan: 'free' | 'pro' | 'premium';
  billingCycle: 'monthly' | 'annual';
  status: 'active' | 'canceled';
  currentPeriodEnd: string;
}

export interface UserUsage {
  userId: string;
  aiGenerationsToday: number;
  aiGenerationsLimit: number;
  documentsUploaded: number;
  documentsLimit: number;
  totalStudyMinutes: number;
  currentStreakDays: number;
  lastStudyDate: string;
  xp: number;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  subject: string;
  topic: string;
  overview: string;
  keyConcepts: string[];
  definitions: { term: string; definition: string }[];
  importantFacts: string[];
  examples: string[];
  formulas?: string[];
  keyTakeaways: string[];
  reviewQuestions: string[];
  contentMarkdown?: string;
  isFavorite: boolean;
  sourceDocId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  id: string;
  userId: string;
  title: string;
  subject: string;
  mode: 'quick' | 'detailed' | 'exam' | 'bullet' | 'concepts';
  summaryText: string;
  bulletPoints?: string[];
  keyTakeaways?: string[];
  sourceType: 'text' | 'document' | 'tutor';
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extractedText: string;
  summaryPreview?: string;
  subject: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reviewedCount: number;
  correctCount: number;
  status: 'new' | 'learning' | 'mastered';
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  title: string;
  subject: string;
  topic: string;
  description: string;
  cardsCount: number;
  masteredCount: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
}

export interface Quiz {
  id: string;
  userId: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  timeLimitMinutes?: number;
  isFavorite: boolean;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: {
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  topicPerformance: { topic: string; correct: number; total: number }[];
  completedAt: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  subject: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  studyMode?: string;
  createdAt: string;
}

export interface StudyPlan {
  id: string;
  userId: string;
  title: string;
  examDate?: string;
  weeklyGoalHours: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface StudyTask {
  id: string;
  planId: string;
  userId: string;
  dayOfWeek: string;
  dateStr: string;
  subject: string;
  topic: string;
  targetMinutes: number;
  completed: boolean;
  completedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'quizzes' | 'study_time' | 'notes';
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'achievement' | 'quiz' | 'plan' | 'streak' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface UserAnalytics {
  usage: UserUsage;
  totalQuizzes: number;
  avgAccuracy: number;
  totalNotes: number;
  totalDecks: number;
  totalDocuments: number;
  subjectProgress: { subject: string; accuracy: number; quizzesTaken: number }[];
  weakTopics: { topic: string; subject: string; errorRate: number; incorrectCount: number; totalAttempted: number }[];
  completedTasks: number;
  totalTasks: number;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
