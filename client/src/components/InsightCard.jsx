import { useEffect, useState } from "react";

export default function InsightCard({ text, small = false }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl bg-[#A3FDA7]/8 border border-[#A3FDA7]/20 transition-all duration-500
        ${small ? "p-4" : "p-5"}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#A3FDA7]/20 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex items-start gap-3">
        <div
          className={`rounded-full bg-[#A3FDA7]/20 flex items-center justify-center shrink-0 border border-[#A3FDA7]/30 ${
            small ? "w-6 h-6" : "w-8 h-8"
          }`}
        >
          <svg
            width={small ? 12 : 14}
            height={small ? 12 : 14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#15803d"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </div>
        <p className={`text-black leading-relaxed ${small ? "text-xs" : "text-sm"}`}>{text}</p>
      </div>
    </div>
  );
}
