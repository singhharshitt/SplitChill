export default function ExpenseRow({ expense }) {
  const payerName = expense?.paidBy?.name || "Unknown";
  const payerInitial = payerName?.[0]?.toUpperCase() || "?";
  const expenseDate = expense?.createdAt
    ? new Date(expense.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Unknown date";

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white border border-black/[0.03] hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center text-xs font-bold">{payerInitial}</div>
        <div>
          <p className="text-sm font-medium text-black">{expense?.title || "Expense"}</p>
          <p className="text-[10px] text-gray-400">{expenseDate} • {payerName} paid</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#A3FDA7]/10 text-emerald-700 border border-[#A3FDA7]/20 font-medium">
          {expense?.splitType === "ai-recommended" ? "Split AI" : expense?.splitType || "Equal"}
        </span>
        <span className="text-sm font-serif text-black">₹{expense?.amount?.toLocaleString() || "0"}</span>
      </div>
    </div>
  );
}