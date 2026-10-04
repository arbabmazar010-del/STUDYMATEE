import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../lib/api.ts';
import { Mail, MessageSquare, Send, CheckCircle2, Shield, HelpCircle, Loader2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { addToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Academic Support');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      addToast('Missing Fields', 'Please complete all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitContact({ name, email, subject, message });
      setIsSubmitted(true);
      addToast('Message Dispatched! ✉️', 'Our academic support team will reply within 24 hours.', 'success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      addToast('Submission Failed', err.message || 'Could not send message.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Mail className="w-3.5 h-3.5" /> Support & Academic Inquiries
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            We’re Here to Support Your Academic Journey
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Have questions about study features, subject curriculum support, or institutional access? Reach out directly to our team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Details Card */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" /> Academic Inquiries
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct student support, curriculum feedback, and pedagogical requests:
              </p>
              <p className="text-xs font-mono text-blue-300 mt-2 font-semibold">support@studymat.ai</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" /> Response Time
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We review student tickets daily. Premium scholars receive priority triage within 6 hours.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" /> Institutional Cohorts
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inquiring for a university department, tutoring center, or research lab? Mention your institution in the message.
              </p>
            </div>
          </div>

          {/* Working Contact Form */}
          <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            {isSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Thank You for Reaching Out!</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your message has been safely logged in our academic support queue. A representative will contact you at your email address shortly.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@university.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Inquiry Topic</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="Academic Support">Academic / Subject Curriculum Support</option>
                    <option value="Feature Feedback">AI Feature Feedback or Suggestion</option>
                    <option value="Account & Billing">Subscription & Billing Question</option>
                    <option value="Institutional Cohort">University or Lab Licensing</option>
                    <option value="Bug Report">Technical Bug Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Message / Details *</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help your study workflow? Share any questions or details..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition leading-relaxed resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wide transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
