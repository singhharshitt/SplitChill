import React, { useState, useMemo, useEffect, useCallback } from "react";
import FilterBar from "../components/FilterBar.jsx";
import Navbar from "../components/Navbar.jsx";
import TransactionItem from "../components/TransactionItem.jsx";
import SummaryStats from "../sections/Transaction/SummaryStats.jsx";
import TransactionDetailModal from "../sections/Transaction/TransactionDetailModal.jsx";
import { useLiveData } from "../context/LiveDataContext.jsx";
import usePagination from "../hooks/usePagination.js";
import api, { unwrap } from "../api/client.js";
import { mapTransaction } from "../lib/liveDataTransforms.js";

function InsightBadge({ text }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/5 shadow-sm">
      <div className="w-1.5 h-1.5 rounded-full bg-[#A3FDA7]" />
      <span className="text-xs text-gray-600">{text}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN TRANSACTIONS PAGE
   ───────────────────────────────────────────── */
export default function TransactionsPage() {
  const { transactions, expenseTransactions } = useLiveData();
  const [filters, setFilters] = useState({ group: "All Groups", person: "All People" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Initialize pagination for transactions
  const fetchTransactions = useCallback(async ({ limit, cursor, signal }) => {
    const data = unwrap(await api.get("/transactions", { params: { limit, cursor }, signal }));
    return {
      items: (data.items || data.transactions || []).map((item) => mapTransaction(item, "")),
      pagination: data.pagination,
    };
  }, []);
  
  const transactionsPagination = usePagination(fetchTransactions, { initialLimit: 20 });
  const { loadInitial } = transactionsPagination;

  // Load initial transactions from LiveData
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const allTransactions = useMemo(() => transactionsPagination.items, [transactionsPagination.items]);
  const totalSettled = useMemo(() => transactions.reduce((sum, item) => sum + (item.amount || 0), 0), [transactions]);
  const totalExpense = useMemo(() => expenseTransactions.reduce((sum, item) => sum + (item.amount || 0), 0), [expenseTransactions]);
  const groupOptions = useMemo(() => ["All Groups", ...new Set(allTransactions.map((item) => item.group).filter(Boolean))], [allTransactions]);
  const peopleOptions = useMemo(() => ["All People", ...new Set(allTransactions.flatMap((item) => [
    item.payer,
    ...(item.breakdown || []).map((entry) => entry.name),
  ]).filter(Boolean))], [allTransactions]);

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      const groupMatch = filters.group === "All Groups" || t.group === filters.group;
      const personMatch = filters.person === "All People" || t.payer === filters.person || t.breakdown.some((b) => b.name === filters.person);
      const normalizedQuery = searchQuery.toLowerCase();
      const searchMatch = !searchQuery ||
        t.title.toLowerCase().includes(normalizedQuery) ||
        t.group.toLowerCase().includes(normalizedQuery) ||
        t.payer.toLowerCase().includes(normalizedQuery) ||
        t.breakdown.some((b) => b.name.toLowerCase().includes(normalizedQuery));
      return groupMatch && personMatch && searchMatch;
    });
  }, [allTransactions, filters, searchQuery]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans selection:bg-[#A3FDA7]/30">

      <Navbar/>

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-8 flex flex-col gap-8">
        {/* Summary Stats */}
        <SummaryStats transactions={allTransactions} />

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultCount={filtered.length}
          groups={groupOptions}
          people={peopleOptions}
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
          {transactionsPagination.hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => transactionsPagination.loadMore()}
                disabled={transactionsPagination.isFetching}
                className="px-6 py-3 text-sm font-medium rounded-full bg-black/[0.05] hover:bg-black/[0.08] disabled:opacity-50 transition-colors"
              >
                {transactionsPagination.isFetching ? "Loading More..." : "Load More Transactions"}
              </button>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="flex flex-wrap gap-3 justify-center pt-6 pb-10">
          <InsightBadge text={`${expenseTransactions.length} live expense records`} />
          <InsightBadge text={`Rs ${totalExpense.toLocaleString()} tracked across groups`} />
          <InsightBadge text={`Rs ${totalSettled.toLocaleString()} settled`} />
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
