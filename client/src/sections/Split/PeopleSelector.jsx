import React, { useState } from "react";

const serif = "font-serif text-black tracking-tight";

export default function PeopleSelector({ people, onAdd, onRemove, allowAdd = true }) {
  const [name, setName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ id: Date.now(), name: name.trim(), initial: name.trim()[0].toUpperCase() });
    setName("");
    setShowInput(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <h3 className={`${serif} text-2xl`}>Who’s involved?</h3>

      <div className="flex flex-wrap items-center gap-3">
        {people.map((p) => (
          <div
            key={p.id}
            className="group flex items-center gap-2.5 pl-2 pr-1 py-1.5 bg-white rounded-full border border-black/5 shadow-sm hover:shadow-md hover:border-black/10 transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center text-sm font-medium text-black">
              {p.initial}
            </div>
            <span className="text-sm text-black font-medium">{p.name}</span>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              ×
            </button>
          </div>
        ))}

        {allowAdd && showInput ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Name"
              className="px-4 py-2 rounded-full border border-black/10 text-sm outline-none focus:border-[#A3FDA7] focus:ring-1 focus:ring-[#A3FDA7]/30 w-36 transition-all"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm hover:scale-105 transition-transform"
            >
              ✓
            </button>
          </div>
        ) : allowAdd ? (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="w-10 h-10 rounded-full border border-dashed border-black/20 flex items-center justify-center text-gray-400 hover:text-black hover:border-black/40 hover:bg-black/[0.02] transition-all duration-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        ) : null}
      </div>

      {people.length === 0 && (
        <p className="text-sm text-gray-400 italic">Add people to start splitting</p>
      )}
    </div>
  );
}
