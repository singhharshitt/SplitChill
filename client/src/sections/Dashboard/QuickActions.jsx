export default function QuickActions() {
  const actions = [
    { label: "Add Expense", primary: true },
    { label: "Split Now", primary: false },
    { label: "Settle Up", primary: false },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((a) => (
        <button
          key={a.label}
          className={`
            group relative overflow-hidden rounded-[20px] px-6 py-5 text-left transition-all duration-300
            ${a.primary 
              ? "bg-black text-white hover:scale-[1.02] hover:shadow-xl" 
              : "bg-white text-black border border-black/5 hover:border-black/10 hover:shadow-lg hover:-translate-y-0.5"}
          `}
        >
          <span className={`block text-sm font-medium mb-1 ${a.primary ? "text-white/60" : "text-gray-400"}`}>
            Action
          </span>
          <span className={`block text-lg font-serif ${a.primary ? "text-white" : "text-black"}`}>
            {a.label}
          </span>
          <div className={`absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 ${a.primary ? "bg-white/10" : "bg-black/[0.03]"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={a.primary ? "text-white" : "text-black"}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}
