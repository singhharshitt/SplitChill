import { useRef } from "react";

const cards = [
  {
    id: 1,
    label: "The Silent Overpayer",
    quote: "I paid again… but didn't say anything.",
    body: "One person keeps covering more than their share. SplitChill makes imbalance visible—before resentment builds.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
    accent: "#0B3D2E",
  },
  {
    id: 2,
    label: "The \"Let's Just Split Equally\" Moment",
    quote: "It's fine… we'll just divide it.",
    body: "Equal feels easy—but not always fair. SplitChill replaces convenience with accuracy.",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop&q=80",
    accent: "#2D3436",
  },
  {
    id: 3,
    label: "The Awkward Reminder",
    quote: "Hey… you still owe me.",
    body: "Chasing payments shouldn't be uncomfortable. SplitChill handles it without friction.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    accent: "#1A1A2E",
  },
  {
    id: 4,
    label: "The Hidden Effort",
    quote: "I planned everything, but paid the same.",
    body: "Time, effort, and coordination matter too. SplitChill factors in more than just money.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    accent: "#2C1810",
  },
  {
    id: 5,
    label: "The Imbalance You Notice Too Late",
    quote: "Wait… I think I've paid way more.",
    body: "By the time you realize, it's already awkward. SplitChill tracks fairness in real time.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80",
    accent: "#0F1419",
  },
  {
    id: 6,
    label: "The Group Drift",
    quote: "It was fair at first… now it's not.",
    body: "Fairness changes over time. SplitChill continuously rebalances the group.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80",
    accent: "#1B1B2F",
  },
];

export default function UnspokenMoments() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -420 : 420;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="py-24 bg-[#F5F5F0] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <p className="text-[11px] tracking-[0.3em] text-gray-500 uppercase mb-4 font-medium">
          Unspoken Moments
        </p>
        <h2 className="text-5xl md:text-6xl font-serif text-black leading-[1.05] max-w-2xl">
          Where fairness quietly breaks
        </h2>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto px-6 pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className="group relative flex-shrink-0 w-[380px] md:w-[480px] snap-start"
            >
              <div className="relative bg-[#2D3436] rounded-[2rem] overflow-hidden flex flex-col md:flex-row h-[420px] md:h-[380px]">
                
                {/* Image Side */}
                <div className="md:w-[45%] h-48 md:h-full relative overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#2D3436]/80 md:bg-gradient-to-r md:from-transparent md:to-[#2D3436]" />
                </div>

                {/* Content Side */}
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-center relative z-10">
                  <p className="text-[10px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-semibold">
                    {card.label}
                  </p>
                  
                  <blockquote className="text-2xl md:text-[1.75rem] font-serif text-white leading-snug mb-4">
                    "{card.quote}"
                  </blockquote>
                  
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    {card.body}
                  </p>

                  <button className="w-fit px-6 py-3 bg-[#A8E6CF] hover:bg-[#8FD9B6] text-gray-900 text-sm font-medium rounded-full transition-colors duration-300 cursor-pointer">
                    See how
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll Arrows */}
        <div className="hidden md:flex items-center justify-end gap-3 mt-8 px-6 max-w-7xl mx-auto">
          <button
            onClick={() => scroll("left")}
            className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}