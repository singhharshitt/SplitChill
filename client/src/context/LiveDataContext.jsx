/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api, { getApiError, unwrap } from "../api/client.js";
import { connectSocket, disconnectSocket, getSocket } from "../api/socket.js";
import { useAuth } from "./AuthContext.jsx";
import { mapGroup, mapMessage, mapTransaction, userIdOf } from "../lib/liveDataTransforms.js";

const LiveDataContext = createContext(null);

function mergeById(items, nextItem) {
  const nextId = userIdOf(nextItem);
  if (!nextId) return items;
  const withoutExisting = items.filter((item) => userIdOf(item) !== nextId);
  return [...withoutExisting, nextItem];
}

function prependById(items, nextItem) {
  const nextId = userIdOf(nextItem);
  if (!nextId) return items;
  return [nextItem, ...items.filter((item) => userIdOf(item) !== nextId)];
}

export function LiveDataProvider({ children }) {
  const { isLoggedIn, user } = useAuth();
  const currentUserId = userIdOf(user);
  const [rawGroups, setRawGroups] = useState([]);
  const [groupExtras, setGroupExtras] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Typing & Presence state ──
  const [typingUsers, setTypingUsers] = useState({}); // { [groupId]: { [userId]: userName } }
  const [onlineUsers, setOnlineUsers] = useState({}); // { [groupId]: [userId, ...] }
  const typingTimers = useRef({}); // cleanup timers for stale typing state

  // Ref to track group IDs for socket event binding (avoids re-render loops)
  const groupIdsRef = useRef([]);

  const refreshTransactions = useCallback(async () => {
    if (!isLoggedIn) return;
    const data = unwrap(await api.get("/transactions"));
    setTransactions((data.items || data.transactions || []).map((item) => mapTransaction(item, currentUserId)));
  }, [currentUserId, isLoggedIn]);

  const refreshGroup = useCallback(async (groupId) => {
    if (!groupId || !isLoggedIn) return;
    const [groupRes, expensesRes, fairnessRes, suggestionsRes, analyticsRes, messagesRes] = await Promise.all([
      api.get(`/groups/${groupId}`),
      api.get(`/groups/${groupId}/expenses`),
      api.get(`/groups/${groupId}/fairness`),
      api.get(`/groups/${groupId}/suggestions`),
      api.get(`/groups/${groupId}/analytics`),
      api.get(`/groups/${groupId}/chat/messages`),
    ]);

    const group = unwrap(groupRes).group;
    setRawGroups((existing) => prependById(existing, group));
    setGroupExtras((existing) => ({
      ...existing,
      [groupId]: {
        expenses: unwrap(expensesRes).expenses || [],
        fairness: unwrap(fairnessRes).fairness,
        suggestions: unwrap(suggestionsRes).suggestions,
        analytics: unwrap(analyticsRes).analytics,
        messages: unwrap(messagesRes).messages || [],
      },
    }));
  }, [isLoggedIn]);

  const refreshGroups = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    setError("");
    try {
      const data = unwrap(await api.get("/groups"));
      const groups = data.groups || [];
      setRawGroups(groups);
      setSelectedGroupId((current) => current || userIdOf(groups[0]));
      await Promise.all(groups.slice(0, 3).map((group) => refreshGroup(userIdOf(group))));
      await refreshTransactions();
    } catch (err) {
      setError(getApiError(err, "Could not load your SplitChill data."));
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, refreshGroup, refreshTransactions]);

  // ── Initial data load ──
  useEffect(() => {
    if (!isLoggedIn) {
      Promise.resolve().then(() => {
        setRawGroups([]);
        setGroupExtras({});
        setTransactions([]);
        setSelectedGroupId(null);
        setTypingUsers({});
        setOnlineUsers({});
      });
      disconnectSocket();
      return;
    }
    Promise.resolve().then(refreshGroups);
  }, [isLoggedIn, refreshGroups]);

  // ── Keep groupIdsRef in sync ──
  useEffect(() => {
    groupIdsRef.current = rawGroups.map((g) => userIdOf(g)).filter(Boolean);
  }, [rawGroups]);

  // ── Socket event binding (separate from rawGroups to avoid infinite loops) ──
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const socket = connectSocket();

    const joinGroups = () => {
      groupIdsRef.current.forEach((groupId) => socket.emit("group:join", groupId));
    };

    // Join on connect and reconnect
    joinGroups();
    socket.on("connect", joinGroups);

    // ── Reconnect recovery ──
    socket.on("connect", () => {
      // Re-join all groups on reconnect
      joinGroups();
    });

    // ── Event handlers that use payload data directly instead of full refetch ──
    const handleExpenseAdded = (payload) => {
      if (!payload?.groupId) return;
      // Refresh only the specific group (expense data changed)
      refreshGroup(payload.groupId);
    };

    const handleFairnessChanged = (payload) => {
      if (!payload?.groupId || !payload?.fairness) return;
      setGroupExtras((existing) => ({
        ...existing,
        [payload.groupId]: {
          ...(existing[payload.groupId] || {}),
          fairness: payload.fairness,
        },
      }));
    };

    const handleGroupUpdated = (payload) => {
      if (!payload?.groupId) return;
      refreshGroup(payload.groupId);
    };

    const handleChatMessage = (payload) => {
      if (!payload?.groupId || !payload?.message) return;
      setGroupExtras((existing) => ({
        ...existing,
        [payload.groupId]: {
          ...(existing[payload.groupId] || {}),
          messages: mergeById(existing[payload.groupId]?.messages || [], payload.message),
        },
      }));
      // Clear typing indicator for this sender
      const senderId = userIdOf(payload.message.sender);
      if (senderId) {
        setTypingUsers((prev) => {
          const groupTyping = { ...(prev[payload.groupId] || {}) };
          delete groupTyping[senderId];
          return { ...prev, [payload.groupId]: groupTyping };
        });
      }
    };

    const handleTransactionCreated = (payload) => {
      if (payload?.transaction) {
        setTransactions((existing) => prependById(existing, mapTransaction(payload.transaction, currentUserId)));
      }
      if (payload?.groupId) refreshGroup(payload.groupId);
    };

    const handleTransactionUpdated = (payload) => {
      if (payload?.transaction) {
        setTransactions((existing) => prependById(existing, mapTransaction(payload.transaction, currentUserId)));
      }
      if (payload?.groupId) refreshGroup(payload.groupId);
    };

    // ── Typing indicators ──
    const handleTyping = (payload) => {
      if (!payload?.groupId || !payload?.userId || payload.userId === currentUserId) return;
      setTypingUsers((prev) => ({
        ...prev,
        [payload.groupId]: {
          ...(prev[payload.groupId] || {}),
          [payload.userId]: payload.userName || "Someone",
        },
      }));
      // Auto-clear after 4 seconds
      const timerKey = `${payload.groupId}:${payload.userId}`;
      clearTimeout(typingTimers.current[timerKey]);
      typingTimers.current[timerKey] = setTimeout(() => {
        setTypingUsers((prev) => {
          const groupTyping = { ...(prev[payload.groupId] || {}) };
          delete groupTyping[payload.userId];
          return { ...prev, [payload.groupId]: groupTyping };
        });
      }, 4000);
    };

    const handleStopTyping = (payload) => {
      if (!payload?.groupId || !payload?.userId) return;
      setTypingUsers((prev) => {
        const groupTyping = { ...(prev[payload.groupId] || {}) };
        delete groupTyping[payload.userId];
        return { ...prev, [payload.groupId]: groupTyping };
      });
      clearTimeout(typingTimers.current[`${payload.groupId}:${payload.userId}`]);
    };

    // ── Presence ──
    const handlePresenceUpdate = (payload) => {
      if (!payload?.groupId) return;
      setOnlineUsers((prev) => ({
        ...prev,
        [payload.groupId]: payload.onlineUsers || [],
      }));
    };

    socket.on("expense:added", handleExpenseAdded);
    socket.on("split:updated", handleExpenseAdded);
    socket.on("fairness:changed", handleFairnessChanged);
    socket.on("group:updated", handleGroupUpdated);
    socket.on("chat:message", handleChatMessage);
    socket.on("transaction:created", handleTransactionCreated);
    socket.on("transaction:updated", handleTransactionUpdated);
    socket.on("chat:typing", handleTyping);
    socket.on("chat:stop-typing", handleStopTyping);
    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("connect", joinGroups);
      socket.off("expense:added", handleExpenseAdded);
      socket.off("split:updated", handleExpenseAdded);
      socket.off("fairness:changed", handleFairnessChanged);
      socket.off("group:updated", handleGroupUpdated);
      socket.off("chat:message", handleChatMessage);
      socket.off("transaction:created", handleTransactionCreated);
      socket.off("transaction:updated", handleTransactionUpdated);
      socket.off("chat:typing", handleTyping);
      socket.off("chat:stop-typing", handleStopTyping);
      socket.off("presence:update", handlePresenceUpdate);
      // Clear all typing timers
      Object.values(typingTimers.current).forEach(clearTimeout);
      typingTimers.current = {};
    };
  }, [isLoggedIn, currentUserId, refreshGroup]);
  // ☝️ Removed rawGroups from deps — groupIdsRef.current handles group ID tracking

  const groups = useMemo(() => rawGroups.map((group) => mapGroup(group, currentUserId, groupExtras[userIdOf(group)])), [currentUserId, groupExtras, rawGroups]);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || groups[0] || null;

  const createGroup = async (payload) => {
    const data = unwrap(await api.post("/groups", payload));
    await refreshGroup(userIdOf(data.group));
    setSelectedGroupId(userIdOf(data.group));
    return data.group;
  };

  const addExpense = async (groupId, payload) => {
    const data = unwrap(await api.post(`/groups/${groupId}/expenses`, payload));
    setGroupExtras((existing) => ({
      ...existing,
      [groupId]: {
        ...(existing[groupId] || {}),
        expenses: prependById(existing[groupId]?.expenses || [], data.expense),
        fairness: data.fairness,
      },
    }));
    await refreshTransactions();
    return data;
  };

  // ── Send message via socket for real-time, with HTTP fallback ──
  const sendMessage = async (groupId, text) => {
    const socket = getSocket();
    if (socket?.connected) {
      return new Promise((resolve, reject) => {
        socket.emit("chat:message", { groupId, text }, (response) => {
          if (response?.success) {
            resolve(mapMessage(response.message, currentUserId));
          } else {
            // Fallback to HTTP
            sendMessageHTTP(groupId, text).then(resolve).catch(reject);
          }
        });
        // Timeout fallback — if ack doesn't come in 3s, use HTTP
        setTimeout(() => {
          sendMessageHTTP(groupId, text).then(resolve).catch(reject);
        }, 3000);
      });
    }
    return sendMessageHTTP(groupId, text);
  };

  const sendMessageHTTP = async (groupId, text) => {
    const data = unwrap(await api.post(`/groups/${groupId}/chat/messages`, { text }));
    setGroupExtras((existing) => ({
      ...existing,
      [groupId]: {
        ...(existing[groupId] || {}),
        messages: mergeById(existing[groupId]?.messages || [], data.message),
      },
    }));
    return mapMessage(data.message, currentUserId);
  };

  // ── Typing indicator helpers ──
  const sendTyping = useCallback((groupId) => {
    const socket = getSocket();
    if (socket?.connected && groupId) {
      socket.emit("chat:typing", groupId);
    }
  }, []);

  const sendStopTyping = useCallback((groupId) => {
    const socket = getSocket();
    if (socket?.connected && groupId) {
      socket.emit("chat:stop-typing", groupId);
    }
  }, []);

  const recommendSplit = async (groupId, payload) => {
    const data = unwrap(await api.post(`/groups/${groupId}/recommend-split`, payload));
    return data.recommendation;
  };

  const settleUp = async (payload) => {
    const data = unwrap(await api.post("/settle", payload));
    if (data.transaction) {
      setTransactions((existing) => prependById(existing, mapTransaction(data.transaction, currentUserId)));
    }
    if (payload.groupId) await refreshGroup(payload.groupId);
    return data;
  };

  const confirmPayment = async (transactionId, payload) => {
    const data = unwrap(await api.patch(`/transactions/${transactionId}/confirm`, payload));
    if (data.transaction) {
      setTransactions((existing) => prependById(existing, mapTransaction(data.transaction, currentUserId)));
    }
    if (data.transaction?.raw?.group?._id || data.transaction?.group?._id) {
      await refreshGroup(userIdOf(data.transaction.raw?.group || data.transaction.group));
    }
    return data;
  };

  const value = {
    groups,
    selectedGroup,
    selectedGroupId,
    setSelectedGroupId,
    transactions,
    isLoading,
    error,
    createGroup,
    addExpense,
    sendMessage,
    sendTyping,
    sendStopTyping,
    typingUsers,
    onlineUsers,
    recommendSplit,
    settleUp,
    confirmPayment,
    refreshGroups,
    refreshGroup,
    refreshTransactions,
    latestExpenses: groups.flatMap((group) => group.expenses.map((expense) => ({ ...expense, group: group.name }))),
    expenseTransactions: groups.flatMap((group) => group.expenses.map((expense) => ({
      ...expense,
      group: group.name,
      yourShare: expense.participants.find((item) => userIdOf(item.user) === currentUserId)?.share || 0,
      splitLogic: "Split result calculated by the backend fairness engine.",
      fairnessContext: "This expense is reflected in the backend fairness score.",
      breakdown: expense.participants.map((item) => ({
        name: userIdOf(item.user) === currentUserId ? "You" : item.user?.name || "Member",
        share: item.share || 0,
        paid: userIdOf(expense.raw?.paidBy) === userIdOf(item.user) ? expense.amount : 0,
        net: (userIdOf(expense.raw?.paidBy) === userIdOf(item.user) ? expense.amount : 0) - (item.share || 0),
      })),
    }))),
  };

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData() {
  const context = useContext(LiveDataContext);
  if (!context) throw new Error("useLiveData must be used within a LiveDataProvider");
  return context;
}
