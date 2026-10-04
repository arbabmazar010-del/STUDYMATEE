import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import http from 'http';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { db, User, UserProfile } from './server/db.ts';
import { AIService, StudentProfileContext } from './server/gemini.ts';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Configure Multer for document uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain', 'text/markdown', 'application/json', 'text/csv'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.txt') || file.originalname.endsWith('.md')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, and Markdown files are supported.'));
    }
  },
});

// Authentication extraction middleware
interface AuthRequest extends Request {
  userId?: string;
  user?: User;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
    return;
  }
  const token = authHeader.substring(7).trim();
  // Format of simple token: user_<id> or raw ID
  const userId = token.startsWith('user_') ? token : `user_${token}`;
  const user = db.getUserById(userId) || db.getUserById(token);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized: Invalid user session' });
    return;
  }
  req.userId = user.id;
  req.user = user;
  next();
};

const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const userId = token.startsWith('user_') ? token : `user_${token}`;
    const user = db.getUserById(userId) || db.getUserById(token);
    if (user) {
      req.userId = user.id;
      req.user = user;
    }
  }
  if (!req.userId) {
    const demo = db.getUserByEmail('alex@studymat.io');
    if (demo) {
      req.userId = demo.id;
      req.user = demo;
    }
  }
  next();
};

// Seed initial demo data if database is fresh
function seedInitialData() {
  const existingAlex = db.getUserByEmail('alex@studymat.io');
  if (!existingAlex) {
    const alexUser: User = {
      id: 'user_alex_demo',
      email: 'alex@studymat.io',
      passwordHash: 'demo1234',
      name: 'Mazhar',
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const alexProfile: UserProfile = {
      userId: alexUser.id,
      educationLevel: 'Undergraduate (Sophomore)',
      subjects: ['Molecular Biology', 'Organic Chemistry', 'Calculus II'],
      goals: ['Score 3.8+ GPA', 'Master Cellular Respiration', 'Prepare for MCAT'],
      studyStyle: 'Active Recall',
      dailyTargetMinutes: 60,
      upcomingExamDate: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString().split('T')[0],
      theme: 'dark',
      notificationsEnabled: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
    db.createUser(alexUser, alexProfile, 'pro');

    // Add sample notes
    db.createNote({
      id: 'note_bio_1',
      userId: alexUser.id,
      title: 'Cellular Respiration & ATP Synthesis Master Guide',
      subject: 'Molecular Biology',
      topic: 'Cellular Metabolism',
      overview: 'Cellular respiration is the biochemical pathway by which organisms harvest energy from nutrients to synthesize ATP. It consists of glycolysis, the Krebs cycle, and oxidative phosphorylation.',
      keyConcepts: [
        'Glycolysis occurs in the cytosol and produces 2 net ATP, 2 NADH, and 2 pyruvate molecules per glucose.',
        'Pyruvate dehydrogenase links glycolysis to the mitochondrial matrix.',
        'Oxidative phosphorylation accounts for ~28-30 of the 32 total ATP generated via the electrochemical proton gradient.',
      ],
      definitions: [
        { term: 'ATP Synthase', definition: 'A rotary enzyme complex powered by the proton motive force to synthesize ATP from ADP and inorganic phosphate.' },
        { term: 'Chemiosmosis', definition: 'The movement of hydrogen ions across a semipermeable membrane down their electrochemical gradient.' },
        { term: 'NADH / FADH2', definition: 'High-energy electron carriers delivering reducing potential to Complex I and Complex II.' },
      ],
      importantFacts: [
        'Oxygen serves as the terminal electron acceptor in aerobic respiration, forming metabolic water.',
        'Uncoupling proteins (UCP-1) in brown adipose tissue generate heat instead of ATP.',
      ],
      examples: [
        'Lactic Acid Fermentation: Anaerobic glycolysis in fatigued mammalian skeletal muscle.',
      ],
      formulas: ['C6H12O6 + 6 O2 → 6 CO2 + 6 H2O + 30-32 ATP'],
      keyTakeaways: [
        'Complex I, III, and IV pump protons into the intermembrane space.',
        'Cyanide directly inhibits Cytochrome c Oxidase (Complex IV), halting ATP synthesis.',
      ],
      reviewQuestions: [
        'How many protons are pumped per pair of electrons transferred from NADH?',
        'Why does FADH2 yield fewer ATP equivalents than NADH?',
      ],
      isFavorite: true,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    });

    // Add sample quiz
    db.createQuiz({
      id: 'quiz_bio_1',
      userId: alexUser.id,
      title: 'Cellular Respiration & Bioenergetics Quiz',
      subject: 'Molecular Biology',
      topic: 'Cellular Respiration',
      difficulty: 'medium',
      isFavorite: true,
      questions: [
        {
          id: 'q1',
          question: 'Which enzyme complex in the electron transport chain does NOT pump protons across the mitochondrial inner membrane?',
          type: 'multiple_choice',
          options: ['Complex I (NADH dehydrogenase)', 'Complex II (Succinate dehydrogenase)', 'Complex III (Cytochrome bc1)', 'Complex IV (Cytochrome c oxidase)'],
          correctAnswer: 'Complex II (Succinate dehydrogenase)',
          explanation: 'Complex II transfers electrons from succinate to ubiquinone via FAD without spanning the membrane, therefore pumping zero protons.',
          topic: 'Electron Transport Chain',
        },
        {
          id: 'q2',
          question: 'What is the direct source of energy driving ATP synthase during oxidative phosphorylation?',
          type: 'multiple_choice',
          options: ['Hydrolysis of GTP in the matrix', 'The proton electrochemical gradient across the inner membrane', 'Direct cleavage of glucose molecules', 'Absorption of radiant photons'],
          correctAnswer: 'The proton electrochemical gradient across the inner membrane',
          explanation: 'Protons flowing back into the matrix through the F0 subunit drive rotation of the gamma stalk, causing conformational changes in F1 catalytic sites.',
          topic: 'Chemiosmosis',
        },
        {
          id: 'q3',
          question: 'True or False: Glycolysis requires molecular oxygen to produce pyruvate.',
          type: 'true_false',
          options: ['True', 'False'],
          correctAnswer: 'False',
          explanation: 'Glycolysis is an anaerobic pathway occurring in the cytoplasm and does not require oxygen.',
          topic: 'Glycolysis',
        },
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    });

    // Add a quiz attempt for analytics
    db.recordQuizAttempt({
      id: 'att_bio_1',
      quizId: 'quiz_bio_1',
      userId: alexUser.id,
      quizTitle: 'Cellular Respiration & Bioenergetics Quiz',
      subject: 'Molecular Biology',
      score: 3,
      totalQuestions: 3,
      percentage: 100,
      answers: [
        { questionId: 'q1', userAnswer: 'Complex II (Succinate dehydrogenase)', isCorrect: true, explanation: 'Correct' },
        { questionId: 'q2', userAnswer: 'The proton electrochemical gradient across the inner membrane', isCorrect: true, explanation: 'Correct' },
        { questionId: 'q3', userAnswer: 'False', isCorrect: true, explanation: 'Correct' },
      ],
      topicPerformance: [
        { topic: 'Electron Transport Chain', correct: 1, total: 1 },
        { topic: 'Chemiosmosis', correct: 1, total: 1 },
      ],
      completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    });

    // Add sample flashcard deck
    db.createDeckWithCards(
      {
        id: 'deck_chem_1',
        userId: alexUser.id,
        title: 'Organic Chemistry Reaction Mechanisms',
        subject: 'Organic Chemistry',
        topic: 'Nucleophilic Substitution & Elimination',
        description: 'High-yield active recall flashcards for SN1, SN2, E1, and E2 pathways.',
        cardsCount: 4,
        masteredCount: 2,
        isFavorite: true,
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
      [
        {
          id: 'card_1',
          deckId: 'deck_chem_1',
          front: 'What solvent type strongly favors SN2 reactions over SN1?',
          back: 'Polar Aprotic Solvents (e.g., Acetone, DMSO, DMF). They solvate cations but leave nucleophilic anions unencumbered and highly reactive.',
          difficulty: 'medium',
          reviewedCount: 3,
          correctCount: 3,
          status: 'mastered',
        },
        {
          id: 'card_2',
          deckId: 'deck_chem_1',
          front: 'Describe the stereochemical outcome of an SN2 substitution at a chiral carbon center.',
          back: 'Complete inversion of configuration (Walden Inversion) due to backside attack by the nucleophile opposite the leaving group.',
          difficulty: 'easy',
          reviewedCount: 2,
          correctCount: 2,
          status: 'mastered',
        },
        {
          id: 'card_3',
          deckId: 'deck_chem_1',
          front: "State Zaitsev's Rule regarding elimination (E1/E2) products.",
          back: 'The major elimination product is the more substituted, thermodynamically more stable alkene.',
          difficulty: 'medium',
          reviewedCount: 1,
          correctCount: 0,
          status: 'learning',
        },
        {
          id: 'card_4',
          deckId: 'deck_chem_1',
          front: 'Why do tertiary alkyl halides fail to undergo SN2 reactions?',
          back: 'Severe steric hindrance prevents backside attack of the nucleophile on the bulky tertiary carbon center.',
          difficulty: 'easy',
          reviewedCount: 1,
          correctCount: 0,
          status: 'learning',
        },
      ],
    );

    // Add sample study plan
    db.saveStudyPlan(
      {
        id: 'plan_alex_1',
        userId: alexUser.id,
        title: 'Midterm Prep Sprint',
        weeklyGoalHours: 12,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      [
        { id: 'task_1', planId: 'plan_alex_1', userId: alexUser.id, dayOfWeek: 'Monday', dateStr: new Date().toISOString().split('T')[0], subject: 'Molecular Biology', topic: 'Krebs Cycle Enzymes & Regulation', targetMinutes: 45, completed: true, completedAt: new Date().toISOString() },
        { id: 'task_2', planId: 'plan_alex_1', userId: alexUser.id, dayOfWeek: 'Monday', dateStr: new Date().toISOString().split('T')[0], subject: 'Organic Chemistry', topic: 'SN1 vs SN2 Mechanism Drills', targetMinutes: 30, completed: true, completedAt: new Date().toISOString() },
        { id: 'task_3', planId: 'plan_alex_1', userId: alexUser.id, dayOfWeek: 'Tuesday', dateStr: new Date(Date.now() + 86400000).toISOString().split('T')[0], subject: 'Calculus II', topic: 'Integration by Parts & Trigonometric Substitution', targetMinutes: 50, completed: false },
        { id: 'task_4', planId: 'plan_alex_1', userId: alexUser.id, dayOfWeek: 'Wednesday', dateStr: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], subject: 'Molecular Biology', topic: 'Electron Transport Chain Inhibitors', targetMinutes: 40, completed: false },
        { id: 'task_5', planId: 'plan_alex_1', userId: alexUser.id, dayOfWeek: 'Thursday', dateStr: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], subject: 'Organic Chemistry', topic: 'E1 and E2 Stereochemistry', targetMinutes: 45, completed: false },
      ],
    );
  }
}

seedInitialData();

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'StudyMat' });
});

