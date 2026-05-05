import ChatBot from "../context/Chatbot";
import hero from "../assets/hero.png";
import dasb from '../assets/dasb.png';
import RecentActivity from "../sections/Dashboard/RecentActivity";
import ActiveGroups from "../sections/Dashboard/ActiveGroups";
import QuickActions from "../sections/Dashboard/QuickActions";
import FairnessScore from "../sections/Dashboard/FairnessScore";
import BalanceOverview from "../sections/Dashboard/BalanceOverview";
import AISuggestion from "../sections/Dashboard/AISuggestion";
import Navbar from "../components/Navbar.jsx";
import { useLiveData } from "../context/LiveDataContext.jsx";


function DoodleStrip() {
  return (
    <div className="relative w-full mt-8">
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#F5F5F0] to-transparent z-10 pointer-events-none" />
      <img
        src={dasb}
        alt="A living ecosystem of shared life"
        className="w-full h-[420px] object-cover block opacity-90"
      />
    </div>
  );
}

export default function Dashboard() {
  const { groups, selectedGroup, latestExpenses, isLoading, error } = useLiveData();
  const suggestionGroup = groups.find((group) => group.suggestions?.suggestions?.length);
  const suggestion = suggestionGroup?.suggestions?.suggestions?.[0];
  const recentItems = latestExpenses.slice(0, 4).map((expense) => ({
    text: `${expense.payer} paid Rs ${expense.amount.toLocaleString()} for ${expense.title}`,
    meta: expense.date,
    type: expense.payer === "You" ? "out" : "neutral",
  }));

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans selection:bg-[#A3FDA7]/30">
      <Navbar/>

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-8 flex flex-col gap-8">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <BalanceOverview groups={groups} isLoading={isLoading}/>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <FairnessScore score={selectedGroup?.fairnessScore} insight={selectedGroup?.insights?.[0]}/>
          </div>
          <div className="lg:col-span-2">
            <QuickActions/>
            <div className="mt-8">
              <ActiveGroups groups={groups}/>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentActivity items={recentItems}/>
          <AISuggestion suggestion={suggestion} groupName={suggestionGroup?.name} />
        </div>
      </main>

      <DoodleStrip />
      <ChatBot/>
    </div>
  );
}
