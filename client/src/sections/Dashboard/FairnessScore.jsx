const cardBase =
  "bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5";
const serifHeading = "font-serif text-black tracking-tight";
const sansBody = "font-sans text-gray-600";

export default function FairnessScore({ score = 100, insight = "Your groups are balanced so far." }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cardBase}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={`${serifHeading} text-2xl`}>Fairness Score</h3>
          <p className={`${sansBody} text-sm mt-1 max-w-xs`}>
            How balanced your shared spending really is.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#A3FDA7]/15 text-emerald-800 text-xs font-medium border border-[#A3FDA7]/20">
          Live
        </span>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" stroke="#f0f0f0" strokeWidth="8" fill="none" />
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="#A3FDA7"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-serif text-black">{score}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <span className="text-sm font-medium text-black">{score >= 80 ? "Balanced" : "Needs attention"}</span>
            <p className="text-xs text-gray-500 mt-0.5">
              Backend-calculated fairness for your active group.
            </p>
          </div>
          <div className="h-px bg-black/5 w-full" />
          <p className="text-xs text-gray-400 leading-relaxed">
            {insight}
          </p>
        </div>
      </div>
    </div>
  );
}
