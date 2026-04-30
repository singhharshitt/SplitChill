import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const GlassCard = ({ children, className = "" }) => (
  <div className={`relative group ${className}`}>
    {/* Teal glow on hover */}
    <div className="absolute -inset-[1px] bg-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl shadow-black/20 overflow-hidden">
      {children}
    </div>
  </div>
);

export default function VisualProof() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Parallax speeds for each card
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [40, -80]);
  const y3 = useTransform(scrollYProgress, [0, 1], [80, -40]);
  const y4 = useTransform(scrollYProgress, [0, 1], [50, -70]);

  const circleCircumference = 2 * Math.PI * 36;

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-[#050a09] overflow-hidden py-20 lg:py-0"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-500/[0.07] rounded-full blur-[150px]" />
      <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-teal-400/[0.05] rounded-full blur-[100px]" />
      <div className="absolute bottom-[20%] left-[15%] w-[250px] h-[250px] bg-emerald-500/[0.05] rounded-full blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-6 lg:h-screen lg:flex lg:items-center lg:justify-center">
        {/* Center Text */}
        <div className="text-center lg:absolute lg:inset-0 lg:flex lg:flex-col lg:items-center lg:justify-center z-10 mb-16 lg:mb-0 pointer-events-none">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-[11px] tracking-[0.3em] text-teal-400 uppercase mb-6 font-medium"
          >
            Real-Time Fairness
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-[1.05] max-w-3xl"
          >
            See how balance evolves
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-gray-400 text-lg md:text-xl max-w-md mx-auto leading-relaxed"
          >
            Every decision, every contribution—reflected instantly.
          </motion.p>
        </div>

        {/* Floating Cards */}
        <div className="relative lg:absolute lg:inset-0 w-full h-full z-20">
          
          {/* 1. Fairness Score */}
          <motion.div
            style={{ y: y1 }}
            className="lg:absolute lg:top-[12%] lg:left-[6%] w-full lg:w-72 mb-6 lg:mb-0"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <GlassCard>
                <p className="text-[10px] tracking-wider text-gray-500 uppercase mb-5 font-semibold">
                  Fairness Score
                </p>
                <div className="flex flex-col items-center">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="6"
                        fill="none"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="#2dd4bf"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circleCircumference}
                        initial={{ strokeDashoffset: circleCircumference }}
                        whileInView={{ strokeDashoffset: circleCircumference * (1 - 0.94) }}
                        viewport={{ once: true }}
                        transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 1.5 }}
                        className="text-3xl font-bold text-white"
                      >
                        94%
                      </motion.span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                    <span className="text-sm text-gray-300">
                      Group is well balanced
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* 2. Contribution Imbalance */}
          <motion.div
            style={{ y: y2 }}
            className="lg:absolute lg:top-[8%] lg:right-[8%] w-full lg:w-80 mb-6 lg:mb-0"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <GlassCard>
                <p className="text-[10px] tracking-wider text-gray-500 uppercase mb-5 font-semibold">
                  Contribution Balance
                </p>
                <div className="space-y-4">
                  {[
                    { name: "Jordan", val: 92, color: "bg-teal-400", glow: "shadow-[0_0_12px_rgba(45,212,191,0.4)]" },
                    { name: "Alex", val: 45, color: "bg-gray-600", glow: "" },
                    { name: "Sam", val: 58, color: "bg-gray-600", glow: "" },
                  ].map((p, i) => (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-400 font-medium">
                          {p.name}
                        </span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 1 + i * 0.2 }}
                          className="text-xs text-gray-500"
                        >
                          {p.val > 70 ? "Over" : p.val < 50 ? "Under" : "Balanced"}
                        </motion.span>
                      </div>
                      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${p.color} ${p.glow}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p.val}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.8 + i * 0.2, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-500">
                  <span>Variance</span>
                  <span className="text-teal-400 font-semibold">Low</span>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* 3. Smart Suggestion */}
          <motion.div
            style={{ y: y3 }}
            className="lg:absolute lg:bottom-[12%] lg:left-[8%] w-full lg:w-72 mb-6 lg:mb-0"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <GlassCard>
                <p className="text-[10px] tracking-wider text-gray-500 uppercase mb-4 font-semibold">
                  Smart Suggestion
                </p>
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      M
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full border-2 border-[#050a09]"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      Maya should pay next
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Keeps the group fair
                    </p>
                  </div>
                </div>
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-400/20 rounded-full"
                  animate={{
                    boxShadow: [
                      "0 0 0px rgba(45,212,191,0)",
                      "0 0 20px rgba(45,212,191,0.15)",
                      "0 0 0px rgba(45,212,191,0)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                  </svg>
                  <span className="text-[11px] font-semibold text-teal-300">
                    AI Suggested
                  </span>
                </motion.div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* 4. Conflict Detection */}
          <motion.div
            style={{ y: y4 }}
            className="lg:absolute lg:bottom-[8%] lg:right-[6%] w-full lg:w-80"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              <GlassCard>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-200">
                      Imbalance detected
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Road Trip group</p>
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Alex owes</span>
                    <span className="text-sm font-bold text-white">$24.50</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mb-3">
                    <motion.div
                      className="h-full bg-amber-400 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "65%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                  </div>
                  <button className="w-full py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-xs font-medium text-gray-300 transition-colors cursor-pointer">
                    Resolve Now
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}