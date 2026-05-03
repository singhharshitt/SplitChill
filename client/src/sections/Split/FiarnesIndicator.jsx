import { useMemo } from "react";

const mint = "#A3FDA7";

export default function FairnessIndicator({ people, splitType }) {
  const score = useMemo(() => {
    if (people.length < 2) return 0;
    if (splitType === "ai") return 96;
    if (splitType === "equal") return 92;
    if (splitType === "income") return 88;
    return 74;
  }, [people.length, splitType]);

  if (people.length < 2) return null;

  const label = score >= 90 ? "Balanced" : score >= 75 ? "Slightly Imbalanced" : "Needs Attention";

  return (
    <div className="flex items-center gap-5 px-1">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">Fairness Score</span>
          <span className="text-sm font-serif text-black">{score}</span>
        </div>
        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${score}%`,
              background: score >= 90 ? mint : score >= 75 ? "#fbbf24" : "#f87171",
            }}
          />
        </div>
      </div>
      <span className={`text-xs font-medium px-3 py-1 rounded-full border shrink-0 ${
        score >= 90 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
        score >= 75 ? "bg-amber-50 text-amber-700 border-amber-100" :
        "bg-red-50 text-red-600 border-red-100"
      }`}>
        {label}
      </span>
    </div>
  );
}
