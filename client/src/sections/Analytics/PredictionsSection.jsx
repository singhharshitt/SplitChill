import PredictionCard from "../../components/PredictionCard.jsx";
import { sans, serif } from "../../lib/uiTokens.js";

export default function PredictionsSection() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h3 className={`${serif} text-2xl`}>Future Intelligence</h3>
          <p className={`${sans} text-sm mt-1`}>Where your group is heading.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PredictionCard
          title="You’ll likely owe ₹800 next week."
          desc="Based on upcoming group expenses and your recent contribution pattern."
          confidence="High"
          trend="down"
        />
        <PredictionCard
          title="Rohan may become overburdened."
          desc="If the current trend continues, his share will exceed sustainable levels."
          confidence="Moderate"
          trend="up"
        />
      </div>
    </div>
  );
}
