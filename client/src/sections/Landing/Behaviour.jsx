import React from "react";

const ArrowButton = () => (
  <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 transition-all duration-300 group-hover:bg-gray-900 group-hover:text-white">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  </div>
);

const Avatar = ({ initials, color, size = "w-8 h-8" }) => (
  <div className={`${size} rounded-full flex items-center justify-center text-white text-[11px] font-bold ${color}`}>
    {initials}
  </div>
);

export default function Behaviour() {
  return (
    <section className="min-h-screen bg-[#D1FADF] px-5 py-10 lg:py-12 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        
        {/* Header */}
        <div className="mb-8 lg:mb-10">
          <p className="text-[11px] tracking-[0.2em] text-gray-500 mb-4 uppercase font-medium">
            Behavior-Driven Splitting
          </p>
          <h2 className="text-4xl lg:text-5xl font-medium leading-[1.1] text-black max-w-2xl">
            Expenses that adapt to people, not formulas
          </h2>
        </div>

        {/* Bento Grid — single screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">
          
          {/* Card 1: Income Awareness */}
          <div className="group relative bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Income Awareness</h3>
              <p className="text-gray-500 text-base leading-snug max-w-sm">
                Adjusts contributions based on what each person can realistically afford.
              </p>
            </div>

            <div className="flex-1 bg-[#F5F5F7] rounded-2xl p-5 flex flex-col justify-center">
              <div className="space-y-3">
                {[
                  { name: "Jordan", init: "JD", color: "bg-blue-500", income: "$45k", old: "$33.33", new: "$20.00", highlight: true },
                  { name: "Alex", init: "AL", color: "bg-purple-500", income: "$120k", old: "$33.33", new: "$50.00", highlight: false },
                  { name: "Sam", init: "SM", color: "bg-orange-400", income: "$60k", old: "$33.33", new: "$30.00", highlight: false },
                ].map((p) => (
                  <div key={p.name} className="flex items-center justify-between bg-white rounded-xl p-3.5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Avatar initials={p.init} color={p.color} size="w-8 h-8" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                        <p className="text-[11px] text-gray-400">Income: {p.income}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400 line-through">{p.old}</p>
                      <p className={`text-sm font-bold ${p.highlight ? "text-green-600" : "text-gray-900"}`}>{p.new}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg w-fit">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Fairness-adjusted by income
              </div>
            </div>

            <ArrowButton />
          </div>

          {/* Card 2: Participation Tracking */}
          <div className="group relative bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Participation Tracking</h3>
              <p className="text-gray-500 text-base leading-snug max-w-sm">
                Accounts for who actually used or benefited from each expense.
              </p>
            </div>

            <div className="flex-1 bg-[#F5F5F7] rounded-2xl p-5 flex flex-col justify-center">
              <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">Dinner at Bistro</p>
                  <span className="text-sm font-bold text-gray-900">$120</span>
                </div>
                <p className="text-[11px] text-gray-400">Mar 12 • Split among participants</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: "Jordan", init: "JD", color: "bg-blue-500", on: true, amount: "$40" },
                  { name: "Alex", init: "AL", color: "bg-purple-500", on: true, amount: "$40" },
                  { name: "Sam", init: "SM", color: "bg-orange-400", on: false, amount: "$0" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Avatar initials={p.init} color={p.color} size="w-7 h-7" />
                      <span className="text-sm font-medium text-gray-700">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${p.on ? "text-gray-900" : "text-gray-300"}`}>{p.amount}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${p.on ? "bg-green-500" : "bg-gray-200"}`}>
                        {p.on && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ArrowButton />
          </div>

          {/* Card 3: Contribution History */}
          <div className="group relative bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Contribution History</h3>
              <p className="text-gray-500 text-base leading-snug max-w-sm">
                Learns from past payments to maintain long-term balance.
              </p>
            </div>

            <div className="flex-1 bg-[#F5F5F7] rounded-2xl p-5 flex flex-col justify-center">
              <div className="flex items-end justify-between h-20 mb-5 gap-3 px-2">
                {[
                  { month: "Jan", h: "h-6", color: "bg-blue-200" },
                  { month: "Feb", h: "h-10", color: "bg-purple-200" },
                  { month: "Mar", h: "h-14", color: "bg-orange-200" },
                  { month: "Apr", h: "h-9", color: "bg-blue-300" },
                  { month: "May", h: "h-16", color: "bg-purple-300" },
                ].map((b) => (
                  <div key={b.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className={`w-full ${b.h} ${b.color} rounded-t-lg`} />
                    <span className="text-[10px] text-gray-400 font-medium">{b.month}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-gray-600">Group balance maintained</span>
                  </div>
                  <span className="font-bold text-green-600">+12%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-gray-600">Avg. variance reduced</span>
                  </div>
                  <span className="font-bold text-blue-600">-8%</span>
                </div>
              </div>
            </div>

            <ArrowButton />
          </div>

          {/* Card 4: Predictive Balance */}
          <div className="group relative bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Predictive Balance</h3>
              <p className="text-gray-500 text-base leading-snug max-w-sm">
                Suggests who should pay next to keep the group fair.
              </p>
            </div>

            <div className="flex-1 bg-[#F5F5F7] rounded-2xl p-5 flex flex-col justify-center">
              <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-3">Suggested Next Payer</p>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar initials="SM" color="bg-orange-400" size="w-11 h-11" />
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">Sam pays next</p>
                    <p className="text-[11px] text-gray-400">Based on 3-month contribution pattern</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-xl p-3.5 shadow-sm">
                <div className="flex -space-x-2">
                  <Avatar initials="JD" color="bg-blue-500" size="w-6 h-6" />
                  <Avatar initials="AL" color="bg-purple-500" size="w-6 h-6" />
                  <Avatar initials="SM" color="bg-orange-400" size="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-[92%] bg-gradient-to-r from-green-400 to-green-500 rounded-full" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">92%</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-right">Fairness score</p>
            </div>

            <ArrowButton />
          </div>

        </div>
      </div>
    </section>
  );
}