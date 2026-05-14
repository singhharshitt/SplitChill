import { useState } from "react";
import InsightCard from "../../components/InsightCard.jsx";
import ToggleSwitch from "../../components/ToggleSwitch.jsx";
import { cardBase, sans, serif } from "../../lib/uiTokens.js";

export default function IncomeSettings({ income = 0, keepPrivate = true, onSave }) {
  const [draftIncome, setDraftIncome] = useState("");
  const [draftPrivate, setDraftPrivate] = useState(null);
  const [focused, setFocused] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const displayedIncome = draftIncome === "" ? String(income || 0) : draftIncome;
  const displayedPrivate = draftPrivate === null ? Boolean(keepPrivate) : draftPrivate;
  const isDirty = Number(displayedIncome || 0) !== Number(income || 0) || displayedPrivate !== Boolean(keepPrivate);

  const save = async () => {
    setIsSaving(true);
    setFeedback("");
    const result = await onSave?.({
      income: Number(displayedIncome || 0),
      preferences: { keepIncomePrivate: displayedPrivate },
    });
    setIsSaving(false);
    setFeedback(result?.success ? "Income settings synced." : result?.error || "Could not save income settings.");
    if (result?.success) {
      setDraftIncome("");
      setDraftPrivate(null);
    }
  };

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
          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-serif transition-colors duration-300 ${focused ? "text-emerald-600" : "text-black/20"}`}>
            Rs
          </span>
          <input
            type="number"
            min="0"
            value={displayedIncome}
            onChange={(event) => setDraftIncome(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full pl-12 pr-4 py-3 bg-[#FAFAF8] rounded-xl text-xl font-serif text-black border border-black/5 outline-none focus:border-[#A3FDA7]/40 focus:ring-1 focus:ring-[#A3FDA7]/20 transition-all placeholder:text-black/10"
          />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <ToggleSwitch
            checked={displayedPrivate}
            onChange={setDraftPrivate}
            label="Keep this private from others"
            description="Only SplitChill's AI uses this - never shared with your group."
          />
        </div>

        <InsightCard
          text="Income updates sync into group fairness snapshots and future split recommendations."
          small
        />

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || isSaving}
            className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white disabled:opacity-40"
          >
            {isSaving ? "Saving..." : "Save income"}
          </button>
          {feedback && <p className="text-xs text-gray-500">{feedback}</p>}
        </div>
      </div>
    </div>
  );
}
