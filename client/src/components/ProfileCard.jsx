import { useState } from "react";
import { cardBase, serif } from "../lib/uiTokens.js";

export default function ProfileCard() {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@splitchill.app");

  return (
    <div className={cardBase}>
      <div className="flex items-start justify-between mb-6">
        <h3 className={`${serif} text-2xl`}>Your Profile</h3>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs text-gray-500 hover:text-black transition-colors underline underline-offset-4"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative group cursor-pointer">
          <div className="w-20 h-20 rounded-full bg-black/[0.04] flex items-center justify-center text-2xl font-serif text-black border-2 border-white shadow-sm">
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          {editing ? (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1 block">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FAFAF8] rounded-xl px-4 py-2.5 text-sm border border-black/5 outline-none focus:border-[#A3FDA7]/40 focus:ring-1 focus:ring-[#A3FDA7]/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1 block">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAFAF8] rounded-xl px-4 py-2.5 text-sm border border-black/5 outline-none focus:border-[#A3FDA7]/40 focus:ring-1 focus:ring-[#A3FDA7]/20 transition-all"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-lg font-medium text-black">{name}</p>
                <p className="text-sm text-gray-500">{email}</p>
              </div>
              <p className="text-xs text-gray-400">Active in 4 groups</p>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-5 leading-relaxed">This helps your group recognize you.</p>
    </div>
  );
}
