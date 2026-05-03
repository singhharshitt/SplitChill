import React, { useRef, useEffect, useCallback, useState } from "react";

// ============================================
// HAND-DRAWN DOODLE CANVAS
// ============================================
const BalanceDoodle = ({ isHovered }) => {
  const canvasRef = useRef(null);
  const isHoveredRef = useRef(isHovered);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  const seedRandom = useCallback((seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }, []);

  const drawWobblyLine = useCallback((ctx, x1, y1, x2, y2, time, seed = 0) => {
    const segments = 8;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    for (let i = 1; i <= segments; i++) {
      const px = x1 + dx * i;
      const py = y1 + dy * i;
      const wobbleX = Math.sin(time * 2 + seed + i * 1.5) * 1.2;
      const wobbleY = Math.cos(time * 1.8 + seed + i * 2.1) * 1.0;
      const jitter = (seedRandom(seed + i * 137 + time * 0.1) - 0.5) * 1.2;
      ctx.lineTo(px + wobbleX + jitter, py + wobbleY + jitter);
    }
    ctx.stroke();
  }, [seedRandom]);

  const drawWobblyCircle = useCallback((ctx, cx, cy, r, time, seed = 0) => {
    const points = 16;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const wobbleR = r + Math.sin(time * 1.5 + seed + i * 0.8) * 1.5 +
                       (seedRandom(seed + i * 73) - 0.5) * 1.2;
      const x = cx + Math.cos(angle) * wobbleR;
      const y = cy + Math.sin(angle) * wobbleR;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }, [seedRandom]);

  const drawWobblyArc = useCallback((ctx, cx, cy, r, startAngle, endAngle, time, seed = 0) => {
    const points = 12;
    const totalAngle = endAngle - startAngle;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const angle = startAngle + totalAngle * t;
      const wobbleR = r + Math.sin(time * 2 + seed + i) * 1.0;
      const x = cx + Math.cos(angle) * wobbleR;
      const y = cy + Math.sin(angle) * wobbleR;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, []);

  const draw = useCallback((ctx, time) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const scale = Math.min(w, h) / 320;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const breathe = Math.sin(time * 1.5) * 3;
    const hoverBalance = isHoveredRef.current ? 0.1 : 0;
    const pointBounce = Math.sin(time * 3) * 2;
    const headY = -80 + breathe * 0.3;

    // HEAD
    drawWobblyCircle(ctx, 0, headY, 35, time, 1);
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(-10, headY - 5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, headY - 5, 2.5, 0, Math.PI * 2); ctx.fill();
    drawWobblyArc(ctx, 0, headY + 5, 12, 0.2, Math.PI - 0.2, time, 2);

    // BODY
    drawWobblyLine(ctx, 0, headY + 35, 0, 40, time, 3);

    // LEFT ARM → holds scale
    drawWobblyLine(ctx, -15, headY + 25, -50, headY - 10, time, 4);

    // RIGHT ARM → points to form
    const fingerY = headY + 5 + pointBounce;
    drawWobblyLine(ctx, 15, headY + 25, 65, fingerY, time, 5);
    drawWobblyLine(ctx, 65, fingerY, 85, fingerY - 8, time, 6);
    drawWobblyLine(ctx, 65, fingerY, 82, fingerY + 3, time, 7);

    // LEGS
    drawWobblyLine(ctx, 0, 40, -20, 90, time, 8);
    drawWobblyLine(ctx, 0, 40, 20, 90, time, 9);

    // BALANCE SCALE
    const scaleX = -55;
    const scaleY = headY - 25 + breathe * 0.2;
    drawWobblyLine(ctx, scaleX, scaleY + 20, scaleX, scaleY - 30, time, 10);

    const baseTilt = 0.15;
    const swingTilt = Math.sin(time * 2) * 0.08;
    const tilt = baseTilt + swingTilt + hoverBalance;
    const beamLength = 45;
    const beamStartX = scaleX - beamLength * Math.cos(tilt);
    const beamStartY = scaleY - 30 - beamLength * Math.sin(tilt);
    const beamEndX = scaleX + beamLength * Math.cos(tilt);
    const beamEndY = scaleY - 30 + beamLength * Math.sin(tilt);

    drawWobblyLine(ctx, beamStartX, beamStartY, beamEndX, beamEndY, time, 11);

    // PLATES
    const plateDrop = 20;
    const leftPlateX = beamStartX;
    const leftPlateY = beamStartY + plateDrop;
    drawWobblyLine(ctx, beamStartX, beamStartY, leftPlateX - 12, leftPlateY, time, 12);
    drawWobblyLine(ctx, beamStartX, beamStartY, leftPlateX + 12, leftPlateY, time, 13);
    drawWobblyArc(ctx, leftPlateX, leftPlateY, 12, 0, Math.PI, time, 14);

    const rightPlateX = beamEndX;
    const rightPlateY = beamEndY + plateDrop;
    drawWobblyLine(ctx, beamEndX, beamEndY, rightPlateX - 12, rightPlateY, time, 15);
    drawWobblyLine(ctx, beamEndX, beamEndY, rightPlateX + 12, rightPlateY, time, 16);
    drawWobblyArc(ctx, rightPlateX, rightPlateY, 12, 0, Math.PI, time, 17);

    // WEIGHTS
    drawWobblyCircle(ctx, leftPlateX - 3, leftPlateY - 5, 5, time, 18);
    drawWobblyCircle(ctx, leftPlateX + 4, leftPlateY - 4, 4, time, 19);
    drawWobblyCircle(ctx, rightPlateX, rightPlateY - 5, 4, time, 20);

    // MINT ACCENT
    const mintPulse = 0.6 + Math.sin(time * 2) * 0.2;
    const mintOpacity = isHoveredRef.current ? 1 : mintPulse;
    ctx.fillStyle = `rgba(163, 253, 167, ${mintOpacity})`;
    ctx.beginPath();
    ctx.arc(90, fingerY - 5, isHoveredRef.current ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();

    if (isHoveredRef.current) {
      ctx.strokeStyle = "rgba(163, 253, 167, 0.4)";
      ctx.lineWidth = 1;
      drawWobblyCircle(ctx, 90, fingerY - 5, 10, time * 2, 21);
    }

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#000";
    ctx.restore();
  }, [drawWobblyArc, drawWobblyCircle, drawWobblyLine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#000";

    let animationId;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      draw(ctx, elapsed);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={320}
      style={{ width: "100%", height: "auto", maxWidth: 280 }}
    />
  );
};

// ============================================
// GLASSMORPHISM FORM
// ============================================
const GlassForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    groupType: "",
    peopleCount: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  const inputBase = "w-full px-5 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-full text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#A3FDA7]/40 focus:bg-white/[0.06] transition-all duration-300";

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute -inset-1 bg-gradient-to-r from-[#A3FDA7]/10 via-transparent to-[#A3FDA7]/10 rounded-[2rem] blur-xl opacity-60" />
      <div className="relative bg-[#111] rounded-[1.5rem] p-8 md:p-10 border border-white/[0.06] shadow-2xl shadow-black/40">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] tracking-wider text-gray-500 uppercase mb-2 font-medium">
                First Name
              </label>
              <input type="text" name="firstName" placeholder="Jane" value={formData.firstName} onChange={handleChange} className={inputBase} />
            </div>
            <div>
              <label className="block text-[11px] tracking-wider text-gray-500 uppercase mb-2 font-medium">
                Last Name
              </label>
              <input type="text" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} className={inputBase} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] tracking-wider text-gray-500 uppercase mb-2 font-medium">Email</label>
            <input type="email" name="email" placeholder="jane@example.com" value={formData.email} onChange={handleChange} className={inputBase} />
          </div>

          <div>
            <label className="block text-[11px] tracking-wider text-gray-500 uppercase mb-2 font-medium">Group Type</label>
            <select name="groupType" value={formData.groupType} onChange={handleChange} className={`${inputBase} appearance-none cursor-pointer`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}>
              <option value="" disabled>Select a type</option>
              <option value="trip">Trip with Friends</option>
              <option value="roommates">Shared Living</option>
              <option value="events">Group Events</option>
              <option value="dining">Dining & Outings</option>
              <option value="ongoing">Ongoing Group</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] tracking-wider text-gray-500 uppercase mb-2 font-medium">How Many People?</label>
            <input type="number" name="peopleCount" placeholder="3" min="2" max="50" value={formData.peopleCount} onChange={handleChange} className={inputBase} />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full mt-2 py-4 bg-[#A3FDA7] hover:bg-[#8FEA93] text-gray-900 font-semibold text-sm rounded-full transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(163,253,167,0.3)] active:scale-[0.98] disabled:opacity-70 cursor-pointer">
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Setting up...
              </span>
            ) : "Get Started Free"}
          </button>

          <p className="text-center text-[11px] text-gray-600 mt-4">
            No credit card required. Free forever for small groups.
          </p>
        </form>
      </div>
    </div>
  );
};

// ============================================
// MAIN CTA SECTION
// ============================================
export default function SplitChillCTA() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section
      className="relative min-h-screen bg-[#F5F5F0] py-20 md:py-0 md:min-h-[90vh] flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
        backgroundSize: "40px 40px"
      }} />

      <div className="relative max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* LEFT */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <p className="text-[11px] tracking-[0.3em] text-gray-500 uppercase mb-4 font-medium">
              Start Splitting
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-black leading-[1.05] max-w-lg mb-6">
              Start splitting… <span className="italic">the fair way</span>
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed max-w-md mb-10">
              See how your group balances out—without awkward conversations.
            </p>

            <div className="relative">
              <BalanceDoodle isHovered={isHovered} />
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#A3FDA7]/10 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none"
                style={{ opacity: isHovered ? 0.6 : 0 }}
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex justify-center lg:justify-end">
            <GlassForm />
          </div>

        </div>
      </div>
    </section>
  );
}