// --- 1. Authentication Endpoints ---
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name, educationLevel, subjects } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }
  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: 'An account with this email already exists.' });
    return;
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const user: User = {
    id: userId,
    email: email.toLowerCase(),
    passwordHash: password, // In production, bcrypt; for student prototype, clean hash
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const profile: UserProfile = {
    userId,
    educationLevel: educationLevel || 'Undergraduate',
    subjects: Array.isArray(subjects) && subjects.length > 0 ? subjects : ['General Academic'],
    goals: ['Improve grades and study efficiency'],
    studyStyle: 'Active Recall',
    dailyTargetMinutes: 45,
    theme: 'dark',
    notificationsEnabled: true,
  };

  db.createUser(user, profile, 'free');
  res.json({ token: user.id, user, profile, subscription: db.getSubscription(userId) });
});

app.post('/api/auth/firebase-sync', (req, res) => {
  const { email, name, collegeSchool } = req.body;
  if (!email || !name) {
    res.status(400).json({ error: 'Name and email are required.' });
    return;
  }
  let user = db.getUserByEmail(email);
  if (!user) {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    user = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash: 'firebase_oauth',
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const profile: UserProfile = {
      userId,
      educationLevel: collegeSchool || 'Undergraduate',
      subjects: ['General Academic'],
      goals: ['Improve grades and study efficiency'],
      studyStyle: 'Active Recall',
      dailyTargetMinutes: 45,
      theme: 'dark',
      notificationsEnabled: true,
    };
    db.createUser(user, profile, 'free');
  } else {
    if (collegeSchool) {
      db.updateProfile(user.id, { educationLevel: collegeSchool });
    }
  }
  const profile = db.getProfile(user.id);
  const subscription = db.getSubscription(user.id);
  const usage = db.getUsage(user.id);
  res.json({ token: user.id, user, profile, subscription, usage });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  const user = db.getUserByEmail(email);
  if (!user || user.passwordHash !== password) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }
  const profile = db.getProfile(user.id);
  const subscription = db.getSubscription(user.id);
  const usage = db.getUsage(user.id);
  res.json({ token: user.id, user, profile, subscription, usage });
});

app.post('/api/auth/demo', (req, res) => {
  const { role = 'pro' } = req.body;
  let targetUser = db.getUserByEmail('alex@studymat.io');
  if (!targetUser) {
    seedInitialData();
    targetUser = db.getUserByEmail('alex@studymat.io')!;
  }
  if (role === 'free' || role === 'premium') {
    db.updateSubscription(targetUser.id, role);
  }
  const profile = db.getProfile(targetUser.id);
  const subscription = db.getSubscription(targetUser.id);
  const usage = db.getUsage(targetUser.id);
  res.json({ token: targetUser.id, user: targetUser, profile, subscription, usage });
});

app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const profile = db.getProfile(user.id);
  const subscription = db.getSubscription(user.id);
  const usage = db.getUsage(user.id);
  res.json({ user, profile, subscription, usage });
});

app.put('/api/auth/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const updated = db.updateProfile(req.userId!, req.body);
  res.json({ profile: updated });
});

// --- 2. Subscriptions & Plan Tier Gating ---
app.get('/api/subscription', authMiddleware, (req: AuthRequest, res: Response) => {
  const sub = db.getSubscription(req.userId!);
  const usage = db.getUsage(req.userId!);
  res.json({ subscription: sub, usage });
});

