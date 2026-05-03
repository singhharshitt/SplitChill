import React from "react";

// ── Mint check icon ──
const MintCheck = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Avatar ──
const Avatar = ({ initials, color, size = "w-8 h-8" }) => (
  <div className={`${size} rounded-full flex items-center justify-center text-white text-[10px] font-semibold ${color} select-none flex-shrink-0`}>
    {initials}
  </div>
);

// ── Eyebrow label ──
const Eyebrow = ({ children, light = false }) => (
  <p className={`text-[10px] tracking-[0.22em] uppercase font-semibold mb-3 ${light ? "text-[#A3FDA7]" : "text-[#6B7280]"}`}>
    {children}
  </p>
);

export default function Behaviour() {
  return (
    <section
      className="min-h-screen px-5 py-16 lg:py-20 flex flex-col relative overflow-hidden"
      style={{ backgroundColor: "#F5F5F0" }}
    >
      {/* Ambient mint glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 w-[700px] h-[700px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(163,253,167,0.11) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      <div className="max-w-7xl mx-auto w-full flex flex-col relative z-10">

        {/* ── Header ── */}
        <div className="mb-10 lg:mb-12">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#A3FDA7]" />
            <p className="text-[11px] tracking-[0.18em] text-[#6B7280] uppercase font-medium">
              Behavior-Driven Splitting
            </p>
          </div>
          <h2
            className="text-4xl lg:text-5xl leading-[1.12] text-black max-w-2xl"
            style={{ fontFamily: "'Georgia', 'Playfair Display', serif", fontWeight: 500 }}
          >
            Expenses that adapt to{" "}
            <span style={{ color: "#2a7a3b" }}>people</span>,<br />
            not formulas.
          </h2>
        </div>

        {/* ── Bento Grid ── */}
        {/*
          Layout (mirrors screenshot):
          [   Income Awareness (tall)   ] [ Participation ] [ Contribution ]
          [          (full h)           ] [  Predictive Balance (wide split) ]
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-4">

          {/* ─────────────────────────────────────────
              LEFT: Income Awareness — tall image card
          ───────────────────────────────────────── */}
          <div className="group relative rounded-[28px] overflow-hidden min-h-[520px] lg:min-h-[640px]">
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80"
              alt="Friends splitting expenses on a trip"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(to top, rgba(5,20,10,0.88) 0%, rgba(5,20,10,0.35) 50%, rgba(5,20,10,0.08) 100%)"
            }} />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-8 lg:p-10">
              <Eyebrow light>Income Awareness</Eyebrow>
              <h3
                className="text-3xl lg:text-[2.25rem] font-medium text-white leading-[1.1] mb-3"
                style={{ fontFamily: "'Georgia', 'Playfair Display', serif" }}
              >
                Income Awareness
              </h3>
              <p className="text-white/65 text-sm leading-relaxed max-w-xs mb-5">
                Adjusts contributions based on what each person can realistically afford.
              </p>

              {/* Mini income rows — glass style */}
              <div className="space-y-2">
                {[
                  { name: "Jordan", income: "$45k", old: "$33.33", new: "$20.00", highlight: true },
                  { name: "Alex",   income: "$120k", old: "$33.33", new: "$50.00", highlight: false },
                  { name: "Sam",    income: "$60k",  old: "$33.33", new: "$30.00", highlight: false },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 border border-white/10"
                    style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
                  >
                    <div>
                      <p className="text-xs font-medium text-white leading-tight">{p.name}</p>
                      <p className="text-[10px] text-white/45">Income: {p.income}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/25 line-through">{p.old}</p>
                      <p className={`text-sm font-semibold ${p.highlight ? "text-[#A3FDA7]" : "text-white"}`}>
                        {p.new}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mint fairness badge */}
              <div
                className="mt-4 inline-flex items-center gap-1.5 text-[#A3FDA7] text-[10px] font-semibold px-3 py-1.5 rounded-lg w-fit border border-[#A3FDA7]/25"
                style={{ background: "rgba(163,253,167,0.12)" }}
              >
                <MintCheck size={9} />
                Fairness-adjusted by income
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────
              RIGHT: 2×2 inner grid
          ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Card 2: Participation Tracking — image card */}
            <div className="group relative rounded-[28px] overflow-hidden min-h-[280px]">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"
                alt="Restaurant dinner table"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to top, rgba(10,25,15,0.85) 0%, rgba(10,25,15,0.2) 60%, transparent 100%)"
              }} />
              <div className="relative h-full flex flex-col justify-end p-7">
                <Eyebrow light>Participation</Eyebrow>
                <h3
                  className="text-xl lg:text-2xl font-medium text-white leading-[1.1] mb-2"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  Participation Tracking
                </h3>
                <p className="text-white/60 text-xs leading-relaxed mb-3">
                  Only the people who actually showed up contribute.
                </p>
                {/* Participant pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { name: "Jordan", on: true },
                    { name: "Alex",   on: true },
                    { name: "Sam",    on: false },
                  ].map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border border-white/10"
                      style={{ background: "rgba(255,255,255,0.09)", backdropFilter: "blur(6px)" }}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${p.on ? "bg-[#A3FDA7] text-[#1a5c27]" : "bg-white/20"}`}>
                        {p.on && <MintCheck size={7} />}
                      </div>
                      <span className={`text-[10px] font-medium ${p.on ? "text-white" : "text-white/40"}`}>{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3: Contribution History — image card */}
            <div className="group relative rounded-[28px] overflow-hidden min-h-[280px]">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                alt="Analytics dashboard on screen"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to top, rgba(8,20,12,0.88) 0%, rgba(8,20,12,0.25) 55%, transparent 100%)"
              }} />
              <div className="relative h-full flex flex-col justify-end p-7">
                <Eyebrow light>Long-term</Eyebrow>
                <h3
                  className="text-xl lg:text-2xl font-medium text-white leading-[1.1] mb-2"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  Contribution History
                </h3>
                <p className="text-white/60 text-xs leading-relaxed mb-3">
                  Learns from past payments to maintain long-term balance.
                </p>
                {/* Mini bar chart */}
                <div className="flex items-end gap-1.5 h-9 mb-2">
                  {[
                    { h: "30%", hi: false },
                    { h: "50%", hi: false },
                    { h: "70%", hi: false },
                    { h: "45%", hi: false },
                    { h: "90%", hi: true  },
                  ].map((b, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: b.h,
                        background: b.hi ? "#A3FDA7" : "rgba(255,255,255,0.18)",
                        alignSelf: "flex-end",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A3FDA7] flex-shrink-0" />
                  <span className="text-[10px] text-white/55">Group balance +12% this month</span>
                </div>
              </div>
            </div>

            {/* Card 4: Predictive Balance — SPLIT card (white + image) */}
            <div className="sm:col-span-2 group relative rounded-[28px] overflow-hidden bg-white border border-black/[0.04] shadow-sm flex min-h-[230px]">

              {/* Left: white panel with text + UI */}
              <div className="flex-1 p-7 lg:p-8 flex flex-col justify-between z-10 min-w-0">
                <div>
                  <Eyebrow>Predictive</Eyebrow>
                  <h3
                    className="text-xl lg:text-2xl font-medium text-black leading-[1.1] mb-2"
                    style={{ fontFamily: "'Georgia', 'Playfair Display', serif" }}
                  >
                    Predictive Balance
                  </h3>
                  <p className="text-[#6B7280] text-xs leading-relaxed max-w-[210px]">
                    Suggests who should pay next to keep the group naturally fair.
                  </p>
                </div>

                {/* Suggested payer */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-3 bg-[#FAFAF8] rounded-xl px-3.5 py-3 border border-black/[0.04]">
                    <div className="relative flex-shrink-0">
                      <Avatar initials="SM" color="bg-[#9CA3AF]" size="w-9 h-9" />
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#A3FDA7] rounded-full flex items-center justify-center border-2 border-white text-[#1a5c27]">
                        <MintCheck size={7} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-black">Sam pays next</p>
                      <p className="text-[10px] text-[#9CA3AF]">Based on 3-month contribution pattern</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-[#FAFAF8] rounded-xl px-3.5 py-2.5 border border-black/[0.04]">
                    <div className="flex -space-x-1.5 flex-shrink-0">
                      <Avatar initials="JD" color="bg-[#9CA3AF]" size="w-5 h-5" />
                      <Avatar initials="AL" color="bg-[#6B7280]" size="w-5 h-5" />
                      <Avatar initials="SM" color="bg-[#D1D5DB]" size="w-5 h-5" />
                    </div>
                    <div className="flex-1 h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: "92%", background: "linear-gradient(to right, #A3FDA7, #7CF29A)" }} />
                    </div>
                    <span className="text-[10px] font-semibold text-black flex-shrink-0">92%</span>
                    <span className="text-[9px] text-[#9CA3AF] flex-shrink-0">fairness</span>
                  </div>
                </div>
              </div>

              {/* Right: image panel */}
              <div className="relative w-[42%] flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                  alt="Team collaborating together"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                {/* Fade from white on the left edge */}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.1) 30%, transparent 60%)" }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}