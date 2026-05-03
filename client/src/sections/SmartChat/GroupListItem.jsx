export default function GroupListItem({ group, isActive, onClick }) {
  const scoreColor = group.fairnessScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                     group.fairnessScore >= 60 ? "bg-amber-50 text-amber-700 border-amber-100" :
                     "bg-red-50 text-red-600 border-red-100";

  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${isActive ? "bg-black/[0.03] shadow-sm" : "hover:bg-black/[0.015]"}`}>
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center text-xs font-bold text-black">{group.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-medium text-black">{group.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${scoreColor}`}>
              {group.fairnessScore >= 80 ? "Fair" : group.fairnessScore >= 60 ? "Imbalanced" : "Unfair"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {group.members.slice(0, 3).map((m) => (
                <div key={m.id} className="w-5 h-5 rounded-full bg-black/[0.05] border border-white flex items-center justify-center text-[8px] font-medium">{m.avatar}</div>
              ))}
              {group.members.length > 3 && <div className="w-5 h-5 rounded-full bg-black/[0.03] border border-white flex items-center justify-center text-[8px] text-gray-500">+{group.members.length - 3}</div>}
            </div>
            <span className="text-[10px] text-gray-400">{group.members.length} members</span>
          </div>
        </div>
        {group.balance.amount > 0 && (
          <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${group.balance.type === "owed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
            {group.balance.type === "owed" ? `+₹${group.balance.amount}` : `-₹${group.balance.amount}`}
          </div>
        )}
      </div>
    </button>
  );
}



