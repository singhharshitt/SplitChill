import { cardBase } from "../lib/uiTokens.js";

export default function TransactionItem({ transaction, onClick }) {
  const isYouPayer = transaction.payer === "You";
  const yourNet = transaction.breakdown.find((b) => b.name === "You")?.net || 0;

  return (
    <button onClick={onClick} className={`w-full text-left ${cardBase} p-5 group`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              transaction.type === "settlement" ? "bg-[#A3FDA7]/10" : "bg-black/[0.03]"
            }`}
          >
            {transaction.type === "settlement" ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#15803d"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-black"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-black truncate">{transaction.title}</h3>
              {transaction.splitType && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                    transaction.splitType === "AI"
                      ? "bg-[#A3FDA7]/10 text-emerald-700 border-[#A3FDA7]/20"
                      : "bg-gray-50 text-gray-600 border-gray-100"
                  }`}
                >
                  {transaction.splitType === "AI" ? "Split AI" : transaction.splitType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{transaction.payer} paid</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{transaction.date}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-gray-400">{transaction.group}</span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p
            className={`text-lg font-serif ${
              transaction.type === "settlement" && isYouPayer
                ? "text-red-500"
                : yourNet > 0
                  ? "text-emerald-600"
                  : yourNet < 0
                    ? "text-red-500"
                    : "text-gray-400"
            }`}
          >
            {yourNet > 0 ? "+" : yourNet < 0 ? "-" : ""}₹{Math.abs(yourNet)}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {transaction.type === "settlement" ? "settlement" : `of ₹${transaction.amount.toLocaleString()}`}
          </p>
        </div>
      </div>
    </button>
  );
}
