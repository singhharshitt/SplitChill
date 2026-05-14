import { useMemo, useState } from "react";
import ChatWindow from "../sections/SmartChat/ChatWindow.jsx";
import ChatListItem from "../sections/SmartChat/ChatListItem.jsx";
import GroupDetail from "../sections/SmartChat/GroupDetail.jsx";
import GroupListItem from "../sections/SmartChat/GroupListItem.jsx";
import { useLiveData } from "../context/LiveDataContext.jsx";
import Navbar from "../components/Navbar.jsx";
import GroupManagerModal from "../components/GroupManagerModal.jsx";
import DirectChatModal from "../components/DirectChatModal.jsx";

/* ─────────────────────────────────────────────
   TOKENS
   ───────────────────────────────────────────── */
const serif = "font-serif text-black tracking-tight";
const sans = "font-sans text-gray-600";

/* ─────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────── */
export default function GroupsChatSystem() {
  const { groups, selectedGroupId: liveSelectedGroupId, setSelectedGroupId: setLiveSelectedGroupId, sendMessage, isLoading, error } = useLiveData();
  const [activeTab, setActiveTab] = useState("groups");
  const [localSelectedGroupId, setLocalSelectedGroupId] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [groupModalMode, setGroupModalMode] = useState(null);
  const [directChatOpen, setDirectChatOpen] = useState(false);
  const selectedGroupId = localSelectedGroupId || liveSelectedGroupId;

  const chats = useMemo(() => groups.map((group) => ({
    id: group.id,
    name: group.name,
    type: group.type === "direct" ? "direct" : "group",
    avatar: group.avatar,
    lastMessage: group.messages.at(-1)?.text || "No messages yet",
    time: group.messages.at(-1)?.time || "",
    unread: 0,
    balance: group.balance,
    messages: group.messages,
  })), [groups]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const demoGroup = groups.find((group) => group.name === "SplitChill Live Demo");
  const selectGroup = (id) => {
    setLocalSelectedGroupId(id);
    setLiveSelectedGroupId(id);
  };

  return (
    <div className="h-screen w-full bg-[#F5F5F0] flex overflow-hidden font-sans selection:bg-[#A3FDA7]/30 pt-[73px]">
      <Navbar />
      {/* Sidebar */}
      <div className="w-80 shrink-0 bg-white/60 backdrop-blur-sm border-r border-black/[0.04] flex flex-col">
        <div className="px-6 pt-8 pb-5">
          <h1 className={`${serif} text-2xl`}>Groups & Chat</h1>
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

        {demoGroup && (
          <div className="mx-6 mb-4 rounded-2xl border border-[#A3FDA7]/30 bg-[#A3FDA7]/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 font-bold">Two-account proof</p>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              Use Demo Aditi in one browser session and Demo Kabir in another. Select this group, type, then send messages both ways.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab("chat");
                setSelectedChatId(demoGroup.id);
                selectGroup(demoGroup.id);
              }}
              className="mt-3 rounded-full bg-black px-4 py-2 text-xs font-medium text-white"
            >
              Open demo chat
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
            {activeTab === "groups" ? (
            <>
              <button
                onClick={() => setGroupModalMode("create")}
                className="w-full mb-2 rounded-2xl bg-black text-white text-sm font-medium py-3 hover:scale-[1.01] transition-transform"
              >
                New Group
              </button>
              {groups.map((g) => (
                <GroupListItem key={g.id} group={g} isActive={g.id === selectedGroupId} onClick={() => selectGroup(g.id)} />
              ))}
            </>
          ) : (
            <>
              <button
                onClick={() => setDirectChatOpen(true)}
                className="w-full mb-2 rounded-2xl bg-black text-white text-sm font-medium py-3 hover:scale-[1.01] transition-transform"
              >
                Create Chat
              </button>
              {chats.map((c) => (
                <ChatListItem key={c.id} chat={c} isActive={c.id === selectedChatId} onClick={() => setSelectedChatId(c.id)} />
              ))}
            </>
          )}
          {!isLoading && activeTab === "groups" && groups.length === 0 && <p className="px-3 text-xs text-gray-400">No groups yet.</p>}
          {error && <p className="px-3 text-xs text-red-600">{error}</p>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "groups" ? (
          selectedGroup ? <GroupDetail group={selectedGroup} onAddMember={() => setGroupModalMode("member")} onSendMessage={(text) => sendMessage(selectedGroup.id, text)} /> : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 font-serif text-xl">Select a group</p>
            </div>
          )
        ) : (
          <div className="h-full">
            {selectedChat ? <ChatWindow chat={selectedChat} onSendMessage={(text) => sendMessage(selectedChat.id, text)} /> : (
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
      <GroupManagerModal open={Boolean(groupModalMode)} mode={groupModalMode === "member" ? "member" : "create"} onClose={() => setGroupModalMode(null)} />
      <DirectChatModal
        open={directChatOpen}
        onClose={() => setDirectChatOpen(false)}
        onOpened={(group) => {
          const id = group._id || group.id;
          setActiveTab("chat");
          setSelectedChatId(id);
          selectGroup(id);
        }}
      />
    </div>
  );
}
