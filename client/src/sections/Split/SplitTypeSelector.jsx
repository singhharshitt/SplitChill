import React from "react";

const serif = "font-serif text-black tracking-tight";

export default function SplitTypeSelector({ active, onSelect }) {
  const types = [
    { key: "equal", label: "Equal" },
    { key: "custom", label: "Custom" },
    { key: "income", label: "Income-Based" },
    { key: "ai", label: "AI Recommended", star: true },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h3 className={`${serif} text-2xl`}>How should we split this?</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {types.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onSelect(t.key)}
              className={`
                relative flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-medium border transition-all duration-300
                ${
                  isActive
                    ? "bg-[#A3FDA7]/10 border-[#A3FDA7]/40 text-black shadow-[0_0_24px_rgba(163,253,167,0.18)]"
                    : "bg-white border-black/5 text-gray-500 hover:border-black/10 hover:text-black"
                }
                ${t.key === "ai" && !isActive ? "ring-1 ring-[#A3FDA7]/20" : ""}
              `}
            >
              {t.star && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#A3FDA7" stroke="#A3FDA7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