app.post('/api/subscription/upgrade', authMiddleware, (req: AuthRequest, res: Response) => {
  const { plan = 'pro', billingCycle = 'annual' } = req.body;
  const updated = db.updateSubscription(req.userId!, plan, billingCycle);
  const usage = db.getUsage(req.userId!);
  res.json({ subscription: updated, usage });
});

// --- 3. Analytics & Progress ---
app.get('/api/analytics', authMiddleware, (req: AuthRequest, res: Response) => {
  const data = db.getUserAnalytics(req.userId!);
  res.json(data);
});

app.post('/api/study/session', authMiddleware, (req: AuthRequest, res: Response) => {
  const { minutes = 15 } = req.body;
  db.addStudyMinutes(req.userId!, Number(minutes));
  const usage = db.getUsage(req.userId!);
  res.json({ success: true, usage });
});

// --- 4. AI Tutor Chat ---
app.get('/api/ai/conversations', authMiddleware, (req: AuthRequest, res: Response) => {
  const convs = db.getConversations(req.userId!);
  res.json({ conversations: convs });
});

app.post('/api/ai/conversations', authMiddleware, (req: AuthRequest, res: Response) => {
  const { title = 'New Study Session', subject = 'General', mode = 'explain' } = req.body;
  const conv = db.createConversation({
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: req.userId!,
    title,
    subject,
    mode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  res.json({ conversation: conv });
});

app.get('/api/ai/conversations/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const data = db.getConversationById(req.params.id, req.userId!);
  if (!data) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }
  res.json(data);
});

app.delete('/api/ai/conversations/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const ok = db.deleteConversation(req.params.id, req.userId!);
  res.json({ success: ok });
});

app.put('/api/ai/conversations/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { title } = req.body;
  const ok = db.renameConversation(req.params.id, req.userId!, title || 'Untitled');
  res.json({ success: ok });
});

// Gemini AI Status Check (Server-side validation, never exposes secrets)
app.get('/api/ai/status', async (_req, res) => {
  const result = await AIService.verifyConnection();
  res.json({
    connected: result.ok,
    model: result.model,
    message: result.message,
    provider: 'Google Gemini AI',
  });
});

app.post('/api/ai/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { conversationId, message, subject, mode = 'explain', documentId, history: clientHistory, studentProfile: clientProfile, enableSearch, enableMaps, latLng } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message text is required.' });
    return;
  }

  // Check rate limits & subscription
  const usageCheck = db.incrementAIUsage(req.userId!);
  if (!usageCheck.allowed) {
    res.status(429).json({
      error: 'Daily AI generation limit reached for your plan. Please upgrade to Pro for 10x higher capacity and unlimited sessions.',
      code: 'UPGRADE_REQUIRED',
    });
    return;
  }

  let convId = conversationId;
  if (!convId) {
    const newConv = db.createConversation({
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: req.userId!,
      title: message.trim().slice(0, 36) + (message.trim().length > 36 ? '...' : ''),
      subject: subject || 'General',
      mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    convId = newConv.id;
  }

  // Get conversation history: prefer client provided history if valid, otherwise load last 8 messages from DB
  let history: { role: 'user' | 'assistant'; content: string }[] = [];
  if (Array.isArray(clientHistory) && clientHistory.length > 0) {
    history = clientHistory
      .filter((h: any) => h && typeof h.content === 'string' && h.content.trim())
      .map((h: any) => ({
        role: (h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: String(h.content),
      }))
      .slice(-8);
  } else {
    const convData = db.getConversationById(convId, req.userId!);
    if (convData && convData.messages) {
      history = convData.messages.slice(-8).map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      }));
    }
  }

  // Resolve student profile context (client-provided or database-stored)
  const dbUser = req.userId ? db.getUserById(req.userId) : undefined;
  const dbProfile = req.userId ? db.getProfile(req.userId) : undefined;
  const rawProfile = clientProfile && typeof clientProfile === 'object' ? clientProfile : {};

  const resolvedProfile: StudentProfileContext = {
    name: rawProfile.name || dbUser?.name,
    educationLevel: rawProfile.educationLevel || dbProfile?.educationLevel,
    studyStyle: rawProfile.studyStyle || dbProfile?.studyStyle,
    targetExam: rawProfile.targetExam || dbProfile?.upcomingExamDate,
    goals: Array.isArray(rawProfile.goals) ? rawProfile.goals : dbProfile?.goals,
    subjects: Array.isArray(rawProfile.subjects) ? rawProfile.subjects : dbProfile?.subjects,
  };

  let docText = '';
  if (documentId) {
    const doc = db.getDocumentById(documentId, req.userId!);
    if (doc) docText = doc.extractedText;
  }

  // Save user message to persistent DB
  const userMsg = db.addMessage({
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_u`,
    conversationId: convId,
    userId: req.userId!,
    role: 'user',
    content: message.trim(),
    studyMode: mode,
    createdAt: new Date().toISOString(),
  });

  try {
    const aiResult = await AIService.getTutorResponse({
      message: message.trim(),
      history,
      subject: subject || 'General',
      mode,
      documentContext: docText,
      studentProfile: resolvedProfile,
      enableSearch,
      enableMaps,
      latLng,
    });

    let aiResponseText = aiResult.text;
    const chunks = aiResult.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      const links: string[] = [];
      for (const chunk of chunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          links.push(`- [${chunk.web.title}](${chunk.web.uri})`);
        } else if (chunk.maps?.uri && chunk.maps?.title) {
          links.push(`- 📍 [${chunk.maps.title}](${chunk.maps.uri})`);
        }
      }
      if (links.length > 0) {
        aiResponseText += '\n\n**Sources & Grounding:**\n' + links.join('\n');
      }
    }

    const assistantMsg = db.addMessage({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_a`,
      conversationId: convId,
      userId: req.userId!,
      role: 'assistant',
      content: aiResponseText,
      studyMode: mode,
      createdAt: new Date().toISOString(),
    });

    res.json({
      answer: aiResponseText,
      conversationId: convId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      usage: db.getUsage(req.userId!),
    });
  } catch (err: any) {
    console.error('Chat error:', err?.message || err);
    const safeError = err?.message && !err.message.toLowerCase().includes('key') && !err.message.includes('at ')
      ? err.message
      : 'Failed to generate AI tutor response. Please try again.';
    res.status(500).json({ error: safeError });
  }
});

