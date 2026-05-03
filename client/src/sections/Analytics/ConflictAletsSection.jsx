
const serif = "font-serif text-black tracking-tight";
const sans = "font-sans text-gray-600";

export default function ConflictAlertsSection() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h3 className={`${serif} text-2xl`}>Conflict Prevention</h3>
          <p className={`${sans} text-sm mt-1`}>Catch imbalance before it becomes tension.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <ConflictAlert
          severity="moderate"
          group="Goa Trip"
          message="Imbalance detected. Sarah has contributed 40% less than the group average."
          action="Suggest a settlement of ₹1,200"
        />
        <ConflictAlert
          severity="mild"
          group="Flatmates"
          message="Alex hasn’t logged an expense in 12 days."
          action="Send a gentle reminder"
        />
      </div>
    </div>
  );
}
