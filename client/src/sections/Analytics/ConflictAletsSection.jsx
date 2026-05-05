const serif = "font-serif text-black tracking-tight";
const sans = "font-sans text-gray-600";

function ConflictAlert({ severity, group, message, action }) {
  const styles = {
    moderate: "bg-amber-50/60 border-amber-100 text-amber-800",
    mild: "bg-white border-black/[0.04] text-gray-700",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[severity] || styles.mild}`}>
      <p className="text-xs font-medium uppercase tracking-widest mb-2">{group}</p>
      <p className="text-sm text-black">{message}</p>
      <p className="text-xs mt-2 text-gray-500">{action}</p>
    </div>
  );
}

export default function ConflictAlertsSection({ suggestions, groupName }) {
  const alerts = suggestions?.suggestions?.length
    ? suggestions.suggestions.map((item) => ({
      severity: "moderate",
      group: groupName || "Active group",
      message: item.message,
      action: "Review settlement suggestion",
    }))
    : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h3 className={`${serif} text-2xl`}>Conflict Prevention</h3>
          <p className={`${sans} text-sm mt-1`}>Catch imbalance before it becomes tension.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {alerts.map((alert) => <ConflictAlert key={`${alert.group}-${alert.message}`} {...alert} />)}
        {alerts.length === 0 && <p className="text-sm text-gray-400">No conflict alerts right now.</p>}
      </div>
    </div>
  );
}
