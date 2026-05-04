function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getMemberId(member) {
  return String(member.user?._id || member.user);
}

function normalizeIncomeFactor(income, averageIncome) {
  if (!income || !averageIncome) return 1;
  return clamp(income / averageIncome, 0.55, 1.85);
}

function contributionFactor(member) {
  const share = member.totalShare || 0;
  const paid = member.totalPaid || 0;
  if (share <= 0) return 1;
  return clamp(1 - (paid - share) / Math.max(share, 1) * 0.25, 0.7, 1.3);
}

function consistencyFactor(member) {
  return clamp(member.paymentConsistency ?? 1, 0.5, 1);
}

function usageFactor(participant) {
  return clamp(participant.usage ?? 1, 0, 5);
}

function calculateMemberWeight({ member, participant, splitType, averageIncome }) {
  if (splitType === "equal") return 1;
  if (splitType === "custom" && participant.share > 0) return participant.share;

  const incomeFactor = splitType === "income-based" || splitType === "ai-recommended"
    ? normalizeIncomeFactor(member.incomeSnapshot, averageIncome)
    : 1;
  const participation = splitType === "ai-recommended"
    ? clamp(member.participationScore ?? 1, 0.5, 1.5)
    : 1;
  const contribution = splitType === "ai-recommended" ? contributionFactor(member) : 1;
  const consistency = splitType === "ai-recommended" ? consistencyFactor(member) : 1;
  const usage = splitType === "usage-based" || splitType === "ai-recommended"
    ? usageFactor(participant)
    : 1;

  return clamp(incomeFactor * participation * contribution * consistency * usage, 0.1, 10);
}

function calculateShares({ amount, participants, members, splitType }) {
  const memberMap = new Map(members.map((member) => [getMemberId(member), member]));
  const selectedMembers = participants.map((participant) => {
    const userId = String(participant.user);
    return {
      participant,
      member: memberMap.get(userId),
      userId,
    };
  });

  const averageIncome = selectedMembers.reduce((sum, item) => {
    return sum + (item.member?.incomeSnapshot || 0);
  }, 0) / Math.max(selectedMembers.length, 1);

  const weighted = selectedMembers.map((item) => {
    const weight = calculateMemberWeight({
      member: item.member || {},
      participant: item.participant,
      splitType,
      averageIncome,
    });
    return { ...item, weight };
  });

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0) || 1;
  let allocated = 0;

  return weighted.map((item, index) => {
    const isLast = index === weighted.length - 1;
    const share = isLast
      ? roundMoney(amount - allocated)
      : roundMoney(amount * (item.weight / totalWeight));
    allocated += share;

    return {
      user: item.userId,
      share: Math.max(0, share),
      weight: roundMoney(item.weight),
      usage: item.participant.usage ?? 1,
    };
  });
}

function calculateFairness(group) {
  const members = group.members || [];
  const totalShare = members.reduce((sum, member) => sum + Math.max(member.totalShare || 0, 0), 0);
  const totalPaid = members.reduce((sum, member) => sum + Math.max(member.totalPaid || 0, 0), 0);
  const volume = Math.max(totalShare, totalPaid, 1);

  const memberScores = members.map((member) => {
    const deviation = Math.abs(member.netBalance || 0) / volume;
    const streakPenalty = Math.min((member.underpaymentStreak || 0) * 4, 20);
    const consistencyPenalty = (1 - clamp(member.paymentConsistency ?? 1, 0, 1)) * 12;
    const score = clamp(100 - deviation * 180 - streakPenalty - consistencyPenalty, 0, 100);

    return {
      user: getMemberId(member),
      score: Math.round(score),
      netBalance: roundMoney(member.netBalance || 0),
      totalPaid: roundMoney(member.totalPaid || 0),
      totalShare: roundMoney(member.totalShare || 0),
      underpaymentStreak: member.underpaymentStreak || 0,
    };
  });

  const avgScore = memberScores.reduce((sum, item) => sum + item.score, 0) / Math.max(memberScores.length, 1);
  const imbalance = members.reduce((sum, member) => sum + Math.abs(member.netBalance || 0), 0) / 2;
  const score = Math.round(clamp(avgScore - (imbalance / volume) * 40, 0, 100));

  const insights = buildInsights(memberScores, score);
  return {
    score,
    imbalance: roundMoney(imbalance),
    memberScores,
    insights,
  };
}

function buildInsights(memberScores, score) {
  const insights = [];
  const underpaying = memberScores.filter((item) => item.netBalance < 0).sort((a, b) => a.netBalance - b.netBalance);
  const overpaying = memberScores.filter((item) => item.netBalance > 0).sort((a, b) => b.netBalance - a.netBalance);

  if (score >= 85) insights.push("Group contributions are balanced and healthy.");
  if (score < 70) insights.push("Fairness is drifting; settlement or payer rotation is recommended.");
  if (overpaying[0]) insights.push(`${overpaying[0].user} is carrying the largest positive balance.`);
  if (underpaying[0]) insights.push(`${underpaying[0].user} has the largest outstanding share.`);

  return insights;
}

function applyExpenseToGroup(group, expense) {
  const shareMap = new Map(expense.participants.map((participant) => [String(participant.user), participant.share]));
  const payerId = String(expense.paidBy);

  group.members.forEach((member) => {
    const memberId = getMemberId(member);
    const share = shareMap.get(memberId) || 0;
    member.totalShare = roundMoney((member.totalShare || 0) + share);
    member.totalPaid = roundMoney((member.totalPaid || 0) + (memberId === payerId ? expense.amount : 0));
    member.netBalance = roundMoney((member.totalPaid || 0) - (member.totalShare || 0));
    member.underpaymentStreak = member.netBalance < 0
      ? (member.underpaymentStreak || 0) + 1
      : 0;
    member.paymentConsistency = clamp(1 - (member.underpaymentStreak || 0) * 0.08, 0.4, 1);
  });

  const fairness = calculateFairness(group);
  group.fairnessScore = fairness.score;
  group.fairnessHistory.push({
    score: fairness.score,
    imbalance: fairness.imbalance,
    calculatedAt: new Date(),
  });

  return fairness;
}

function applySettlementToGroup(group, transaction) {
  const payerId = String(transaction.payer);
  const receiverId = String(transaction.receiver);

  group.members.forEach((member) => {
    const memberId = getMemberId(member);
    if (memberId === payerId) member.netBalance = roundMoney((member.netBalance || 0) + transaction.amount);
    if (memberId === receiverId) member.netBalance = roundMoney((member.netBalance || 0) - transaction.amount);
    member.underpaymentStreak = member.netBalance < 0 ? member.underpaymentStreak || 0 : 0;
    member.paymentConsistency = clamp(1 - (member.underpaymentStreak || 0) * 0.08, 0.4, 1);
  });

  const fairness = calculateFairness(group);
  group.fairnessScore = fairness.score;
  group.fairnessHistory.push({
    score: fairness.score,
    imbalance: fairness.imbalance,
    calculatedAt: new Date(),
  });

  return fairness;
}

module.exports = {
  applyExpenseToGroup,
  applySettlementToGroup,
  calculateFairness,
  calculateShares,
  clamp,
  roundMoney,
};