// Real-Time Streaming AI Chat Endpoint (Server-Sent Events)
app.post('/api/ai/chat/stream', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { conversationId, message, subject, mode = 'explain', documentId, history: clientHistory, studentProfile: clientProfile, enableSearch, enableMaps, latLng } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message text is required.' });
    return;
  }

  // Check rate limits & subscription
  const usageCheck = db.incrementAIUsage(req.userId!);
  if (!usageCheck.allowed) {
    res.status(429).json({
      error: 'Daily AI generation limit reached for your plan. Please upgrade to Pro for unlimited sessions.',
      code: 'UPGRADE_REQUIRED',
    });
    return;
  }

  let convId = conversationId;
  if (!convId) {
    const newConv = db.createConversation({
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: req.userId!,
      title: message.trim().slice(0, 36) + (message.trim().length > 36 ? '...' : ''),
      subject: subject || 'General',
      mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    convId = newConv.id;
  }

  // Get conversation history
  let history: { role: 'user' | 'assistant'; content: string }[] = [];
  if (Array.isArray(clientHistory) && clientHistory.length > 0) {
    history = clientHistory
      .filter((h: any) => h && typeof h.content === 'string' && h.content.trim())
      .map((h: any) => ({
        role: (h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: String(h.content),
      }))
      .slice(-8);
  } else {
    const convData = db.getConversationById(convId, req.userId!);
    if (convData && convData.messages) {
      history = convData.messages.slice(-8).map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      }));
    }
  }

  // Resolve student profile context
  const dbUser = req.userId ? db.getUserById(req.userId) : undefined;
  const dbProfile = req.userId ? db.getProfile(req.userId) : undefined;
  const rawProfile = clientProfile && typeof clientProfile === 'object' ? clientProfile : {};

  const resolvedProfile: StudentProfileContext = {
    name: rawProfile.name || dbUser?.name,
    educationLevel: rawProfile.educationLevel || dbProfile?.educationLevel,
    studyStyle: rawProfile.studyStyle || dbProfile?.studyStyle,
    targetExam: rawProfile.targetExam || dbProfile?.upcomingExamDate,
    goals: Array.isArray(rawProfile.goals) ? rawProfile.goals : dbProfile?.goals,
    subjects: Array.isArray(rawProfile.subjects) ? rawProfile.subjects : dbProfile?.subjects,
  };

  let docText = '';
  if (documentId) {
    const doc = db.getDocumentById(documentId, req.userId!);
    if (doc) docText = doc.extractedText;
  }

  // Save user message to persistent DB
  const userMsg = db.addMessage({
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_u`,
    conversationId: convId,
    userId: req.userId!,
    role: 'user',
    content: message.trim(),
    studyMode: mode,
    createdAt: new Date().toISOString(),
  });

  // Prepare SSE connection
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
  });

  // Send initial handshake with conversation and user message details
  res.write(`data: ${JSON.stringify({ type: 'start', conversationId: convId, userMessage: userMsg })}\n\n`);

  try {
    const streamResult = await AIService.streamTutorResponse(
      {
        message: message.trim(),
        history,
        subject: subject || 'General',
        mode,
        documentContext: docText,
        studentProfile: resolvedProfile,
        enableSearch,
        enableMaps,
        latLng,
      },
      (chunkText: string) => {
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
        }
      }
    );

    let finalText = streamResult.text;
    const chunks = streamResult.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      const links: string[] = [];
      for (const chunk of chunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          links.push(`- [${chunk.web.title}](${chunk.web.uri})`);
        } else if (chunk.maps?.uri && chunk.maps?.title) {
          links.push(`- 📍 [${chunk.maps.title}](${chunk.maps.uri})`);
        }
      }
      if (links.length > 0) {
        finalText += '\n\n**Sources & Grounding:**\n' + links.join('\n');
      }
    }

    // Save final assistant response to DB
    const assistantMsg = db.addMessage({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_a`,
      conversationId: convId,
      userId: req.userId!,
      role: 'assistant',
      content: finalText,
      studyMode: mode,
      createdAt: new Date().toISOString(),
    });

    if (!clientDisconnected) {
      res.write(`data: ${JSON.stringify({
        type: 'done',
        conversationId: convId,
        assistantMessage: assistantMsg,
        usage: db.getUsage(req.userId!),
      })}\n\n`);
      res.end();
    }
  } catch (err: any) {
    console.error('Streaming chat error:', err?.message || err);
    const safeError = err?.message && !err.message.toLowerCase().includes('key') && !err.message.includes('at ')
      ? err.message
      : 'Failed to generate AI tutor response. Please try again.';

    if (!clientDisconnected) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: safeError })}\n\n`);
      res.end();
    }
  }
});

// Dedicated AI Question Endpoint
app.post(['/api/ai/question', '/api/ai/ask'], authMiddleware, async (req: AuthRequest, res: Response) => {
  const { message, history: clientHistory, studentProfile: clientProfile, subject = 'General', mode = 'explain', documentContext } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Question message is required.' });
    return;
  }

  // Check rate limits & subscription
  const usageCheck = db.incrementAIUsage(req.userId!);
  if (!usageCheck.allowed) {
    res.status(429).json({
      error: 'Daily AI generation limit reached for your plan. Please upgrade to Pro for unlimited sessions.',
      code: 'UPGRADE_REQUIRED',
    });
    return;
  }

  // Format conversation history if provided
  let history: { role: 'user' | 'assistant'; content: string }[] = [];
  if (Array.isArray(clientHistory)) {
    history = clientHistory
      .filter((h: any) => h && typeof h.content === 'string' && h.content.trim())
      .map((h: any) => ({
        role: (h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: String(h.content),
      }))
      .slice(-8);
  }

  // Resolve student profile context
  const dbUser = req.userId ? db.getUserById(req.userId) : undefined;
  const dbProfile = req.userId ? db.getProfile(req.userId) : undefined;
  const rawProfile = clientProfile && typeof clientProfile === 'object' ? clientProfile : {};

  const resolvedProfile: StudentProfileContext = {
    name: rawProfile.name || dbUser?.name,
    educationLevel: rawProfile.educationLevel || dbProfile?.educationLevel,
    studyStyle: rawProfile.studyStyle || dbProfile?.studyStyle,
    targetExam: rawProfile.targetExam || dbProfile?.upcomingExamDate,
    goals: Array.isArray(rawProfile.goals) ? rawProfile.goals : dbProfile?.goals,
    subjects: Array.isArray(rawProfile.subjects) ? rawProfile.subjects : dbProfile?.subjects,
  };

  try {
    const aiResponseText = await AIService.getTutorResponse({
      message: message.trim(),
      history,
      subject,
      mode,
      documentContext: typeof documentContext === 'string' ? documentContext : undefined,
      studentProfile: resolvedProfile,
    });

    res.json({
      answer: aiResponseText,
      subject,
      mode,
      usage: db.getUsage(req.userId!),
    });
  } catch (err: any) {
    console.error('Question endpoint error:', err?.message || err);
    const safeError = err?.message && !err.message.toLowerCase().includes('key') && !err.message.includes('at ')
      ? err.message
      : 'Failed to process AI question. Please try again.';
    res.status(500).json({ error: safeError });
  }
});

// --- 5. Notes Endpoints ---
app.get('/api/notes', authMiddleware, (req: AuthRequest, res: Response) => {
  const notes = db.getNotes(req.userId!);
  res.json({ notes });
});

app.get('/api/notes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const note = db.getNoteById(req.params.id, req.userId!);
  if (!note) {
    res.status(404).json({ error: 'Note not found.' });
    return;
  }
  res.json({ note });
});

app.post('/api/notes/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { topic, subject = 'Academic Studies', inputText = '', documentId } = req.body;
  if (!topic) {
    res.status(400).json({ error: 'Topic is required to generate notes.' });
    return;
  }

  const usageCheck = db.incrementAIUsage(req.userId!);
  if (!usageCheck.allowed) {
    res.status(429).json({ error: 'Daily AI limit reached. Please upgrade to Pro.', code: 'UPGRADE_REQUIRED' });
    return;
  }

  let fullSource = inputText;
  if (documentId) {
    const doc = db.getDocumentById(documentId, req.userId!);
    if (doc) fullSource = doc.extractedText + '\n' + inputText;
  }

  try {
    const generated = await AIService.generateNotes({ topic, subject, inputText: fullSource });
    const newNote = db.createNote({
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: req.userId!,
      title: generated.title || `${topic} Notes`,
      subject,
      topic,
      overview: generated.overview,
      keyConcepts: generated.keyConcepts || [],
      definitions: generated.definitions || [],
      importantFacts: generated.importantFacts || [],
      examples: generated.examples || [],
      formulas: generated.formulas || [],
      keyTakeaways: generated.keyTakeaways || [],
      reviewQuestions: generated.reviewQuestions || [],
      isFavorite: false,
      sourceDocId: documentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ note: newNote, usage: db.getUsage(req.userId!) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate study notes.' });
  }
});

app.post('/api/notes', authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, subject, topic, overview, keyConcepts, definitions, importantFacts, examples, formulas, keyTakeaways, reviewQuestions, contentMarkdown } = req.body;
  const note = db.createNote({
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: req.userId!,
    title: title || 'Untitled Note',
    subject: subject || 'General',
    topic: topic || 'General',
    overview: overview || '',
    keyConcepts: keyConcepts || [],
    definitions: definitions || [],
    importantFacts: importantFacts || [],
    examples: examples || [],
    formulas: formulas || [],
    keyTakeaways: keyTakeaways || [],
    reviewQuestions: reviewQuestions || [],
    contentMarkdown: contentMarkdown || '',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  res.json({ note });
});

app.put('/api/notes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const updated = db.updateNote(req.params.id, req.userId!, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Note not found.' });
    return;
  }
  res.json({ note: updated });
});

app.delete('/api/notes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const ok = db.deleteNote(req.params.id, req.userId!);
  res.json({ success: ok });
});

// --- 6. Summaries Endpoints ---
app.get('/api/summaries', authMiddleware, (req: AuthRequest, res: Response) => {
  const summaries = db.getSummaries(req.userId!);
  res.json({ summaries });
});

app.post('/api/summaries/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { content, subject = 'General', mode = 'quick', documentId } = req.body;

  let textToSummarize = content || '';
  if (documentId) {
    const doc = db.getDocumentById(documentId, req.userId!);
    if (doc) textToSummarize = doc.extractedText;
  }

  if (!textToSummarize || textToSummarize.trim().length < 20) {
    res.status(400).json({ error: 'Content of at least 20 characters is required to generate a summary.' });
    return;
  }

  const usageCheck = db.incrementAIUsage(req.userId!);
  if (!usageCheck.allowed) {
    res.status(429).json({ error: 'Daily AI limit reached. Please upgrade to Pro.', code: 'UPGRADE_REQUIRED' });
    return;
  }

  try {
    const gen = await AIService.generateSummary({ content: textToSummarize, subject, mode });
    const summary = db.createSummary({
      id: `sum_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: req.userId!,
      title: gen.title,
      subject,
      mode,
      summaryText: gen.summaryText,
      bulletPoints: gen.bulletPoints,
      keyTakeaways: gen.keyTakeaways,
      sourceType: documentId ? 'document' : 'text',
      createdAt: new Date().toISOString(),
    });
    res.json({ summary, usage: db.getUsage(req.userId!) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

app.delete('/api/summaries/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const ok = db.deleteSummary(req.params.id, req.userId!);
  res.json({ success: ok });
});

// --- 7. Documents & PDF Upload Endpoints ---
app.get('/api/documents', authMiddleware, (req: AuthRequest, res: Response) => {
  const docs = db.getDocuments(req.userId!);
  res.json({ documents: docs });
});

app.get('/api/documents/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const doc = db.getDocumentById(req.params.id, req.userId!);
  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }
  res.json({ document: doc });
});

