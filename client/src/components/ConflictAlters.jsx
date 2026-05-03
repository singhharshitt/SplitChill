export default function ConflictAlert({ severity, group, message, action }) {
  const styles = {
    mild: "bg-amber-50/60 border-amber-100 text-amber-800",
    moderate: "bg-orange-50/60 border-orange-100 text-orange-800",
    high: "bg-red-50/60 border-red-100 text-red-800",
  };

  const dotStyles = {
    mild: "bg-amber-400",
    moderate: "bg-orange-400",
    high: "bg-red-500",
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 hover:shadow-md ${styles[severity]}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotStyles[severity]}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">{severity}</span>
            <span className="text-xs opacity-50">•</span>
            <span className="text-xs opacity-70">{group}</span>
          </div>
          <p className="text-sm font-medium leading-relaxed">{message}</p>
          {action && (
            <button className="mt-3 text-xs font-medium underline underline-offset-4 opacity-70 hover:opacity-100 transition-opacity">
              {action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}