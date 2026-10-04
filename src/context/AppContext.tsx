import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppRoute,
  User,
  UserProfile,
  UserSubscription,
  UserUsage,
  ToastMessage,
  NotificationItem,
} from '../types.ts';
import { api, getStoredToken } from '../lib/api.ts';
import { auth, googleProvider, facebookProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, updateProfile as updateFirebaseProfile } from '../lib/firebase.ts';
import confetti from 'canvas-confetti';

interface AppContextType {
  currentRoute: AppRoute;
  navigateTo: (route: AppRoute, params?: Record<string, string>) => void;
  routeParams: Record<string, string>;
  user: User | null;
  profile: UserProfile | null;
  subscription: UserSubscription | null;
  usage: UserUsage | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (params: { email: string; password: string; name: string; collegeSchool: string }) => Promise<void>;
  socialLogin: (providerType: 'google' | 'facebook', collegeSchool?: string) => Promise<void>;
  demoLogin: (role?: 'free' | 'pro' | 'premium') => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  isUpgradeModalOpen: boolean;
  upgradeReason: string;
  openUpgradeModal: (reason?: string) => void;
  closeUpgradeModal: () => void;
  upgradePlan: (plan: 'free' | 'pro' | 'premium', billingCycle?: 'monthly' | 'annual') => Promise<void>;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshNotifications: () => Promise<void>;
  studyTimerSeconds: number;
  isTimerRunning: boolean;
  startStudyTimer: () => void;
  pauseStudyTimer: () => void;
  saveStudySession: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const parseRouteFromUrl = (): { route: AppRoute; params: Record<string, string> } => {
    if (typeof window === 'undefined') return { route: 'home', params: {} };
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const [pathPart, queryPart] = hash.split('?');
    const parts = (pathPart || 'home').split('/');
    const mainRoute = (parts[0] || 'home') as AppRoute;

    const params: Record<string, string> = {};
    if (parts.length > 1) {
      params.id = parts[1];
    }
    if (queryPart) {
      const sp = new URLSearchParams(queryPart);
      sp.forEach((val, key) => {
        params[key] = val;
      });
    }

    const validRoutes: AppRoute[] = [
      'home',
      'features',
      'pricing',
      'about',
      'contact',
      'login',
      'signup',
      'onboarding',
      'dashboard',
      'ai-tutor',
      'library',
      'quizzes',
      'flashcards',
      'study-planner',
      'progress',
      'account',
    ];

    return {
      route: validRoutes.includes(mainRoute) ? mainRoute : 'home',
      params,
    };
  };

