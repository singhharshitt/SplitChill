import { cardBase, serif } from "../../lib/uiTokens.js";

export default function ContextPanel({ chat }) {
  if (!chat || chat.type === "individual") {
    return (
      <div className="hidden xl:flex flex-col h-full bg-white/40 backdrop-blur-sm border-l border-black/[0.04] w-72 p-6">
        <p className="text-sm text-gray-400 text-center mt-20">Select a group to see fairness context.</p>
      </div>
    );
  }

  const balances = [
    { name: "You", paid: 3200, owed: 2800, net: 400 },
    { name: "Alex", paid: 4500, owed: 4200, net: 300 },
    { name: "Rohan", paid: 6000, owed: 3800, net: 2200 },
    { name: "Sarah", paid: 1800, owed: 3100, net: -1300 },
  ];

  return (
    <div className="hidden xl:flex flex-col h-full bg-white/40 backdrop-blur-sm border-l border-black/[0.04] w-80 overflow-y-auto">
      <div className="p-6">
        <h4 className={`${serif} text-lg mb-5`}>Group Context</h4>

        {/* Fairness Score */}
        <div className={`${cardBase} p-5 mb-5 text-center`}>
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Fairness Score</span>
          <div className="text-4xl font-serif text-black mt-1">{chat.fairnessScore}</div>
          <span className={`
            text-[10px] font-medium px-2.5 py-0.5 rounded-full border mt-2 inline-block
            ${chat.fairnessScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
              chat.fairnessScore >= 60 ? "bg-amber-50 text-amber-700 border-amber-100" :
              "bg-red-50 text-red-600 border-red-100"}
          `}>
            {chat.fairnessScore >= 80 ? "Balanced" : chat.fairnessScore >= 60 ? "Slightly Imbalanced" : "Unfair"}
          </span>
        </div>

        {/* Balances */}
        <div className="mb-5">
          <h5 className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-3">Who Owes Whom</h5>
          <div className="flex flex-col gap-2">
            {balances.map((b) => (
              <div key={b.name} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white border border-black/[0.03]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-black/[0.03] flex items-center justify-center text-[10px] font-bold">
                    {b.name[0]}
                  </div>
                  <span className="text-xs font-medium text-black">{b.name}</span>
                </div>
                <span className={`text-xs font-medium ${b.net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {b.net >= 0 ? "+" : ""}₹{b.net}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Settle */}
        <button className="w-full py-3 rounded-xl bg-black text-white text-xs font-medium hover:scale-[1.01] transition-transform">
          Settle All Balances
        </button>
      </div>
    </div>
  );
}
