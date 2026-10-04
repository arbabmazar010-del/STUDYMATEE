import {
  User,
  UserProfile,
  UserSubscription,
  UserUsage,
  Note,
  Summary,
  DocumentRecord,
  FlashcardDeck,
  Flashcard,
  Quiz,
  QuizAttempt,
  AIConversation,
  AIMessage,
  StudyPlan,
  StudyTask,
  Achievement,
  NotificationItem,
  UserAnalytics,
} from '../types.ts';

const TOKEN_KEY = 'studymat_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, set Content-Type
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    (error as any).code = errorData.code;
    (error as any).status = response.status;
    throw error;
  }
  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ token: string; user: User; profile: UserProfile; subscription: UserSubscription; usage: UserUsage }> {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async signup(params: { email: string; password: string; name: string; educationLevel?: string; subjects?: string[] }) {
    const data = await fetchWithAuth('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredToken(data.token);
    return data;
  },

  async firebaseSync(params: { email: string; name: string; collegeSchool?: string }) {
    const data = await fetchWithAuth('/api/auth/firebase-sync', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredToken(data.token);
    return data;
  },

  async demoLogin(role: 'free' | 'pro' | 'premium' = 'pro') {
    const data = await fetchWithAuth('/api/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setStoredToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: User; profile: UserProfile; subscription: UserSubscription; usage: UserUsage }> {
    return fetchWithAuth('/api/auth/me');
  },

  logout() {
    removeStoredToken();
  },

  async updateProfile(profileUpdates: Partial<UserProfile>): Promise<{ profile: UserProfile }> {
    return fetchWithAuth('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileUpdates),
    });
  },

  // Subscription
  async getSubscription(): Promise<{ subscription: UserSubscription; usage: UserUsage }> {
    return fetchWithAuth('/api/subscription');
  },

  async upgradePlan(plan: 'free' | 'pro' | 'premium', billingCycle: 'monthly' | 'annual' = 'annual'): Promise<{ subscription: UserSubscription; usage: UserUsage }> {
    return fetchWithAuth('/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan, billingCycle }),
    });
  },

  // Analytics & Study Session
  async getAnalytics(): Promise<UserAnalytics> {
    return fetchWithAuth('/api/analytics');
  },

  async logStudySession(minutes: number): Promise<{ success: boolean; usage: UserUsage }> {
    return fetchWithAuth('/api/study/session', {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
  },

  // AI Tutor
  async getAiStatus(): Promise<{ connected: boolean; model: string; message: string; provider: string }> {
    return fetchWithAuth('/api/ai/status');
  },

  async getConversations(): Promise<{ conversations: AIConversation[] }> {
    return fetchWithAuth('/api/ai/conversations');
  },

  async createConversation(params: { title?: string; subject?: string; mode?: string }): Promise<{ conversation: AIConversation }> {
    return fetchWithAuth('/api/ai/conversations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getConversation(id: string): Promise<{ conversation: AIConversation; messages: AIMessage[] }> {
    return fetchWithAuth(`/api/ai/conversations/${id}`);
  },

  async deleteConversation(id: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/ai/conversations/${id}`, { method: 'DELETE' });
  },

  async renameConversation(id: string, title: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/ai/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  },

  async sendChatMessage(params: {
    conversationId?: string;
    message: string;
    subject?: string;
    mode?: string;
    documentId?: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
    studentProfile?: {
      name?: string;
      educationLevel?: string;
      studyStyle?: string;
      targetExam?: string;
      goals?: string[];
      subjects?: string[];
    };
    enableSearch?: boolean;
    enableMaps?: boolean;
    latLng?: { latitude: number; longitude: number };
  }): Promise<{
    answer?: string;
    conversationId: string;
    userMessage: AIMessage;
    assistantMessage: AIMessage;
    usage: UserUsage;
  }> {
    return fetchWithAuth('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async sendChatMessageStream(params: {
    conversationId?: string | null;
    message: string;
    mode?: string;
    subject?: string;
    documentId?: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
    studentProfile?: {
      name?: string;
      educationLevel?: string;
      studyStyle?: string;
      targetExam?: string;
      goals?: string[];
      subjects?: string[];
    };
    enableSearch?: boolean;
    enableMaps?: boolean;
    latLng?: { latitude: number; longitude: number };
    signal?: AbortSignal;
    onStart?: (data: { conversationId: string; userMessage: AIMessage }) => void;
    onChunk: (chunk: string, accumulated: string) => void;
  }): Promise<{
    conversationId: string;
    userMessage: AIMessage;
    assistantMessage: AIMessage;
    usage?: UserUsage;
  }> {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversationId: params.conversationId,
        message: params.message,
        mode: params.mode,
        subject: params.subject,
        documentId: params.documentId,
        history: params.history,
        studentProfile: params.studentProfile,
        enableSearch: params.enableSearch,
        enableMaps: params.enableMaps,
        latLng: params.latLng,
      }),
      signal: params.signal,
    });

    if (!res.ok) {
      let errText = 'Failed to stream AI response.';
      try {
        const errJson = await res.json();
        if (errJson?.error) errText = errJson.error;
      } catch {
        // ignore
      }
      throw new Error(errText);
    }

    if (!res.body) {
      throw new Error('ReadableStream not supported by client environment.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let startData: { conversationId: string; userMessage: AIMessage } | null = null;
    let finalResult: { conversationId: string; userMessage: AIMessage; assistantMessage: AIMessage; usage?: UserUsage } | null = null;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const rawJson = trimmed.slice(6);
        try {
          const payload = JSON.parse(rawJson);
          if (payload.type === 'start') {
            startData = payload;
            params.onStart?.(payload);
          } else if (payload.type === 'chunk') {
            accumulated += payload.text;
            params.onChunk(payload.text, accumulated);
          } else if (payload.type === 'done') {
            finalResult = {
              conversationId: payload.conversationId,
              userMessage: startData?.userMessage || payload.userMessage,
              assistantMessage: payload.assistantMessage,
              usage: payload.usage,
            };
          } else if (payload.type === 'error') {
            throw new Error(payload.error || 'AI generation encountered an error.');
          }
        } catch (e: any) {
          if (e.message && e.message.includes('AI generation encountered an error')) {
            throw e;
          }
        }
      }
    }

    if (finalResult) {
      return finalResult;
    }

    if (accumulated && startData) {
      return {
        conversationId: startData.conversationId,
        userMessage: startData.userMessage,
        assistantMessage: {
          id: `msg_${Date.now()}_stream_end_a`,
          conversationId: startData.conversationId,
          userId: startData.userMessage.userId,
          role: 'assistant',
          content: accumulated,
          createdAt: new Date().toISOString(),
        },
      };
    }

    throw new Error('AI generation completed without content.');
  },

  async askAiQuestion(params: {
    message: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
    studentProfile?: {
      name?: string;
      educationLevel?: string;
      studyStyle?: string;
      targetExam?: string;
      goals?: string[];
      subjects?: string[];
    };
    subject?: string;
    mode?: string;
    documentContext?: string;
  }): Promise<{
    answer: string;
    subject: string;
    mode: string;
    usage: UserUsage;
  }> {
    return fetchWithAuth('/api/ai/question', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Notes
  async getNotes(): Promise<{ notes: Note[] }> {
    return fetchWithAuth('/api/notes');
  },

  async getNote(id: string): Promise<{ note: Note }> {
    return fetchWithAuth(`/api/notes/${id}`);
  },

  async generateNote(params: { topic: string; subject?: string; inputText?: string; documentId?: string }): Promise<{ note: Note; usage: UserUsage }> {
    return fetchWithAuth('/api/notes/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async createNote(note: Partial<Note>): Promise<{ note: Note }> {
    return fetchWithAuth('/api/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<{ note: Note }> {
    return fetchWithAuth(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteNote(id: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/notes/${id}`, { method: 'DELETE' });
  },

  // Summaries
  async getSummaries(): Promise<{ summaries: Summary[] }> {
    return fetchWithAuth('/api/summaries');
  },

  async generateSummary(params: { content?: string; subject?: string; mode: 'quick' | 'detailed' | 'exam' | 'bullet' | 'concepts'; documentId?: string }): Promise<{ summary: Summary; usage: UserUsage }> {
    return fetchWithAuth('/api/summaries/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async deleteSummary(id: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/summaries/${id}`, { method: 'DELETE' });
  },

  // Documents
  async getDocuments(): Promise<{ documents: DocumentRecord[] }> {
    return fetchWithAuth('/api/documents');
  },

  async getDocument(id: string): Promise<{ document: DocumentRecord }> {
    return fetchWithAuth(`/api/documents/${id}`);
  },

  async uploadDocument(file: File, subject: string): Promise<{ document: DocumentRecord; usage: UserUsage }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    return fetchWithAuth('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/documents/${id}`, { method: 'DELETE' });
  },

  // Quizzes
  async getQuizzes(): Promise<{ quizzes: Quiz[]; attempts: QuizAttempt[] }> {
    return fetchWithAuth('/api/quizzes');
  },

  async getQuiz(id: string): Promise<{ quiz: Quiz; attempts: QuizAttempt[] }> {
    return fetchWithAuth(`/api/quizzes/${id}`);
  },

  async generateQuiz(params: {
    topic: string;
    subject?: string;
    numQuestions?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionType?: 'multiple_choice' | 'true_false' | 'short_answer';
    documentId?: string;
    noteId?: string;
  }): Promise<{ quiz: Quiz; usage: UserUsage }> {
    return fetchWithAuth('/api/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async submitQuiz(quizId: string, answers: { questionId: string; userAnswer: string }[]): Promise<{ attempt: QuizAttempt; quiz: Quiz; usage: UserUsage }> {
    return fetchWithAuth(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  async deleteQuiz(id: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/quizzes/${id}`, { method: 'DELETE' });
  },

  // Flashcards
  async getFlashcardDecks(): Promise<{ decks: FlashcardDeck[] }> {
    return fetchWithAuth('/api/flashcards/decks');
  },

  async getDeckWithCards(deckId: string): Promise<{ deck: FlashcardDeck; cards: Flashcard[] }> {
    return fetchWithAuth(`/api/flashcards/decks/${deckId}`);
  },

  async generateFlashcardDeck(params: {
    topic: string;
    subject?: string;
    numCards?: number;
    documentId?: string;
    noteId?: string;
  }): Promise<{ deck: FlashcardDeck; cards: Flashcard[]; usage: UserUsage }> {
    return fetchWithAuth('/api/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async reviewCard(cardId: string, status: 'mastered' | 'learning', wasCorrect: boolean): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/flashcards/cards/${cardId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, wasCorrect }),
    });
  },

  async deleteDeck(deckId: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/flashcards/decks/${deckId}`, { method: 'DELETE' });
  },

  // Study Planner
  async getStudyPlan(): Promise<{ plan?: StudyPlan; tasks: StudyTask[] }> {
    return fetchWithAuth('/api/planner');
  },

  async generateStudyPlan(params: {
    subjects?: string[];
    examDate?: string;
    dailyMinutes?: number;
    goals?: string[];
    studyStyle?: string;
  }): Promise<{ plan: StudyPlan; tasks: StudyTask[] }> {
    return fetchWithAuth('/api/planner/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async toggleTask(taskId: string, completed: boolean): Promise<{ task: StudyTask; usage: UserUsage }> {
    return fetchWithAuth(`/api/planner/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    });
  },

  async addCustomTask(params: { dayOfWeek: string; subject: string; topic: string; targetMinutes?: number }): Promise<{ task: StudyTask }> {
    return fetchWithAuth('/api/planner/tasks', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/planner/tasks/${taskId}`, { method: 'DELETE' });
  },

  // Achievements & Notifications
  async getAchievements(): Promise<{ achievements: Achievement[] }> {
    return fetchWithAuth('/api/achievements');
  },

  async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    return fetchWithAuth('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return fetchWithAuth('/api/notifications/read-all', { method: 'PUT' });
  },

  // Search & Contact
  async globalSearch(q: string): Promise<{ results: any[] }> {
    return fetchWithAuth(`/api/search?q=${encodeURIComponent(q)}`);
  },

  async submitContact(data: { name: string; email: string; subject: string; message: string }): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
