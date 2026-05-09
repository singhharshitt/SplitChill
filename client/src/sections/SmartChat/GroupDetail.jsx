import { useEffect, useRef, useState } from "react";
import AIBubble from "../../components/AIAssistantBubble.jsx";
import ExpenseBubble from "../../components/ExpenseMessageCard.jsx";
import FairnessRing from "../../components/FairnessRing.jsx";
import InsightCard from "../../components/InsightCard.jsx";
import SecurityBadge from "../../components/SecurityBadge.jsx";
import SystemBubble from "../../components/SystemBubble.jsx";
import TextBubble from "../../components/TextBubble.jsx";
import { cardBase, serif } from "../../lib/uiTokens.js";
import ExpenseRow from "./ExpenseRow.jsx";
import MemberRow from "./MemberRow.jsx";
import usePagination from "../../hooks/usePagination.js";

export default function GroupDetail({ group, onSendMessage }) {
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef(null);
  
  // Initialize pagination for messages and expenses
  const messagesPagination = usePagination(
    group ? `/groups/${group.id}/chat/messages` : null,
    { limit: 30 }
  );
  
  const expensesPagination = usePagination(
    group ? `/groups/${group.id}/expenses` : null,
    { limit: 25 }
  );

  // Load initial data from group prop
  useEffect(() => {
    if (group?.messages && group.messages.length > 0) {
      messagesPagination.prependItems(group.messages);
    }
    if (group?.expenses && group.expenses.length > 0) {
      expensesPagination.prependItems(group.expenses);
    }
  }, [group?.id]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messagesPagination.items]);

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    const newMessage = await onSendMessage?.(messageInput.trim());
    if (newMessage) {
      messagesPagination.appendItems([newMessage]);
    }
    setMessageInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-black/[0.04] flex items-center justify-center text-sm font-bold">{group.avatar}</div>
          <div>
            <h2 className={`${serif} text-2xl`}>{group.name}</h2>
            <p className="text-xs text-gray-500">{group.members.length} members • {group.expenses.length} expenses</p>
          </div>
        </div>
        <FairnessRing score={group.fairnessScore} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left: Members + Expenses + Insights */}
        <div className="xl:col-span-2 flex flex-col gap-6 overflow-y-auto pr-1">
          {/* Members */}
          <div className={cardBase}>
            <h3 className={`${serif} text-lg mb-4`}>Members</h3>
            <div className="flex flex-col gap-2">
              {group.members.map((m) => <MemberRow key={m.id} member={m} />)}
            </div>
          </div>

          {/* Expenses */}
          <div className={cardBase}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${serif} text-lg`}>Expenses</h3>
              <button className="text-xs text-gray-400 hover:text-black transition-colors">View all</button>
            </div>
            <div className="flex flex-col gap-2">
              {expensesPagination.items.map((e) => <ExpenseRow key={e.id} expense={e} />)}
              {expensesPagination.items.length === 0 && <p className="text-sm text-gray-400">No expenses yet.</p>}
              {expensesPagination.hasMore && (
                <button
                  onClick={() => expensesPagination.loadMore()}
                  disabled={expensesPagination.isFetching}
                  className="mt-3 text-xs font-medium text-gray-600 hover:text-black disabled:opacity-50 transition-colors"
                >
                  {expensesPagination.isFetching ? "Loading..." : "Load More Expenses"}
                </button>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="flex flex-col gap-3">
            <h3 className={`${serif} text-lg`}>Group Insights</h3>
            {group.insights.map((insight, i) => (
              <InsightCard key={i} text={insight} small />
            ))}
          </div>

          {/* Embedded Chat */}
          <div className={`${cardBase} flex flex-col h-96`}>
            <h3 className={`${serif} text-lg mb-3`}>Group Chat</h3>
            <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 px-1 pb-2">
              <SecurityBadge />
              {messagesPagination.items.map((msg) => {
                switch (msg.type) {
                  case "text": return <TextBubble key={msg.id} message={msg} />;
                  case "expense": return <ExpenseBubble key={msg.id} message={msg} />;
                  case "system": return <SystemBubble key={msg.id} text={msg.text} />;
                  case "ai": return <AIBubble key={msg.id} message={msg} />;
                  default: return null;
                }
              })}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Message..."
                className="flex-1 bg-[#FAFAF8] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#A3FDA7]/30 transition-all placeholder:text-gray-400"
              />
              <button onClick={handleSend} className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:scale-105 transition-transform">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Balance + Actions */}
        <div className="flex flex-col gap-6">
          <div className={cardBase}>
            <h3 className={`${serif} text-lg mb-4`}>Balance Breakdown</h3>
            <div className="flex flex-col gap-3">
              {group.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-black">{m.name}</span>
                  <span className={`font-medium ${m.net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {m.net >= 0 ? "is owed" : "owes"} ₹{Math.abs(m.net)}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px bg-black/5 my-4" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Group total</span>
              <span className="text-sm font-serif text-black">₹{group.expenses.reduce((a, e) => a + e.amount, 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col gap-3 sticky top-4">
            <button className="w-full py-3.5 rounded-2xl bg-black text-white text-sm font-medium hover:scale-[1.01] hover:shadow-xl transition-all duration-300 shadow-lg shadow-black/5">
              Add Expense
            </button>
            <button className="w-full py-3.5 rounded-2xl bg-white text-black text-sm font-medium border border-black/5 hover:border-black/10 hover:shadow-lg transition-all duration-300">
              Split Now
            </button>
            <button className="w-full py-3.5 rounded-2xl bg-[#A3FDA7]/10 text-emerald-800 text-sm font-medium border border-[#A3FDA7]/20 hover:bg-[#A3FDA7]/20 transition-all duration-300">
              Settle Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
