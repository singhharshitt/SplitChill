import { useState } from "react";
import { X } from "lucide-react";
import { getApiError } from "../api/client.js";
import { useLiveData } from "../context/LiveDataContext.jsx";
import groupsplit from "../assets/groupsplit.png";

export default function DirectChatModal({ open, onClose, onOpened }) {
  const { startDirectChatByEmail } = useLiveData();
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback("");
    setIsSaving(true);
    try {
      const group = await startDirectChatByEmail(email);
      setEmail("");
      onOpened?.(group);
      onClose();
    } catch (error) {
      setFeedback(getApiError(error, "No registered SplitChill user found for that email."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-white rounded-[28px] border border-black/[0.04] shadow-2xl p-6 md:p-8">
        <button type="button" onClick={onClose} className="absolute top-5 right-5 h-9 w-9 rounded-full bg-black/[0.03] flex items-center justify-center text-gray-500 hover:text-black">
          <X size={16} />
        </button>
        <div className="flex items-start gap-4 pr-10">
          <img src={groupsplit} alt="" className="w-20 h-20 object-contain" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold mb-1">Create Chat</p>
            <h2 className="font-serif text-3xl text-black">Start by email</h2>
            <p className="text-sm text-gray-500 mt-2">Only registered SplitChill users can be added.</p>
          </div>
        </div>

        <label className="mt-7 flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.12em] text-gray-500 font-medium">User email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="rounded-2xl border border-black/10 bg-[#FAFAF8] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#A3FDA7]/40"
            placeholder="friend@example.com"
          />
        </label>
        {feedback && <p className="mt-4 text-xs text-red-600">{feedback}</p>}
        <button type="submit" disabled={isSaving || !email.trim()} className="mt-6 w-full rounded-full bg-black px-6 py-3.5 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed">
          {isSaving ? "Opening..." : "Open chat"}
        </button>
      </form>
    </div>
  );
}
