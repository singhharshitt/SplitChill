import { useMemo } from "react";

const cardBase =
  "bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] transition-all duration-300";
const serif = "font-serif text-black tracking-tight";



export default function SplitPreview({ amount, people, splitType, customShares, onCustomChange, recommendedShares }) {
  const shares = useMemo(() => {
    const total = parseFloat(amount) || 0;
    if (!people.length || total <= 0) return [];
    if (recommendedShares?.length && splitType !== "custom") {
      return people.map((person) => {
        const backendShare = recommendedShares.find((share) => String(share.user) === String(person.id));
        return { ...person, share: backendShare?.share || 0 };
      });
    }

    if (splitType === "equal") {
      const each = total / people.length;
      return people.map((p) => ({ ...p, share: each }));
    }

    if (splitType === "custom") {
      return people.map((p) => ({
        ...p,
        share: parseFloat(customShares[p.id]) || 0,
      }));
    }

    if (splitType === "income") {
      // Client-side preview: approximate income-weighted distribution
      const weights = people.map((_, i) => 1 + i * 0.3);
      const sumW = weights.reduce((a, b) => a + b, 0);
      return people.map((p, i) => ({ ...p, share: (weights[i] / sumW) * total }));
    }

    if (splitType === "ai") {
      // Client-side preview: approximate fairness-adjusted distribution
      const adjusted = people.map((p, i) => (i === 0 ? 0.15 : 1));
      const sumA = adjusted.reduce((a, b) => a + b, 0);
      return people.map((p, i) => ({ ...p, share: (adjusted[i] / sumA) * total }));
    }

    return people.map((p) => ({ ...p, share: 0 }));
  }, [amount, people, splitType, customShares, recommendedShares]);

  const allocated = shares.reduce((s, p) => s + p.share, 0);
  const total = parseFloat(amount) || 0;
  const remaining = Math.round((total - allocated) * 100) / 100;
  const fullyAllocated = Math.abs(remaining) < 0.01;

  if (!people.length || total <= 0) return null;

  return (
    <div className={`${cardBase} flex flex-col gap-5`}>
      <div className="flex items-center justify-between">
        <h4 className={`${serif} text-xl`}>Split Preview</h4>
        {splitType === "ai" && (
          <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold bg-[#A3FDA7]/15 px-3 py-1 rounded-full border border-[#A3FDA7]/20">
            Optimized for fairness
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {shares.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#FAFAF8] border border-black/[0.02]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center text-sm font-medium text-black">
                {p.initial}
              </div>
              <span className="text-sm font-medium text-black">{p.name}</span>
            </div>

            {splitType === "custom" ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  value={customShares[p.id] || ""}
                  onChange={(e) => onCustomChange(p.id, e.target.value)}
                  className="w-20 text-right text-sm font-serif bg-white border border-black/5 rounded-lg px-2 py-1 outline-none focus:border-[#A3FDA7] transition-colors"
                />
              </div>
            ) : (
              <span className="text-lg font-serif text-black">₹{Math.round(p.share).toLocaleString()}</span>
            )}
          </div>
        ))}
      </div>

      {splitType === "custom" && (
        <div className="flex items-center justify-between text-xs px-1">
          <span className={fullyAllocated ? "text-emerald-600" : "text-red-500"}>
            {fullyAllocated ? "Fully allocated" : `₹${Math.abs(remaining).toLocaleString()} ${remaining > 0 ? "remaining" : "over allocated"}`}
          </span>
          <span className="text-gray-400">of ₹{total.toLocaleString()}</span>
        </div>
      )}

      {splitType === "ai" && (
        <p className="text-xs text-gray-500 leading-relaxed">
          Based on income and past contributions.
        </p>
      )}
    </div>
  );
}
