import { useEffect, useRef, useState } from "react";
import AIBubble from "../../components/AIAssistantBubble.jsx";
import ExpenseBubble from "../../components/ExpenseMessageCard.jsx";
import SecurityBadge from "../../components/SecurityBadge.jsx";
import SmartActionBubble from "../../components/SmartActionBubble.jsx";
import SystemBubble from "../../components/SystemBubble.jsx";
import TextBubble from "../../components/TextBubble.jsx";
import { serif } from "../../lib/uiTokens.js";

export default function ChatWindow({ chat }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chat.messages]);

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

  return (
    <div className="flex flex-col h-full bg-white rounded-[24px] shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-black/[0.04] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${chat.type === "group" ? "bg-black/[0.04]" : "bg-[#A3FDA7]/20 text-emerald-800"}`}>{chat.avatar}</div>
          <div>
            <h3 className="text-sm font-medium text-black">{chat.name}</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-gray-500">Active now</span>
            </div>
          </div>
        </div>
        {chat.balance.amount > 0 && (
          <div className={`text-xs font-medium px-3 py-1.5 rounded-full border ${chat.balance.type === "owed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
            {chat.balance.type === "owed" ? `You are owed ₹${chat.balance.amount}` : `You owe ₹${chat.balance.amount}`}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 bg-[#F5F5F0]">
        <SecurityBadge />
        {chat.messages.map((msg) => {
          switch (msg.type) {
            case "text": return <TextBubble key={msg.id} message={msg} />;
            case "expense": return <ExpenseBubble key={msg.id} message={msg} />;
            case "system": return <SystemBubble key={msg.id} text={msg.text} />;
            case "ai": return <AIBubble key={msg.id} message={msg} />;
            case "smart-action": return <SmartActionBubble key={msg.id} actions={msg.actions} context={msg.context} />;
            default: return null;
          }
        })}
      </div>

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t border-black/[0.04] shrink-0">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button className="w-9 h-9 rounded-full bg-black/[0.03] flex items-center justify-center text-gray-400 hover:text-black transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setInput("")}
            placeholder="Message or ask about fairness..."
            className="flex-1 bg-[#FAFAF8] rounded-2xl px-5 py-3 text-sm outline-none focus:ring-1 focus:ring-[#A3FDA7]/30 transition-all placeholder:text-gray-400"
          />
          <button className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-black/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
