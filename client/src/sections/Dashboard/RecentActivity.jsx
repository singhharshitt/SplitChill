const cardBase =
  "bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5";
const serifHeading = "font-serif text-black tracking-tight";

export default function RecentActivity() {
  const items = [
    { text: "You paid ₹500 for dinner", meta: "2h ago", type: "out" },
    { text: "Alex owes you ₹200", meta: "Yesterday", type: "in" },
    { text: "Goa Trip — Sarah settled ₹1,000", meta: "Yesterday", type: "neutral" },
    { text: "You added ₹320 to Office Lunch", meta: "3d ago", type: "out" },
  ];

  return (
    <div className={cardBase}>
      <h3 className={`${serifHeading} text-2xl mb-6`}>Recent Activity</h3>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-4 px-3 rounded-xl hover:bg-black/[0.015] transition-colors duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full shrink-0 ${item.type === "out" ? "bg-red-300" : item.type === "in" ? "bg-emerald-400" : "bg-gray-300"}`} />
              <span className="text-sm text-black font-medium">{item.text}</span>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">{item.meta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
