import { useEffect, useRef, useState } from "react";
import AIBubble from "../../components/AIAssistantBubble.jsx";
import ExpenseBubble from "../../components/ExpenseMessageCard.jsx";
import SmartActionBubble from "../../components/SmartActionBubble.jsx";
import SystemBubble from "../../components/SystemBubble.jsx";
import TextBubble from "../../components/TextBubble.jsx";
import { serif } from "../../lib/uiTokens.js";
import usePagination from "../../hooks/usePagination.js";
import { useLiveData } from "../../context/LiveDataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { mapMessage, userIdOf } from "../../lib/liveDataTransforms.js";
import { getSocket } from "../../api/socket.js";

function TypingIndicator({ users }) {
  const names = Object.values(users || {});
  if (names.length === 0) return null;
  const label = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing`
    : `${names[0]} and ${names.length - 1} others are typing`;
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-[11px] text-gray-400 italic">{label}</span>
    </div>
  );
}

export default function ChatWindow({ chat, onSendMessage }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const { user } = useAuth();
  const { sendTyping, sendStopTyping, typingUsers, onlineUsers } = useLiveData();
  const typingTimeout = useRef(null);

  // Initialize pagination for messages
  const messagesPagination = usePagination(
    chat ? `/groups/${chat.id}/chat/messages` : null,
    { limit: 30 }
  );
  const {
    upsertItems,
    clearItems,
    hasMore,
    isFetching,
    items,
    loadInitial,
    loadMore,
  } = messagesPagination;

  useEffect(() => {
    if (!chat?.id) {
      clearItems();
      return;
    }

    clearItems();
    loadInitial(true);
  }, [chat?.id, clearItems, loadInitial]);

  // Sync with chat.messages which receives optimistic updates from LiveDataContext
  useEffect(() => {
    if (chat?.messages?.length) {
      upsertItems(chat.messages);
    }
  }, [chat?.messages, upsertItems]);

  useEffect(() => {
    if (!chat?.id) return;

    const socket = getSocket();
    if (!socket?.connected) return;

    const handleChatMessage = (payload) => {
      if (payload?.groupId === chat.id && payload?.message) {
        const senderId = userIdOf(payload.message.sender);
        const currentUserId = userIdOf(user);
        if (senderId !== currentUserId) {
          upsertItems([payload.message]);
        }
      }
    };

    socket.on("chat:message", handleChatMessage);

    return () => {
      socket.off("chat:message", handleChatMessage);
    };
  }, [chat?.id, upsertItems, user]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [items]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (chat?.id) {
      sendTyping(chat.id);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        sendStopTyping(chat.id);
      }, 2000);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (chat?.id) sendStopTyping(chat.id);
    clearTimeout(typingTimeout.current);

    // LiveDataContext handles the optimistic update now, which will update chat.messages
    // and trigger the useEffect above to upsertItems
    await onSendMessage?.(text);
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F5F0] rounded-[24px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className={`${serif} text-xl text-gray-400`}>Select a conversation</p>
          <p className="text-sm text-gray-400 mt-1">Your financial context awaits.</p>
        </div>
      </div>
    );
  }

  const groupTyping = typingUsers[chat.id] || {};
  const groupOnline = onlineUsers[chat.id] || [];
  const onlineCount = groupOnline.length;

  return (
    <div className="flex flex-col h-full bg-white rounded-[24px] shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-black/[0.04] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${chat.type === "group" ? "bg-black/[0.04]" : "bg-[#A3FDA7]/20 text-emerald-800"}`}>{chat.avatar}</div>
          <div>
            <h3 className="text-sm font-medium text-black">{chat.name}</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${onlineCount > 0 ? "bg-emerald-400" : "bg-gray-300"}`} />
              <span className="text-[10px] text-gray-500">
                {onlineCount > 0 ? `${onlineCount} online` : "No one online"}
              </span>
            </div>
          </div>
        </div>
        {chat.balance && chat.balance.amount > 0 && (
          <div className={`text-xs font-medium px-3 py-1.5 rounded-full border ${chat.balance.type === "owed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
            {chat.balance.type === "owed" ? `You are owed ₹${chat.balance.amount}` : `You owe ₹${chat.balance.amount}`}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 bg-[#F5F5F0]">
        {items.length > 0 && hasMore && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => loadMore()}
              disabled={isFetching}
              className="px-4 py-2 text-xs font-medium rounded-full bg-black/[0.05] hover:bg-black/[0.08] disabled:opacity-50 transition-colors"
            >
              {isFetching ? "Loading..." : "Load Earlier Messages"}
            </button>
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5 py-3">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-[10px] text-gray-400 tracking-wide">Secured connection</span>
        </div>
        {items.map((item) => {
          const msg = mapMessage(item, userIdOf(user));
          switch (msg.type) {
            case "text": return <TextBubble key={msg.id} message={msg} />;
            case "expense": return <ExpenseBubble key={msg.id} message={msg} />;
            case "system": return <SystemBubble key={msg.id} text={msg.text} />;
            case "ai": return <AIBubble key={msg.id} message={msg} />;
            case "smart-action": return <SmartActionBubble key={msg.id} actions={msg.actions} context={msg.context} />;
            default: return null;
          }
        })}
        <TypingIndicator users={groupTyping} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t border-black/[0.04] shrink-0">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button className="w-9 h-9 rounded-full bg-black/[0.03] flex items-center justify-center text-gray-400 hover:text-black transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Message or ask about fairness..."
            className="flex-1 bg-[#FAFAF8] rounded-2xl px-5 py-3 text-sm outline-none focus:ring-1 focus:ring-[#A3FDA7]/30 transition-all placeholder:text-gray-400"
          />
          <button onClick={handleSend} className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-black/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