  const initialParsed = parseRouteFromUrl();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(initialParsed.route);
  const [routeParams, setRouteParams] = useState<Record<string, string>>(initialParsed.params);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('Unlock unlimited AI study tools, deep exam prep, and 10x higher capacity.');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Study timer state
  const [studyTimerSeconds, setStudyTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  const addToast = useCallback((title: string, description?: string, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigateTo = useCallback((route: AppRoute, params?: Record<string, string>) => {
    setCurrentRoute(route);
    setRouteParams(params || {});
    if (typeof window !== 'undefined') {
      let targetHash = `#/${route}`;
      if (params?.id) {
        targetHash += `/${params.id}`;
      }
      const otherParams = { ...(params || {}) };
      delete otherParams.id;
      const q = new URLSearchParams(otherParams).toString();
      if (q) targetHash += `?${q}`;

      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Listen to hash changes
  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseRouteFromUrl();
      setCurrentRoute(parsed.route);
      setRouteParams(parsed.params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);

  // Study timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStudyTimerSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const startStudyTimer = useCallback(() => setIsTimerRunning(true), []);
  const pauseStudyTimer = useCallback(() => setIsTimerRunning(false), []);

  const saveStudySession = useCallback(async () => {
    if (studyTimerSeconds < 60) {
      addToast('Session Saved', 'Logged focus interval.', 'info');
      setStudyTimerSeconds(0);
      setIsTimerRunning(false);
      return;
    }
    const minutes = Math.round(studyTimerSeconds / 60);
    try {
      const res = await api.logStudySession(minutes);
      setUsage(res.usage);
      addToast('Study Session Logged! ⏱️', `Added ${minutes} minutes of deep focus time (+${minutes * 2} XP).`, 'success');
      setStudyTimerSeconds(0);
      setIsTimerRunning(false);
    } catch {
      addToast('Error', 'Failed to save session.', 'error');
    }
  }, [studyTimerSeconds, addToast]);

  // Notifications
  const refreshNotifications = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch {
      // ignore
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {}
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      addToast('Notifications Cleared', 'All marked as read.', 'info');
    } catch {}
  }, [addToast]);

  // Refresh user state
  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setUsage(null);
      setIsLoadingAuth(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
      setSubscription(data.subscription);
      setUsage(data.usage);
      refreshNotifications();
    } catch {
      api.logout();
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setUsage(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [refreshNotifications]);

  // Check auth on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Auth actions
  const login = useCallback(
    async (email: string, pass: string) => {
      setIsLoadingAuth(true);
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        const data = await api.login(email, pass).catch(async () => {
          return api.firebaseSync({ email, name: email.split('@')[0] });
        });
        setUser(data.user);
        setProfile(data.profile);
        setSubscription(data.subscription);
        setUsage(data.usage);
        addToast(`Welcome back, ${data.user.name}! 📚`, 'Study dashboard ready.', 'success');
        navigateTo('dashboard');
      } catch (err: any) {
        let msg = err.message || 'Check email and password.';
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          msg = 'Invalid email or password. Please check your credentials.';
        }
        addToast('Sign In Failed', msg, 'error');
        throw err;
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [addToast, navigateTo],
  );

  const signup = useCallback(
    async (params: { email: string; password: string; name: string; collegeSchool: string }) => {
      setIsLoadingAuth(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
        if (params.name) {
          await updateFirebaseProfile(cred.user, { displayName: params.name }).catch(() => {});
        }
        const data = await api.firebaseSync({
          email: params.email,
          name: params.name,
          collegeSchool: params.collegeSchool,
        });
        setUser(data.user);
        setProfile(data.profile);
        setSubscription(data.subscription);
        setUsage(data.usage);
        addToast('Account Created! 🚀', 'Welcome to StudyMat. Your workspace is ready.', 'success');
        navigateTo('dashboard');
      } catch (err: any) {
        let msg = err.message || 'Could not create account.';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'An account with this email already exists. Please sign in instead.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password should be at least 6 characters.';
        }
        addToast('Sign Up Failed', msg, 'error');
        throw err;
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [addToast, navigateTo],
  );

  const socialLogin = useCallback(
    async (providerType: 'google' | 'facebook', collegeSchool?: string) => {
      setIsLoadingAuth(true);
      try {
        const provider = providerType === 'google' ? googleProvider : facebookProvider;
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        const data = await api.firebaseSync({
          email: fbUser.email || `${fbUser.uid}@oauth.user`,
          name: fbUser.displayName || 'Student',
          collegeSchool: collegeSchool || 'College / University',
        });
        setUser(data.user);
        setProfile(data.profile);
        setSubscription(data.subscription);
        setUsage(data.usage);
        addToast(`Welcome, ${data.user.name}! 🎉`, 'Signed in successfully via ' + (providerType === 'google' ? 'Google' : 'Facebook'), 'success');
        navigateTo('dashboard');
      } catch (err: any) {
        let msg = err.message || 'OAuth authentication failed.';
        if (err.code === 'auth/popup-closed-by-user') {
          msg = 'Authentication popup was closed before completing.';
        } else if (err.code === 'auth/account-exists-with-different-credential') {
          msg = 'An account already exists with the same email address using a different sign-in method.';
        }
        addToast('Authentication Failed', msg, 'error');
        throw err;
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [addToast, navigateTo],
  );

  const demoLogin = useCallback(
    async (role: 'free' | 'pro' | 'premium' = 'pro') => {
      setIsLoadingAuth(true);
      try {
        const data = await api.demoLogin(role);
        setUser(data.user);
        setProfile(data.profile);
        setSubscription(data.subscription);
        setUsage(data.usage);
        addToast(`Demo Logged In as ${data.user.name} (${role.toUpperCase()}) 🎓`, 'Test student profile loaded with sample notes and quizzes.', 'success');
        navigateTo('dashboard');
      } catch (err: any) {
        addToast('Demo Login Failed', err.message || 'Could not load demo.', 'error');
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [addToast, navigateTo],
  );

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    api.logout();
    setUser(null);
    setProfile(null);
    setSubscription(null);
    setUsage(null);
    addToast('Signed Out', 'You have been safely signed out.', 'info');
    navigateTo('home');
  }, [addToast, navigateTo]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      try {
        const res = await api.updateProfile(updates);
        setProfile(res.profile);
        addToast('Profile Updated', 'Your study preferences were saved.', 'success');
      } catch (err: any) {
        addToast('Error', err.message || 'Failed to update profile.', 'error');
      }
    },
    [addToast],
  );

  // Upgrade Plan
  const openUpgradeModal = useCallback((reason?: string) => {
    if (reason) setUpgradeReason(reason);
    setIsUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false);
  }, []);

  const upgradePlan = useCallback(
    async (plan: 'free' | 'pro' | 'premium', billingCycle: 'monthly' | 'annual' = 'annual') => {
      try {
        const res = await api.upgradePlan(plan, billingCycle);
        setSubscription(res.subscription);
        setUsage(res.usage);
        setIsUpgradeModalOpen(false);

        // Confetti effect
        try {
          confetti({
            particleCount: 110,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
          });
        } catch {}

        addToast(
          `Welcome to StudyMat ${plan.toUpperCase()}! 🌟`,
          `Your daily AI capacity has been raised to ${res.usage.aiGenerationsLimit} generations and ${res.usage.documentsLimit} documents.`,
          'success',
        );
      } catch (err: any) {
        addToast('Upgrade Failed', err.message || 'Payment simulation failed.', 'error');
      }
    },
    [addToast],
  );

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigateTo,
        routeParams,
        user,
        profile,
        subscription,
        usage,
        isAuthenticated: !!user,
        isLoadingAuth,
        login,
        signup,
        socialLogin,
        demoLogin,
        logout,
        updateProfile,
        refreshUser,
        toasts,
        addToast,
        removeToast,
        isUpgradeModalOpen,
        upgradeReason,
        openUpgradeModal,
        closeUpgradeModal,
        upgradePlan,
        isSearchOpen,
        openSearch,
        closeSearch,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        refreshNotifications,
        studyTimerSeconds,
        isTimerRunning,
        startStudyTimer,
        pauseStudyTimer,
        saveStudySession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
