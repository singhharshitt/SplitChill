import AnimatedNumber from "../../components/AnimatedNumber.jsx";

const mint = "#A3FDA7";

const cardBase =
  "bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5";
const serif = "font-serif text-black tracking-tight";
const sans = "font-sans text-gray-600";




export default function FairnessScoreCard({ fairness, trend }) {
  const score = fairness?.score ?? 100;
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;

  const trendData = trend?.length
    ? trend.slice(-7).map((item) => ({ day: new Date(item.at).toLocaleDateString([], { weekday: "short" }), score: item.score }))
    : [{ day: "Now", score }];

  const maxScore = 100;
  const points = trendData.map((d, i) => {
    const x = trendData.length === 1 ? 140 : (i / (trendData.length - 1)) * 280;
    const y = 80 - (d.score / maxScore) * 70;
    return `${x},${y}`;
  });

  const areaPoints = `0,80 ${points.join(" ")} 280,80`;

  return (
    <div className={`${cardBase} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#A3FDA7]/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        {/* Score Ring */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" stroke="#f0f0ec" strokeWidth="10" fill="none" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={mint}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-serif text-black">
                <AnimatedNumber value={score} />
              </span>
              <span className="text-xs uppercase tracking-widest text-emerald-700 font-medium mt-1">Balanced</span>
            </div>
          </div>
        </div>

        {/* Trend + Context */}
        <div className="flex-1 w-full">
          <h2 className={`${serif} text-3xl md:text-4xl mb-2`}>
            Fairness is improving
          </h2>
          <p className={`${sans} text-sm mb-6 max-w-md`}>
            Your group has become more balanced over the last 3 days.
          </p>

          <div className="w-full h-24 relative">
            <svg viewBox="0 0 280 90" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={mint} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={mint} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill="url(#trendGrad)" />
              <polyline
                points={points.join(" ")}
                fill="none"
                stroke={mint}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {trendData.map((d, i) => (
                <circle
                  key={i}
                  cx={trendData.length === 1 ? 140 : (i / (trendData.length - 1)) * 280}
                  cy={80 - (d.score / maxScore) * 70}
                  r="3.5"
                  fill={i === trendData.length - 1 ? mint : "white"}
                  stroke={mint}
                  strokeWidth="2"
                />
              ))}
            </svg>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
              {trendData.map((d) => (
                <span key={d.day}>{d.day}</span>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-[#A3FDA7]/8 border border-[#A3FDA7]/15">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
            <p className="text-xs text-emerald-800 leading-relaxed">
              You’ve contributed slightly more than others recently. Consider letting the next bill fall to someone else.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
