import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api, { getApiError, unwrap } from "../api/client.js";
import { useLiveData } from "../context/LiveDataContext.jsx";
import groupsplit from "../assets/groupsplit.png";

export default function GroupManagerModal({ open, mode = "create", onClose }) {
  const { createGroup, selectedGroup, refreshGroup } = useLiveData();
  const [name, setName] = useState("");
  const [type, setType] = useState("general");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = unwrap(await api.get("/users", { params: { q: query.trim() } }));
        if (!cancelled) setUsers(data.users || []);
      } catch {
        if (!cancelled) setUsers([]);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  if (!open) return null;

  const isCreate = mode === "create";

  const toggleUser = (id) => {
    setSelectedUserIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const handleQueryChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    if (nextQuery.trim().length < 2) setUsers([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback("");
    setIsSaving(true);
    try {
      if (isCreate) {
        await createGroup({ name, type, memberIds: selectedUserIds });
      } else if (selectedGroup?.id && selectedUserIds[0]) {
        await api.post(`/groups/${selectedGroup.id}/add-member`, { userId: selectedUserIds[0] });
        await refreshGroup(selectedGroup.id);
      }
      onClose();
      setName("");
      setQuery("");
      setSelectedUserIds([]);
    } catch (error) {
      setFeedback(getApiError(error, "Could not update group."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-lg bg-white rounded-[28px] border border-black/[0.04] shadow-2xl p-6 md:p-8">
        <button type="button" onClick={onClose} className="absolute top-5 right-5 h-9 w-9 rounded-full bg-black/[0.03] flex items-center justify-center text-gray-500 hover:text-black">
          <X size={16} />
        </button>
        <div className="flex items-start gap-4 pr-10">
          <img src={groupsplit} alt="" className="w-20 h-20 object-contain" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold mb-1">
              {isCreate ? "Create Group" : "Add Member"}
            </p>
            <h2 className="font-serif text-3xl text-black">{isCreate ? "Start a shared group" : `Invite into ${selectedGroup?.name || "group"}`}</h2>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4">
          {isCreate && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.12em] text-gray-500 font-medium">Group name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-black/10 bg-[#FAFAF8] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#A3FDA7]/40" placeholder="Goa trip, Flatmates, Friday dinner" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.12em] text-gray-500 font-medium">Group type</span>
                <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-2xl border border-black/10 bg-[#FAFAF8] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#A3FDA7]/40">
                  <option value="general">General</option>
                  <option value="trip">Trip</option>
                  <option value="rent">Rent</option>
                  <option value="event">Event</option>
                  <option value="dining">Dining</option>
                </select>
              </label>
            </>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.12em] text-gray-500 font-medium">Search users</span>
            <input value={query} onChange={handleQueryChange} className="rounded-2xl border border-black/10 bg-[#FAFAF8] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#A3FDA7]/40" placeholder="Search by name or email" />
          </label>

          <div className="max-h-44 overflow-y-auto flex flex-col gap-2">
            {users.map((user) => {
              const id = user._id || user.id;
              const selected = selectedUserIds.includes(id);
              return (
                <button key={id} type="button" onClick={() => toggleUser(id)} className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left border transition-colors ${selected ? "bg-[#A3FDA7]/15 border-[#A3FDA7]/40" : "bg-[#FAFAF8] border-black/[0.03] hover:border-black/10"}`}>
                  <span>
                    <span className="block text-sm font-medium text-black">{user.name}</span>
                    <span className="block text-xs text-gray-500">{user.email}</span>
                  </span>
                  <span className="text-xs text-gray-500">{selected ? "Selected" : "Add"}</span>
                </button>
              );
            })}
            {query.trim().length >= 2 && users.length === 0 && <p className="text-xs text-gray-400 px-1">No matching users found.</p>}
          </div>
        </div>

        {feedback && <p className="mt-4 text-xs text-red-600">{feedback}</p>}

        <button type="submit" disabled={isSaving || (isCreate ? name.trim().length < 2 : selectedUserIds.length === 0)} className="mt-6 w-full rounded-full bg-black px-6 py-3.5 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed">
          {isSaving ? "Saving..." : isCreate ? "Create group" : "Add member"}
        </button>
      </form>
    </div>
  );
}