app.post('/api/documents/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const file = req.file;
  const { subject = 'General Academic' } = req.body;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded.' });
    return;
  }

  // Check upload limit
  const usage = db.getUsage(req.userId!);
  if (usage.documentsUploaded >= usage.documentsLimit) {
    // delete uploaded file
    try { fs.unlinkSync(file.path); } catch {}
    res.status(429).json({
      error: `You have reached your limit of ${usage.documentsLimit} document uploads. Upgrade to Pro for 25 uploads or Premium for unlimited.`,
      code: 'UPGRADE_REQUIRED',
    });
    return;
  }

  let extractedText = '';
  try {
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      // Try pdf-parse or fallback to string extraction
      try {
        const pdfParseMod: any = await import('pdf-parse');
        const pdfParse = pdfParseMod.default || pdfParseMod;
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text || '';
      } catch (pdfErr) {
        console.warn('pdf-parse failed, using raw buffer conversion:', pdfErr);
        extractedText = dataBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      }
    } else {
      extractedText = fs.readFileSync(file.path, 'utf-8');
    }
  } catch (readErr) {
    console.error('File reading error:', readErr);
    extractedText = 'Extracted study material content from ' + file.originalname;
  }

  // Clean and trim text
  extractedText = extractedText.trim();
  if (extractedText.length === 0) {
    extractedText = `Study Document: ${file.originalname}\nProcessed text ready for AI question answering, note generation, quizzes, and summaries.`;
  }

  const docRecord = db.createDocument({
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: req.userId!,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    extractedText,
    summaryPreview: extractedText.slice(0, 240) + '...',
    subject,
    createdAt: new Date().toISOString(),
  });

  res.json({ document: docRecord, usage: db.getUsage(req.userId!) });
});

app.delete('/api/documents/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const ok = db.deleteDocument(req.params.id, req.userId!);
  res.json({ success: ok });
});

// --- 8. Quizzes Endpoints ---
app.get('/api/quizzes', authMiddleware, (req: AuthRequest, res: Response) => {
  const quizzes = db.getQuizzes(req.userId!);
  const attempts = db.getQuizAttempts(req.userId!);
  res.json({ quizzes, attempts });
});

app.get('/api/quizzes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const quiz = db.getQuizById(req.params.id, req.userId!);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }
  const attempts = db.getQuizAttempts(req.userId!).filter((a) => a.quizId === quiz.id);
  res.json({ quiz, attempts });
});

