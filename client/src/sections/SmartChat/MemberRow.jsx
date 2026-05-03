export default function MemberRow({ member }) {
  const tagStyles = {
    balanced: "bg-gray-50 text-gray-600 border-gray-100",
    overpaying: "bg-[#A3FDA7]/15 text-emerald-800 border-[#A3FDA7]/20",
    owes: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white border border-black/[0.03]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center text-xs font-bold">{member.avatar}</div>
        <span className="text-sm font-medium text-black">{member.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${tagStyles[member.tag]}`}>
          {member.tag === "overpaying" ? "Paid more" : member.tag === "owes" ? "Owes more" : "Balanced"}
        </span>
        <span className={`text-xs font-medium ${member.net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {member.net >= 0 ? "+" : ""}₹{member.net}
        </span>
      </div>
    </div>
  );
}

