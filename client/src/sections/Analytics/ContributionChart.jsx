
import { cardBase, sans, serif } from "../../lib/uiTokens.js";

export default function ContributionChart() {
  const data = [
    { name: "Rohan", value: 6000, color: "#000" },
    { name: "Alex", value: 4500, color: "#333" },
    { name: "You", value: 3200, color: "#666" },
    { name: "Sarah", value: 1800, color: "#999" },
  ];

  const max = 7000;
  const total = data.reduce((a, b) => a + b.value, 0);
  const avg = total / data.length;
  const imbalance = Math.round(((data[0].value - data[data.length - 1].value) / avg) * 100);

  return (
    <div className={cardBase}>
      <div className="mb-6">
        <h3 className={`${serif} text-2xl`}>Contribution Imbalance</h3>
        <p className={`${sans} text-sm mt-1`}>Ranking who has contributed the most.</p>
      </div>

      <div className="flex flex-col gap-4">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-4">
            <span className="w-16 text-sm font-medium text-black shrink-0">{d.name}</span>
            <div className="flex-1 h-9 bg-black/[0.03] rounded-xl overflow-hidden relative">
              <div
                className="h-full rounded-xl transition-all duration-700 ease-out flex items-center justify-end pr-3"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  backgroundColor: i === 0 ? "#A3FDA7" : i === data.length - 1 ? "#fecaca" : "#e5e5e5",
                }}
              >
                <span className={`text-xs font-medium ${i === 0 ? "text-emerald-800" : i === data.length - 1 ? "text-red-700" : "text-gray-600"}`}>
                  ₹{d.value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50/50 border border-red-100">
        <span className="text-lg">⚠️</span>
        <div>
          <p className="text-sm text-red-700 font-medium">This group has a contribution imbalance of {imbalance}%.</p>
          <p className="text-xs text-red-500/80 mt-0.5">Higher imbalance may lead to friction over time.</p>
        </div>
      </div>
    </div>
  );
}
