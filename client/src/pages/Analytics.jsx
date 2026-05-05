import FairnessScoreCard from "../sections/Analytics/FairnessScoreCard";
import PaymentUsageChart from "../sections/Analytics/PaymentUsageChart";
import ContributionChart from "../sections/Analytics/ContributionChart";
import PredictionsSection from "../sections/Analytics/PredictionsSection";
import ConflictAlertsSection from "../sections/Analytics/ConflictAletsSection";
import Navbar from '../components/Navbar.jsx';
import { useLiveData } from "../context/LiveDataContext.jsx";
function InsightBadge({ text }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/5 shadow-sm">
      <div className="w-1.5 h-1.5 rounded-full bg-[#A3FDA7]" />
      <span className="text-xs text-gray-600">{text}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { selectedGroup } = useLiveData();
  const analytics = selectedGroup?.analytics;
  const suggestions = selectedGroup?.suggestions;
  const fairness = selectedGroup?.fairness;

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans selection:bg-[#A3FDA7]/30">
      {/* Header */}
      {/* <nav className="max-w-6xl mx-auto px-6 pt-8 pb-2 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-black tracking-tight">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Fairness intelligence for your shared life.</p>
        </div>
        <InsightBadge text="You tend to pay first in group settings" />
      </nav> */}
      <Navbar/>
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-10 flex flex-col gap-10">
        <FairnessScoreCard fairness={fairness} trend={analytics?.fairnessTrend}/>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PaymentUsageChart people={analytics?.paymentVsUsage}/>
          <ContributionChart data={analytics?.contributionImbalance}/>
        </div>
        <PredictionsSection suggestions={suggestions}/>
        <ConflictAlertsSection suggestions={suggestions} groupName={selectedGroup?.name}/>
        <div className="flex flex-wrap gap-3 justify-center pt-6 pb-10">
          <InsightBadge text="Your contribution is above group average" />
          <InsightBadge text="3 groups trending toward fairness" />
          <InsightBadge text="Next predicted settlement: Friday" />
        </div>
      </main>
    </div>
  );
}
