export default function SplitChillWork() {
  return (
    <section className="relative min-h-screen bg-white  text-black overflow-hidden mt-5">
      {/* Subtle background accents */}

      {/* Top Left Block */}
      <div className="absolute top-8 left-6 md:top-16 md:left-16 max-w-4xl space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight  drop-shadow-lg">
          Splitting expenses was never the problem.
        </h1>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium ">
          Fairness was.
        </h2>
      </div>

      {/* Bottom Right Block */}
      <div className="absolute bottom-8 right-6 md:bottom-16 md:right-16 max-w-2xl text-right space-y-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight drop-shadow-lg">
          Most apps divide equally.
        </h2>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-medium text-emerald-400">
          SplitChill understands people.
        </h3>
      </div>

      {/* Optional subtle divider / brand hint */}
      
    </section>
  )
}