import PredictionCard from "../../components/PredictionCard.jsx";
import { sans, serif } from "../../lib/uiTokens.js";

export default function PredictionsSection({ suggestions }) {
  const cards = suggestions?.suggestions?.length
    ? suggestions.suggestions.map((item) => ({
      title: item.message,
      desc: "Recommended by the backend fairness engine.",
      confidence: "High",
      trend: "up",
    }))
    : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h3 className={`${serif} text-2xl`}>Future Intelligence</h3>
          <p className={`${sans} text-sm mt-1`}>Where your group is heading.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => <PredictionCard key={card.title} {...card} />)}
        {cards.length === 0 && <p className="text-sm text-gray-400">No predictions yet.</p>}
      </div>
    </div>
  );
}
