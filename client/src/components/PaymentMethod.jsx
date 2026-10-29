import { useState } from "react";
import { Loader2, Smartphone } from "lucide-react";
import { cardBase, sans, serif } from "../lib/uiTokens.js";
import { getApiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const UPI_PATTERN = /^[\w.]{2,}@[a-zA-Z]{2,}[\w.]*$/;

export default function PaymentMethod() {
  const { user, updateProfile } = useAuth();
  const savedUpi = user?.upi || "";
  const [value, setValue] = useState(savedUpi);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { ok, text }

  const save = async () => {
    const next = value.trim();
    if (next && !UPI_PATTERN.test(next)) {
      setFeedback({ ok: false, text: "Enter a valid UPI ID like name@bank." });
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await updateProfile({ upi: next });
      if (result?.success !== false) {
        setFeedback({ ok: true, text: next ? "Saved. Group members can settle debts to this UPI ID." : "UPI ID cleared." });
      } else {
        setFeedback({ ok: false, text: result?.error || "Could not save your UPI ID." });
      }
    } catch (err) {
      setFeedback({ ok: false, text: getApiError(err, "Could not save your UPI ID.") });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`${serif} text-2xl`}>UPI Settlement</h3>
        <Smartphone size={16} className="text-gray-400" />
      </div>

      <p className={`${sans} text-sm mb-5`}>
        Members settling a debt to you will pay to this UPI ID. SplitChill does not handle money —
        payments go directly from the payer's UPI app to yours.
      </p>

      <div className={`${sans} flex flex-col sm:flex-row gap-3`}>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="yourname@bank"
          className="flex-1 rounded-xl border border-black/10 bg-[#FAFAF8] px-4 py-3 text-sm outline-none focus:border-black/20"
        />
        <button
          type="button"
          onClick={save}
          disabled={isSaving || value.trim() === savedUpi}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving && <Loader2 size={15} className="animate-spin" />}
          Save
        </button>
      </div>

      {feedback && (
        <p className={`text-xs mt-3 ${feedback.ok ? "text-emerald-700" : "text-red-600"}`}>{feedback.text}</p>
      )}
      {!savedUpi && (
        <p className="text-[11px] text-gray-400 mt-3">No UPI ID saved yet. Settlements to you will require the payer to enter a UPI ID manually.</p>
      )}
    </div>
  );
}
