import { cardBase } from "../lib/uiTokens.js";

export default function ExpenseMessageCard({ message }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] w-full">
        <div className={`${cardBase} p-5 hover:shadow-md cursor-pointer group`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center text-xs font-bold">
                {message.from[0]}
              </div>
              <div>
                <p className="text-xs text-gray-500">{message.from} added an expense</p>
                <p className="text-sm font-medium text-black">{message.desc}</p>
              </div>
            </div>
            <span className="text-2xl font-serif text-black">₹{message.amount.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {message.participants.map((p) => (
              <div key={p} className="w-6 h-6 rounded-full bg-black/[0.03] flex items-center justify-center text-[9px] font-medium text-gray-600 border border-white">
                {p[0]}
              </div>
            ))}
            <span className="text-[10px] text-gray-400">{message.participants.length} people</span>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-xl bg-black text-white text-xs font-medium hover:scale-[1.01] transition-transform">
              Split this
            </button>
            <button className="flex-1 py-2 rounded-xl bg-[#FAFAF8] text-black text-xs font-medium border border-black/5 hover:bg-black/[0.02] transition-colors">
              View details
            </button>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-1.5 block ml-1">{message.time}</span>
      </div>
    </div>
  );
}
