"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Plus, Brain, Scale, HeartHandshake } from "lucide-react";

// ── Module-level variants (accessible everywhere) ──
const lineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1, 
    transition: { duration: 3.5, ease: "easeInOut" } 
  }
};

const nodeVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const labelVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

// ── Helper Component (defined outside to avoid scope issues) ──
function StepNode({ index, top, left, icon, title, subtitle, color, bgColor, delay }) {
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
      {/* Icon Circle */}
      <div className={`relative z-20 p-4 rounded-full ${bgColor} border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-110`}>
        <div className={`${color}`}>
          {icon}
        </div>
        {/* Pulse Effect */}
        <div className={`absolute inset-0 rounded-full ${bgColor} animate-ping opacity-20`} />
      </div>

      {/* Text Label */}
      <motion.div 
        variants={labelVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ delay: delay * 0.8 + 0.7 }}
        className="text-center whitespace-nowrap"
      >
        <h4 className="text-[#0B0B0B] font-semibold text-sm md:text-base tracking-wide uppercase mb-1">
          {title}
        </h4>
        <p className="text-[#0B0B0B] text-xs md:text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
      className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col items-center justify-center py-24 px-6 md:px-12"
    >
     
      {/* --- Header Content --- */}
      <div className="z-10 text-center max-w-4xl mb-16 space-y-6">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-7xl font-bold tracking-tight text-black"
        >
          From expense to fairness <span className="text-[#A3FDA7]">automatically</span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed"
        >
          No manual adjustments. No awkward conversations. Just intelligent balance.
        </motion.p>
      </div>

      {/* --- Cinematic Flow Visualization --- */}
      <div className="relative w-full max-w-6xl h-96 md:h-[500px]">
        
        {/* SVG Path Container */}
        <svg 
          viewBox="0 0 1000 400" 
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full absolute inset-0 drop-shadow-[0_0_15px_rgba(163,253,167,0.15)]"
        >
          <defs>
            {/* Gradient from Red (Problem) to Mint (Solution) */}
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6D001A" />
              <stop offset="30%" stopColor="#A1123C" />
              <stop offset="60%" stopColor="#7CF29A" />
              <stop offset="100%" stopColor="#A3FDA7" />
            </linearGradient>
            
            {/* Glow Filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* The Wavy Path */}
          <motion.path
            d="M 50,200 C 250,200 250,50 450,50 C 650,50 650,350 850,350 C 950,350 950,200 1050,200"
            fill="none"
            stroke="url(#flowGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#glow)"
            variants={lineVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          />
        </svg>

        {/* --- Step Nodes & Labels --- */}
        
        {/* Step 1: Add Expense (Left) */}
        <StepNode 
          index={0}
          delay={0}
          top="50%" left="5%" 
          icon={<Plus size={24} />} 
          title="Add an expense" 
          subtitle="Upload receipt or enter cost"
          color="text-[#A1123C]" 
          bgColor="bg-[#6D001A]/20"
        />

        {/* Step 2: SplitChill Analyzes (Top Peak) */}
        <StepNode 
          index={1}
          delay={1}
          top="12%" left="45%" 
          icon={<Brain size={24} />} 
          title="SplitChill analyzes" 
          subtitle="AI reads who paid vs. who consumed"
          color="text-[#A3FDA7]" 
          bgColor="bg-[#A3FDA7]/10"
        />

        {/* Step 3: Fairness Calculated (Bottom Valley) */}
        <StepNode 
          index={2}
          delay={2}
          top="88%" left="85%" 
          icon={<Scale size={24} />} 
          title="Fairness calculated" 
          subtitle="Not equal split. Smart split."
          color="text-[#A3FDA7]" 
          bgColor="bg-[#A3FDA7]/10"
        />

        {/* Step 4: Balance Restored (Right) */}
        <StepNode 
          index={3}
          delay={3}
          top="50%" left="95%" 
          icon={<HeartHandshake size={24} />} 
          title="Balance restored" 
          subtitle="Everyone pays their fair share"
          color="text-[#A3FDA7]" 
          bgColor="bg-[#A3FDA7]/10"
        />

      </div>
    </section>
  );
}