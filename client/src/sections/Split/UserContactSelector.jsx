import React, { useState, useEffect, useMemo } from "react";
import api, { getApiError } from "../../api/client.js";

const serif = "font-serif text-black tracking-tight";

export default function UserContactSelector({ people, onAdd, amountEntered }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const alreadyAdded = useMemo(() => new Set(people.map((p) => p.id)), [people]);
  const canSearch = Boolean(searchQuery.trim() && amountEntered);

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      setError("");
      try {
        const response = await api.get("/users", { params: { q: searchQuery } });
        const users = response.data?.data?.users || [];
        setSearchResults(users.filter((u) => !alreadyAdded.has(u.id)));
        setShowDropdown(true);
      } catch (err) {
        setError(getApiError(err, "Could not search users."));
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, canSearch, alreadyAdded]);

  const handleAddUser = (user) => {
    onAdd({
      id: user.id || user._id,
      name: user.name,
      initial: user.name[0]?.toUpperCase() || "?",
      email: user.email,
      upi: user.upi,
      phone: user.phone,
    });
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const getContactInfo = (user) => {
    if (user.email) return user.email;
    if (user.upi) return user.upi;
    if (user.phone) return user.phone;
    return "No contact info";
  };

  if (!amountEntered) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className={`${serif} text-2xl`}>Add people by email, UPI, or phone</h3>

      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search by email, UPI ID, or phone number"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!e.target.value.trim()) {
              setSearchResults([]);
              setShowDropdown(false);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white text-sm outline-none focus:border-[#A3FDA7] focus:ring-1 focus:ring-[#A3FDA7]/30 transition-all"
        />
        {isSearching && (
          <div className="absolute right-4 top-3">
            <div className="w-5 h-5 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
          </div>
        )}

        {showDropdown && canSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/10 rounded-2xl shadow-lg z-50 max-h-72 overflow-y-auto">
            {searchResults.map((user) => (
              <button
                key={user.id || user._id}
                type="button"
                onClick={() => handleAddUser(user)}
                className="w-full px-4 py-3 text-left hover:bg-[#F5F5F0] border-b border-black/5 last:border-b-0 transition-colors flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-black">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{getContactInfo(user)}</p>
                </div>
                <span className="text-xs text-[#A3FDA7] font-medium ml-2 shrink-0">Add</span>
              </button>
            ))}
          </div>
        )}

        {showDropdown && canSearch && searchResults.length === 0 && !isSearching && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/10 rounded-2xl shadow-lg z-50 px-4 py-3">
            <p className="text-sm text-gray-500">No users found. Invite them to join SplitChill first.</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {searchResults.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">{searchResults.length} user(s) found</p>
      )}
    </div>
  );
}
