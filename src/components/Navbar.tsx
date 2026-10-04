import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  GraduationCap,
  Sparkles,
  Search,
  Clock,
  Play,
  Pause,
  Save,
  Bell,
  CheckCheck,
  User,
  LogOut,
  Menu,
  X,
  Flame,
  Zap,
  BookOpen,
  CheckSquare,
  Layers,
  Calendar,
  BarChart3,
  MessageSquare,
  Shield,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentRoute,
    navigateTo,
    user,
    subscription,
    usage,
    isAuthenticated,
    logout,
    openUpgradeModal,
    openSearch,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    studyTimerSeconds,
    isTimerRunning,
    startStudyTimer,
    pauseStudyTimer,
    saveStudySession,
    demoLogin,
  } = useApp();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoDropdownOpen, setIsDemoDropdownOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const plan = subscription?.plan || 'free';
  const aiUsed = usage?.aiGenerationsToday || 0;
  const aiLimit = usage?.aiGenerationsLimit || 10;
  const streak = usage?.currentStreakDays || 1;
  const xp = usage?.xp || 100;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigateTo(isAuthenticated ? 'dashboard' : 'home')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight flex items-center gap-1">
                StudyMat
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </span>
              <span className="block text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">AI Study Companion</span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigateTo('dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === 'dashboard' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigateTo('ai-tutor')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    currentRoute === 'ai-tutor' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  AI Tutor
                </button>
                <button
                  onClick={() => navigateTo('library')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    currentRoute === 'library' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Library
                </button>
                <button
                  onClick={() => navigateTo('quizzes')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    currentRoute === 'quizzes' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  Quizzes
                </button>
                <button
                  onClick={() => navigateTo('flashcards')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    currentRoute === 'flashcards' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-400" />
                  Flashcards
                </button>
                <button
                  onClick={() => navigateTo('study-planner')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    currentRoute === 'study-planner' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-rose-400" />
                  Planner
                </button>
                <button
                  onClick={() => navigateTo('progress')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    currentRoute === 'progress' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Analytics
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigateTo('home')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === 'home' ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => navigateTo('features')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === 'features' ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => navigateTo('pricing')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === 'pricing' ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Pricing
                </button>
                <button
                  onClick={() => navigateTo('about')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === 'about' ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Pedagogy
                </button>
                <button
                  onClick={() => navigateTo('contact')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === 'contact' ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Support
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              {/* Study Focus Timer */}
              <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 shadow-inner">
                <Clock className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
                <span className="font-mono font-bold text-white mr-2">{formatTimer(studyTimerSeconds)}</span>
                {isTimerRunning ? (
                  <button
                    onClick={pauseStudyTimer}
                    className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
                    title="Pause Focus Timer"
                  >
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                ) : (
                  <button
                    onClick={startStudyTimer}
                    className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
                    title="Start Deep Study Timer"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                )}
                {studyTimerSeconds > 0 && (
                  <button
                    onClick={saveStudySession}
                    className="p-1 hover:text-white hover:bg-slate-800 rounded transition ml-1"
                    title="Save Focus Session & Gain XP"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                )}
              </div>

              {/* AI Usage Counter Pill */}
              <button
                onClick={() => openUpgradeModal('Upgrade for 10x higher AI study capacity and unlimited practice.')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-xs transition"
                title="Daily AI Generations used"
              >
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400">AI:</span>
                <span className={`font-semibold ${aiUsed >= aiLimit ? 'text-rose-400' : 'text-slate-200'}`}>
                  {aiUsed}/{aiLimit}
                </span>
                {plan !== 'premium' && (
                  <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded uppercase">
                    {plan}
                  </span>
                )}
              </button>

              {/* Universal StudyMate Search Shortcut */}
              <button
                id="search-shortcut-btn"
                onClick={openSearch}
                className="px-2.5 py-1.5 text-slate-300 hover:text-white bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition flex items-center gap-1.5 sm:gap-2 group shadow-sm"
                title="Universal StudyMate Search (Cmd+K)"
              >
                <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                <span className="hidden xl:inline text-xs text-slate-300 font-medium">Search</span>
                <span className="hidden xl:inline text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⌘K</span>
              </button>

              {/* Notifications Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">Study Notifications</h4>
                        {unreadNotificationsCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded-full">
                            {unreadNotificationsCount} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 mt-2">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications yet. Keep studying!
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              if (n.link) navigateTo(n.link.replace('/', '') as any);
                            }}
                            className={`p-2.5 rounded-lg cursor-pointer transition ${
                              n.isRead ? 'opacity-70 hover:bg-slate-800/40' : 'bg-blue-950/20 hover:bg-blue-950/40'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-white">{n.title}</p>
                              <span className="text-[10px] text-slate-500">
                                {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-xs">
                    {user?.name ? user.name[0].toUpperCase() : 'S'}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="pb-3 border-b border-slate-800">
                      <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>

                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 uppercase">
                          {plan} PLAN
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <Flame className="w-3.5 h-3.5 text-amber-400" /> {streak}d streak
                        </span>
                        <span className="text-[11px] font-semibold text-purple-400">
                          ⭐ {xp} XP
                        </span>
                      </div>
                    </div>

                    <div className="py-2 space-y-1 text-xs">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigateTo('account');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-slate-400" /> Account Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          openUpgradeModal();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4 text-blue-400" /> Subscription & Limits
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2 text-xs font-semibold"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Demo Fast Login Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDemoDropdownOpen(!isDemoDropdownOpen)}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fast Demo</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isDemoDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs">
                    <button
                      onClick={() => {
                        setIsDemoDropdownOpen(false);
                        demoLogin('pro');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white font-medium flex items-center justify-between"
                    >
                      <span>Pro Scholar</span>
                      <span className="text-[10px] text-blue-400 font-bold">PRO</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsDemoDropdownOpen(false);
                        demoLogin('free');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white font-medium flex items-center justify-between"
                    >
                      <span>Free Student</span>
                      <span className="text-[10px] text-slate-400 font-bold">FREE</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsDemoDropdownOpen(false);
                        demoLogin('premium');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white font-medium flex items-center justify-between"
                    >
                      <span>Pre-Med Researcher</span>
                      <span className="text-[10px] text-purple-400 font-bold">VIP</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={openSearch}
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition flex items-center gap-1.5 group"
                title="Universal StudyMate Search (Cmd+K)"
              >
                <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                <span className="hidden sm:inline text-xs text-slate-300">Search</span>
              </button>

              <button
                onClick={() => navigateTo('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Sign In
              </button>

              <button
                onClick={() => navigateTo('signup')}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition"
              >
                Get Started
              </button>
            </>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          {/* Mobile Universal Search Button */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              openSearch();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 hover:text-white hover:border-cyan-500/40 flex items-center justify-between transition mb-3 shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-200">Universal Search</span>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⌘K</span>
          </button>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  navigateTo('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  navigateTo('ai-tutor');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-blue-400" /> AI Tutor
              </button>
              <button
                onClick={() => {
                  navigateTo('library');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" /> Library & Notes
              </button>
              <button
                onClick={() => {
                  navigateTo('quizzes');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4 text-amber-400" /> Practice Quizzes
              </button>
              <button
                onClick={() => {
                  navigateTo('flashcards');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-purple-400" /> Flashcards
              </button>
              <button
                onClick={() => {
                  navigateTo('study-planner');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-rose-400" /> Study Planner
              </button>
              <button
                onClick={() => {
                  navigateTo('progress');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" /> Progress & Analytics
              </button>
              <button
                onClick={() => {
                  navigateTo('account');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <User className="w-4 h-4 text-slate-400" /> Account Settings
              </button>
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-rose-400 text-sm font-semibold"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  navigateTo('home');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                Home
              </button>
              <button
                onClick={() => {
                  navigateTo('features');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                Features
              </button>
              <button
                onClick={() => {
                  navigateTo('pricing');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  navigateTo('about');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                Academic Pedagogy
              </button>
              <button
                onClick={() => {
                  navigateTo('contact');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
              >
                Support & Contact
              </button>
              <div className="pt-3 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => {
                    navigateTo('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-1/2 py-2 text-center text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-xl"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    navigateTo('signup');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-1/2 py-2 text-center text-xs font-semibold text-white bg-blue-600 rounded-xl"
                >
                  Get Started
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
