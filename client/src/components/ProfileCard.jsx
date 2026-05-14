import { useMemo, useState } from "react";
import { cardBase, serif } from "../lib/uiTokens.js";

function initials(name = "?") {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProfileCard({ user, groupCount = 0, onSave }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const avatar = useMemo(() => initials(user?.name || name || "User"), [name, user?.name]);

  const handleSave = async () => {
    if (!editing) {
      setName(user?.name || "");
      setEditing(true);
      setFeedback("");
      return;
    }
    setIsSaving(true);
    setFeedback("");
    const result = await onSave?.({ name: name.trim() });
    setIsSaving(false);
    if (result?.success) {
      setEditing(false);
      setFeedback("Profile synced.");
    } else {
      setFeedback(result?.error || "Could not update profile.");
    }
  };

  return (
    <div className={cardBase}>
      <div className="flex items-start justify-between mb-6">
        <h3 className={`${serif} text-2xl`}>Your Profile</h3>
        <button
          onClick={handleSave}
          disabled={isSaving || (editing && name.trim().length < 2)}
          className="text-xs text-gray-500 hover:text-black transition-colors underline underline-offset-4 disabled:opacity-40"
        >
          {isSaving ? "Saving..." : editing ? "Save" : "Edit"}
        </button>
      </div>

      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-black/[0.04] flex items-center justify-center text-2xl font-serif text-black border-2 border-white shadow-sm">
          {avatar}
        </div>

        <div className="flex-1 flex flex-col gap-3">
          {editing ? (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1 block">Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full bg-[#FAFAF8] rounded-xl px-4 py-2.5 text-sm border border-black/5 outline-none focus:border-[#A3FDA7]/40 focus:ring-1 focus:ring-[#A3FDA7]/20 transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-2">Email is tied to account login and cannot be changed here.</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-lg font-medium text-black">{user?.name || "SplitChill user"}</p>
                <p className="text-sm text-gray-500">{user?.email || "No email loaded"}</p>
              </div>
              <p className="text-xs text-gray-400">Active in {groupCount} group{groupCount === 1 ? "" : "s"}</p>
            </>
          )}
        </div>
      </div>

      {feedback && <p className="text-xs text-gray-500 mt-4">{feedback}</p>}
      <p className="text-xs text-gray-400 mt-5 leading-relaxed">Profile changes sync to your open SplitChill sessions in real time.</p>
    </div>
  );
}