app.post('/api/quizzes/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { topic, subject = 'Academic Studies', numQuestions = 5, difficulty = 'medium', questionType = 'multiple_choice', documentId, noteId } = req.body;

  if (!topic) {
    res.status(400).json({ error: 'Topic is required.' });
    return;
  }

  // Free users are capped at 5 questions per quiz
  const sub = db.getSubscription(req.userId!);
  const questionCount = sub.plan === 'free' ? Math.min(Number(numQuestions) || 5, 5) : Number(numQuestions) || 5;

  const usageCheck = db.incrementAIUsage(req.userId!);
  if (!usageCheck.allowed) {
    res.status(429).json({ error: 'Daily AI limit reached. Please upgrade to Pro.', code: 'UPGRADE_REQUIRED' });
    return;
  }

  let sourceText = '';
  if (documentId) {
    const doc = db.getDocumentById(documentId, req.userId!);
    if (doc) sourceText += doc.extractedText + '\n';
  }
  if (noteId) {
    const note = db.getNoteById(noteId, req.userId!);
    if (note) sourceText += note.overview + '\n' + note.keyConcepts.join('\n');
  }

  try {
    const generated = await AIService.generateQuiz({
      topic,
      subject,
      numQuestions: questionCount,
      difficulty,
      questionType,
      sourceText,
    });

    const newQuiz = db.createQuiz({
      id: `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: req.userId!,
      title: generated.title || `${topic} Quiz`,
      subject,
      topic,
      difficulty,
      questions: generated.questions,
      timeLimitMinutes: questionCount * 2,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    });

    res.json({ quiz: newQuiz, usage: db.getUsage(req.userId!) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
});

app.post('/api/quizzes/:id/submit', authMiddleware, (req: AuthRequest, res: Response) => {
  const { answers } = req.body; // array of { questionId, userAnswer }
  const quiz = db.getQuizById(req.params.id, req.userId!);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  let correctCount = 0;
  const gradedAnswers = quiz.questions.map((q) => {
    const userSubmission = (answers || []).find((a: any) => a.questionId === q.id);
    const userAnswer = userSubmission ? userSubmission.userAnswer : '';
    // Comparison
    const isCorrect = q.type === 'short_answer'
      ? userAnswer.trim().toLowerCase().includes(q.correctAnswer.toLowerCase()) || q.correctAnswer.toLowerCase().includes(userAnswer.trim().toLowerCase())
      : userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

    if (isCorrect) correctCount += 1;
    return {
      questionId: q.id,
      userAnswer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const percentage = Math.round((correctCount / quiz.questions.length) * 100);

  const attempt = db.recordQuizAttempt({
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    quizId: quiz.id,
    userId: req.userId!,
    quizTitle: quiz.title,
    subject: quiz.subject,
    score: correctCount,
    totalQuestions: quiz.questions.length,
    percentage,
    answers: gradedAnswers,
    topicPerformance: [{ topic: quiz.topic, correct: correctCount, total: quiz.questions.length }],
    completedAt: new Date().toISOString(),
  });

  res.json({ attempt, quiz, usage: db.getUsage(req.userId!) });
});

app.delete('/api/quizzes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const ok = db.deleteQuiz(req.params.id, req.userId!);
  res.json({ success: ok });
});

// --- 9. Flashcards Endpoints ---
app.get('/api/flashcards/decks', authMiddleware, (req: AuthRequest, res: Response) => {
  const decks = db.getDecks(req.userId!);
  res.json({ decks });
});

app.get('/api/flashcards/decks/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const data = db.getDeckWithCards(req.params.id, req.userId!);
  if (!data) {
    res.status(404).json({ error: 'Deck not found.' });
    return;
  }
  res.json(data);
});

app.post('/api/flashcards/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { topic, subject = 'Academic Studies', numCards = 6, documentId, noteId } = req.body;

  if (!topic) {
    res.status(400).json({ error: 'Topic is required.' });
    return;
  }

  const usageCheck = db.incrementAIUsage(req.userId!);
  if (!usageCheck.allowed) {
    res.status(429).json({ error: 'Daily AI limit reached. Please upgrade to Pro.', code: 'UPGRADE_REQUIRED' });
    return;
  }

  let sourceText = '';
  if (documentId) {
    const doc = db.getDocumentById(documentId, req.userId!);
    if (doc) sourceText += doc.extractedText + '\n';
  }
  if (noteId) {
    const note = db.getNoteById(noteId, req.userId!);
    if (note) sourceText += note.overview + '\n' + note.keyConcepts.join('\n');
  }

  try {
    const generated = await AIService.generateFlashcards({ topic, subject, numCards: Number(numCards) || 6, sourceText });
    const deckId = `deck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const cards = generated.cards.map((c, idx) => ({
      id: `card_${Date.now()}_${idx}`,
      deckId,
      front: c.front,
      back: c.back,
      topic: c.topic || topic,
      difficulty: c.difficulty || 'medium',
      reviewedCount: 0,
      correctCount: 0,
      status: 'new' as const,
    }));

    const result = db.createDeckWithCards(
      {
        id: deckId,
        userId: req.userId!,
        title: generated.title || `${topic} Flashcards`,
        subject,
        topic,
        description: generated.description || `Essential active recall cards for ${topic}`,
        cardsCount: cards.length,
        masteredCount: 0,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      cards,
    );

    res.json({ ...result, usage: db.getUsage(req.userId!) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate flashcards.' });
  }
});

app.post('/api/flashcards/cards/:id/review', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status, wasCorrect } = req.body; // status: 'mastered' | 'learning'
  db.updateCardProgress(req.params.id, status || 'learning', Boolean(wasCorrect));
  res.json({ success: true });
});

app.delete('/api/flashcards/decks/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const ok = db.deleteDeck(req.params.id, req.userId!);
  res.json({ success: ok });
});

// --- 10. Study Planner Endpoints ---
app.get('/api/planner', authMiddleware, (req: AuthRequest, res: Response) => {
  const planData = db.getStudyPlan(req.userId!);
  res.json(planData);
});

app.post('/api/planner/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { subjects, examDate, dailyMinutes = 60, goals, studyStyle } = req.body;
  const profile = db.getProfile(req.userId!);

  const sub = db.getSubscription(req.userId!);
  if (sub.plan === 'free') {
    res.status(403).json({
      error: 'AI Study Planner is a Pro feature. Upgrade to unlock personalized multi-subject schedules and exam roadmaps.',
      code: 'UPGRADE_REQUIRED',
    });
    return;
  }

  const effectiveSubjects = Array.isArray(subjects) && subjects.length > 0 ? subjects : (profile?.subjects || ['General Studies']);
  const effectiveGoals = Array.isArray(goals) && goals.length > 0 ? goals : (profile?.goals || ['Master key topics']);
  const effectiveStyle = studyStyle || profile?.studyStyle || 'Active Recall';

  try {
    const generated = await AIService.generateStudyPlan({
      subjects: effectiveSubjects,
      examDate,
      dailyMinutes: Number(dailyMinutes) || 60,
      studyGoals: effectiveGoals,
      studyStyle: effectiveStyle,
    });

    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tasks = generated.tasks.map((t, idx) => ({
      id: `task_${Date.now()}_${idx}`,
      planId,
      userId: req.userId!,
      dayOfWeek: t.dayOfWeek,
      dateStr: t.dateStr,
      subject: t.subject,
      topic: t.topic,
      targetMinutes: t.targetMinutes,
      completed: false,
    }));

    const result = db.saveStudyPlan(
      {
        id: planId,
        userId: req.userId!,
        title: generated.title,
        examDate,
        weeklyGoalHours: generated.weeklyGoalHours,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      tasks,
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate study plan.' });
  }
});

app.put('/api/planner/tasks/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { completed } = req.body;
  const updated = db.updateTask(req.params.id, req.userId!, Boolean(completed));
  if (!updated) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }
  res.json({ task: updated, usage: db.getUsage(req.userId!) });
});

