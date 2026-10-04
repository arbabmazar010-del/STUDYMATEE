import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import {
  Note,
  DocumentRecord,
  Summary,
} from '../types.ts';
import {
  BookOpen,
  FileText,
  ListFilter,
  Search,
  Plus,
  Trash2,
  Download,
  Share2,
  Sparkles,
  Upload,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  ExternalLink,
  BookMarked,
  Layers,
  CheckSquare,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Tab = 'notes' | 'summaries' | 'docs';

export const LibraryPage: React.FC = () => {
  const { profile, routeParams, navigateTo, openUpgradeModal, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>((routeParams.tab as Tab) || 'notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  const [notes, setNotes] = useState<Note[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  // Modals & Generation
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(routeParams.openGenerator === 'note');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Note generation form state
  const [genTopic, setGenTopic] = useState('');
  const [genSubject, setGenSubject] = useState(profile?.subjects?.[0] || 'General');
  const [genInputText, setGenInputText] = useState('');
  const [genDocId, setGenDocId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Summary generation form state
  const [sumMode, setSumMode] = useState<'quick' | 'detailed' | 'exam' | 'bullet' | 'concepts'>('bullet');
  const [sumContent, setSumContent] = useState('');
  const [sumSubject, setSumSubject] = useState(profile?.subjects?.[0] || 'General');
  const [sumDocId, setSumDocId] = useState('');

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSubject, setUploadSubject] = useState(profile?.subjects?.[0] || 'General');
  const [isUploading, setIsUploading] = useState(false);

  // Initial fetch
  const fetchLibrary = async () => {
    try {
      const [notesRes, sumRes, docRes] = await Promise.all([
        api.getNotes().catch(() => ({ notes: [] })),
        api.getSummaries().catch(() => ({ summaries: [] })),
        api.getDocuments().catch(() => ({ documents: [] })),
      ]);
      setNotes(notesRes.notes || []);
      setSummaries(sumRes.summaries || []);
      setDocuments(docRes.documents || []);

      // If route has noteId
      if (routeParams.noteId && notesRes.notes?.length > 0) {
        const target = notesRes.notes.find((n) => n.id === routeParams.noteId);
        if (target) {
          setSelectedNote(target);
          setActiveTab('notes');
        }
      } else if (notesRes.notes?.length > 0 && !selectedNote) {
        setSelectedNote(notesRes.notes[0]);
      }
    } catch (err) {
      console.error('Failed to load library:', err);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleGenerateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) return;

    setIsGenerating(true);
    try {
      const res = await api.generateNote({
        topic: genTopic,
        subject: genSubject,
        inputText: genInputText || undefined,
        documentId: genDocId || undefined,
      });

      setNotes([res.note, ...notes]);
      setSelectedNote(res.note);
      setIsNoteModalOpen(false);
      setGenTopic('');
      setGenInputText('');
      addToast('Note Generated! ✨', `${res.note.title} added to your library.`, 'success');
    } catch (err: any) {
      if (err.message && err.message.includes('Daily AI generation limit reached')) {
        openUpgradeModal('You have reached your daily limit of AI generations. Upgrade to Pro for 100/day.');
      } else {
        addToast('Generation Failed', err.message || 'Error creating note', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sumContent.trim() && !sumDocId) {
      addToast('Input Required', 'Please paste text or select an uploaded document', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.generateSummary({
        content: sumContent || undefined,
        subject: sumSubject,
        mode: sumMode,
        documentId: sumDocId || undefined,
      });

      setSummaries([res.summary, ...summaries]);
      setSelectedSummary(res.summary);
      setIsSummaryModalOpen(false);
      setSumContent('');
      addToast('Summary Ready! 📝', 'Active-recall summary successfully compiled.', 'success');
    } catch (err: any) {
      if (err.message && err.message.includes('Daily AI generation limit reached')) {
        openUpgradeModal('You have reached your daily limit of AI generations. Upgrade to Pro for 100/day.');
      } else {
        addToast('Summary Failed', err.message || 'Error creating summary', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      const res = await api.uploadDocument(uploadFile, uploadSubject);
      setDocuments([res.document, ...documents]);
      setSelectedDoc(res.document);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      addToast('Document Processed! 📄', `${res.document.fileName} extracted and ready for study.`, 'success');
    } catch (err: any) {
      if (err.message && err.message.includes('Document upload limit reached')) {
        openUpgradeModal('Free plan document limit reached. Upgrade to Pro to upload up to 25 textbooks.');
      } else {
        addToast('Upload Failed', err.message || 'Error processing document', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteNote(id);
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      if (selectedNote?.id === id) setSelectedNote(remaining[0] || null);
      addToast('Note Deleted', '', 'info');
    } catch {
      addToast('Error', 'Failed to delete note', 'error');
    }
  };

  const handleDeleteSummary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteSummary(id);
      const remaining = summaries.filter((s) => s.id !== id);
      setSummaries(remaining);
      if (selectedSummary?.id === id) setSelectedSummary(remaining[0] || null);
      addToast('Summary Deleted', '', 'info');
    } catch {
      addToast('Error', 'Failed to delete summary', 'error');
    }
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteDocument(id);
      const remaining = documents.filter((d) => d.id !== id);
      setDocuments(remaining);
      if (selectedDoc?.id === id) setSelectedDoc(remaining[0] || null);
      addToast('Document Removed', '', 'info');
    } catch {
      addToast('Error', 'Failed to delete document', 'error');
    }
  };

  const subjects = ['All', ...(profile?.subjects || ['Biology', 'Chemistry', 'Calculus'])];

  // Filtering
  const filteredNotes = notes.filter((n) => {
    const matchSub = selectedSubject === 'All' || n.subject === selectedSubject;
    const matchQ = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.overview?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSub && matchQ;
  });

  const filteredSummaries = summaries.filter((s) => {
    const matchSub = selectedSubject === 'All' || s.subject === selectedSubject;
    const matchQ = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSub && matchQ;
  });

  const filteredDocs = documents.filter((d) => {
    const matchSub = selectedSubject === 'All' || d.subject === selectedSubject;
    const matchQ = !searchQuery || d.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSub && matchQ;
  });

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#0c0f17] text-slate-100 flex flex-col overflow-hidden">
      {/* Top Header & Controls */}
      <header className="p-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Academic Study Library</h1>
            <p className="text-xs text-slate-400">Structured notes, AI summaries, and grounded documents</p>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'notes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" /> Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('summaries')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'summaries' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Summaries ({summaries.length})
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'docs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Documents ({documents.length})
            </button>
          </div>

          {/* Creation Button */}
          {activeTab === 'notes' && (
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Generate Note
            </button>
          )}

          {activeTab === 'summaries' && (
            <button
              onClick={() => setIsSummaryModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Sparkles className="w-4 h-4" /> Summarize Text
            </button>
          )}

          {activeTab === 'docs' && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          )}
        </div>
      </header>

      {/* Main Split View: Left List, Right Reader */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Explorer List */}
        <div className="w-72 sm:w-80 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
          {/* Filter Bar */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {subjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSubject(s)}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition ${
                    selectedSubject === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeTab === 'notes' && (
              filteredNotes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No notes found. Click "Generate Note" to create one!
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-3 rounded-xl cursor-pointer transition text-left group ${
                      selectedNote?.id === note.id
                        ? 'bg-slate-800 border border-blue-500/40 text-white'
                        : 'bg-slate-900/50 hover:bg-slate-900 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="text-blue-400 font-semibold">{note.subject}</span>
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-bold truncate text-white">{note.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {note.overview}
                    </p>
                  </div>
                ))
              )
            )}

            {activeTab === 'summaries' && (
              filteredSummaries.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No summaries found. Click "Summarize Text" to condense your materials!
                </div>
              ) : (
                filteredSummaries.map((sum) => (
                  <div
                    key={sum.id}
                    onClick={() => setSelectedSummary(sum)}
                    className={`p-3 rounded-xl cursor-pointer transition text-left group ${
                      selectedSummary?.id === sum.id
                        ? 'bg-slate-800 border border-blue-500/40 text-white'
                        : 'bg-slate-900/50 hover:bg-slate-900 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="text-emerald-400 font-semibold uppercase">{sum.mode}</span>
                      <button
                        onClick={(e) => handleDeleteSummary(sum.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-bold truncate text-white">{sum.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {sum.summaryText}
                    </p>
                  </div>
                ))
              )
            )}

            {activeTab === 'docs' && (
              filteredDocs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No documents found. Upload a PDF or lecture file!
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3 rounded-xl cursor-pointer transition text-left group ${
                      selectedDoc?.id === doc.id
                        ? 'bg-slate-800 border border-blue-500/40 text-white'
                        : 'bg-slate-900/50 hover:bg-slate-900 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="text-sky-400 font-semibold">{doc.subject}</span>
                      <button
                        onClick={(e) => handleDeleteDoc(doc.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-bold truncate text-white">📄 {doc.fileName}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Right Detail / Reader View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0c0f17]">
          {activeTab === 'notes' && selectedNote && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Note Header */}
              <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-bold">
                    {selectedNote.subject} • {selectedNote.topic}
                  </span>
                  <h2 className="text-2xl font-extrabold text-white mt-2">{selectedNote.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Updated {new Date(selectedNote.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateTo('quizzes', { openCreator: 'true', topic: selectedNote.topic, subject: selectedNote.subject })}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold hover:border-slate-700 text-slate-200 flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-amber-400" /> Quiz from Note
                  </button>
                  <button
                    onClick={() => navigateTo('flashcards', { openCreator: 'true', topic: selectedNote.topic, subject: selectedNote.subject })}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold hover:border-slate-700 text-slate-200 flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" /> Generate Cards
                  </button>
                </div>
              </div>

              {/* Overview */}
              {selectedNote.overview && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Conceptual Overview</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedNote.overview}</p>
                </div>
              )}

              {/* Definitions */}
              {selectedNote.definitions && selectedNote.definitions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Terminology</h4>
                  <div className="grid gap-2">
                    {selectedNote.definitions.map((def, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <span className="font-bold text-white">{def.term}: </span>
                        <span className="text-slate-300">{def.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              {selectedNote.keyTakeaways && selectedNote.keyTakeaways.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">High-Yield Takeaways</h4>
                  <ul className="space-y-1.5">
                    {selectedNote.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Markdown Body */}
              {selectedNote.contentMarkdown && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                  <ReactMarkdown>{selectedNote.contentMarkdown}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {activeTab === 'summaries' && selectedSummary && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold uppercase">
                  {selectedSummary.mode} Summary • {selectedSummary.subject}
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-2">{selectedSummary.title}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Synthesized on {new Date(selectedSummary.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedSummary.summaryText}
              </div>

              {selectedSummary.bulletPoints && selectedSummary.bulletPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Highlights</h4>
                  <ul className="space-y-1.5">
                    {selectedSummary.bulletPoints.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                        <span className="text-blue-400">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'docs' && selectedDoc && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[11px] font-bold">
                    {selectedDoc.subject}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-2">📄 {selectedDoc.fileName}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Uploaded {new Date(selectedDoc.createdAt).toLocaleDateString()} • {(selectedDoc.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('ai-tutor', { prompt: `Examine this document and quiz me on key points: ${selectedDoc.fileName}` })}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-4 h-4" /> Study with AI Tutor
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Extracted Document Text</h4>
                <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto leading-relaxed border border-slate-800/80 whitespace-pre-wrap">
                  {selectedDoc.extractedText}
                </div>
              </div>
            </div>
          )}

          {/* Empty Selection State */}
          {!selectedNote && !selectedSummary && !selectedDoc && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <BookOpen className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-semibold">Select an item on the left to read or inspect</p>
            </div>
          )}
        </div>
      </div>

      {/* Note Generation Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> Generate Structured Note
            </h3>
            <p className="text-xs text-slate-400">
              StudyMat will compile a comprehensive study guide with key concepts, definitions, and takeaways.
            </p>

            <form onSubmit={handleGenerateNote} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Study Topic / Chapter</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cellular Respiration, Taylor Series, Cold War..."
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                <select
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
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
                <label className="block font-semibold text-slate-300 mb-1">Optional Source Passage / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Paste lecture excerpts or textbook paragraphs to guide the generation..."
                  value={genInputText}
                  onChange={(e) => setGenInputText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !genTopic.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold transition flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isGenerating ? 'Synthesizing...' : 'Generate Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Generation Modal */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Active Recall Summarizer
            </h3>
            <p className="text-xs text-slate-400">
              Transform complex papers, articles, or passages into concise bullet points.
            </p>

            <form onSubmit={handleGenerateSummary} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Summary Format</label>
                <select
                  value={sumMode}
                  onChange={(e) => setSumMode(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="bullet">High-Yield Bullet Points</option>
                  <option value="quick">30-Second Quick Recap</option>
                  <option value="detailed">In-Depth Comprehensive Summary</option>
                  <option value="exam">Exam Cram & High-Stakes Focus</option>
                  <option value="concepts">Core Conceptual Breakdown</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                <select
                  value={sumSubject}
                  onChange={(e) => setSumSubject(e.target.value)}
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
                <label className="block font-semibold text-slate-300 mb-1">Text Content to Summarize</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste article, lecture transcript, or study material here..."
                  value={sumContent}
                  onChange={(e) => setSumContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !sumContent.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold transition flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isGenerating ? 'Summarizing...' : 'Generate Summary'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" /> Upload Study Document
            </h3>
            <p className="text-xs text-slate-400">
              Upload PDF, TXT, or Markdown documents to enable grounded Socratic tutoring and quiz generation.
            </p>

            <form onSubmit={handleUploadFile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                <select
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
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
                <label className="block font-semibold text-slate-300 mb-1">Select File (.pdf, .txt, .md)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold transition flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{isUploading ? 'Extracting...' : 'Upload & Process'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
