import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { GraduationCap, Sparkles, BookOpen, ShieldCheck, Heart, Github, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1">
                StudyMat
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              StudyMat is an AI-powered study companion built to help students comprehend complex concepts, generate active-recall notes, practice adaptive quizzes, and achieve academic mastery.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Grounded Pedagogy
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Active Recall
              </span>
            </div>
          </div>

          {/* Academic Modules */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Study Modules</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigateTo('ai-tutor')} className="hover:text-white transition">
                  AI Socratic Tutor
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('library')} className="hover:text-white transition">
                  Structured Note Generator
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('quizzes')} className="hover:text-white transition">
                  Adaptive Quiz Center
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('flashcards')} className="hover:text-white transition">
                  Spaced Repetition Flashcards
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('study-planner')} className="hover:text-white transition">
                  Weekly Exam Planner
                </button>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Platform</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigateTo('features')} className="hover:text-white transition">
                  All Features
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('pricing')} className="hover:text-white transition">
                  Student Pricing
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-white transition">
                  Cognitive Science Principles
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-white transition">
                  Student Support & FAQs
                </button>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Quick Access</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigateTo('login')} className="hover:text-white transition">
                  Student Sign In
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('signup')} className="hover:text-white transition">
                  Create Free Account
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('onboarding')} className="hover:text-white transition">
                  Setup Subject Goals
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('account')} className="hover:text-white transition">
                  Plan & Privacy
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} StudyMat Inc. All rights reserved. Designed for students worldwide.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Academic Terms</span>
            <span className="hover:text-slate-400 cursor-pointer">Honor Code Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
