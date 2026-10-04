import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import {
  FlashcardDeck,
  Flashcard,
} from '../types.ts';
import {
  Layers,
  Sparkles,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Trash2,
  Loader2,
  BrainCircuit,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const FlashcardsPage: React.FC = () => {
  const { profile, routeParams, openUpgradeModal, addToast } = useApp();

  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [activeCards, setActiveCards] = useState<Flashcard[]>([]);

  // Study Session State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Deck Generator Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(routeParams.openCreator === 'true');
  const [topic, setTopic] = useState(routeParams.topic || '');
  const [subject, setSubject] = useState(routeParams.subject || profile?.subjects?.[0] || 'General');
  const [numCards, setNumCards] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchDecks = async () => {
    try {
      const res = await api.getFlashcardDecks();
      setDecks(res.decks || []);
      if (routeParams.deckId && res.decks?.length > 0) {
        const found = res.decks.find((d) => d.id === routeParams.deckId);
        if (found) startDeckStudy(found);
      }
    } catch (err) {
      console.error('Failed to load flashcard decks:', err);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [routeParams.deckId]);

  const startDeckStudy = async (deck: FlashcardDeck) => {
    try {
      const res = await api.getDeckWithCards(deck.id);
      setActiveDeck(res.deck);
      setActiveCards(res.cards || []);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setSessionCompleted(false);
    } catch {
      addToast('Error', 'Failed to load cards for this deck', 'error');
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRateCard = async (status: 'mastered' | 'learning', wasCorrect: boolean) => {
    if (!activeCards[currentCardIndex]) return;
    const cardId = activeCards[currentCardIndex].id;

    try {
      await api.reviewCard(cardId, status, wasCorrect);
      // Advance to next card or complete session
      if (currentCardIndex < activeCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
      } else {
        setSessionCompleted(true);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
        addToast('Deck Completed! 🏆', 'All cards reviewed using spaced repetition.', 'success');
      }
    } catch {
      addToast('Error', 'Could not record card review', 'error');
    }
  };

  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const res = await api.generateFlashcardDeck({
        topic,
        subject,
        numCards,
      });

      setDecks([res.deck, ...decks]);
      setIsCreateModalOpen(false);
      setTopic('');
      startDeckStudy(res.deck);
      addToast('Flashcards Generated! 🗂️', `${res.cards.length} cards added for active recall.`, 'success');
    } catch (err: any) {
      if (err.message && err.message.includes('Daily AI generation limit reached')) {
        openUpgradeModal('Daily AI generation limit reached. Upgrade to Pro for unlimited flashcard generations.');
      } else {
        addToast('Generation Failed', err.message || 'Error creating flashcards', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteDeck(deckId);
      setDecks(decks.filter((d) => d.id !== deckId));
      if (activeDeck?.id === deckId) setActiveDeck(null);
      addToast('Deck Deleted', '', 'info');
    } catch {
      addToast('Error', 'Failed to delete deck', 'error');
    }
  };

  const currentCard = activeCards[currentCardIndex];

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Active Study View */}
        {activeDeck && activeCards.length > 0 ? (
          <div className="space-y-6">
            {/* Header Ribbon */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-bold uppercase">
                  {activeDeck.subject} • {activeDeck.topic}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">{activeDeck.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveDeck(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Exit Deck
                </button>
              </div>
            </div>

            {!sessionCompleted && currentCard ? (
              <div className="space-y-6 max-w-2xl mx-auto">
                {/* Progress Bar */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Card {currentCardIndex + 1} of {activeCards.length}</span>
                  <span>{Math.round(((currentCardIndex) / activeCards.length) * 100)}% Complete</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentCardIndex + 1) / activeCards.length) * 100}%` }}
                  />
                </div>

                {/* Flip Card Stage */}
                <div
                  onClick={handleFlip}
                  className="min-h-[280px] sm:min-h-[340px] rounded-3xl bg-slate-900 border border-slate-800 p-8 flex flex-col justify-between cursor-pointer hover:border-purple-500/50 transition-all shadow-2xl relative select-none group"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider text-purple-400">
                      {isFlipped ? 'Back (Solution / Definition)' : 'Front (Prompt / Term)'}
                    </span>
                    <span className="text-[11px] text-slate-500 group-hover:text-purple-300 transition">
                      Click anywhere to flip
                    </span>
                  </div>

                  <div className="my-auto text-center px-4">
                    <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </p>
                  </div>

                  <div className="text-center text-[11px] text-slate-500">
                    Space to flip • Rating buttons below
                  </div>
                </div>

                {/* Response Rating Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => handleRateCard('learning', false)}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-rose-500/30 hover:bg-rose-950/30 text-rose-400 hover:text-rose-300 font-bold text-xs transition flex flex-col items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Hard / Forgot</span>
                  </button>

                  <button
                    onClick={() => handleRateCard('learning', true)}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/30 hover:bg-amber-950/30 text-amber-400 hover:text-amber-300 font-bold text-xs transition flex flex-col items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Good / Recalled</span>
                  </button>

                  <button
                    onClick={() => handleRateCard('mastered', true)}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/30 hover:bg-emerald-950/30 text-emerald-400 hover:text-emerald-300 font-bold text-xs transition flex flex-col items-center gap-1 col-span-2 sm:col-span-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Easy / Mastered</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Session Completed Celebration Screen */
              <div className="max-w-md mx-auto text-center p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Deck Session Complete!</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You reviewed all {activeCards.length} cards in this deck. Spaced repetition intervals have been refreshed.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                      setSessionCompleted(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md"
                  >
                    Review Again
                  </button>
                  <button
                    onClick={() => setActiveDeck(null)}
                    className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
                  >
                    All Decks
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Main Decks Directory */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Flashcard Decks & Spaced Repetition
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Active recall flashcards organized by subject with Leitner spaced repetition
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Flashcards</span>
              </button>
            </div>

            {decks.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 space-y-3">
                <Layers className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-semibold">No flashcard decks created yet.</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition"
                >
                  Generate Flashcards with AI
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck) => {
                  const mastery = deck.cardsCount > 0 ? Math.round((deck.masteredCount / deck.cardsCount) * 100) : 0;
                  return (
                    <div
                      key={deck.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-semibold">
                            {deck.subject}
                          </span>
                          <button
                            onClick={(e) => handleDeleteDeck(deck.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition"
                            title="Delete deck"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition">
                          {deck.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {deck.description || `Topic: ${deck.topic}`}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-3">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>{deck.cardsCount} Cards</span>
                          <span className="text-emerald-400 font-medium">{mastery}% Mastered</span>
                        </div>
                        <button
                          onClick={() => startDeckStudy(deck)}
                          className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Study Deck
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generator Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Generate Flashcard Deck
            </h3>
            <p className="text-xs text-slate-400">
              AI creates high-yield active-recall question-and-answer pairs designed for spaced repetition.
            </p>

            <form onSubmit={handleGenerateDeck} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Study Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cranial Nerves, Thermodynamics, Organic Reactions..."
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
                  <label className="block font-semibold text-slate-300 mb-1">Number of Cards</label>
                  <select
                    value={numCards}
                    onChange={(e) => setNumCards(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={5}>5 Cards</option>
                    <option value={8}>8 Cards</option>
                    <option value={12}>12 Cards</option>
                    <option value={15}>15 Cards</option>
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold transition flex items-center gap-2 shadow-md shadow-purple-500/20"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isGenerating ? 'Generating...' : 'Create Deck'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
