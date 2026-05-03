export default function ChatListItem({ chat, isActive, onClick }) {
  const statusTag = chat.balance.type === "settled" ? null :
                    chat.balance.type === "owed" ? { text: "Owes you", color: "bg-emerald-50 text-emerald-700 border-emerald-100" } :
                    { text: "You owe", color: "bg-red-50 text-red-600 border-red-100" };

  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${isActive ? "bg-black/[0.03] shadow-sm" : "hover:bg-black/[0.015]"}`}>
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold ${chat.type === "group" ? "bg-black/[0.04] text-black" : "bg-[#A3FDA7]/20 text-emerald-800"}`}>
          {chat.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-medium text-black">{chat.name}</span>
            <span className="text-[10px] text-gray-400 shrink-0 ml-2">{chat.time}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 truncate max-w-[140px]">{chat.lastMessage}</span>
            {chat.unread > 0 && (
              <span className="ml-2 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-medium shrink-0">{chat.unread}</span>
            )}
          </div>
        </div>
      </div>
      {statusTag && (
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusTag.color}`}>{statusTag.text} ₹{chat.balance.amount}</span>
          {chat.unread > 0 && <span className="text-[10px] text-amber-600 font-medium">Pending split</span>}
        </div>
      )}
    </button>
  );
}
