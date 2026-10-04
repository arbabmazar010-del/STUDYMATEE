import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { UpgradeModal } from './components/UpgradeModal.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';

import { HomePage } from './pages/HomePage.tsx';
import { FeaturesPage } from './pages/FeaturesPage.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { SignupPage } from './pages/SignupPage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';

import { DashboardPage } from './pages/DashboardPage.tsx';
import { AITutorPage } from './pages/AITutorPage.tsx';
import { LibraryPage } from './pages/LibraryPage.tsx';
import { QuizzesPage } from './pages/QuizzesPage.tsx';
import { FlashcardsPage } from './pages/FlashcardsPage.tsx';
import { StudyPlannerPage } from './pages/StudyPlannerPage.tsx';
import { ProgressPage } from './pages/ProgressPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';

const AppContent: React.FC = () => {
  const { currentRoute } = useApp();

  const renderActivePage = () => {
    switch (currentRoute) {
      // Core Public Pages
      case 'features':
        return <FeaturesPage />;
      case 'pricing':
        return <PricingPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'login':
        return <LoginPage />;
      case 'signup':
        return <SignupPage />;
      case 'onboarding':
        return <OnboardingPage />;

      // Authenticated Student App Pages
      case 'dashboard':
        return <DashboardPage />;
      case 'ai-tutor':
        return <AITutorPage />;
      case 'library':
        return <LibraryPage />;
      case 'quizzes':
        return <QuizzesPage />;
      case 'flashcards':
        return <FlashcardsPage />;
      case 'study-planner':
        return <StudyPlannerPage />;
      case 'progress':
        return <ProgressPage />;
      case 'account':
        return <AccountPage />;

      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0f17] text-slate-100 selection:bg-blue-500 selection:text-white font-sans antialiased">
      {/* Global Navigation */}
      <Navbar />

      {/* Main Multi-Page Routed View */}
      <main className="flex-1 w-full">
        {renderActivePage()}
      </main>

      {/* Global Footer (only shown on non-tutor pages to maximize chat viewport) */}
      {currentRoute !== 'ai-tutor' && <Footer />}

      {/* Global Modals & Notifications */}
      <UpgradeModal />
      <SearchModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
