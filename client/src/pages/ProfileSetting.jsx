import React, { useState, useEffect } from "react";
import PaymentMethod from "../components/PaymentMethod.jsx";
import ProfileCard from "../components/ProfileCard.jsx";
import ToggleSwitch from "../components/ToggleSwitch.jsx";
import IncomeSettings from "../sections/ProfileSetting/IncomeSetting.jsx";
import SecuritySetting from "../sections/ProfileSetting/SecuritySetting.jsx";

/* ─────────────────────────────────────────────
   TOKENS
   ───────────────────────────────────────────── */
const cardBase =
  "bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5";
const serif = "font-serif text-black tracking-tight";
const sans = "font-sans text-gray-600";

/* ─────────────────────────────────────────────
   REUSABLE TOGGLE SWITCH
   ───────────────────────────────────────────── */


/* ─────────────────────────────────────────────
   AI INSIGHT CARD
   ───────────────────────────────────────────── */
function AIInsightCard({ text, small }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl bg-[#A3FDA7]/8 border border-[#A3FDA7]/20 transition-all duration-500
        ${small ? "p-4" : "p-5"}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#A3FDA7]/20 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex items-start gap-3">
        <div
          className={`rounded-full bg-[#A3FDA7]/20 flex items-center justify-center shrink-0 border border-[#A3FDA7]/30 ${
            small ? "w-6 h-6" : "w-8 h-8"
          }`}
        >
          <svg
            width={small ? 12 : 14}
            height={small ? 12 : 14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#15803d"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </div>
        <p className={`text-black leading-relaxed ${small ? "text-xs" : "text-sm"}`}>{text}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   1. PROFILE CARD
   ───────────────────────────────────────────── */


/* ─────────────────────────────────────────────
   2. INCOME SETTINGS (FAIRNESS ENGINE CORE)
   ───────────────────────────────────────────── */




/* ─────────────────────────────────────────────
   4. SECURITY & PRIVACY
   ───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   5. PREFERENCES (BEHAVIOR CONTROL)
   ───────────────────────────────────────────── */
function PreferencesPanel() {
  const [defaultSplit, setDefaultSplit] = useState("ai");
  const [reminders, setReminders] = useState(true);
  const [fairnessAlerts, setFairnessAlerts] = useState(true);
  const [groupActivity, setGroupActivity] = useState(false);

  const splitOptions = [
    { key: "equal", label: "Equal", desc: "Divide evenly, always" },
    { key: "ai", label: "AI Recommended", desc: "Smart fairness-based splits", star: true },
    { key: "custom", label: "Custom", desc: "You decide every time" },
  ];

  return (
    <div className={cardBase}>
      <h3 className={`${serif} text-2xl mb-2`}>Preferences</h3>
      <p className={`${sans} text-sm mb-6`}>Choose how SplitChill works for you.</p>

      {/* Default Split */}
      <div className="mb-6">
        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-3 block">
          Default Split Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {splitOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDefaultSplit(opt.key)}
              className={`
                relative flex flex-col items-start gap-1 p-4 rounded-2xl border text-left transition-all duration-300
                ${
                  defaultSplit === opt.key
                    ? "bg-[#A3FDA7]/8 border-[#A3FDA7]/30 shadow-[0_0_20px_rgba(163,253,167,0.12)]"
                    : "bg-[#FAFAF8] border-black/[0.03] hover:border-black/5"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-black">{opt.label}</span>
                {opt.star && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#A3FDA7" stroke="#A3FDA7" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
              </div>
              <span className="text-[10px] text-gray-500 leading-relaxed">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-black/5 mb-6" />

      {/* Notifications */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-3 block">
          Notifications
        </label>
        <div className="flex flex-col divide-y divide-black/5">
          <ToggleSwitch
            checked={reminders}
            onChange={setReminders}
            label="Payment reminders"
            description="Gentle nudges when a settlement is due."
          />
          <ToggleSwitch
            checked={fairnessAlerts}
            onChange={setFairnessAlerts}
            label="Fairness alerts"
            description="Notify when a group becomes imbalanced."
          />
          <ToggleSwitch
            checked={groupActivity}
            onChange={setGroupActivity}
            label="Group activity"
            description="Updates when someone adds an expense."
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FLOATING SPLIT BUTTON
   ───────────────────────────────────────────── */
function FloatingSplitButton() {
  return (
    <button className="fixed bottom-8 right-8 z-50 px-6 py-3.5 rounded-full bg-black text-white text-sm font-medium shadow-2xl shadow-black/20 hover:scale-105 hover:shadow-black/30 transition-all duration-300 flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Split Now
    </button>
  );
}

/* ─────────────────────────────────────────────
   MAIN PROFILE PAGE
   ───────────────────────────────────────────── */
export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans selection:bg-[#A3FDA7]/30 pb-24">
      {/* Header */}
      <nav className="max-w-3xl mx-auto px-6 pt-8 pb-2 flex items-center justify-between">
        <div>
          <h1 className={`${serif} text-3xl`}>Profile</h1>
          <p className={`${sans} text-sm mt-1`}>Your fairness calibration center.</p>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Profile */}
        <ProfileCard />

        {/* Income */}
        <IncomeSettings />

        {/* Payment Methods */}
        <PaymentMethod />

        {/* Security */}
        <SecuritySetting />

        {/* Preferences */}
        <PreferencesPanel />

        {/* AI Insights strip */}
        <div className="flex flex-wrap gap-3 justify-center pt-4">
          <AIInsightCard text="AI splits are currently optimized for your profile" small />
          <AIInsightCard text="You usually prefer equal splits — try AI for better fairness" small />
        </div>

        {/* Save CTA */}
        <div className="flex justify-center pt-6">
          <button className="px-10 py-3.5 rounded-full bg-black text-white text-sm font-medium hover:scale-[1.02] hover:shadow-xl transition-all duration-300 shadow-lg shadow-black/5">
            Update Fairness Settings
          </button>
        </div>
      </main>

      <FloatingSplitButton />
    </div>
  );
}
