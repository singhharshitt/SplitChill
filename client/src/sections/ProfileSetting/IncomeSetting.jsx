import { useState } from "react";
import InsightCard from "../../components/InsightCard.jsx";
import ToggleSwitch from "../../components/ToggleSwitch.jsx";
import { cardBase, sans, serif } from "../../lib/uiTokens.js";

export default function IncomeSettings() {
  const [income, setIncome] = useState("75000");
  const [keepPrivate, setKeepPrivate] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <div className={`${cardBase} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#A3FDA7]/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`${serif} text-2xl`}>Income</h3>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-[10px] font-medium text-emerald-700">Private & encrypted</span>
          </div>
        </div>

        <p className={`${sans} text-sm mb-6 max-w-sm`}>
          This helps SplitChill adjust splits fairly based on affordability.
        </p>

        <div className="relative max-w-xs mb-5">
          <span
            className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-serif transition-colors duration-300 ${
              focused ? "text-emerald-600" : "text-black/20"
            }`}
          >
            ₹
          </span>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full pl-10 pr-4 py-3 bg-[#FAFAF8] rounded-xl text-xl font-serif text-black border border-black/5 outline-none focus:border-[#A3FDA7]/40 focus:ring-1 focus:ring-[#A3FDA7]/20 transition-all placeholder:text-black/10"
          />
          {focused && (
            <div
              className="absolute -inset-3 rounded-2xl pointer-events-none transition-opacity duration-500"
              style={{
                background:
                  "radial-gradient(circle, rgba(163,253,167,0.12) 0%, transparent 70%)",
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <ToggleSwitch
            checked={keepPrivate}
            onChange={setKeepPrivate}
            label="Keep this private from others"
            description="Only SplitChill's AI uses this — never shared with your group."
          />
        </div>

        <InsightCard
          text="Your contributions may be adjusted to reduce imbalance. Updating income improves fairness accuracy."
          small
        />
      </div>
    </div>
  );
}