app.post('/api/planner/tasks', authMiddleware, (req: AuthRequest, res: Response) => {
  const { dayOfWeek, subject, topic, targetMinutes = 30 } = req.body;
  const planData = db.getStudyPlan(req.userId!);
  const planId = planData.plan?.id || 'default_plan';

  const task = db.addTask({
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    planId,
    userId: req.userId!,
    dayOfWeek: dayOfWeek || 'Today',
    dateStr: new Date().toISOString().split('T')[0],
    subject: subject || 'General',
    topic: topic || 'Review Topic',
    targetMinutes: Number(targetMinutes) || 30,
    completed: false,
  });

  res.json({ task });
});

app.delete('/api/planner/tasks/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const ok = db.deleteTask(req.params.id, req.userId!);
  res.json({ success: ok });
});

// --- 11. Achievements & Notifications ---
app.get('/api/achievements', authMiddleware, (req: AuthRequest, res: Response) => {
  const achievements = db.getAchievements(req.userId!);
  res.json({ achievements });
});

app.get('/api/notifications', authMiddleware, (req: AuthRequest, res: Response) => {
  const notifs = db.getNotifications(req.userId!);
  res.json({ notifications: notifs });
});

app.put('/api/notifications/:id/read', authMiddleware, (req: AuthRequest, res: Response) => {
  const ok = db.markNotificationRead(req.params.id, req.userId!);
  res.json({ success: ok });
});

app.put('/api/notifications/read-all', authMiddleware, (req: AuthRequest, res: Response) => {
  const ok = db.markAllNotificationsRead(req.userId!);
  res.json({ success: ok });
});

// --- 12. Contact Form ---
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email, and message are required.' });
    return;
  }
  // Store support inquiry
  console.log(`[StudyMat Support Inquiry] From: ${name} <${email}> | Subject: ${subject}`);
  res.json({
    success: true,
    message: 'Thank you for reaching out! Our academic support team has received your inquiry and will reply within 24 hours.',
  });
});

