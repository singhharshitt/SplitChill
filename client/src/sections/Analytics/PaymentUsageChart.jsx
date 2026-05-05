
import { cardBase, sans, serif } from "../../lib/uiTokens.js";

export default function PaymentUsageChart({ people: livePeople }) {
  const people = (livePeople?.length ? livePeople : []).map((person) => ({
    name: person.name,
    paid: person.paid,
    used: person.share,
  }));

  const maxVal = Math.max(...people.flatMap((person) => [person.paid, person.used]), 1);
  return (
    <div className={cardBase}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className={`${serif} text-2xl`}>Payment vs Usage</h3>
          <p className={`${sans} text-sm mt-1 max-w-sm`}>
            Who paid versus who actually consumed. Mismatches reveal hidden unfairness.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {people.map((p) => {
          const paidW = (p.paid / maxVal) * 100;
          const usedW = (p.used / maxVal) * 100;
          const diff = p.paid - p.used;
          const overpay = diff > 0;

          return (
            <div key={p.name} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black">{p.name}</span>
                <span className={`text-xs font-medium ${overpay ? "text-emerald-700" : "text-red-500"}`}>
                  {overpay ? "Overpaying" : "Underpaying"} by ₹{Math.abs(diff).toLocaleString()}
                </span>
              </div>

              <div className="relative h-16 flex items-center">
                {/* Paid bar */}
                <div className="absolute left-0 h-[10px] rounded-full bg-black/[0.08] overflow-hidden" style={{ width: `${paidW}%` }}>
                  <div
                    className="h-full rounded-full bg-black transition-all duration-700 ease-out"
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Used bar */}
                <div
                  className="absolute left-0 h-[10px] rounded-full overflow-hidden"
                  style={{ width: `${usedW}%`, top: "28px" }}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      overpay ? "bg-[#A3FDA7]/60" : "bg-red-300/70"
                    }`}
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Labels */}
                <span className="absolute text-[10px] text-gray-400" style={{ left: `${paidW}%`, marginLeft: 8, top: -2 }}>
                  Paid ₹{p.paid.toLocaleString()}
                </span>
                <span className="absolute text-[10px] text-gray-400" style={{ left: `${usedW}%`, marginLeft: 8, top: 26 }}>
                  Used ₹{p.used.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
        {people.length === 0 && <p className="text-sm text-gray-400">No analytics data yet.</p>}
      </div>

      <div className="mt-6 pt-5 border-t border-black/5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#A3FDA7]/15 flex items-center justify-center shrink-0 border border-[#A3FDA7]/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-black font-medium">Rohan has paid significantly more than his usage.</p>
          <p className="text-xs text-gray-500 mt-0.5">Consider adjusting future splits to restore balance.</p>
        </div>
      </div>
    </div>
  );
}
