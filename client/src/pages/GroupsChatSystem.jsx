import { useState } from "react";
import ChatWindow from "../sections/SmartChat/ChatWindow.jsx";
import ChatListItem from "../sections/SmartChat/ChatListItem.jsx";
import GroupDetail from "../sections/SmartChat/GroupDetail.jsx";
import GroupListItem from "../sections/SmartChat/GroupListItem.jsx";

/* ─────────────────────────────────────────────
   TOKENS
   ───────────────────────────────────────────── */
const cardBase =
  "bg-white rounded-[24px] p-6 shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]";
const serif = "font-serif text-black tracking-tight";
const sans = "font-sans text-gray-600";

/* ─────────────────────────────────────────────
   MOCK DATA
   ───────────────────────────────────────────── */
const GROUPS = [
  {
    id: 1,
    name: "Goa Trip",
    avatar: "GT",
    members: [
      { id: 1, name: "You", avatar: "Y", tag: "balanced", net: 450 },
      { id: 2, name: "Alex", avatar: "A", tag: "balanced", net: 300 },
      { id: 3, name: "Rohan", avatar: "R", tag: "overpaying", net: 2200 },
      { id: 4, name: "Sarah", avatar: "S", tag: "owes", net: -1300 },
    ],
    expenses: [
      { id: 1, title: "Taxi to airport", payer: "You", amount: 1200, date: "Today", splitType: "Equal" },
      { id: 2, title: "Dinner at Fisherman's", payer: "Alex", amount: 3500, date: "Yesterday", splitType: "AI" },
      { id: 3, title: "Hotel booking", payer: "Rohan", amount: 8000, date: "2 days ago", splitType: "Equal" },
    ],
    fairnessScore: 82,
    balance: { amount: 450, type: "owed" },
    insights: [
      "Rohan has paid significantly more than his share.",
      "This group is 82% balanced — trending fair.",
      "You've contributed evenly over the last week.",
    ],
    messages: [
      { id: 1, type: "system", text: "Alex added Dinner at Fisherman's" },
      { id: 2, type: "expense", from: "Alex", amount: 3500, desc: "Dinner at Fisherman's", participants: ["You", "Alex", "Rohan", "Sarah"] },
      { id: 3, type: "ai", text: "Rohan has already paid ₹8,000 for hotels. Consider letting him skip this split.", actions: [{ label: "Skip Rohan", type: "skip" }, { label: "Split equally", type: "split" }] },
      { id: 4, type: "text", from: "You", text: "Good point, let's skip Rohan", self: true },
      { id: 5, type: "system", text: "Split updated • 3 ways" },
    ],
  },
  {
    id: 2,
    name: "Flatmates",
    avatar: "FM",
    members: [
      { id: 1, name: "You", avatar: "Y", tag: "overpaying", net: 1200 },
      { id: 2, name: "Rohan", avatar: "R", tag: "owes", net: -800 },
      { id: 3, name: "Priya", avatar: "P", tag: "owes", net: -400 },
    ],
    expenses: [
      { id: 1, title: "Electricity + WiFi", payer: "You", amount: 2400, date: "Yesterday", splitType: "Equal" },
      { id: 2, title: "Groceries", payer: "You", amount: 1800, date: "3 days ago", splitType: "Equal" },
    ],
    fairnessScore: 64,
    balance: { amount: 1200, type: "owe" },
    insights: [
      "You've paid 40% more than your share this month.",
      "Consider asking Rohan to cover the next utility bill.",
    ],
    messages: [
      { id: 1, type: "expense", from: "You", amount: 2400, desc: "Electricity + WiFi", participants: ["You", "Rohan", "Priya"] },
      { id: 2, type: "ai", text: "This is your 3rd consecutive payment. Rohan or Priya could cover next.", actions: [{ label: "Ask Rohan", type: "ask" }, { label: "Rotate payer", type: "rotate" }] },
    ],
  },
  {
    id: 3,
    name: "Office Lunch",
    avatar: "OL",
    members: [
      { id: 1, name: "You", avatar: "Y", tag: "balanced", net: 0 },
      { id: 2, name: "Mike", avatar: "M", tag: "balanced", net: 0 },
      { id: 3, name: "Sarah", avatar: "S", tag: "balanced", net: 0 },
    ],
    expenses: [
      { id: 1, title: "Pizza Friday", payer: "Mike", amount: 1200, date: "Last week", splitType: "Equal" },
    ],
    fairnessScore: 98,
    balance: { amount: 0, type: "settled" },
    insights: ["This group is perfectly balanced. Great teamwork!"],
    messages: [{ id: 1, type: "system", text: "All balances settled" }],
  },
];

