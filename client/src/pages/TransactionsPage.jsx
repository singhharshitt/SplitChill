import React, { useState, useMemo } from "react";
import FilterBar from "../components/FilterBar.jsx";
import TransactionItem from "../components/TransactionItem.jsx";
import { sans, serif } from "../lib/uiTokens.js";
import { GROUPS, PEOPLE } from "../lib/transactionFilters.js";
import SummaryStats from "../sections/Transaction/SummaryStats.jsx";
import TransactionDetailModal from "../sections/Transaction/TransactionDetailModal.jsx";

/* ─────────────────────────────────────────────
   TOKENS
   ───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   MOCK DATA
   ───────────────────────────────────────────── */
const TRANSACTIONS = [
  {
    id: 1,
    title: "Dinner at Fisherman's Wharf",
    type: "expense",
    amount: 3500,
    payer: "Alex",
    yourShare: 875,
    date: "Today, 8:30 PM",
    group: "Goa Trip",
    splitType: "AI",
    splitLogic: "Adjusted using AI fairness model — Rohan paid more earlier, so his share was reduced by 18%.",
    fairnessScore: 88,
    fairnessContext: "This split reduced imbalance in the group.",
    breakdown: [
      { name: "Alex", share: 875, paid: 3500, net: 2625 },
      { name: "You", share: 875, paid: 0, net: -875 },
      { name: "Rohan", share: 700, paid: 0, net: -700 },
      { name: "Sarah", share: 1050, paid: 0, net: -1050 },
    ],
  },
  {
    id: 2,
    title: "Settlement with Rohan",
    type: "settlement",
    amount: 800,
    payer: "You",
    yourShare: -800,
    date: "Yesterday, 4:15 PM",
    group: "Flatmates",
    splitType: null,
    splitLogic: "Direct settlement to clear outstanding balance.",
    fairnessScore: 72,
    fairnessContext: "This settlement improved group fairness by 12%.",
    breakdown: [
      { name: "You", share: -800, paid: 800, net: 0 },
      { name: "Rohan", share: 800, paid: 0, net: 800 },
    ],
  },
  {
    id: 3,
    title: "Taxi to Airport",
    type: "expense",
    amount: 1200,
    payer: "You",
    yourShare: 300,
    date: "Yesterday, 10:00 AM",
    group: "Goa Trip",
    splitType: "Equal",
    splitLogic: "Split equally among 4 people — standard equal division.",
    fairnessScore: 95,
    fairnessContext: "Perfectly balanced. No adjustment needed.",
    breakdown: [
      { name: "You", share: 300, paid: 1200, net: 900 },
      { name: "Alex", share: 300, paid: 0, net: -300 },
      { name: "Rohan", share: 300, paid: 0, net: -300 },
      { name: "Sarah", share: 300, paid: 0, net: -300 },
    ],
  },
  {
    id: 4,
    title: "Electricity + WiFi",
    type: "expense",
    amount: 2400,
    payer: "You",
    yourShare: 800,
    date: "3 days ago",
    group: "Flatmates",
    splitType: "Equal",
    splitLogic: "Split equally among 3 flatmates.",
    fairnessScore: 64,
    fairnessContext: "You've paid 3 consecutive bills. Consider rotating.",
    breakdown: [
      { name: "You", share: 800, paid: 2400, net: 1600 },
      { name: "Rohan", share: 800, paid: 0, net: -800 },
      { name: "Priya", share: 800, paid: 0, net: -800 },
    ],
  },
  {
    id: 5,
    title: "Hotel Booking",
    type: "expense",
    amount: 8000,
    payer: "Rohan",
    yourShare: 2000,
    date: "5 days ago",
    group: "Goa Trip",
    splitType: "Income-Based",
    splitLogic: "Based on income and contribution history — higher earners cover more.",
    fairnessScore: 82,
    fairnessContext: "Rohan volunteered to front the cost. Others will settle gradually.",
    breakdown: [
      { name: "Rohan", share: 3200, paid: 8000, net: 4800 },
      { name: "You", share: 2000, paid: 0, net: -2000 },
      { name: "Alex", share: 1800, paid: 0, net: -1800 },
      { name: "Sarah", share: 1000, paid: 0, net: -1000 },
    ],
  },
  {
    id: 6,
    title: "Pizza Friday",
    type: "expense",
    amount: 1200,
    payer: "Mike",
    yourShare: 240,
    date: "Last week",
    group: "Office Lunch",
    splitType: "Equal",
    splitLogic: "Split equally among 5 people.",
    fairnessScore: 98,
    fairnessContext: "Group is perfectly balanced. Great teamwork!",
    breakdown: [
      { name: "Mike", share: 240, paid: 1200, net: 960 },
      { name: "You", share: 240, paid: 0, net: -240 },
      { name: "Sarah", share: 240, paid: 0, net: -240 },
      { name: "Alex", share: 240, paid: 0, net: -240 },
      { name: "Rohan", share: 240, paid: 0, net: -240 },
    ],
  },
];

/* ─────────────────────────────────────────────
   1. FILTER BAR
   ───────────────────────────────────────────── */


/* ─────────────────────────────────────────────
   2. TRANSACTION ITEM
   ───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   5. SUMMARY STATS
   ───────────────────────────────────────────── */


/* ─────────────────────────────────────────────
   MAIN TRANSACTIONS PAGE
   ───────────────────────────────────────────── */
export default function TransactionsPage() {
  const [filters, setFilters] = useState({ group: "All Groups", person: "All People" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const filtered = useMemo(() => {
    return TRANSACTIONS.filter((t) => {
      const groupMatch = filters.group === "All Groups" || t.group === filters.group;
      const personMatch = filters.person === "All People" || t.payer === filters.person || t.breakdown.some((b) => b.name === filters.person);
      const searchMatch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.group.toLowerCase().includes(searchQuery.toLowerCase());
      return groupMatch && personMatch && searchMatch;
    });
  }, [filters, searchQuery]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans selection:bg-[#A3FDA7]/30">
      {/* Header */}
      <nav className="max-w-4xl mx-auto px-6 pt-8 pb-2">
        <h1 className={`${serif} text-3xl`}>Transactions</h1>
        <p className={`${sans} text-sm mt-1`}>Every rupee, explained and verified.</p>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Summary Stats */}
        <SummaryStats transactions={TRANSACTIONS} />

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultCount={filtered.length}
        />

        {/* Transaction List */}
        <div className="flex flex-col gap-3">
          {filtered.map((t) => (
            <TransactionItem key={t.id} transaction={t} onClick={() => setSelectedTransaction(t)} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 font-serif text-xl">No transactions found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="flex flex-wrap gap-3 justify-center pt-6 pb-10">
          <InsightBadge text="You've paid more than average this month" />
          <InsightBadge text="Most expenses are from dining out" />
          <InsightBadge text="3 settlements improved fairness this week" />
        </div>
      </main>

      {/* Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
