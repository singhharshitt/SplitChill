// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// ── Refined Glass Card — softer, less heavy ──
const GlassCard = ({ children, className = "" }) => (
  <div className={`relative group ${className}`}>
    {/* Hover glow — reduced opacity, mint-tinted */}
    <div className="absolute -inset-[1px] rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
      style={{ background: "radial-gradient(ellipse, rgba(163,253,167,0.12) 0%, transparent 70%)" }}
    />
    <div
      className="relative rounded-[24px] p-6 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.035)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "0.5px solid rgba(255,255,255,0.09)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  </div>
);

// ── Eyebrow — consistent micro-label ──
const Eyebrow = ({ children }) => (
  <p className="text-[9px] tracking-[0.28em] uppercase font-semibold mb-4"
    style={{ color: "rgba(163,253,167,0.55)" }}>
    {children}
  </p>
);

// ── Mint dot indicator ──
const LiveDot = () => (
  <span className="relative flex h-1.5 w-1.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
      style={{ background: "#A3FDA7" }} />
    <span className="relative inline-flex rounded-full h-1.5 w-1.5"
      style={{ background: "#A3FDA7" }} />
  </span>
);

export default function VisualProof() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Parallax — unchanged
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [40, -80]);
  const y3 = useTransform(scrollYProgress, [0, 1], [80, -40]);
  const y4 = useTransform(scrollYProgress, [0, 1], [50, -70]);

  const circleCircumference = 2 * Math.PI * 36;

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden py-20 lg:py-0"
      style={{ background: "#06100D" }}
    >
      {/* ── Background atmosphere — softer, fewer blobs ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(163,253,167,0.055) 0%, transparent 65%)", filter: "blur(80px)" }}
        />
        {/* Subtle top-right */}
        <div className="absolute top-[15%] right-[18%] w-[280px] h-[280px] rounded-full"
          style={{ background: "rgba(163,253,167,0.035)", filter: "blur(90px)" }}
        />
      </div>

      {/* ── Very subtle grain texture overlay ── */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "180px" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:h-screen lg:flex lg:items-center lg:justify-center">

        {/* ── Center Text — improved typography ── */}
        <div className="text-center lg:absolute lg:inset-0 lg:flex lg:flex-col lg:items-center lg:justify-center z-10 mb-16 lg:mb-0 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 mb-7"
          >
            <LiveDot />
            <span className="text-[9px] tracking-[0.28em] uppercase font-semibold"
              style={{ color: "rgba(163,253,167,0.55)" }}>
              Real-Time Fairness
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl leading-[1.06] text-white"
            style={{ fontFamily: "'Georgia', 'Playfair Display', serif", fontWeight: 500, letterSpacing: "-0.02em" }}
          >
            See how balance<br />evolves
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-5 text-base md:text-lg max-w-sm mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            Every decision, every contribution—<br />reflected instantly.
          </motion.p>
        </div>

        {/* ── Floating Cards ── */}
        <div className="relative lg:absolute lg:inset-0 w-full h-full z-20">

          {/* ── 1. Fairness Score ── */}
          <motion.div
            style={{ y: y1 }}
            className="lg:absolute lg:top-[12%] lg:left-[5%] w-full lg:w-[268px] mb-6 lg:mb-0"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <GlassCard>
                <Eyebrow>Fairness Score</Eyebrow>

                <div className="flex flex-col items-center">
                  {/* Ring — unchanged animation, refined colors */}
                  <div className="relative w-[108px] h-[108px]">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36"
                        stroke="rgba(255,255,255,0.05)" strokeWidth="5" fill="none" />
                      <motion.circle
                        cx="40" cy="40" r="36"
                        stroke="#A3FDA7" strokeWidth="5" fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circleCircumference}
                        initial={{ strokeDashoffset: circleCircumference }}
                        whileInView={{ strokeDashoffset: circleCircumference * (1 - 0.94) }}
                        viewport={{ once: true }}
                        transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1.5 }}
                        className="text-[28px] font-semibold text-white leading-none"
                      >
                        94%
                      </motion.span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <LiveDot />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Group is well balanced
                    </span>
                  </div>
                </div>

                {/* Subtle bottom rule */}
                <div className="mt-5 pt-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>Last recalculated</span>
                    <span style={{ color: "rgba(163,253,167,0.6)" }}>Just now</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* ── 2. Contribution Balance ── */}
          <motion.div
            style={{ y: y2 }}
            className="lg:absolute lg:top-[8%] lg:right-[6%] w-full lg:w-[300px] mb-6 lg:mb-0"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <GlassCard>
                <Eyebrow>Contribution Balance</Eyebrow>

                <div className="space-y-4">
                  {[
                    { name: "Jordan", val: 92, label: "Balanced", accent: true },
                    { name: "Alex",   val: 45, label: "Under",    accent: false },
                    { name: "Sam",    val: 58, label: "Balanced", accent: false },
                  ].map((p, i) => (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {p.name}
                        </span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 1 + i * 0.2 }}
                          className="text-[10px] font-medium"
                          style={{ color: p.accent ? "rgba(163,253,167,0.7)" : "rgba(255,255,255,0.25)" }}
                        >
                          {p.label}
                        </motion.span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.05)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: p.accent
                              ? "linear-gradient(to right, #A3FDA7, #7CF29A)"
                              : "rgba(255,255,255,0.18)"
                          }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p.val}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.8 + i * 0.2, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 flex items-center justify-between"
                  style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Variance</span>
                  <span className="text-[10px] font-semibold" style={{ color: "#A3FDA7" }}>Low · within threshold</span>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* ── 3. Smart Suggestion ── */}
          <motion.div
            style={{ y: y3 }}
            className="lg:absolute lg:bottom-[12%] lg:left-[7%] w-full lg:w-[268px] mb-6 lg:mb-0"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <GlassCard>
                <Eyebrow>Smart Suggestion</Eyebrow>

                <div className="flex items-center gap-3.5 mb-5">
                  <div className="relative flex-shrink-0">
                    {/* Avatar — desaturated, cleaner */}
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.12)" }}>
                      M
                    </div>
                    <motion.div
                      className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                      style={{ background: "#A3FDA7", borderColor: "#06100D" }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white leading-tight">Maya should pay next</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Keeps the group fair
                    </p>
                  </div>
                </div>

                {/* AI badge — calmer, on-brand */}
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: "rgba(163,253,167,0.07)",
                    border: "0.5px solid rgba(163,253,167,0.18)"
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 0px rgba(163,253,167,0)",
                      "0 0 16px rgba(163,253,167,0.1)",
                      "0 0 0px rgba(163,253,167,0)",
                    ],
                  }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="#A3FDA7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                  </svg>
                  <span className="text-[10px] font-semibold" style={{ color: "rgba(163,253,167,0.75)" }}>
                    AI Suggested · Based on 90 days
                  </span>
                </motion.div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* ── 4. Conflict Detection ── */}
          <motion.div
            style={{ y: y4 }}
            className="lg:absolute lg:bottom-[8%] lg:right-[5%] w-full lg:w-[300px]"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              <GlassCard>
                {/* Alert header */}
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(251,191,36,0.08)", border: "0.5px solid rgba(251,191,36,0.18)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white leading-tight">Imbalance detected</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Road Trip · 3 members</p>
                  </div>
                </div>

                {/* Debt row */}
                <div className="rounded-xl p-4 mb-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Alex owes</span>
                    <span className="text-base font-semibold text-white">$24.50</span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden mb-1"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(to right, #fbbf24, #f59e0b)" }}
                      initial={{ width: 0 }}
                      whileInView={{ width: "65%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                  </div>
                  <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>65% of group threshold</p>
                </div>

                {/* CTA — upgraded */}
                <button
                  className="w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  }}
                >
                  Resolve Now →
                </button>
              </GlassCard>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}