// --- 13. Universal Global Search ---
app.get('/api/search', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  const rawQuery = ((req.query.q as string) || '').trim();
  const query = rawQuery.toLowerCase();

  const userId = req.userId || 'user_alex_demo';
  const profile = db.getProfile(userId);
  const userNotes = db.getNotes(userId);
  const userDocs = db.getDocuments(userId);
  const userQuizzes = db.getQuizzes(userId);
  const userDecks = db.getDecks(userId);
  const userConvs = db.getConversations(userId);
  const { plan: userPlan, tasks: userTasks } = db.getStudyPlan(userId);

  const results: any[] = [];

  // If query is empty, return smart starter suggestions
  if (!query) {
    // 1. Featured Subjects
    const allSubjects = new Set<string>();
    if (profile?.subjects) profile.subjects.forEach((s) => allSubjects.add(s));
    userNotes.forEach((n) => n.subject && allSubjects.add(n.subject));
    userDocs.forEach((d) => d.subject && allSubjects.add(d.subject));
    if (allSubjects.size === 0) {
      allSubjects.add('Molecular Biology');
      allSubjects.add('Organic Chemistry');
      allSubjects.add('Calculus II');
    }

    allSubjects.forEach((subj) => {
      results.push({
        id: `subj_${subj}`,
        title: subj,
        type: 'subject',
        category: 'Subjects',
        subject: subj,
        subtitle: `Explore ${subj} notes, practice questions, and study schedule`,
        route: 'ai-tutor',
        routeParams: { subject: subj, prompt: `Let's study ${subj}: summarize the core concepts and test my understanding.` },
        aiPrompt: `Let's study ${subj}: summarize the core concepts and test my understanding.`,
      });
    });

    // 2. Active Study Plan
    if (userPlan) {
      results.push({
        id: userPlan.id,
        title: `Study Plan: ${userPlan.title}`,
        type: 'study-plan',
        category: 'Study Plans',
        subject: 'Academic Blueprint',
        subtitle: `Weekly Target: ${userPlan.weeklyGoalHours} hrs/week • Exam: ${userPlan.examDate || 'Scheduled'}`,
        route: 'study-planner',
        routeParams: {},
        aiPrompt: `Help me plan and break down today's study session for my ${userPlan.title}.`,
      });
    }

    // 3. Saved / Favorite Notes
    const favNotes = userNotes.filter((n) => n.isFavorite);
    (favNotes.length > 0 ? favNotes : userNotes.slice(0, 3)).forEach((n) => {
      results.push({
        id: n.id,
        title: n.title,
        type: 'note',
        category: 'Saved Content',
        subject: n.subject,
        subtitle: n.overview ? n.overview.slice(0, 100) + '...' : `Study Guide • ${n.topic}`,
        isFavorite: n.isFavorite,
        route: 'library',
        routeParams: { noteId: n.id, tab: 'notes' },
        aiPrompt: `Help me study my note on "${n.title}" (${n.subject}). Ask me conceptual test questions.`,
      });
    });

    res.json({ results });
    return;
  }

  // --- QUERY RESULTS ---

  // 1. Direct AI Tutor Question Action (Highest relevance for queries)
  results.push({
    id: `ai_ask_${Date.now()}`,
    title: `Ask AI Tutor: "${rawQuery}"`,
    type: 'ai-tutor',
    category: 'AI Tutor',
    subject: profile?.subjects?.[0] || 'General',
    subtitle: 'Launch instant Socratic explanation, step-by-step breakdown & active drill',
    route: 'ai-tutor',
    routeParams: { prompt: rawQuery, subject: profile?.subjects?.[0] || 'General' },
    aiPrompt: rawQuery,
  });

  // 2. Subjects Matching
  const allSubjects = new Set<string>();
  if (profile?.subjects) profile.subjects.forEach((s) => allSubjects.add(s));
  userNotes.forEach((n) => n.subject && allSubjects.add(n.subject));
  userDocs.forEach((d) => d.subject && allSubjects.add(d.subject));
  userQuizzes.forEach((q) => q.subject && allSubjects.add(q.subject));

  allSubjects.forEach((subj) => {
    if (subj.toLowerCase().includes(query)) {
      results.push({
        id: `subj_${subj}`,
        title: subj,
        type: 'subject',
        category: 'Subjects',
        subject: subj,
        subtitle: `Open ${subj} in AI Tutor & access all relevant study materials`,
        route: 'ai-tutor',
        routeParams: { subject: subj, prompt: `Let's study ${subj}: summarize the core concepts and test my understanding.` },
        aiPrompt: `Let's study ${subj}: summarize the core concepts and test my understanding.`,
      });
    }
  });

  // 3. Topics Matching
  const allTopics = new Set<string>();
  const topicMap = new Map<string, string>();
  userNotes.forEach((n) => {
    if (n.topic) {
      allTopics.add(n.topic);
      topicMap.set(n.topic, n.subject);
    }
  });
  userQuizzes.forEach((q) => {
    if (q.topic) {
      allTopics.add(q.topic);
      topicMap.set(q.topic, q.subject);
    }
  });
  userDecks.forEach((d) => {
    if (d.topic) {
      allTopics.add(d.topic);
      topicMap.set(d.topic, d.subject);
    }
  });
  userTasks.forEach((t) => {
    if (t.topic) {
      allTopics.add(t.topic);
      topicMap.set(t.topic, t.subject);
    }
  });

  allTopics.forEach((top) => {
    if (top.toLowerCase().includes(query)) {
      const subj = topicMap.get(top) || 'General';
      results.push({
        id: `top_${top}`,
        title: top,
        type: 'topic',
        category: 'Topics',
        subject: subj,
        subtitle: `Explain key mechanisms, formulas, and principles of ${top}`,
        route: 'ai-tutor',
        routeParams: { subject: subj, prompt: `Explain the mechanisms and principles of ${top} in ${subj}.` },
        aiPrompt: `Explain the mechanisms and principles of ${top} in ${subj}.`,
      });
    }
  });

  // 4. Notes (including Saved / Favorites)
  userNotes.forEach((n) => {
    const match =
      n.title.toLowerCase().includes(query) ||
      n.topic.toLowerCase().includes(query) ||
      n.subject.toLowerCase().includes(query) ||
      (n.overview && n.overview.toLowerCase().includes(query)) ||
      (n.keyConcepts && n.keyConcepts.some((kc) => kc.toLowerCase().includes(query)));
    if (match) {
      results.push({
        id: n.id,
        title: n.title,
        type: 'note',
        category: n.isFavorite ? 'Saved Content' : 'Notes',
        subject: n.subject,
        topic: n.topic,
        subtitle: n.overview ? n.overview.slice(0, 100) + '...' : `Study Guide • ${n.topic}`,
        isFavorite: n.isFavorite,
        route: 'library',
        routeParams: { noteId: n.id, tab: 'notes' },
        aiPrompt: `Help me review and master my note on "${n.title}" (${n.subject}). Give me 3 active recall questions.`,
      });
    }
  });

  // 5. Documents
  userDocs.forEach((d) => {
    const match =
      d.fileName.toLowerCase().includes(query) ||
      d.subject.toLowerCase().includes(query) ||
      (d.summaryPreview && d.summaryPreview.toLowerCase().includes(query)) ||
      (d.extractedText && d.extractedText.toLowerCase().includes(query));
    if (match) {
      results.push({
        id: d.id,
        title: d.fileName,
        type: 'document',
        category: 'Documents',
        subject: d.subject,
        subtitle: d.summaryPreview ? d.summaryPreview.slice(0, 100) + '...' : `Uploaded Study Document • ${(d.fileSize / 1024).toFixed(1)} KB`,
        route: 'library',
        routeParams: { docId: d.id, tab: 'documents' },
        aiPrompt: `Explain the key concepts and formulas from my document "${d.fileName}".`,
      });
    }
  });

  // 6. Timetable / Study Timings & Study Plans
  if (userPlan && (userPlan.title.toLowerCase().includes(query) || (userPlan.examDate && userPlan.examDate.includes(query)))) {
    results.push({
      id: userPlan.id,
      title: `Study Plan: ${userPlan.title}`,
      type: 'study-plan',
      category: 'Study Plans',
      subject: 'Academic Blueprint',
      subtitle: `Target: ${userPlan.weeklyGoalHours} hrs/week • Exam: ${userPlan.examDate || 'Scheduled'}`,
      route: 'study-planner',
      routeParams: {},
      aiPrompt: `Help me optimize my schedule and strategy for my ${userPlan.title}.`,
    });
  }

  userTasks.forEach((t) => {
    const match =
      t.topic.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query) ||
      t.dayOfWeek.toLowerCase().includes(query) ||
      t.dateStr.includes(query);
    if (match) {
      results.push({
        id: t.id,
        title: `${t.topic} (${t.dayOfWeek})`,
        type: 'timetable',
        category: 'Timetable',
        subject: t.subject,
        subtitle: `Timetable: ${t.targetMinutes} mins session • ${t.dateStr} • ${t.completed ? 'Completed ✓' : 'Upcoming Session'}`,
        route: 'study-planner',
        routeParams: {},
        aiPrompt: `I have a study session scheduled for ${t.topic} in ${t.subject} (${t.targetMinutes} mins). Let's review the essentials!`,
      });
    }
  });

  // 7. Previous Conversations (AI Tutor Sessions)
  userConvs.forEach((c) => {
    const match =
      c.title.toLowerCase().includes(query) ||
      c.subject.toLowerCase().includes(query) ||
      c.mode.toLowerCase().includes(query);
    if (match) {
      results.push({
        id: c.id,
        title: c.title,
        type: 'conversation',
        category: 'Previous Conversations',
        subject: c.subject,
        subtitle: `Previous AI Session (${c.mode.toUpperCase()} mode) • ${new Date(c.updatedAt).toLocaleDateString()}`,
        route: 'ai-tutor',
        routeParams: { convId: c.id },
        aiPrompt: `Continue our study session on "${c.title}".`,
      });
    }
  });

  // 8. Quizzes & Flashcards (including Saved Content)
  userQuizzes.forEach((q) => {
    if (q.title.toLowerCase().includes(query) || q.subject.toLowerCase().includes(query) || q.topic.toLowerCase().includes(query)) {
      results.push({
        id: q.id,
        title: q.title,
        type: 'quiz',
        category: q.isFavorite ? 'Saved Content' : 'Quizzes',
        subject: q.subject,
        subtitle: `${q.difficulty.toUpperCase()} • ${q.questions.length} Questions`,
        isFavorite: q.isFavorite,
        route: 'quizzes',
        routeParams: { quizId: q.id },
        aiPrompt: `Quiz me on ${q.title} (${q.subject}) and evaluate my answers.`,
      });
    }
  });

  userDecks.forEach((dk) => {
    if (dk.title.toLowerCase().includes(query) || dk.subject.toLowerCase().includes(query) || dk.topic.toLowerCase().includes(query)) {
      results.push({
        id: dk.id,
        title: dk.title,
        type: 'flashcard',
        category: dk.isFavorite ? 'Saved Content' : 'Flashcards',
        subject: dk.subject,
        subtitle: `${dk.cardsCount} cards deck • ${dk.masteredCount} mastered`,
        isFavorite: dk.isFavorite,
        route: 'flashcards',
        routeParams: { deckId: dk.id },
        aiPrompt: `Practice flashcards for ${dk.title} (${dk.subject}) with me.`,
      });
    }
  });

  res.json({ results });
});

// ==========================================
// Vite Integration for SPA Frontend
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.on('upgrade', (request, socket, head) => {
    const parsedUrl = new URL(request.url || '', `http://${request.headers.host}`);
    if (parsedUrl.pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', async (clientWs) => {
    try {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        clientWs.send(JSON.stringify({ error: 'GEMINI_API_KEY missing' }));
        clientWs.close();
        return;
      }
      const aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const session = await aiClient.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: 'You are StudyMat AI Tutor, an empathetic, expert study assistant providing warm voice tutoring.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onerror: (err) => {
            console.error('Live session error:', err);
          },
          onclose: () => {
            console.log('Live session closed');
          },
        },
      });

      clientWs.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
        } catch (e) {
          console.error('Failed to parse client live message', e);
        }
      });

      clientWs.on('close', () => {
        try {
          session.close();
        } catch {}
      });
    } catch (err: any) {
      console.error('Failed to connect to Gemini Live API:', err);
      try {
        clientWs.send(JSON.stringify({ error: err?.message || 'Live connection failed' }));
      } catch {}
      clientWs.close();
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyMat Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
