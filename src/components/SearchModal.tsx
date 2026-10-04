import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import {
  Search,
  X,
  Sparkles,
  BookOpen,
  FileText,
  Calendar,
  Clock,
  Compass,
  Star,
  MessageSquare,
  CheckSquare,
  Layers,
  ArrowRight,
  Loader2,
  CornerDownLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';

export interface SearchResultItem {
  id: string;
  title: string;
  type:
    | 'ai-tutor'
    | 'subject'
    | 'topic'
    | 'note'
    | 'document'
    | 'study-plan'
    | 'timetable'
    | 'conversation'
    | 'quiz'
    | 'flashcard';
  category?: string;
  subject: string;
  topic?: string;
  subtitle: string;
  isFavorite?: boolean;
  route?: string;
  routeParams?: Record<string, string>;
  aiPrompt?: string;
  link?: string;
}

type CategoryTab =
  | 'all'
  | 'ai-tutor'
  | 'subjects-topics'
  | 'notes-docs'
  | 'plans-timetable'
  | 'saved'
  | 'conversations'
  | 'practice';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, closeSearch, navigateTo, profile } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Focus input and load starter suggestions when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setActiveTab('all');
      setSelectedIndex(0);
      // Fetch initial suggestions
      const loadInitial = async () => {
        try {
          const res = await api.globalSearch('');
          if (res?.results) {
            setResults(res.results);
          }
        } catch (e) {
          console.error('Error fetching initial search suggestions:', e);
        }
      };
      loadInitial();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  // Global keydown for Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isSearchOpen) closeSearch();
        else {
          const btn = document.getElementById('search-shortcut-btn');
          if (btn) btn.click();
        }
      }
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  // Debounced search when query changes
  useEffect(() => {
    if (!isSearchOpen) return;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.globalSearch(query.trim());
        setResults(res.results || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Universal Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query, isSearchOpen]);

  // Filter results by active tab
  const filteredResults = useMemo(() => {
    if (activeTab === 'all') return results;
    if (activeTab === 'ai-tutor') return results.filter((r) => r.type === 'ai-tutor');
    if (activeTab === 'subjects-topics') return results.filter((r) => r.type === 'subject' || r.type === 'topic');
    if (activeTab === 'notes-docs') return results.filter((r) => r.type === 'note' || r.type === 'document');
    if (activeTab === 'plans-timetable') return results.filter((r) => r.type === 'study-plan' || r.type === 'timetable');
    if (activeTab === 'saved') return results.filter((r) => r.isFavorite || r.category === 'Saved Content');
    if (activeTab === 'conversations') return results.filter((r) => r.type === 'conversation');
    if (activeTab === 'practice') return results.filter((r) => r.type === 'quiz' || r.type === 'flashcard');
    return results;
  }, [results, activeTab]);

  // Keyboard navigation for results list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredResults[selectedIndex];
      if (current) {
        handleSelect(current);
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = document.getElementById(`search-result-item-${selectedIndex}`);
    if (el && resultsContainerRef.current) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isSearchOpen) return null;

  // Direct Click Navigation: Jump directly without manual page traversal
  const handleSelect = (result: SearchResultItem) => {
    closeSearch();

    if (result.route && result.routeParams) {
      navigateTo(result.route as any, result.routeParams);
      return;
    }

    switch (result.type) {
      case 'ai-tutor':
        navigateTo('ai-tutor', { prompt: result.aiPrompt || query, subject: result.subject || 'General' });
        break;
      case 'subject':
        navigateTo('ai-tutor', {
          subject: result.subject,
          prompt: `Let's study ${result.subject}: explain the core concepts and test my understanding.`,
        });
        break;
      case 'topic':
        navigateTo('ai-tutor', {
          subject: result.subject,
          prompt: `Explain the mechanisms and key principles of ${result.title} in ${result.subject}.`,
        });
        break;
      case 'note':
        navigateTo('library', { noteId: result.id, tab: 'notes' });
        break;
      case 'document':
        navigateTo('library', { docId: result.id, tab: 'documents' });
        break;
      case 'study-plan':
      case 'timetable':
        navigateTo('study-planner');
        break;
      case 'conversation':
        navigateTo('ai-tutor', { convId: result.id });
        break;
      case 'quiz':
        navigateTo('quizzes', { quizId: result.id });
        break;
      case 'flashcard':
        navigateTo('flashcards', { deckId: result.id });
        break;
      default:
        navigateTo('ai-tutor');
        break;
    }
  };

  // Explicit "Open in AI Tutor" action button
  const handleOpenInAITutor = (e: React.MouseEvent, item: SearchResultItem) => {
    e.stopPropagation();
    closeSearch();
    let tutorPrompt = item.aiPrompt;
    if (!tutorPrompt) {
      if (item.type === 'subject') {
        tutorPrompt = `Let's study ${item.subject}: summarize the core concepts and guide me step-by-step.`;
      } else if (item.type === 'note') {
        tutorPrompt = `Help me study my note on "${item.title}" (${item.subject}). Test my recall with practice questions.`;
      } else if (item.type === 'document') {
        tutorPrompt = `Explain the key concepts and formulas from "${item.title}" in ${item.subject}.`;
      } else if (item.type === 'topic') {
        tutorPrompt = `Explain ${item.title} in ${item.subject} with real-world examples and step-by-step breakdown.`;
      } else if (item.type === 'timetable') {
        tutorPrompt = `I have a study session scheduled for ${item.title} in ${item.subject}. Let's do a targeted study session.`;
      } else {
        tutorPrompt = `Help me review and master ${item.title} in ${item.subject}.`;
      }
    }
    navigateTo('ai-tutor', {
      subject: item.subject || profile?.subjects?.[0] || 'General',
      prompt: tutorPrompt,
      ...(item.type === 'document' ? { docId: item.id } : {}),
    });
  };

  const getItemVisual = (type: SearchResultItem['type'], isFav?: boolean) => {
    if (isFav) {
      return {
        icon: <Star className="w-4 h-4 text-amber-300 fill-amber-400" />,
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        badge: 'Saved',
      };
    }
    switch (type) {
      case 'ai-tutor':
        return {
          icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
          bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
          badge: 'AI Tutor',
        };
      case 'subject':
        return {
          icon: <Compass className="w-4 h-4 text-indigo-400" />,
          bg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
          badge: 'Subject',
        };
      case 'topic':
        return {
          icon: <BookOpen className="w-4 h-4 text-sky-400" />,
          bg: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
          badge: 'Topic',
        };
      case 'note':
        return {
          icon: <FileText className="w-4 h-4 text-blue-400" />,
          bg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
          badge: 'Study Note',
        };
      case 'document':
        return {
          icon: <FolderOpen className="w-4 h-4 text-emerald-400" />,
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
          badge: 'Document',
        };
      case 'study-plan':
        return {
          icon: <Calendar className="w-4 h-4 text-amber-400" />,
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          badge: 'Study Plan',
        };
      case 'timetable':
        return {
          icon: <Clock className="w-4 h-4 text-orange-400" />,
          bg: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
          badge: 'Timetable',
        };
      case 'conversation':
        return {
          icon: <MessageSquare className="w-4 h-4 text-violet-400" />,
          bg: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
          badge: 'AI Chat',
        };
      case 'quiz':
        return {
          icon: <CheckSquare className="w-4 h-4 text-pink-400" />,
          bg: 'bg-pink-500/15 border-pink-500/30 text-pink-300',
          badge: 'Quiz',
        };
      case 'flashcard':
        return {
          icon: <Layers className="w-4 h-4 text-purple-400" />,
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
          badge: 'Flashcards',
        };
      default:
        return {
          icon: <Search className="w-4 h-4 text-slate-400" />,
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          badge: 'Result',
        };
    }
  };

  const tabs: { id: CategoryTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'all', label: 'All', icon: <Search className="w-3 h-3" />, count: results.length },
    {
      id: 'ai-tutor',
      label: 'AI Tutor',
      icon: <Sparkles className="w-3 h-3" />,
      count: results.filter((r) => r.type === 'ai-tutor').length,
    },
    {
      id: 'subjects-topics',
      label: 'Subjects & Topics',
      icon: <Compass className="w-3 h-3" />,
      count: results.filter((r) => r.type === 'subject' || r.type === 'topic').length,
    },
    {
      id: 'notes-docs',
      label: 'Notes & Docs',
      icon: <FileText className="w-3 h-3" />,
      count: results.filter((r) => r.type === 'note' || r.type === 'document').length,
    },
    {
      id: 'plans-timetable',
      label: 'Plans & Timings',
      icon: <Calendar className="w-3 h-3" />,
      count: results.filter((r) => r.type === 'study-plan' || r.type === 'timetable').length,
    },
    {
      id: 'saved',
      label: 'Saved ★',
      icon: <Star className="w-3 h-3 text-amber-400" />,
      count: results.filter((r) => r.isFavorite || r.category === 'Saved Content').length,
    },
    {
      id: 'conversations',
      label: 'Previous Chats',
      icon: <MessageSquare className="w-3 h-3" />,
      count: results.filter((r) => r.type === 'conversation').length,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={closeSearch}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0c101a] border border-slate-700/80 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90 relative">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mr-3 shrink-0">
            <Search className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, notes, documents, timetable, or ask AI Tutor..."
            className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium"
          />
          {loading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin mr-2 shrink-0" />}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition mr-1.5 shrink-0"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={closeSearch}
            className="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-950/60 border-b border-slate-800/70 overflow-x-auto no-scrollbar shrink-0 text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedIndex(0);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results Body */}
        <div ref={resultsContainerRef} className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {query.trim() === '' && results.length === 0 && !loading ? (
            /* Starter / Empty State */
            <div className="py-8 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Universal StudyMate Search</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Type any subject, question, concept, or document to immediately jump to notes, study plans, or open directly in AI Tutor.
              </p>

              {/* Subject Quick Jump Tags */}
              <div className="mt-5 max-w-lg mx-auto">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Popular Subjects
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Molecular Biology', 'Organic Chemistry', 'Calculus II', 'Cellular Respiration'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-3 py-1 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition flex items-center gap-1.5"
                    >
                      <Compass className="w-3 h-3 text-cyan-400" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-md mx-auto text-left">
                <button
                  onClick={() => {
                    closeSearch();
                    navigateTo('ai-tutor', { prompt: 'Explain the core principles of my current subjects.' });
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition flex items-center gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">Ask AI Tutor</p>
                    <p className="text-[11px] text-slate-400">Instant Socratic tutoring</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    closeSearch();
                    navigateTo('study-planner');
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition flex items-center gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">Timetable & Schedule</p>
                    <p className="text-[11px] text-slate-400">View upcoming study sessions</p>
                  </div>
                </button>
              </div>
            </div>
          ) : filteredResults.length === 0 && !loading ? (
            /* No Results Found */
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">No matching results for "{query}"</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                You can still ask the AI Tutor directly about this question or concept.
              </p>
              <button
                onClick={() => {
                  closeSearch();
                  navigateTo('ai-tutor', { prompt: query });
                }}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition inline-flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Tutor: "{query.length > 25 ? query.slice(0, 25) + '...' : query}"</span>
              </button>
            </div>
          ) : (
            /* Results List */
            <div className="space-y-1">
              {filteredResults.map((item, idx) => {
                const visual = getItemVisual(item.type, item.isFavorite);
                const isSelected = selectedIndex === idx;

                return (
                  <div
                    key={`${item.type}-${item.id}-${idx}`}
                    id={`search-result-item-${idx}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`group w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition border text-left ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/40 shadow-sm'
                        : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      {/* Icon */}
                      <div className={`p-2.5 rounded-xl border shrink-0 ${visual.bg}`}>
                        {visual.icon}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition truncate">
                            {item.title}
                          </span>

                          {/* Subject Pill */}
                          {item.subject && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded-md border border-slate-700/60 shrink-0">
                              {item.subject}
                            </span>
                          )}

                          {/* Type Pill */}
                          <span className="px-1.5 py-0.2 text-[10px] font-semibold text-slate-400 bg-slate-800/50 rounded shrink-0">
                            {visual.badge}
                          </span>

                          {/* Saved Star Badge */}
                          {item.isFavorite && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 rounded flex items-center gap-1 shrink-0">
                              <Star className="w-2.5 h-2.5 fill-amber-300" />
                              Saved
                            </span>
                          )}
                        </div>

                        {/* Subtitle / Snippet */}
                        <p className="text-xs text-slate-400 line-clamp-1 group-hover:text-slate-300 transition">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* "Open in AI Tutor" Quick Action Button */}
                      {item.type !== 'ai-tutor' && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenInAITutor(e, item)}
                          className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-600/80 border border-cyan-800/50 hover:border-cyan-500 rounded-lg transition shadow-sm"
                          title={`Open ${item.title} directly in AI Tutor`}
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>AI Tutor</span>
                        </button>
                      )}

                      {/* Open Arrow */}
                      <div
                        className={`p-1.5 rounded-lg transition ${
                          isSelected
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : 'text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-800'
                        }`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">
              {filteredResults.length} {filteredResults.length === 1 ? 'item' : 'items'} found
            </span>
            {query.trim() && (
              <span className="hidden sm:inline text-slate-600">• for "{query}"</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-400">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-400">↓</kbd>
              <span className="ml-1 text-slate-400">Navigate</span>
            </span>
            <span className="hidden sm:inline flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-400">↵</kbd>
              <span className="ml-1 text-slate-400">Open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-400">Esc</kbd>
              <span className="ml-1 text-slate-400">Close</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
