import { useState } from "react";

const serif = "font-serif text-black tracking-tight";

export default function AmountInput({ value, onChange }) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <label className={`${serif} text-2xl md:text-3xl text-center`}>
        What’s the total expense?
      </label>

      <div className="relative flex items-center justify-center w-full max-w-sm mt-2">
        <span
          className={`absolute left-0 text-5xl md:text-6xl font-serif transition-colors duration-300 select-none ${
            focused ? "text-emerald-600" : "text-black/20"
          }`}
        >
          ₹
        </span>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="0"
          className="w-full pl-12 pr-4 py-4 text-5xl md:text-6xl font-serif text-center bg-transparent border-b-2 border-black/10 focus:border-[#A3FDA7] outline-none transition-all duration-300 placeholder:text-black/10"
        />
        {focused && (
          <div
            className="absolute -inset-4 rounded-3xl pointer-events-none transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(circle, rgba(163,253,167,0.15) 0%, transparent 70%)",
            }}
          />
        )}
      </div>

      <p className="text-xs text-gray-400 mt-1">
        Include taxes or tips if needed
      </p>
    </div>
  );
}
