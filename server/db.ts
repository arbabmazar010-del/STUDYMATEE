import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  educationLevel: string; // High School, Undergraduate, Graduate, Self-Learner
  subjects: string[];
  goals: string[];
  studyStyle: string; // Visual, Active Recall, Step-by-Step, Practice
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
  aiGenerationsLimit: number; // e.g. Free: 10, Pro: 100, Premium: 9999
  documentsUploaded: number;
  documentsLimit: number; // Free: 3, Pro: 25, Premium: 999
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
  pageCount?: number;
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
  options?: string[]; // for multiple choice
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
  dayOfWeek: string; // Monday, Tuesday, etc.
  dateStr: string; // YYYY-MM-DD
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

export interface DatabaseSchema {
  users: User[];
  profiles: UserProfile[];
  subscriptions: UserSubscription[];
  usages: UserUsage[];
  notes: Note[];
  summaries: Summary[];
  documents: DocumentRecord[];
  flashcardDecks: FlashcardDeck[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  conversations: AIConversation[];
  messages: AIMessage[];
  studyPlans: StudyPlan[];
  studyTasks: StudyTask[];
  achievements: { [userId: string]: Achievement[] };
  notifications: NotificationItem[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'studymat_db.json');

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private getDefaultAchievements(): Achievement[] {
    return [
      { id: 'first_quiz', title: 'Quiz Starter', description: 'Complete your first practice quiz', icon: 'Award', category: 'quizzes', progress: 0, maxProgress: 1 },
      { id: 'quiz_master', title: 'Knowledge Hunter', description: 'Complete 5 practice quizzes with >80% score', icon: 'CheckCircle', category: 'quizzes', progress: 0, maxProgress: 5 },
      { id: 'streak_3', title: 'Consistency Scout', description: 'Maintain a 3-day study streak', icon: 'Flame', category: 'streak', progress: 1, maxProgress: 3 },
      { id: 'streak_7', title: 'Study Champion', description: 'Reach a 7-day study streak', icon: 'Zap', category: 'streak', progress: 1, maxProgress: 7 },
      { id: 'notes_creator', title: 'Master Scribe', description: 'Generate and save 5 structured AI notes', icon: 'BookOpen', category: 'notes', progress: 0, maxProgress: 5 },
      { id: 'time_10h', title: 'Deep Work', description: 'Accumulate 10 hours of active study time', icon: 'Clock', category: 'study_time', progress: 0, maxProgress: 600 },
    ];
  }

  private getInitialData(): DatabaseSchema {
    return {
      users: [],
      profiles: [],
      subscriptions: [],
      usages: [],
      notes: [],
      summaries: [],
      documents: [],
      flashcardDecks: [],
      flashcards: [],
      quizzes: [],
      quizAttempts: [],
      conversations: [],
      messages: [],
      studyPlans: [],
      studyTasks: [],
      achievements: {},
      notifications: [],
    };
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading database file, initializing empty:', err);
    }
    const initial = this.getInitialData();
    this.saveData(initial);
    return initial;
  }

