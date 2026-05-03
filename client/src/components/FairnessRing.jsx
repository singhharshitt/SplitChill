import { mint } from "../lib/uiTokens.js";

export default function FairnessRing({ score }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  const label = score >= 80 ? "Balanced" : score >= 60 ? "Slightly Imbalanced" : "Unfair";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" stroke="#f0f0ec" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="36" stroke={score >= 80 ? mint : score >= 60 ? "#fbbf24" : "#f87171"} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-serif text-black">{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-gray-600">{label}</span>
    </div>
  );
}