const CHATS = [
  {
    id: 101,
    name: "Alex",
    type: "individual",
    avatar: "A",
    lastMessage: "Movie tickets were ₹800",
    time: "10m ago",
    unread: 1,
    balance: { amount: 200, type: "owed" },
    messages: [
      { id: 1, type: "text", from: "Alex", text: "Movie tickets were ₹800", time: "10:00 AM" },
      { id: 2, type: "smart-action", actions: [{ label: "Split ₹800", type: "split" }, { label: "I got this", type: "cover" }], context: "Alex mentioned ₹800" },
      { id: 3, type: "text", from: "You", text: "I'll split it with you", self: true, time: "10:05 AM" },
    ],
  },
  {
    id: 102,
    name: "Sarah",
    type: "individual",
    avatar: "S",
    lastMessage: "Next coffee is on me",
    time: "2h ago",
    unread: 0,
    balance: { amount: 80, type: "owe" },
    messages: [
      { id: 1, type: "text", from: "Sarah", text: "Next coffee is on me", time: "9:00 AM" },
      { id: 2, type: "text", from: "You", text: "Deal ☕", self: true, time: "9:05 AM" },
    ],
  },
  {
    id: 103,
    name: "Goa Trip",
    type: "group",
    avatar: "GT",
    lastMessage: "Rohan: Let's skip me this time",
    time: "5m ago",
    unread: 3,
    balance: { amount: 450, type: "owed" },
    messages: [
      { id: 1, type: "text", from: "Rohan", text: "Let's skip me this time", time: "2:30 PM" },
      { id: 2, type: "ai", text: "Rohan has paid ₹8,000 already. Skipping him keeps the group fair.", actions: [{ label: "Confirm skip", type: "confirm" }], time: "2:31 PM" },
    ],
  },
];

/* ─────────────────────────────────────────────
   SHARED COMPONENTS
   ───────────────────────────────────────────── */
function SecurityBadge() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-3">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span className="text-[10px] text-gray-400 tracking-wide">End-to-end encrypted</span>
    </div>
  );
}

