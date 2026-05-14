import ToggleSwitch from "../../components/ToggleSwitch.jsx";
import { cardBase, sans, serif } from "../../lib/uiTokens.js";

export default function SecuritySetting({ preferences = {}, onChange }) {
  const shareInsights = preferences.shareInsights ?? true;
  const aiPersonalization = preferences.aiPersonalization ?? true;

  return (
    <div className={cardBase}>
      <h3 className={`${serif} text-2xl mb-2`}>Security & Privacy</h3>
      <p className={`${sans} text-sm mb-6`}>Your data is never shared without consent.</p>

      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-emerald-800">Protected account data</p>
            <p className="text-xs text-emerald-600/80 mt-0.5">Profile and fairness settings are stored server-side.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-black/5">
        <ToggleSwitch
          checked={shareInsights}
          onChange={(value) => onChange?.({ shareInsights: value })}
          label="Share contribution insights"
          description="Let your group see anonymized fairness trends."
        />
        <ToggleSwitch
          checked={aiPersonalization}
          onChange={(value) => onChange?.({ aiPersonalization: value })}
          label="Allow AI personalization"
          description="Enable SplitChill to learn your patterns for better suggestions."
        />
      </div>
    </div>
  );
}
