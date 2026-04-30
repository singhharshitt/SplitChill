export default function Metrices() {
  return (
    <section className="py-32 bg-[#F5F5F0] text-center">
      {/* Small top label */}
      <p className="text-xs tracking-[0.2em] text-gray-500 uppercase mb-6 font-medium">
        Fairness, quantified differently
      </p>

      {/* Headline */}
      <h2 className="text-5xl md:text-6xl font-serif mb-16 max-w-4xl mx-auto leading-tight text-black">
        A smarter way to stay balanced
      </h2>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto px-6">
        
        {/* Card 1 */}
        <div className="group">
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
            🔢
          </div>
          <h3 className="text-3xl font-serif text-black">0–100 score</h3>
          <p className="text-gray-500 mt-2 text-base leading-relaxed">
            Measure how balanced your group really is
          </p>
        </div>

        {/* Card 2 */}
        <div className="group">
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
            📊
          </div>
          <h3 className="text-3xl font-serif text-black">Dynamic adjustments</h3>
          <p className="text-gray-500 mt-2 text-base leading-relaxed">
            Splits evolve as behavior changes
          </p>
        </div>

        {/* Card 3 */}
        <div className="group">
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
            🧠
          </div>
          <h3 className="text-3xl font-serif text-black">Continuous learning</h3>
          <p className="text-gray-500 mt-2 text-base leading-relaxed">
            Gets smarter with every expense
          </p>
        </div>

      </div>
    </section>
  );
}