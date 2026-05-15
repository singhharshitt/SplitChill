import { useEffect, useRef, useState } from "react";
import AIBubble from "../../components/AIAssistantBubble.jsx";
import ExpenseBubble from "../../components/ExpenseMessageCard.jsx";
import FairnessRing from "../../components/FairnessRing.jsx";
import InsightCard from "../../components/InsightCard.jsx";
import SystemBubble from "../../components/SystemBubble.jsx";
import TextBubble from "../../components/TextBubble.jsx";
import { cardBase, serif } from "../../lib/uiTokens.js";
import ExpenseRow from "./ExpenseRow.jsx";
import MemberRow from "./MemberRow.jsx";
import usePagination from "../../hooks/usePagination.js";
import { useLiveData } from "../../context/LiveDataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { mapMessage, userIdOf } from "../../lib/liveDataTransforms.js";

function TypingIndicator({ users }) {
  const names = Object.values(users || {});
  if (names.length === 0) return null;
  const label = names.length === 1
    ? `${names[0]} is typing`
    : `${names.length} people are typing`;
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-[11px] text-gray-400 italic">{label}</span>
    </div>
  );
}

export default function GroupDetail({ group, onSendMessage, onAddMember }) {
  const [messageInput, setMessageInput] = useState("");
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [settlement, setSettlement] = useState({ payer: "", receiver: "", amount: "", receiverUpiId: "" });
  const [settlementFeedback, setSettlementFeedback] = useState("");
  const [isSettling, setIsSettling] = useState(false);
  const scrollRef = useRef(null);
  const { user } = useAuth();
  const { sendTyping, sendStopTyping, typingUsers, onlineUsers, settleUp } = useLiveData();
  const typingTimeout = useRef(null);
  
  // Initialize pagination for messages and expenses
  const messagesPagination = usePagination(
    group ? `/groups/${group.id}/chat/messages` : null,
    { limit: 30 }
  );
  const {
    appendItems,
    clearItems: clearMessages,
    items: messages,
    loadInitial: loadInitialMessages,
  } = messagesPagination;
  
  const expensesPagination = usePagination(
    group ? `/groups/${group.id}/expenses` : null,
    { limit: 25 }
  );
  const {
    clearItems: clearExpenses,
    hasMore: hasMoreExpenses,
    isFetching: isFetchingExpenses,
    items: expenses,
    loadInitial: loadInitialExpenses,
    loadMore: loadMoreExpenses,
    prependItems,
  } = expensesPagination;

  useEffect(() => {
    if (!group?.id) {
      clearMessages();
      clearExpenses();
      return;
    }

    clearMessages();
    clearExpenses();
    loadInitialMessages(true);
    loadInitialExpenses(true);
  }, [group?.id, clearMessages, clearExpenses, loadInitialMessages, loadInitialExpenses]);

  useEffect(() => {
    if (group?.messages?.length) {
      appendItems(group.messages);
    }
  }, [group?.messages, appendItems]);

  useEffect(() => {
    if (group?.expenses?.length) {
      prependItems(group.expenses);
    }
  }, [group?.expenses, prependItems]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    if (group?.id) {
      sendTyping(group.id);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        sendStopTyping(group.id);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    const text = messageInput.trim();
    setMessageInput("");
    if (group?.id) sendStopTyping(group.id);
    clearTimeout(typingTimeout.current);
    const newMessage = await onSendMessage?.(text);
    if (newMessage) {
      appendItems([newMessage]);
    }
  };

  const openSettlement = () => {
    const payer = group.members.find((member) => member.net < 0)?.id || group.members[0]?.id || "";
    const receiver = group.members.find((member) => member.net > 0)?.id || group.members.find((member) => member.id !== payer)?.id || "";
    const amount = Math.min(
      Math.abs(group.members.find((member) => member.id === payer)?.net || 0),
      Math.abs(group.members.find((member) => member.id === receiver)?.net || 0),
    );
    setSettlement({ payer, receiver, amount: amount ? String(amount) : "", receiverUpiId: "" });
    setSettlementFeedback("");
    setSettlementOpen(true);
  };

  const submitSettlement = async () => {
    setIsSettling(true);
    setSettlementFeedback("");
    try {
      await settleUp({
        groupId: group.id,
        payer: settlement.payer,
        receiver: settlement.receiver,
        amount: Number(settlement.amount),
        receiverUpiId: settlement.receiverUpiId || undefined,
        note: `Settlement for ${group.name}`,
      });
      setSettlementFeedback("Settlement created and synced.");
      setSettlementOpen(false);
    } catch (error) {
      setSettlementFeedback(error.response?.data?.message || "Could not create settlement.");
    } finally {
      setIsSettling(false);
    }
  };

  const groupTyping = typingUsers[group?.id] || {};
  const groupOnline = onlineUsers[group?.id] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-black/[0.04] flex items-center justify-center text-sm font-bold">{group.avatar}</div>
          <div>
            <h2 className={`${serif} text-2xl`}>{group.name}</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{group.members.length} members • {group.expenses.length} expenses</p>
              {groupOnline.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {groupOnline.length} online
                </span>
              )}
            </div>
          </div>
        </div>
        <FairnessRing score={group.fairnessScore} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left: Members + Expenses + Insights */}
        <div className="xl:col-span-2 flex flex-col gap-6 overflow-y-auto pr-1">
          {/* Members */}
          <div className={cardBase}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${serif} text-lg`}>Members</h3>
              <button onClick={onAddMember} className="text-xs text-gray-400 hover:text-black transition-colors">Add member</button>
            </div>
            <div className="flex flex-col gap-2">
              {group.members.map((m) => <MemberRow key={m.id} member={m} />)}
            </div>
          </div>

          {/* Expenses */}
          <div className={cardBase}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${serif} text-lg`}>Expenses</h3>
              <button onClick={() => window.location.assign("/transactions")} className="text-xs text-gray-400 hover:text-black transition-colors">View all</button>
            </div>
            <div className="flex flex-col gap-2">
              {expenses.map((e, idx) => <ExpenseRow key={e._id || e.id || `expense-${idx}`} expense={e} />)}
              {expenses.length === 0 && <p className="text-sm text-gray-400">No expenses yet.</p>}
              {hasMoreExpenses && (
                <button
                  onClick={() => loadMoreExpenses()}
                  disabled={isFetchingExpenses}
                  className="mt-3 text-xs font-medium text-gray-600 hover:text-black disabled:opacity-50 transition-colors"
                >
                  {isFetchingExpenses ? "Loading..." : "Load More Expenses"}
                </button>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="flex flex-col gap-3">
            <h3 className={`${serif} text-lg`}>Group Insights</h3>
            {group.insights.map((insight, i) => {
              const insightKey = insight._id || insight.id || `insight-${i}`;
              return <InsightCard key={insightKey} text={insight} small />;
            })}
          </div>

          {/* Embedded Chat */}
          <div className={`${cardBase} flex flex-col h-96`}>
            <h3 className={`${serif} text-lg mb-3`}>Group Chat</h3>
            <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 px-1 pb-2">
              <div className="flex items-center justify-center gap-1.5 py-2">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-[10px] text-gray-400 tracking-wide">Secured connection</span>
              </div>
              {messages.map((item, idx) => {
                const msg = mapMessage(item, userIdOf(user));
                const msgKey = msg.id || `msg-${idx}`;
                switch (msg.type) {
                  case "text": return <TextBubble key={msgKey} message={msg} />;
                  case "expense": return <ExpenseBubble key={msgKey} message={msg} />;
                  case "system": return <SystemBubble key={msgKey} text={msg.text} />;
                  case "ai": return <AIBubble key={msgKey} message={msg} />;
                  default: return null;
                }
              })}
              <TypingIndicator users={groupTyping} />
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5">
              <input
                value={messageInput}
                onChange={handleInputChange}
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
            <button onClick={() => window.location.assign("/split")} className="w-full py-3.5 rounded-2xl bg-black text-white text-sm font-medium hover:scale-[1.01] hover:shadow-xl transition-all duration-300 shadow-lg shadow-black/5">
              Add Expense
            </button>
            <button onClick={() => window.location.assign("/split")} className="w-full py-3.5 rounded-2xl bg-white text-black text-sm font-medium border border-black/5 hover:border-black/10 hover:shadow-lg transition-all duration-300">
              Split Now
            </button>
            <button onClick={openSettlement} className="w-full py-3.5 rounded-2xl bg-[#A3FDA7]/10 text-emerald-800 text-sm font-medium border border-[#A3FDA7]/20 hover:bg-[#A3FDA7]/20 transition-all duration-300">
              Settle Up
            </button>
            {settlementFeedback && <p className="text-xs text-gray-500 text-center">{settlementFeedback}</p>}
          </div>
        </div>
      </div>
      {settlementOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSettlementOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[28px] border border-black/[0.04] shadow-2xl p-6">
            <h3 className={`${serif} text-2xl`}>Settle balance</h3>
            <p className="text-sm text-gray-500 mt-1">Create a settlement transaction for this group.</p>
            <div className="mt-5 flex flex-col gap-3">
              <select value={settlement.payer} onChange={(event) => setSettlement((current) => ({ ...current, payer: event.target.value }))} className="rounded-2xl border border-black/10 bg-[#FAFAF8] px-4 py-3 text-sm outline-none">
                {group.members.map((member) => <option key={member.id} value={member.id}>{member.name} pays</option>)}
              </select>
              <select value={settlement.receiver} onChange={(event) => setSettlement((current) => ({ ...current, receiver: event.target.value }))} className="rounded-2xl border border-black/10 bg-[#FAFAF8] px-4 py-3 text-sm outline-none">
                {group.members.map((member) => <option key={member.id} value={member.id}>{member.name} receives</option>)}
              </select>
              <input value={settlement.amount} onChange={(event) => setSettlement((current) => ({ ...current, amount: event.target.value }))} type="number" min="1" className="rounded-2xl border border-black/10 bg-[#FAFAF8] px-4 py-3 text-sm outline-none" placeholder="Amount" />
              <input value={settlement.receiverUpiId} onChange={(event) => setSettlement((current) => ({ ...current, receiverUpiId: event.target.value }))} className="rounded-2xl border border-black/10 bg-[#FAFAF8] px-4 py-3 text-sm outline-none" placeholder="Receiver UPI (optional)" />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setSettlementOpen(false)} className="flex-1 rounded-full border border-black/10 px-5 py-3 text-sm font-medium">Cancel</button>
              <button onClick={submitSettlement} disabled={isSettling || !settlement.payer || !settlement.receiver || Number(settlement.amount) <= 0} className="flex-1 rounded-full bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-40">
                {isSettling ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
