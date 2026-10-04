import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Sparkles, Check, X, ShieldCheck, Zap } from 'lucide-react';

export const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, closeUpgradeModal, upgradeReason, upgradePlan, subscription } = useApp();
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isUpgradeModalOpen) return null;

  const currentPlan = subscription?.plan || 'free';

  const handleSelectPlan = async (plan: 'pro' | 'premium') => {
    setIsSubmitting(true);
    try {
      await upgradePlan(plan, billingCycle);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            StudyMat Pro Privileges
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Supercharge Your Academic Performance</h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">{upgradeReason}</p>

          {/* Billing Cycle Toggle */}
          <div className="mt-5 inline-flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                billingCycle === 'annual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Annual (Save 25%) 🏷️
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
          </div>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {/* Pro Tier */}
          <div
            className={`relative rounded-xl border p-5 transition flex flex-col justify-between ${
              currentPlan === 'pro'
                ? 'bg-blue-950/20 border-blue-500/60 ring-1 ring-blue-500/50'
                : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
            }`}
          >
            {currentPlan !== 'pro' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold rounded-full shadow">
                RECOMMENDED FOR STUDENTS
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-400" /> StudyMat Pro
                </h3>
                {currentPlan === 'pro' && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{billingCycle === 'annual' ? '$7' : '$9'}</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {billingCycle === 'annual' ? 'Billed annually at $84/yr' : 'Billed monthly, cancel anytime'}
              </p>

              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>100 AI study generations / day</strong> (10x free tier)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>25 PDF & Document uploads</strong> with OCR Q&A</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>AI Study Planner</strong> with automated daily schedules</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full practice quizzes up to <strong>15 questions</strong> per quiz</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Weak topic diagnostic analytics & practice</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('pro')}
              disabled={isSubmitting || currentPlan === 'pro'}
              className={`mt-6 w-full py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wide transition shadow-lg ${
                currentPlan === 'pro'
                  ? 'bg-slate-700 text-slate-400 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25'
              }`}
            >
              {currentPlan === 'pro' ? 'Active Subscription' : isSubmitting ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Premium Researcher Tier */}
          <div
            className={`relative rounded-xl border p-5 transition flex flex-col justify-between ${
              currentPlan === 'premium'
                ? 'bg-purple-950/20 border-purple-500/60 ring-1 ring-purple-500/50'
                : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Premium Scholar
                </h3>
                {currentPlan === 'premium' && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{billingCycle === 'annual' ? '$15' : '$19'}</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {billingCycle === 'annual' ? 'Billed annually at $180/yr' : 'Billed monthly, cancel anytime'}
              </p>

              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>Unlimited AI generations</strong> & conversations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>Unlimited document uploads</strong> & textbook parsing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Standardized exam prep simulations (MCAT, GRE, SAT)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Priority fast-lane AI response speeds</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Multi-export: PDF, Markdown, Anki, and Notability</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('premium')}
              disabled={isSubmitting || currentPlan === 'premium'}
              className={`mt-6 w-full py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wide transition shadow-lg ${
                currentPlan === 'premium'
                  ? 'bg-slate-700 text-slate-400 cursor-default'
                  : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-purple-500/25'
              }`}
            >
              {currentPlan === 'premium' ? 'Active Subscription' : isSubmitting ? 'Processing...' : 'Upgrade to Premium'}
            </button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 border-t border-slate-800 pt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Instant upgrade with 14-day academic satisfaction refund guarantee. No lock-in contract.</span>
        </div>
      </div>
    </div>
  );
};
