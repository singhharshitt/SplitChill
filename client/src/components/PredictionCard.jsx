







export default function PredictionCard({ title, desc, confidence, trend }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#FAFAF8] border border-[#A3FDA7]/20 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#A3FDA7]/20 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#A3FDA7]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold">Prediction</span>
        </div>
        
        <p className="text-base text-black font-medium leading-relaxed">{title}</p>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">{confidence} confidence</span>
          {trend === "up" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          )}
          {trend === "down" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
