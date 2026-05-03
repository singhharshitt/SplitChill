import ChatBot from "../context/Chatbot";
import hero from "../assets/hero.png";
import RecentActivity from "../sections/Dashboard/RecentActivity";
import ActiveGroups from "../sections/Dashboard/ActiveGroups";
import QuickActions from "../sections/Dashboard/QuickActions";
import FairnessScore from "../sections/Dashboard/FairnessScore";
import BalanceOverview from "../sections/Dashboard/BalanceOverview";
import AISuggestion from "../sections/Dashboard/AISuggestion";


function DoodleStrip() {
  return (
    <div className="relative w-full mt-8">
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#F5F5F0] to-transparent z-10 pointer-events-none" />
      <img
        src={hero}
        alt="A living ecosystem of shared life"
        className="w-full h-[220px] object-cover block opacity-90"
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans selection:bg-[#A3FDA7]/30">
      {/* Optional subtle top nav placeholder */}
      <nav className="max-w-6xl mx-auto px-6 pt-8 pb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-black tracking-tight">SplitChill</h1>
        <div className="w-8 h-8 rounded-full bg-black/5" />
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        <BalanceOverview/>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <FairnessScore/>
          </div>
          <div className="lg:col-span-2">
            <QuickActions/>
            <div className="mt-8">
              <ActiveGroups/>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentActivity/>
          <AISuggestion />
        </div>
      </main>

      <DoodleStrip />
      <ChatBot/>
    </div>
  );
}
