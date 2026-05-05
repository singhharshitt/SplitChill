/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { getApiError, unwrap } from "../api/client.js";
import { connectSocket, disconnectSocket } from "../api/socket.js";
import { useAuth } from "./AuthContext.jsx";
import { mapGroup, mapMessage, mapTransaction, userIdOf } from "../lib/liveDataTransforms.js";

const LiveDataContext = createContext(null);

export function LiveDataProvider({ children }) {
  const { isLoggedIn, user } = useAuth();
  const currentUserId = userIdOf(user);
  const [rawGroups, setRawGroups] = useState([]);
  const [groupExtras, setGroupExtras] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshTransactions = useCallback(async () => {
    if (!isLoggedIn) return;
    const data = unwrap(await api.get("/transactions"));
    setTransactions((data.transactions || []).map((item) => mapTransaction(item, currentUserId)));
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
    setRawGroups((existing) => {
      const without = existing.filter((item) => userIdOf(item) !== userIdOf(group));
      return [group, ...without];
    });
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

  useEffect(() => {
    if (!isLoggedIn) {
      Promise.resolve().then(() => {
        setRawGroups([]);
        setGroupExtras({});
        setTransactions([]);
        setSelectedGroupId(null);
      });
      disconnectSocket();
      return;
    }
    Promise.resolve().then(refreshGroups);
  }, [isLoggedIn, refreshGroups]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const socket = connectSocket();
    const groupIds = rawGroups.map((group) => userIdOf(group)).filter(Boolean);
    groupIds.forEach((groupId) => socket.emit("group:join", groupId));

    const refreshPayloadGroup = (payload) => {
      if (payload?.groupId) {
        refreshGroup(payload.groupId);
        refreshTransactions();
      }
    };
    const appendMessage = (payload) => {
      if (!payload?.groupId || !payload?.message) return;
      setGroupExtras((existing) => ({
        ...existing,
        [payload.groupId]: {
          ...(existing[payload.groupId] || {}),
          messages: [...(existing[payload.groupId]?.messages || []), payload.message],
        },
      }));
    };

    socket.on("expense:added", refreshPayloadGroup);
    socket.on("split:updated", refreshPayloadGroup);
    socket.on("fairness:changed", refreshPayloadGroup);
    socket.on("group:updated", refreshPayloadGroup);
    socket.on("chat:message", appendMessage);

    return () => {
      groupIds.forEach((groupId) => socket.emit("group:leave", groupId));
      socket.off("expense:added", refreshPayloadGroup);
      socket.off("split:updated", refreshPayloadGroup);
      socket.off("fairness:changed", refreshPayloadGroup);
      socket.off("group:updated", refreshPayloadGroup);
      socket.off("chat:message", appendMessage);
    };
  }, [isLoggedIn, rawGroups, refreshGroup, refreshTransactions]);

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
        expenses: [data.expense, ...(existing[groupId]?.expenses || [])],
        fairness: data.fairness,
      },
    }));
    await refreshTransactions();
    return data;
  };

  const sendMessage = async (groupId, text) => {
    const data = unwrap(await api.post(`/groups/${groupId}/chat/messages`, { text }));
    setGroupExtras((existing) => ({
      ...existing,
      [groupId]: {
        ...(existing[groupId] || {}),
        messages: [...(existing[groupId]?.messages || []), data.message],
      },
    }));
    return mapMessage(data.message, currentUserId);
  };

  const recommendSplit = async (groupId, payload) => {
    const data = unwrap(await api.post(`/groups/${groupId}/recommend-split`, payload));
    return data.recommendation;
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
    recommendSplit,
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
