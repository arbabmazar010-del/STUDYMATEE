import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Sparkles, Check, X, ShieldCheck, Zap, HelpCircle } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { subscription, upgradePlan, openUpgradeModal, isAuthenticated, navigateTo } = useApp();
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

  const currentPlan = subscription?.plan || 'free';

  const handleUpgrade = (plan: 'free' | 'pro' | 'premium') => {
    if (!isAuthenticated) {
      navigateTo('signup');
      return;
    }
    if (plan === 'free') return;
    upgradePlan(plan, billingCycle);
  };

  const faqs = [
    {
      q: 'Can I cancel my subscription at any time?',
      a: 'Yes, absolutely. You can cancel your subscription with a single click from your Account Settings. You will retain access until the end of your billing cycle.',
    },
    {
      q: 'Is there an academic discount for students?',
      a: 'Our annual plans already include a 25% student discount ($7/mo for Pro, $15/mo for Premium). If you are part of a university research lab or high-school cohort, contact our support team for institutional volume licensing.',
    },
    {
      q: 'How does the daily AI generation limit work?',
      a: 'Free accounts receive 10 high-quality AI study generations daily. Pro scholars receive 100 generations per day, and Premium researchers enjoy unlimited AI tutor dialogues and quiz generations. Limits reset every night at midnight UTC.',
    },
    {
      q: 'Are my uploaded lecture slides and notes kept private?',
      a: 'Yes. Every student’s library is strictly isolated. We do not use your personal lecture slides, exams, or personal notes to train public foundation models.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Fair Academic Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Invest in Your Academic Future
          </h1>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Choose the plan that fits your study workload. Upgrade, downgrade, or cancel anytime.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                billingCycle === 'annual' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Annual Billing (Save 25%) 🏷️
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 max-w-6xl mx-auto">
          {/* Free Tier */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Free Student</h3>
                {currentPlan === 'free' && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 rounded">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Essential tools for daily homework and quick concept reviews.</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-400">/ forever</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-slate-300 border-t border-slate-800 pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>10 AI generations / day</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 3 PDF document uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Socratic AI tutor (Standard speed)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Basic practice quizzes (Up to 5 questions)</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <X className="w-4 h-4 shrink-0" />
                  <span>Diagnostic weak topic analytics</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <X className="w-4 h-4 shrink-0" />
                  <span>Automated AI exam planner</span>
                </li>
              </ul>
            </div>

            <button
              disabled={currentPlan === 'free'}
              onClick={() => handleUpgrade('free')}
              className={`mt-8 w-full py-2.5 rounded-xl text-xs font-semibold transition ${
                currentPlan === 'free' ? 'bg-slate-800 text-slate-400 cursor-default' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {currentPlan === 'free' ? 'Your Current Tier' : 'Downgrade to Free'}
            </button>
          </div>

          {/* Pro Scholar Tier (Recommended) */}
          <div className="rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900 border-2 border-blue-500/60 p-6 flex flex-col justify-between relative shadow-xl shadow-blue-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold rounded-full shadow">
              MOST POPULAR FOR UNDERGRADS
            </div>
            <div>
              <div className="flex items-center justify-between mt-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-400" /> Pro Scholar
                </h3>
                {currentPlan === 'pro' && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                    Active Plan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Heavy-duty studying for stem courses, midterms & finals.</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">{billingCycle === 'annual' ? '$7' : '$9'}</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <p className="text-[11px] text-blue-300 mt-0.5">
                {billingCycle === 'annual' ? 'Billed annually ($84/year)' : 'Billed monthly'}
              </p>

              <ul className="mt-6 space-y-3 text-xs text-slate-300 border-t border-slate-800 pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>100 AI study generations / day</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 25 PDF textbook & slide uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Quizzes up to 15 questions per test</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated AI Weekly Study Planner</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Weak topic diagnostic analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Spaced repetition flashcard scheduling</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade('pro')}
              disabled={currentPlan === 'pro'}
              className={`mt-8 w-full py-2.5 rounded-xl text-xs font-bold transition shadow-md ${
                currentPlan === 'pro'
                  ? 'bg-slate-700 text-slate-400 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
              }`}
            >
              {currentPlan === 'pro' ? 'Current Active Tier' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Premium Researcher Tier */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Premium Scholar
                </h3>
                {currentPlan === 'premium' && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                    Active Plan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">For medical, graduate, law, or intensive research students.</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">{billingCycle === 'annual' ? '$15' : '$19'}</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <p className="text-[11px] text-purple-300 mt-0.5">
                {billingCycle === 'annual' ? 'Billed annually ($180/year)' : 'Billed monthly'}
              </p>

              <ul className="mt-6 space-y-3 text-xs text-slate-300 border-t border-slate-800 pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>Unlimited AI generations & queries</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>Unlimited document uploads</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Standardized test simulations (MCAT, GRE, SAT)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Fastest AI response processing tier</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Export to Anki, Markdown, and PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Priority academic support response</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade('premium')}
              disabled={currentPlan === 'premium'}
              className={`mt-8 w-full py-2.5 rounded-xl text-xs font-bold transition shadow-md ${
                currentPlan === 'premium'
                  ? 'bg-slate-700 text-slate-400 cursor-default'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/25'
              }`}
            >
              {currentPlan === 'premium' ? 'Current Active Tier' : 'Upgrade to Premium'}
            </button>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto border-t border-slate-800 pt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
