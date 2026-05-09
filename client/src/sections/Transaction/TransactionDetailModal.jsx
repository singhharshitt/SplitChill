import { serif } from "../../lib/uiTokens.js";
import PaymentStatusPanel from "../../components/PaymentStatusPanel.jsx";

export default function TransactionDetailModal({ transaction, onClose }) {
  if (!transaction) return null;

  const maxShare = Math.max(...transaction.breakdown.map((b) => b.share));
  const isSettlement = transaction.type === "settlement";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[28px] shadow-2xl border border-black/[0.04] animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-8 pt-8 pb-4 border-b border-black/[0.04] flex items-start justify-between z-10">
          <div>
            <span className={`text-[10px] uppercase tracking-widest font-medium ${
              isSettlement ? "text-emerald-600" : "text-gray-500"
            }`}>
              {isSettlement ? "Settlement" : "Expense"}
            </span>
            <h2 className={`${serif} text-2xl mt-1`}>{transaction.title}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/[0.03] flex items-center justify-center text-gray-500 hover:text-black hover:bg-black/[0.06] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-8 py-6 flex flex-col gap-8">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Amount</p>
              <p className="text-4xl font-serif text-black">₹{transaction.amount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">{transaction.date}</p>
              <span className="text-xs px-3 py-1 rounded-full bg-black/[0.03] text-gray-600 border border-black/[0.04]">{transaction.group}</span>
            </div>
          </div>

          {/* Payer */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAFAF8] border border-black/[0.03]">
            <div className="w-10 h-10 rounded-full bg-black/[0.04] flex items-center justify-center text-sm font-bold">
              {transaction.payer[0]}
            </div>
            <div>
              <p className="text-xs text-gray-500">Paid by</p>
              <p className="text-sm font-medium text-black">{transaction.payer} paid ₹{transaction.amount.toLocaleString()}</p>
            </div>
          </div>

          {/* Split Breakdown */}
          <div>
            <h3 className={`${serif} text-lg mb-4`}>Split Breakdown</h3>
            <div className="flex flex-col gap-3">
              {transaction.breakdown.map((person) => (
                <div key={person.name} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium text-black shrink-0">{person.name}</span>
                  <div className="flex-1 h-8 bg-black/[0.03] rounded-xl overflow-hidden relative">
                    <div
                      className={`h-full rounded-xl transition-all duration-700 ${
                        person.name === "You" ? "bg-black" : "bg-black/[0.06]"
                      }`}
                      style={{ width: `${(person.share / maxShare) * 100}%` }}
                    />
                    <span className={`absolute inset-0 flex items-center px-3 text-xs font-medium ${
                      person.name === "You" ? "text-white" : "text-black"
                    }`}>
                      ₹{person.share.toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-xs font-medium w-16 text-right shrink-0 ${
                    person.net > 0 ? "text-emerald-600" : person.net < 0 ? "text-red-500" : "text-gray-400"
                  }`}>
                    {person.net > 0 ? "+" : person.net < 0 ? "-" : ""}₹{Math.abs(person.net)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Split Logic */}
          <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-black/[0.03]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#A3FDA7]/15 flex items-center justify-center shrink-0 border border-[#A3FDA7]/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-700 font-bold mb-1">Split Logic</p>
                <p className="text-sm text-black leading-relaxed">{transaction.splitLogic}</p>
              </div>
            </div>
          </div>

          {/* Fairness Context */}
          {isSettlement && (
            <PaymentStatusPanel transaction={transaction} />
          )}

          {/* Fairness Context */}
          {!isSettlement && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#A3FDA7]/8 border border-[#A3FDA7]/15">
              <div className="text-center">
                <span className="text-2xl font-serif text-black">{transaction.fairnessScore}</span>
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Fairness</p>
              </div>
              <div className="h-8 w-px bg-[#A3FDA7]/30" />
              <div>
                <p className="text-sm text-black font-medium">{transaction.fairnessContext}</p>
                <p className="text-xs text-gray-500 mt-0.5">Score above 80 is considered balanced.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-medium hover:scale-[1.01] transition-transform">
              Recalculate Split
            </button>
            <button className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-medium border border-black/5 hover:border-black/10 transition-colors">
              View in Group
            </button>
            <button className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-medium border border-black/5 hover:border-black/10 transition-colors">
              Discuss in Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
