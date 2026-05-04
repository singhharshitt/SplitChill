const cardBase =
  "bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5";

const serifHeading = "font-serif text-black tracking-tight";

/* ─────────────────────────────────────────────
   1. BALANCE OVERVIEW
   ───────────────────────────────────────────── */

export default function BalanceOverview() {
  return (
    <div className={`${cardBase} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#A3FDA7]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />      
      <h2 className={`${serifHeading} text-3xl md:text-4xl mb-8`}>
        Your financial balance, <br className="hidden md:block" />
        <span className="italic text-gray-500">at a glance</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="flex flex-col gap-2 p-5 rounded-2xl bg-red-50/50 border border-red-100">
          <span className="text-xs uppercase tracking-widest text-red-400 font-medium">You Owe</span>
          <span className="text-3xl md:text-4xl font-serif text-red-600">₹1,200</span>
          <span className="text-xs text-red-400/80">Across 3 groups</span>
        </div>

        <div className="flex flex-col gap-2 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
          <span className="text-xs uppercase tracking-widest text-emerald-500 font-medium">You Are Owed</span>
          <span className="text-3xl md:text-4xl font-serif text-emerald-600">₹2,300</span>
          <span className="text-xs text-emerald-500/80">From 5 friends</span>
        </div>

        <div className="flex flex-col gap-2 p-5 rounded-2xl bg-[#A3FDA7]/10 border border-[#A3FDA7]/30">
          <span className="text-xs uppercase tracking-widest text-emerald-700 font-medium">Net Balance</span>
          <span className="text-3xl md:text-4xl font-serif text-emerald-700">+₹1,100</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A3FDA7]" />
            <span className="text-xs text-emerald-700/80">Fairness positive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
