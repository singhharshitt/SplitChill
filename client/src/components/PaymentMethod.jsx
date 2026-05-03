import { useState } from "react";
import { cardBase, sans, serif } from "../lib/uiTokens.js";

export default function PaymentMethod() {
  const [methods, setMethods] = useState([
    { id: 1, type: "UPI", value: "alex@okicici", primary: true, verified: true },
    { id: 2, type: "Bank", value: "ICICI •••• 4521", primary: false, verified: true },
    { id: 3, type: "Email", value: "alex@splitchill.app", primary: false, verified: false },
  ]);

  const togglePrimary = (id) => {
    setMethods((prev) =>
      prev.map((m) => ({ ...m, primary: m.id === id }))
    );
  };

  const removeMethod = (id) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`${serif} text-2xl`}>Payment Methods</h3>
        <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add method
        </button>
      </div>

      <p className={`${sans} text-sm mb-5`}>Used for seamless settlements.</p>

      <div className="flex flex-col gap-3">
        {methods.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#FAFAF8] border border-black/[0.03] hover:border-black/5 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                  m.type === "UPI"
                    ? "bg-purple-50 text-purple-700"
                    : m.type === "Bank"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {m.type[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-black">{m.value}</span>
                  {m.primary && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black text-white font-medium">
                      Primary
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">{m.type}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className={`text-[10px] font-medium ${m.verified ? "text-emerald-600" : "text-amber-600"}`}>
                    {m.verified ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!m.primary && (
                <button
                  onClick={() => togglePrimary(m.id)}
                  className="text-[10px] text-gray-500 hover:text-black transition-colors underline underline-offset-2"
                >
                  Set primary
                </button>
              )}
              <button
                onClick={() => removeMethod(m.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
