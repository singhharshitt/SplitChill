import { sans, serif } from "../../lib/uiTokens.js";

export default function ChatList({ chats, activeId, onSelect }) {
  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-sm border-r border-black/[0.04]">
      <div className="px-6 pt-8 pb-5">
        <h2 className={`${serif} text-2xl`}>Conversations</h2>
        <p className={`${sans} text-xs mt-1`}>Money talks, made simple.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {chats.map((chat) => {
          const isActive = chat.id === activeId;
          const bal = chat.balance;

          return (
            <button
              key={chat.id}
              onClick={() => onSelect(chat)}
              className={`
                w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 group
                ${isActive ? "bg-black/[0.03] shadow-sm" : "hover:bg-black/[0.015]"}
              `}
            >
              <div
                className={`
                  w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${chat.type === "group" ? "bg-black/[0.04] text-black" : "bg-[#A3FDA7]/20 text-emerald-800"}
                `}
              >
                {chat.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-black truncate">{chat.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate max-w-[140px]">{chat.lastMessage}</span>
                  {chat.unread > 0 && (
                    <span className="ml-2 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-medium shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>

              {bal.amount > 0 && (
                <div
                  className={`
                    text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 border
                    ${
                      bal.type === "owed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : bal.type === "owe"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-gray-50 text-gray-500 border-gray-100"
                    }
                  `}
                >
                  {bal.type === "owed" ? `+₹${bal.amount}` : bal.type === "owe" ? `-₹${bal.amount}` : "Settled"}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
