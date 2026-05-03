import React, { useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   6. AI INSIGHT CARD
   ───────────────────────────────────────────── */
export default function AIInsightCard({ visible }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setShow(true), 50);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl bg-[#A3FDA7]/8 border border-[#A3FDA7]/20 p-5 md:p-6
        transition-all duration-700 ease-out
        ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
      `}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#A3FDA7]/20 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#A3FDA7]/20 flex items-center justify-center shrink-0 border border-[#A3FDA7]/30">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
            <path d="M12 2a10 10 0 0 1 10 10" />
            <path d="M12 12L2.5 12" />
          </svg>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-800 font-bold">AI Insight</span>
          <p className="text-sm text-black mt-1.5 leading-relaxed max-w-md">
            You’ve paid more in past trips — your share is reduced by 18% to restore balance.
          </p>
        </div>
      </div>
    </div>
  );
}