  public saveData(data?: DatabaseSchema) {
    if (data) this.data = data;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database to disk:', err);
    }
  }

  // --- Users & Profiles ---
  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User, profile: UserProfile, plan: 'free' | 'pro' | 'premium' = 'free'): { user: User; profile: UserProfile } {
    this.data.users.push(user);
    this.data.profiles.push(profile);

    const limits = plan === 'premium' ? { ai: 9999, doc: 999 } : plan === 'pro' ? { ai: 100, doc: 25 } : { ai: 10, doc: 3 };
    this.data.subscriptions.push({
      userId: user.id,
      plan,
      billingCycle: 'monthly',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    this.data.usages.push({
      userId: user.id,
      aiGenerationsToday: 0,
      aiGenerationsLimit: limits.ai,
      documentsUploaded: 0,
      documentsLimit: limits.doc,
      totalStudyMinutes: 0,
      currentStreakDays: 1,
      lastStudyDate: new Date().toISOString().split('T')[0],
      xp: 150, // Welcome bonus XP
    });

    this.data.achievements[user.id] = this.getDefaultAchievements();

    // Welcome notification
    this.addNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      title: 'Welcome to StudyMat! 🎓',
      message: 'Set up your subjects and start an AI study session or generate your first quiz.',
      type: 'system',
      isRead: false,
      link: '/onboarding',
      createdAt: new Date().toISOString(),
    });

    this.saveData();
    return { user, profile };
  }

  public getProfile(userId: string): UserProfile | undefined {
    return this.data.profiles.find((p) => p.userId === userId);
  }

  public updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const idx = this.data.profiles.findIndex((p) => p.userId === userId);
    if (idx >= 0) {
      this.data.profiles[idx] = { ...this.data.profiles[idx], ...updates };
      this.saveData();
      return this.data.profiles[idx];
    }
    const newProfile: UserProfile = {
      userId,
      educationLevel: 'Undergraduate',
      subjects: ['General Studies'],
      goals: ['Improve grades'],
      studyStyle: 'Active Recall',
      dailyTargetMinutes: 45,
      theme: 'dark',
      notificationsEnabled: true,
      ...updates,
    };
    this.data.profiles.push(newProfile);
    this.saveData();
    return newProfile;
  }

  public getSubscription(userId: string): UserSubscription {
    let sub = this.data.subscriptions.find((s) => s.userId === userId);
    if (!sub) {
      sub = {
        userId,
        plan: 'free',
        billingCycle: 'monthly',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      this.data.subscriptions.push(sub);
      this.saveData();
    }
    return sub;
  }

  public updateSubscription(userId: string, plan: 'free' | 'pro' | 'premium', billingCycle: 'monthly' | 'annual' = 'monthly'): UserSubscription {
    let sub = this.data.subscriptions.find((s) => s.userId === userId);
    if (sub) {
      sub.plan = plan;
      sub.billingCycle = billingCycle;
      sub.status = 'active';
      sub.currentPeriodEnd = new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();
    } else {
      sub = {
        userId,
        plan,
        billingCycle,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      };
      this.data.subscriptions.push(sub);
    }

    // Update usage limits
    const usage = this.getUsage(userId);
    const limits = plan === 'premium' ? { ai: 9999, doc: 999 } : plan === 'pro' ? { ai: 100, doc: 25 } : { ai: 10, doc: 3 };
    usage.aiGenerationsLimit = limits.ai;
    usage.documentsLimit = limits.doc;

    this.addNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId,
      title: `Plan Upgraded to ${plan.toUpperCase()}! 🚀`,
      message: `Your study limits have been expanded. Enjoy premium AI study tools and unlimited practice.`,
      type: 'system',
      isRead: false,
      link: '/account',
      createdAt: new Date().toISOString(),
    });

    this.saveData();
    return sub;
  }

  public getUsage(userId: string): UserUsage {
    let usage = this.data.usages.find((u) => u.userId === userId);
    if (!usage) {
      usage = {
        userId,
        aiGenerationsToday: 0,
        aiGenerationsLimit: 10,
        documentsUploaded: 0,
        documentsLimit: 3,
        totalStudyMinutes: 0,
        currentStreakDays: 1,
        lastStudyDate: new Date().toISOString().split('T')[0],
        xp: 100,
      };
      this.data.usages.push(usage);
      this.saveData();
    }
    // Check if day rolled over
    const today = new Date().toISOString().split('T')[0];
    if (usage.lastStudyDate !== today) {
      // Check streak
      const lastDate = new Date(usage.lastStudyDate);
      const diffDays = Math.round((new Date(today).getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        usage.currentStreakDays += 1;
      } else if (diffDays > 1) {
        usage.currentStreakDays = 1;
      }
      usage.lastStudyDate = today;
      usage.aiGenerationsToday = 0;
      this.saveData();
    }
    return usage;
  }

  public incrementAIUsage(userId: string): { allowed: boolean; current: number; limit: number } {
    const usage = this.getUsage(userId);
    if (usage.aiGenerationsToday >= usage.aiGenerationsLimit) {
      return { allowed: false, current: usage.aiGenerationsToday, limit: usage.aiGenerationsLimit };
    }
    usage.aiGenerationsToday += 1;
    usage.xp += 10;
    this.saveData();
    return { allowed: true, current: usage.aiGenerationsToday, limit: usage.aiGenerationsLimit };
  }

  public addStudyMinutes(userId: string, minutes: number) {
    const usage = this.getUsage(userId);
    usage.totalStudyMinutes += minutes;
    usage.xp += Math.round(minutes * 2);
    this.saveData();
  }

  // --- Notes ---
  public getNotes(userId: string): Note[] {
    return this.data.notes.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getNoteById(id: string, userId: string): Note | undefined {
    return this.data.notes.find((n) => n.id === id && n.userId === userId);
  }

  public createNote(note: Note): Note {
    this.data.notes.push(note);
    const usage = this.getUsage(note.userId);
    usage.xp += 25;
    this.saveData();
    return note;
  }

  public updateNote(id: string, userId: string, updates: Partial<Note>): Note | undefined {
    const idx = this.data.notes.findIndex((n) => n.id === id && n.userId === userId);
    if (idx >= 0) {
      this.data.notes[idx] = { ...this.data.notes[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveData();
      return this.data.notes[idx];
    }
    return undefined;
  }

  public deleteNote(id: string, userId: string): boolean {
    const prevLen = this.data.notes.length;
    this.data.notes = this.data.notes.filter((n) => !(n.id === id && n.userId === userId));
    const changed = this.data.notes.length !== prevLen;
    if (changed) this.saveData();
    return changed;
  }

  // --- Summaries ---
  public getSummaries(userId: string): Summary[] {
    return this.data.summaries.filter((s) => s.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createSummary(summary: Summary): Summary {
    this.data.summaries.push(summary);
    this.saveData();
    return summary;
  }

  public deleteSummary(id: string, userId: string): boolean {
    const prevLen = this.data.summaries.length;
    this.data.summaries = this.data.summaries.filter((s) => !(s.id === id && s.userId === userId));
    const changed = this.data.summaries.length !== prevLen;
    if (changed) this.saveData();
    return changed;
  }

  // --- Documents ---
  public getDocuments(userId: string): DocumentRecord[] {
    return this.data.documents.filter((d) => d.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getDocumentById(id: string, userId: string): DocumentRecord | undefined {
    return this.data.documents.find((d) => d.id === id && d.userId === userId);
  }

  public createDocument(doc: DocumentRecord): DocumentRecord {
    this.data.documents.push(doc);
    const usage = this.getUsage(doc.userId);
    usage.documentsUploaded += 1;
    usage.xp += 30;
    this.saveData();
    return doc;
  }

  public deleteDocument(id: string, userId: string): boolean {
    const prevLen = this.data.documents.length;
    this.data.documents = this.data.documents.filter((d) => !(d.id === id && d.userId === userId));
    const changed = this.data.documents.length !== prevLen;
    if (changed) this.saveData();
    return changed;
  }

  // --- Flashcards ---
  public getDecks(userId: string): FlashcardDeck[] {
    return this.data.flashcardDecks.filter((d) => d.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getDeckWithCards(deckId: string, userId: string): { deck: FlashcardDeck; cards: Flashcard[] } | undefined {
    const deck = this.data.flashcardDecks.find((d) => d.id === deckId && d.userId === userId);
    if (!deck) return undefined;
    const cards = this.data.flashcards.filter((c) => c.deckId === deckId);
    return { deck, cards };
  }

  public createDeckWithCards(deck: FlashcardDeck, cards: Flashcard[]): { deck: FlashcardDeck; cards: Flashcard[] } {
    this.data.flashcardDecks.push(deck);
    this.data.flashcards.push(...cards);
    const usage = this.getUsage(deck.userId);
    usage.xp += 35;
    this.saveData();
    return { deck, cards };
  }

  public updateCardProgress(cardId: string, status: 'new' | 'learning' | 'mastered', wasCorrect: boolean) {
    const card = this.data.flashcards.find((c) => c.id === cardId);
    if (card) {
      card.reviewedCount += 1;
      if (wasCorrect) card.correctCount += 1;
      card.status = status;
      // update deck mastered count
      const deck = this.data.flashcardDecks.find((d) => d.id === card.deckId);
      if (deck) {
        const deckCards = this.data.flashcards.filter((c) => c.deckId === deck.id);
        deck.masteredCount = deckCards.filter((c) => c.status === 'mastered').length;
        deck.updatedAt = new Date().toISOString();
      }
      this.saveData();
    }
  }

  public deleteDeck(deckId: string, userId: string): boolean {
    const deck = this.data.flashcardDecks.find((d) => d.id === deckId && d.userId === userId);
    if (!deck) return false;
    this.data.flashcardDecks = this.data.flashcardDecks.filter((d) => d.id !== deckId);
    this.data.flashcards = this.data.flashcards.filter((c) => c.deckId !== deckId);
    this.saveData();
    return true;
  }

  // --- Quizzes & Attempts ---
  public getQuizzes(userId: string): Quiz[] {
    return this.data.quizzes.filter((q) => q.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getQuizById(id: string, userId: string): Quiz | undefined {
    return this.data.quizzes.find((q) => q.id === id && q.userId === userId);
  }

  public createQuiz(quiz: Quiz): Quiz {
    this.data.quizzes.push(quiz);
    const usage = this.getUsage(quiz.userId);
    usage.xp += 30;
    this.saveData();
    return quiz;
  }

  public deleteQuiz(id: string, userId: string): boolean {
    const prevLen = this.data.quizzes.length;
    this.data.quizzes = this.data.quizzes.filter((q) => !(q.id === id && q.userId === userId));
    const changed = this.data.quizzes.length !== prevLen;
    if (changed) this.saveData();
    return changed;
  }

  public recordQuizAttempt(attempt: QuizAttempt): QuizAttempt {
    this.data.quizAttempts.push(attempt);
    const usage = this.getUsage(attempt.userId);
    usage.xp += Math.round(50 * (attempt.percentage / 100)) + 20;

    // Check achievement progress
    const userAch = this.getAchievements(attempt.userId);
    const firstQuiz = userAch.find((a) => a.id === 'first_quiz');
    if (firstQuiz && !firstQuiz.unlockedAt) {
      firstQuiz.progress = 1;
      firstQuiz.unlockedAt = new Date().toISOString();
      this.addNotification({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        userId: attempt.userId,
        title: 'Achievement Unlocked: Quiz Starter! 🏆',
        message: 'You completed your first quiz on StudyMat. Keep testing your knowledge!',
        type: 'achievement',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    if (attempt.percentage >= 80) {
      const qMaster = userAch.find((a) => a.id === 'quiz_master');
      if (qMaster && !qMaster.unlockedAt) {
        qMaster.progress += 1;
        if (qMaster.progress >= qMaster.maxProgress) {
          qMaster.unlockedAt = new Date().toISOString();
        }
      }
    }

    this.saveData();
    return attempt;
  }

  public getQuizAttempts(userId: string): QuizAttempt[] {
    return this.data.quizAttempts.filter((a) => a.userId === userId).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  // --- Conversations & Messages ---
  public getConversations(userId: string): AIConversation[] {
    return this.data.conversations.filter((c) => c.userId === userId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getConversationById(id: string, userId: string): { conversation: AIConversation; messages: AIMessage[] } | undefined {
    const conversation = this.data.conversations.find((c) => c.id === id && c.userId === userId);
    if (!conversation) return undefined;
    const messages = this.data.messages.filter((m) => m.conversationId === id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return { conversation, messages };
  }

  public createConversation(conv: AIConversation): AIConversation {
    this.data.conversations.push(conv);
    this.saveData();
    return conv;
  }

  public addMessage(msg: AIMessage): AIMessage {
    const existingIndex = this.data.messages.findIndex((m) => m.id === msg.id);
    if (existingIndex >= 0) {
      this.data.messages[existingIndex] = msg;
    } else {
      this.data.messages.push(msg);
    }
    const conv = this.data.conversations.find((c) => c.id === msg.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }
    this.saveData();
    return msg;
  }

  public deleteConversation(id: string, userId: string): boolean {
    const conv = this.data.conversations.find((c) => c.id === id && c.userId === userId);
    if (!conv) return false;
    this.data.conversations = this.data.conversations.filter((c) => c.id !== id);
    this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);
    this.saveData();
    return true;
  }

  public renameConversation(id: string, userId: string, title: string): boolean {
    const conv = this.data.conversations.find((c) => c.id === id && c.userId === userId);
    if (!conv) return false;
    conv.title = title;
    conv.updatedAt = new Date().toISOString();
    this.saveData();
    return true;
  }

  // --- Study Plans & Tasks ---
  public getStudyPlan(userId: string): { plan?: StudyPlan; tasks: StudyTask[] } {
    const plan = this.data.studyPlans.find((p) => p.userId === userId);
    if (!plan) return { tasks: [] };
    const tasks = this.data.studyTasks.filter((t) => t.planId === plan.id);
    return { plan, tasks };
  }

  public saveStudyPlan(plan: StudyPlan, tasks: StudyTask[]): { plan: StudyPlan; tasks: StudyTask[] } {
    this.data.studyPlans = this.data.studyPlans.filter((p) => p.userId !== plan.userId);
    this.data.studyTasks = this.data.studyTasks.filter((t) => t.userId !== plan.userId);
    this.data.studyPlans.push(plan);
    this.data.studyTasks.push(...tasks);
    const usage = this.getUsage(plan.userId);
    usage.xp += 40;
    this.saveData();
    return { plan, tasks };
  }

  public updateTask(taskId: string, userId: string, completed: boolean): StudyTask | undefined {
    const task = this.data.studyTasks.find((t) => t.id === taskId && t.userId === userId);
    if (task) {
      task.completed = completed;
      task.completedAt = completed ? new Date().toISOString() : undefined;
      if (completed) {
        this.addStudyMinutes(userId, task.targetMinutes);
      }
      this.saveData();
      return task;
    }
    return undefined;
  }

  public addTask(task: StudyTask): StudyTask {
    this.data.studyTasks.push(task);
    this.saveData();
    return task;
  }

  public deleteTask(taskId: string, userId: string): boolean {
    const prev = this.data.studyTasks.length;
    this.data.studyTasks = this.data.studyTasks.filter((t) => !(t.id === taskId && t.userId === userId));
    const changed = this.data.studyTasks.length !== prev;
    if (changed) this.saveData();
    return changed;
  }

  // --- Achievements & Notifications ---
  public getAchievements(userId: string): Achievement[] {
    if (!this.data.achievements[userId]) {
      this.data.achievements[userId] = this.getDefaultAchievements();
      this.saveData();
    }
    return this.data.achievements[userId];
  }

  public getNotifications(userId: string): NotificationItem[] {
    return this.data.notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notif: NotificationItem): NotificationItem {
    this.data.notifications.unshift(notif);
    if (this.data.notifications.length > 500) {
      this.data.notifications = this.data.notifications.slice(0, 500);
    }
    this.saveData();
    return notif;
  }

  public markNotificationRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (notif) {
      notif.isRead = true;
      this.saveData();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(userId: string): boolean {
    this.data.notifications.filter((n) => n.userId === userId).forEach((n) => (n.isRead = true));
    this.saveData();
    return true;
  }

  // --- Analytics & Progress Summary ---
  public getUserAnalytics(userId: string) {
    const usage = this.getUsage(userId);
    const attempts = this.getQuizAttempts(userId);
    const notes = this.getNotes(userId);
    const decks = this.getDecks(userId);
    const docs = this.getDocuments(userId);
    const plan = this.getStudyPlan(userId);

    // Subject stats
    const subjectMap: { [subject: string]: { totalScore: number; count: number; quizzes: number } } = {};
    const topicMistakes: { [topic: string]: { incorrect: number; total: number; subject: string } } = {};

    attempts.forEach((att) => {
      if (!subjectMap[att.subject]) {
        subjectMap[att.subject] = { totalScore: 0, count: 0, quizzes: 0 };
      }
      subjectMap[att.subject].totalScore += att.percentage;
      subjectMap[att.subject].count += 1;
      subjectMap[att.subject].quizzes += 1;

      att.answers.forEach((ans) => {
        // If question had a topic, track it
        const qTopic = (att.topicPerformance && att.topicPerformance[0]?.topic) || att.subject;
        if (!topicMistakes[qTopic]) {
          topicMistakes[qTopic] = { incorrect: 0, total: 0, subject: att.subject };
        }
        topicMistakes[qTopic].total += 1;
        if (!ans.isCorrect) {
          topicMistakes[qTopic].incorrect += 1;
        }
      });
    });

    const subjectProgress = Object.keys(subjectMap).map((subj) => ({
      subject: subj,
      accuracy: Math.round(subjectMap[subj].totalScore / subjectMap[subj].count),
      quizzesTaken: subjectMap[subj].quizzes,
    }));

    // Weak topics (where error rate is highest)
    const weakTopics = Object.keys(topicMistakes)
      .map((topic) => ({
        topic,
        subject: topicMistakes[topic].subject,
        errorRate: Math.round((topicMistakes[topic].incorrect / topicMistakes[topic].total) * 100),
        incorrectCount: topicMistakes[topic].incorrect,
        totalAttempted: topicMistakes[topic].total,
      }))
      .filter((w) => w.totalAttempted >= 2 && w.errorRate >= 30)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5);

    const totalQuizzes = attempts.length;
    const avgAccuracy = totalQuizzes > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalQuizzes) : 0;
    const completedTasks = plan.tasks.filter((t) => t.completed).length;

    return {
      usage,
      totalQuizzes,
      avgAccuracy,
      totalNotes: notes.length,
      totalDecks: decks.length,
      totalDocuments: docs.length,
      subjectProgress,
      weakTopics,
      completedTasks,
      totalTasks: plan.tasks.length,
    };
  }
}

export const db = new DatabaseManager();
