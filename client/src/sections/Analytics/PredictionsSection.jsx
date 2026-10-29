import PredictionCard from "../../components/PredictionCard.jsx";
import { sans, serif } from "../../lib/uiTokens.js";

export default function PredictionsSection({ suggestions }) {
  // Historical facts: balances computed from real expense records.
  const facts = (suggestions?.suggestions || [])
    .filter((item) => item.source !== "ai-recommendation")
    .map((item) => ({
      title: item.message,
      desc: "Calculated from your group's actual expense history.",
      confidence: "High",
      trend: "up",
    }));

  // AI recommendations: speculative, clearly labeled as such.
  const aiPredictions = suggestions?.aiPredictions;
  const aiCards = Array.isArray(aiPredictions?.items)
    ? aiPredictions.items.map((item) => ({
      title: item.title || item.message || item.text || "AI insight",
      desc: item.description || item.reason || "AI-generated recommendation — speculative, not a financial record.",
      confidence: "AI",
      trend: "flat",
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

      {facts.length > 0 && (
        <p className={`${sans} text-xs uppercase tracking-widest text-gray-400`}>Balance-based insights</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facts.map((card) => <PredictionCard key={`fact-${card.title}`} {...card} />)}
      </div>

      {aiCards.length > 0 && (
        <p className={`${sans} text-xs uppercase tracking-widest text-gray-400 mt-2`}>AI recommendations (speculative)</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiCards.map((card) => <PredictionCard key={`ai-${card.title}`} {...card} />)}
      </div>

      {aiCards.length === 0 && aiPredictions?.insufficientData && (
        <p className="text-sm text-gray-400">{aiPredictions.message}</p>
      )}
      {facts.length === 0 && aiCards.length === 0 && !aiPredictions?.insufficientData && (
        <p className="text-sm text-gray-400">No predictions yet.</p>
      )}
    </div>
  );
}
