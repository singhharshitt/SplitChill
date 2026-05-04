const cardBase =
  "bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5";

export default function AISuggestion() {
  return (
    <div className={`${cardBase} relative overflow-hidden bg-[#FAFAF8]`}>

      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#A3FDA7]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#A3FDA7]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#A3FDA7]/20 flex items-center justify-center shrink-0 border border-[#A3FDA7]/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10" />
              <path d="M12 12L2.5 12" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-semibold">AI Insight</span>
            <p className="text-base text-black mt-1 leading-relaxed max-w-md">
              You should settle <span className="font-serif text-emerald-700">₹320</span> with Rohan to restore fairness in <span className="font-serif">Flatmates</span>.
            </p>
          </div>
        </div>

        <button className="shrink-0 px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 hover:scale-[1.03] transition-all duration-300 shadow-lg shadow-black/5">
          Settle Now
        </button>
      </div>
    </div>
  );
}