function AIInsightCard({ text, small }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#A3FDA7]/8 border border-[#A3FDA7]/20 ${small ? "p-4" : "p-5"} transition-all duration-300 hover:shadow-md`}>
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#A3FDA7]/20 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex items-start gap-3">
        <div className={`rounded-full bg-[#A3FDA7]/20 flex items-center justify-center shrink-0 border border-[#A3FDA7]/30 ${small ? "w-6 h-6" : "w-8 h-8"}`}>
          <svg width={small ? 12 : 14} height={small ? 12 : 14} viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </div>
        <p className={`text-black leading-relaxed ${small ? "text-xs" : "text-sm"}`}>{text}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MESSAGE COMPONENTS (SHARED)
   ───────────────────────────────────────────── */
function TextBubble({ message }) {
  return (
    <div className={`flex ${message.self ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${message.self ? "bg-black text-white rounded-br-md" : "bg-white text-black border border-black/[0.04] rounded-bl-md shadow-sm"}`}>
        <p>{message.text}</p>
        {message.time && <span className={`block text-[10px] mt-1.5 ${message.self ? "text-white/50" : "text-gray-400"}`}>{message.time}</span>}
      </div>
    </div>
  );
}

function ExpenseBubble({ message }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] w-full">
        <div className={`${cardBase} p-5 hover:shadow-md cursor-pointer group`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center text-xs font-bold">{message.from[0]}</div>
              <div>
                <p className="text-xs text-gray-500">{message.from} added an expense</p>
                <p className="text-sm font-medium text-black">{message.desc}</p>
              </div>
            </div>
            <span className="text-2xl font-serif text-black">₹{message.amount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {message.participants.map((p) => (
              <div key={p} className="w-6 h-6 rounded-full bg-black/[0.03] flex items-center justify-center text-[9px] font-medium text-gray-600 border border-white">{p[0]}</div>
            ))}
            <span className="text-[10px] text-gray-400">{message.participants.length} people</span>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-xl bg-black text-white text-xs font-medium hover:scale-[1.01] transition-transform">Split this</button>
            <button className="flex-1 py-2 rounded-xl bg-[#FAFAF8] text-black text-xs font-medium border border-black/5 hover:bg-black/[0.02] transition-colors">View details</button>
          </div>
        </div>
        {message.time && <span className="text-[10px] text-gray-400 mt-1.5 block ml-1">{message.time}</span>}
      </div>
    </div>
  );
}

function SystemBubble({ text }) {
  return (
    <div className="flex justify-center">
      <span className="text-[11px] text-gray-400 bg-black/[0.02] px-4 py-1.5 rounded-full tracking-wide">{text}</span>
    </div>
  );
}




function SmartActionBubble({ actions, context }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] flex flex-col gap-2">
        {context && <span className="text-[10px] text-gray-400 ml-1">{context}</span>}
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <button key={a.label} className="px-4 py-2 rounded-xl bg-black text-white text-xs font-medium hover:scale-[1.03] hover:shadow-lg transition-all duration-300 shadow-md shadow-black/5">
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GROUPS TAB COMPONENTS
   ───────────────────────────────────────────── */



/* ─────────────────────────────────────────────
   CHAT TAB COMPONENTS
   ───────────────────────────────────────────── */


/* ─────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────── */
export default function GroupsChatSystem() {
  const [activeTab, setActiveTab] = useState("groups");
  const [selectedGroupId, setSelectedGroupId] = useState(1);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const selectedGroup = GROUPS.find((g) => g.id === selectedGroupId);
  const selectedChat = CHATS.find((c) => c.id === selectedChatId);

  return (
    <div className="h-screen w-full bg-[#F5F5F0] flex overflow-hidden font-sans selection:bg-[#A3FDA7]/30">
      {/* Sidebar */}
      <div className="w-80 shrink-0 bg-white/60 backdrop-blur-sm border-r border-black/[0.04] flex flex-col">
        <div className="px-6 pt-8 pb-5">
          <h1 className={`${serif} text-2xl`}>SplitChill</h1>
          <p className={`${sans} text-xs mt-1`}>Social finance, simplified.</p>
        </div>

        {/* Tabs */}
        <div className="px-6 mb-4">
          <div className="flex p-1 bg-black/[0.03] rounded-xl">
            {["groups", "chat"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === tab ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
                }`}
              >
                {tab === "groups" ? "📂 Groups" : "💬 Chat"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {activeTab === "groups" ? (
            GROUPS.map((g) => (
              <GroupListItem key={g.id} group={g} isActive={g.id === selectedGroupId} onClick={() => setSelectedGroupId(g.id)} />
            ))
          ) : (
            CHATS.map((c) => (
              <ChatListItem key={c.id} chat={c} isActive={c.id === selectedChatId} onClick={() => setSelectedChatId(c.id)} />
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "groups" ? (
          selectedGroup ? <GroupDetail group={selectedGroup} /> : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 font-serif text-xl">Select a group</p>
            </div>
          )
        ) : (
          <div className="h-full">
            {selectedChat ? <ChatWindow chat={selectedChat} /> : (
              <div className="h-full flex items-center justify-center bg-white rounded-[24px] shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04]">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className={`${serif} text-xl text-gray-400`}>Select a conversation</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
