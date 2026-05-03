export default function SplitChillWork() {
  return (
    <section className="relative min-h-screen bg-[#F5F5F0] text-black flex items-center justify-center px-6">

      {/* Content Container */}
      <div className="max-w-6xl mx-auto text-center">

        {/* TOP STATEMENT */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif leading-[1.1] tracking-tight">
            Splitting expenses was never the problem.
          </h1>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-600">
            Fairness was.
          </h2>
        </div>

        {/* DIVIDER (SUBTLE BRAND MOMENT) */}
        <div className="my-16 flex justify-center">
          <div className="w-24 h-[2px] bg-[#A3FDA7] opacity-70" />
        </div>

        {/* BOTTOM STATEMENT */}
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif leading-[1.1] tracking-tight">
            Most apps divide equally.
          </h2>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-medium text-black/80">
            SplitChill understands people.
          </h3>
        </div>

      </div>

      {/* SUBTLE BACKGROUND GLOW */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#A3FDA7]/20 blur-3xl opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#A3FDA7]/20 blur-3xl opacity-20" />
      </div>

    </section>
  );
}