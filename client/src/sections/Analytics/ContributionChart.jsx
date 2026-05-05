
import { cardBase, sans, serif } from "../../lib/uiTokens.js";

export default function ContributionChart({ data: liveData }) {
  const data = (liveData?.length ? liveData : []).map((item) => ({
    name: item.name,
    value: Math.abs(item.netBalance || item.paid || 0),
  }));

  const max = Math.max(...data.map((item) => item.value), 1);
  const total = data.reduce((a, b) => a + b.value, 0);
  const avg = total / Math.max(data.length, 1);
  const imbalance = data.length > 1 ? Math.round(((data[0].value - data[data.length - 1].value) / Math.max(avg, 1)) * 100) : 0;

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
        {data.length === 0 && <p className="text-sm text-gray-400">No contribution data yet.</p>}
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
