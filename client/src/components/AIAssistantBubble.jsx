import { useEffect, useState } from "react";

export default function AIAssistantBubble({ message }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timeoutId = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timeoutId);
  }, []);
  return (
    <div className={`flex justify-start transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
      <div className="max-w-[85%]">
        <div className="relative overflow-hidden rounded-2xl bg-[#A3FDA7]/8 border border-[#A3FDA7]/20 p-5">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#A3FDA7]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#A3FDA7]/30 flex items-center justify-center shrink-0 border border-[#A3FDA7]/40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-black leading-relaxed">{message.text}</p>
              {message.actions && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.actions.map((a) => (
                    <button key={a.label} className="px-4 py-1.5 rounded-full bg-white border border-black/5 text-xs font-medium text-black hover:bg-black hover:text-white transition-all duration-300 shadow-sm">
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {message.time && <span className="text-[10px] text-gray-400 mt-1.5 block ml-1">{message.time}</span>}
      </div>
    </div>
  );
}
