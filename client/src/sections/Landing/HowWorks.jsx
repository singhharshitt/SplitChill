"use client";

// eslint-disable-next-line no-unused-vars
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Plus, Brain, Scale, HeartHandshake } from "lucide-react";

// ── Module-level variants (accessible everywhere) ──
const lineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 2.8, ease: "easeInOut" }  // slightly faster, calmer feel
  }
};

const nodeVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" }    // snappier, less "tech demo"
  }
};

const labelVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

// ── Helper Component ──
function StepNode({ top, left, icon, title, subtitle, color, bgColor, delay }) {
  return (
    <motion.div
      variants={nodeVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ delay: delay * 0.8 + 0.5 }}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 group"
      style={{ top, left }}
    >
      {/* Icon Circle — cleaned up, premium feel */}
      <motion.div
        whileHover={{ scale: 1.07 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          relative z-20 p-4 rounded-full
          bg-white
          border border-black/5
          shadow-sm
          ${bgColor}
          transition-shadow duration-300
          group-hover:shadow-md
        `}
      >
        <div className={color}>
          {icon}
        </div>
        {/* Soft mint ambient glow — replaces animate-ping */}
        <div className="absolute inset-0 rounded-full bg-[#A3FDA7] opacity-0 group-hover:opacity-10 blur-md transition-opacity duration-500 -z-10 scale-150" />
      </motion.div>

      {/* Text Label */}
      <motion.div
        variants={labelVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ delay: delay * 0.8 + 0.7 }}
        className="text-center whitespace-nowrap"
      >
        {/* Serif heading, no uppercase shouting */}
        <h4
          className="text-[#111111] font-semibold text-sm md:text-[15px] mb-1"
          style={{ fontFamily: "'Georgia', 'Playfair Display', serif", letterSpacing: "0.01em" }}
        >
          {title}
        </h4>
        {/* Always visible subtitle — subtle, not hidden */}
        <p className="text-[#6B7280] text-xs md:text-sm font-normal opacity-70 transition-opacity duration-300 group-hover:opacity-100">
          {subtitle}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function HowWorks() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-10% 0px -10% 0px" });

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen overflow-hidden flex flex-col items-center justify-center py-28 px-6 md:px-12"
      style={{ backgroundColor: "#F5F5F0" }}
    >

      {/* Ambient mint glow — background atmosphere, very subtle */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-100 rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(163,253,167,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* --- Header Content --- */}
      <div className="relative z-10 text-center max-w-3xl mb-20 space-y-5">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl tracking-tight text-black leading-[1.15]"
          style={{ fontFamily: "'Georgia', 'Playfair Display', serif", fontWeight: 600 }}
        >
          From expense to fairness{" "}
          <span style={{ color: "#2a7a3b" }}>automatically</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-base md:text-lg max-w-xl mx-auto leading-relaxed"
          style={{ color: "#6B7280" }}
        >
          No manual adjustments. No awkward conversations. Just intelligent balance.
        </motion.p>
      </div>

      {/* --- Cinematic Flow Visualization --- */}
      <div className="relative w-full max-w-6xl h-96 md:h-125">

        <svg
          viewBox="0 0 1000 400"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full absolute inset-0"
        >
          <defs>
            {/* Gradient: neutral warm → mint — removes harsh red */}
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#C4B8A8" />
              <stop offset="40%"  stopColor="#9DBFA5" />
              <stop offset="100%" stopColor="#A3FDA7" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.path
            d="M 50,200 C 250,200 250,50 450,50 C 650,50 650,350 850,350 C 950,350 950,200 1050,200"
            fill="none"
            stroke="url(#flowGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
            variants={lineVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          />
        </svg>

        <StepNode
          index={0}
          delay={0}
          top="50%" left="5%"
          icon={<Plus size={22} />}
          title="Add an expense"
          subtitle="Upload receipt or enter cost"
          color="text-black/70"
          bgColor=""
        />

        <StepNode
          index={1}
          delay={1}
          top="12%" left="45%"
          icon={<Brain size={22} />}
          title="SplitChill analyzes"
          subtitle="AI reads who paid vs. who consumed"
          color="text-black/70"
          bgColor=""
        />

        <StepNode
          index={2}
          delay={2}
          top="88%" left="85%"
          icon={<Scale size={22} />}
          title="Fairness calculated"
          subtitle="Not equal split. Smart split."
          color="text-[#2a7a3b]"
          bgColor=""
        />

        {/* Step 4: Balance Restored — mint accent for outcome */}
        <StepNode
          index={3}
          delay={3}
          top="50%" left="95%"
          icon={<HeartHandshake size={22} />}
          title="Balance restored"
          subtitle="Everyone pays their fair share"
          color="text-[#2a7a3b]"
          bgColor=""
        />

      </div>
    </section>
  );
}

