import { cardBase } from "../../lib/uiTokens.js";

export default function SummaryStats({ transactions }) {
  const totalPaid = transactions
    .filter((t) => t.breakdown.find((b) => b.name === "You")?.paid > 0)
    .reduce((sum, t) => sum + (t.breakdown.find((b) => b.name === "You")?.paid || 0), 0);

  const totalOwed = transactions
    .filter((t) => {
      const you = t.breakdown.find((b) => b.name === "You");
      return you && you.net < 0;
    })
    .reduce((sum, t) => sum + Math.abs(t.breakdown.find((b) => b.name === "You")?.net || 0), 0);

  const totalReceived = transactions
    .filter((t) => {
      const you = t.breakdown.find((b) => b.name === "You");
      return you && you.net > 0;
    })
    .reduce((sum, t) => sum + (t.breakdown.find((b) => b.name === "You")?.net || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className={cardBase}>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Total Paid</span>
        <p className="text-2xl font-serif text-black mt-1">₹{totalPaid.toLocaleString()}</p>
      </div>
      <div className={cardBase}>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">You Owe</span>
        <p className="text-2xl font-serif text-red-500 mt-1">₹{totalOwed.toLocaleString()}</p>
      </div>
      <div className={cardBase}>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">You're Owed</span>
        <p className="text-2xl font-serif text-emerald-600 mt-1">₹{totalReceived.toLocaleString()}</p>
      </div>
    </div>
  );
}
