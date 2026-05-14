import { useNavigate } from "react-router-dom";

const cardBase =
  "bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5";
const serifHeading = "font-serif text-black tracking-tight";

export default function ActiveGroups({ groups = [] }) {
  const navigate = useNavigate();
  const statusStyles = {
    fair: "bg-emerald-50 text-emerald-700 border-emerald-100",
    unfair: "bg-red-50 text-red-600 border-red-100",
    settled: "bg-gray-50 text-gray-500 border-gray-100",
  };

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`${serifHeading} text-2xl`}>Active Groups</h3>
        <button className="text-xs text-gray-400 hover:text-black transition-colors">View all</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groups.map((group) => {
          const statusType = group.balance.type === "settled" ? "settled" : group.fairnessScore >= 80 ? "fair" : "unfair";
          const balance = group.balance.type === "settled"
            ? "Rs 0"
            : `${group.balance.type === "owed" ? "+" : "-"}Rs ${group.balance.amount.toLocaleString()}`;

          return (
            <div
              key={group.id}
              onClick={() => navigate("/chat")}
              className="group p-5 rounded-2xl bg-[#FAFAF8] border border-black/[0.03] hover:bg-white hover:border-black/5 hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-serif text-lg text-black">{group.name}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusStyles[statusType]}`}>
                  {statusType === "settled" ? "Settled" : statusType === "fair" ? "Fair" : "Imbalanced"}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-serif ${group.balance.type === "owe" ? "text-red-500" : group.balance.type === "settled" ? "text-gray-400" : "text-emerald-600"}`}>
                  {balance}
                </span>
                <span className="text-xs text-gray-400">your balance</span>
              </div>
            </div>
          );
        })}
        {groups.length === 0 && <p className="text-sm text-gray-400">No groups yet.</p>}
      </div>
    </div>
  );
}
