import { Link } from "react-router-dom";
import groupsplit from "../../assets/groupsplit.png";
import shopptense from "../../assets/shopptense.png";

export default function UseCases() {
  return (
    <section className="py-20 px-5 bg-[#F5F5F0]">
      <div className="max-w-7xl mx-auto">
        
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Trips — Large left card (spans 2 rows on lg) */}
          <div className="group relative lg:row-span-2 bg-[#0B3D2E] rounded-[2rem] overflow-hidden flex flex-col">
            <div className="flex-1 p-10 flex flex-col justify-end relative z-10">
              <p className="text-xs tracking-[0.2em] text-emerald-300/70 uppercase mb-4 font-medium">
                Travel
              </p>
              <h3 className="text-4xl font-serif text-white mb-3 leading-tight">
                Trips
              </h3>
              <p className="text-emerald-100/80 text-base leading-relaxed max-w-sm">
                Friends. Different budgets. One shared experience. SplitChill adjusts contributions so no one feels overburdened.
              </p>
            </div>
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=80" 
                alt="Friends hiking mountain trip"
                className="w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B3D2E] via-[#0B3D2E]/60 to-transparent" />
            </div>
          </div>

          {/* Card 2: Shared Living — Top middle */}
          <div className="group relative bg-[#2D3436] rounded-[2rem] overflow-hidden min-h-[320px] flex flex-col">
            <div className="flex-1 p-8 flex flex-col justify-end relative z-10">
              <p className="text-xs tracking-[0.2em] text-gray-400 uppercase mb-3 font-medium">
                Living
              </p>
              <h3 className="text-3xl font-serif text-white mb-2 leading-tight">
                Shared Living
              </h3>
              <p className="text-gray-300/80 text-sm leading-relaxed">
                Rent, groceries, utilities—never equally used. Fair splits based on actual usage and contribution.
              </p>
            </div>
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80" 
                alt="Modern shared apartment living space"
                className="w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D3436] via-[#2D3436]/50 to-transparent" />
            </div>
          </div>

          {/* Card 3: Group Events — Top right */}
          <div className="group relative bg-[#1A1A2E] rounded-[2rem] overflow-hidden min-h-[320px] flex flex-col">
            <div className="flex-1 p-8 flex flex-col justify-end relative z-10">
              <p className="text-xs tracking-[0.2em] text-purple-300/60 uppercase mb-3 font-medium">
                Events
              </p>
              <h3 className="text-3xl font-serif text-white mb-2 leading-tight">
                Group Events
              </h3>
              <p className="text-gray-300/80 text-sm leading-relaxed">
                Some organize. Some just attend. Effort and participation are factored into the split.
              </p>
            </div>
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80" 
                alt="Friends party celebration group event"
                className="w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/50 to-transparent" />
            </div>
          </div>

          {/* Card 4: Ongoing Groups — Bottom middle (with split layout like reference) */}
          <div className="group relative bg-[#E8E6E1] rounded-[2rem] overflow-hidden min-h-[320px] flex flex-col md:flex-row">
            <div className="flex-1 p-8 flex flex-col justify-center relative z-10 md:w-1/2">
              <p className="text-xs tracking-[0.2em] text-gray-500 uppercase mb-3 font-medium">
                Long-term
              </p>
              <h3 className="text-3xl font-serif text-gray-900 mb-2 leading-tight">
                Ongoing Groups
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Balance isn't one moment—it evolves. SplitChill tracks history to keep things fair over time.
              </p>
              <img
                src={groupsplit}
                alt=""
                className="absolute bottom-4 right-4 w-24 h-24 object-contain opacity-85 pointer-events-none"
              />
              <Link to="/blog/groups" className="w-fit px-6 py-3 bg-[#A8E6CF] hover:bg-[#8FD9B6] text-gray-900 text-sm font-medium rounded-full transition-colors duration-300 cursor-pointer">
                Learn More
              </Link>
            </div>
            <div className="md:w-1/2 h-48 md:h-auto relative">
              <img 
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&auto=format&fit=crop&q=80" 
                alt="Team collaboration office meeting"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Card 5: Dining & Outings — Bottom right */}
          <div className="group relative bg-[#2C1810] rounded-[2rem] overflow-hidden min-h-[320px] flex flex-col">
            <div className="flex-1 p-8 flex flex-col justify-end relative z-10">
              <img src={shopptense} alt="" className="absolute top-5 right-5 w-20 h-20 object-contain opacity-85 pointer-events-none" />
              <p className="text-xs tracking-[0.2em] text-orange-300/60 uppercase mb-3 font-medium">
                Dining
              </p>
              <h3 className="text-3xl font-serif text-white mb-2 leading-tight">
                Dining & Outings
              </h3>
              <p className="text-orange-100/70 text-sm leading-relaxed">
                Not everyone orders the same. Pay based on what you actually consumed.
              </p>
            </div>
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80" 
                alt="Friends dining restaurant food table"
                className="w-full h-full object-cover opacity-35 group-hover:opacity-45 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810] via-[#2C1810]/50 to-transparent" />
            </div>
          </div>

          {/* Card 6: Travel Logistics — Full width bottom (spans all columns on lg) */}
          <div className="group relative lg:col-span-3 bg-[#0F1419] rounded-[2rem] overflow-hidden min-h-[280px] flex flex-col md:flex-row">
            <div className="md:w-2/5 h-56 md:h-auto relative">
              <img 
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80" 
                alt="Road trip car travel friends"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="flex-1 p-10 flex flex-col justify-center relative z-10">
              <p className="text-xs tracking-[0.2em] text-blue-300/60 uppercase mb-4 font-medium">
                Logistics
              </p>
              <h3 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight">
                Travel Logistics
              </h3>
              <p className="text-gray-300/80 text-lg leading-relaxed max-w-lg">
                Tickets, bookings, planning—shared unevenly. Costs reflect who contributed and benefited.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                  </svg>
                </div>
                <span className="text-sm text-blue-300/80 font-medium">Smart cost tracking</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
