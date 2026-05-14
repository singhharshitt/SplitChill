export function userIdOf(value) {
  return String(value?._id || value?.id || value || "");
}

export function money(value) {
  return Number(value || 0);
}

export function formatDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function initials(name = "?") {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function mapGroup(group, currentUserId, extras = {}) {
  const members = (group.members || []).map((member) => {
    const user = member.user || {};
    const net = money(member.netBalance);
    return {
      id: userIdOf(user),
      name: userIdOf(user) === currentUserId ? "You" : user.name || "Member",
      avatar: initials(user.name || "Member"),
      tag: net > 0 ? "overpaying" : net < 0 ? "owes" : "balanced",
      net,
      raw: member,
    };
  });

  const currentMember = members.find((member) => member.id === currentUserId);
  const currentBalance = money(currentMember?.net);
  const expenses = (extras.expenses || []).map(mapExpense);
  const messages = (extras.messages || []).map((message) => mapMessage(message, currentUserId));
  const suggestions = extras.suggestions?.suggestions || [];
  const insightMessages = [
    ...(extras.fairness?.insights || []),
    ...(suggestions.length ? suggestions.map((item) => item.message) : []),
  ];

  return {
    id: userIdOf(group),
    name: group.name,
    avatar: initials(group.name),
    type: group.type || "general",
    members,
    expenses,
    fairnessScore: money(extras.fairness?.score ?? group.fairnessScore ?? 100),
    balance: {
      amount: Math.abs(currentBalance),
      type: currentBalance > 0 ? "owed" : currentBalance < 0 ? "owe" : "settled",
    },
    insights: insightMessages.length ? insightMessages : ["No fairness concerns yet."],
    messages,
    raw: group,
    analytics: extras.analytics,
    suggestions: extras.suggestions,
    fairness: extras.fairness,
  };
}

export function mapExpense(expense) {
  const payer = expense.paidBy?.name || "Someone";
  return {
    id: userIdOf(expense),
    title: expense.title,
    type: "expense",
    amount: money(expense.amount),
    payer,
    date: formatDate(expense.createdAt),
    splitType: splitLabel(expense.splitType),
    fairnessScore: expense.fairnessScoreAfter,
    participants: expense.participants || [],
    raw: expense,
  };
}

export function mapMessage(message, currentUserId) {
  if (message?.id && message?.type) return message;
  const sender = message.sender || {};
  return {
    id: userIdOf(message),
    type: "text",
    from: userIdOf(sender) === currentUserId ? "You" : sender.name || "Member",
    text: message.text,
    self: userIdOf(sender) === currentUserId,
    time: formatDate(message.createdAt),
    raw: message,
  };
}

export function mapTransaction(transaction, currentUserId) {
  const payerId = userIdOf(transaction.payer);
  const receiverId = userIdOf(transaction.receiver);
  const isPayer = payerId === currentUserId;
  const payerName = isPayer ? "You" : transaction.payer?.name || "Payer";
  const receiverName = receiverId === currentUserId ? "You" : transaction.receiver?.name || "Receiver";

  return {
    id: userIdOf(transaction),
    title: `Settlement with ${isPayer ? receiverName : payerName}`,
    type: "settlement",
    amount: money(transaction.amount),
    payer: payerName,
    yourShare: isPayer ? -money(transaction.amount) : money(transaction.amount),
    date: formatDate(transaction.createdAt),
    group: transaction.group?.name || "Group",
    splitType: null,
    splitLogic: transaction.note || "Direct settlement to clear outstanding balance.",
    fairnessScore: transaction.group?.fairnessScore || 100,
    fairnessContext: transaction.status === "pending"
      ? "This settlement is pending confirmation before it changes fairness balances."
      : "This settlement is reflected in the backend fairness engine.",
    status: transaction.status || "completed",
    paymentMethod: transaction.paymentMethod || "manual",
    upi: transaction.upi,
    breakdown: [
      { name: payerName, share: -money(transaction.amount), paid: money(transaction.amount), net: -money(transaction.amount) },
      { name: receiverName, share: money(transaction.amount), paid: 0, net: money(transaction.amount) },
    ],
    raw: transaction,
  };
}

function splitLabel(splitType) {
  const labels = {
    equal: "Equal",
    custom: "Custom",
    "income-based": "Income-Based",
    "usage-based": "Usage-Based",
    "ai-recommended": "AI",
  };
  return labels[splitType] || splitType || "Equal";
}
