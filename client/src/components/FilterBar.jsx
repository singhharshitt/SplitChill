import { serif } from "../lib/uiTokens.js";
import { GROUPS, PEOPLE } from "../lib/transactionFilters.js";

export default function FilterBar({ filters, onFilterChange, searchQuery, onSearchChange, resultCount }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className={`${serif} text-3xl`}>Transactions</h2>
        <span className="text-sm text-gray-400">{resultCount} entries</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by expense or person..."
            className="w-full bg-white rounded-xl pl-11 pr-4 py-2.5 text-sm border border-black/5 outline-none focus:border-[#A3FDA7]/40 focus:ring-1 focus:ring-[#A3FDA7]/20 transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Group Filter */}
        <div className="flex items-center gap-2">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => onFilterChange("group", g)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 ${
                filters.group === g
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-black/5 hover:border-black/10"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Person Filter */}
        <div className="flex items-center gap-2">
          {PEOPLE.map((p) => (
            <button
              key={p}
              onClick={() => onFilterChange("person", p)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 ${
                filters.person === p
                  ? "bg-[#A3FDA7]/15 text-emerald-800 border-[#A3FDA7]/30"
                  : "bg-white text-gray-600 border-black/5 hover:border-black/10"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Export */}
        <button className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-black/5 text-xs font-medium text-gray-600 hover:border-black/10 hover:shadow-sm transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
      </div>
    </div>
  );
}
