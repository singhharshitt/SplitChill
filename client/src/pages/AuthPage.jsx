"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// ── Reusable Input Field ──────────────────────────────────────────────
function InputField({ label, type = "text", placeholder, value, onChange, autoComplete }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#374151]">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm text-black placeholder-black/25 outline-none transition-all duration-200 focus:border-[#A3FDA7] focus:ring-2 focus:ring-[#A3FDA7]/30 hover:border-black/20"
      />
    </div>
  );
}

// ── Auth Tabs ─────────────────────────────────────────────────────────
function AuthTabs({ activeTab, onChange }) {
  return (
    <div className="flex bg-[#F5F5F0] rounded-2xl p-1 mb-7">
      {["login", "signup"].map((tab) => (
        <button
          type="button"
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === tab
              ? "bg-white text-black shadow-sm"
              : "text-[#9CA3AF] hover:text-black/60"
          }`}
        >
          {tab === "login" ? "Log in" : "Sign up"}
        </button>
      ))}
    </div>
  );
}

// ── Google Icon ───────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Animated Form Panel ───────────────────────────────────────────────
function AnimatedPanel({ visible, children }) {
  const [rendered, setRendered] = useState(visible);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    let frame;
    let innerFrame;
    let timer;

    if (visible) {
      frame = requestAnimationFrame(() => {
        setRendered(true);
        innerFrame = requestAnimationFrame(() => setAnimating(true));
      });
    } else {
      frame = requestAnimationFrame(() => setAnimating(false));
      timer = setTimeout(() => setRendered(false), 320);
    }

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(innerFrame);
      clearTimeout(timer);
    };
  }, [visible]);

  if (!rendered) return null;

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{
        opacity: animating ? 1 : 0,
        transform: animating ? "translateY(0px)" : "translateY(10px)",
        pointerEvents: animating ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

// ── Auth Card ─────────────────────────────────────────────────────────
function AuthCard({ activeTab, setActiveTab }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
  });
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const isLogin = activeTab === "login";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (!isLogin && form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    const result = isLogin ? await login(form) : await signup(form);
    if (result.success) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setError(result.error || "Authentication failed. Please try again.");
  };

  return (
    <div className="bg-white rounded-[28px] p-8 border border-black/[0.06] shadow-sm hover:shadow-md transition-shadow duration-400 w-full max-w-[400px]">

      <AuthTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* Login Form */}
      <AnimatedPanel visible={isLogin}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
          />
          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set("password")}
            autoComplete="current-password"
          />

          <div className="flex justify-end -mt-1">
            <button type="button" className="text-[11px] text-[#9CA3AF] hover:text-black/60 transition-colors underline underline-offset-2 decoration-black/20">
              Forgot password?
            </button>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button type="submit" className="w-full py-3.5 bg-black text-white rounded-2xl text-sm font-semibold tracking-[0.01em] hover:bg-black/85 hover:scale-[1.015] active:scale-[0.99] transition-all duration-200 mt-1">
            Split Fairly →
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-black/7" />
            <span className="text-[11px] text-[#C4C4C0]">or</span>
            <div className="flex-1 h-px bg-black/7" />
          </div>

          <button type="button" className="w-full py-3 flex items-center justify-center gap-2 bg-white border border-black/10 rounded-2xl text-sm font-medium text-[#374151] hover:bg-[#FAFAF8] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <p className="text-center text-[11px] text-[#9CA3AF] mt-5">
          No account?{" "}
          <button
            onClick={() => setActiveTab("signup")}
            className="text-black/60 underline underline-offset-2 decoration-black/20 hover:text-black transition-colors"
          >
            Sign up free
          </button>
        </p>
      </AnimatedPanel>

      {/* Signup Form */}
      <AnimatedPanel visible={!isLogin}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <InputField
            label="Full name"
            placeholder="Jordan Smith"
            value={form.name}
            onChange={set("name")}
            autoComplete="name"
          />
          <InputField
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
          />
          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set("password")}
            autoComplete="new-password"
          />
          <InputField
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={set("confirm")}
            autoComplete="new-password"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button type="submit" className="w-full py-3.5 bg-black text-white rounded-2xl text-sm font-semibold tracking-[0.01em] hover:bg-black/85 hover:scale-[1.015] active:scale-[0.99] transition-all duration-200 mt-1">
            Get Started →
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-black/7" />
            <span className="text-[11px] text-[#C4C4C0]">or</span>
            <div className="flex-1 h-px bg-black/7" />
          </div>

          <button type="button" className="w-full py-3 flex items-center justify-center gap-2 bg-white border border-black/10 rounded-2xl text-sm font-medium text-[#374151] hover:bg-[#FAFAF8] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <p className="text-center text-[11px] text-[#9CA3AF] mt-5">
          Already have an account?{" "}
          <button
            onClick={() => setActiveTab("login")}
            className="text-black/60 underline underline-offset-2 decoration-black/20 hover:text-black transition-colors"
          >
            Log in
          </button>
        </p>
      </AnimatedPanel>

      {/* Security note */}
      <p className="text-center text-[10px] text-[#C4C4C0] mt-4">
        Your data is encrypted · Payments are secure
      </p>
    </div>
  );
}

// ── Left Content ──────────────────────────────────────────────────────
function AuthLeftContent() {
  return (
    <div className="flex flex-col justify-center lg:pr-12 xl:pr-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-14">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 8h10M8 3v10" />
            <circle cx="8" cy="8" r="6.5" />
          </svg>
        </div>
        <span
          className="text-[17px] font-semibold text-black tracking-[-0.02em]"
          style={{ fontFamily: "'Georgia', 'Playfair Display', serif" }}
        >
          SplitChill
        </span>
      </div>

      {/* Heading */}
      <h1
        className="text-[48px] lg:text-[56px] xl:text-[64px] leading-[1.07] tracking-[-0.025em] text-black mb-6 max-w-[480px]"
        style={{ fontFamily: "'Georgia', 'Playfair Display', serif", fontWeight: 500 }}
      >
        Start splitting…<br />
        the <em className="italic">fair</em> way.
      </h1>

      <p className="text-[15px] text-[#6B7280] leading-[1.7] max-w-[340px] mb-8">
        No awkward math. No uncomfortable conversations.<br />
        Just balance — the way it should be.
      </p>

      <p className="text-[12px] text-[#9CA3AF] tracking-[0.01em] leading-relaxed mb-12">
        Join groups · Track fairness · Let AI handle the rest.
      </p>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center gap-5">
        {[
          { label: "Encrypted payments" },
          { label: "Bank-level security" },
          { label: "No hidden fees" },
        ].map(({ label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#A3FDA7] flex-shrink-0" />
            <span className="text-[11px] text-[#9CA3AF] font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Doodle Character (scale holder) ──────────────────────────────────
function DoodleCharacter() {
  return (
    <div className="absolute -left-14 bottom-4 hidden xl:block" aria-hidden>
      <svg
        width="90"
        height="130"
        viewBox="0 0 90 130"
        fill="none"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      >
        {/* Head */}
        <circle cx="45" cy="22" r="10" />
        {/* Body */}
        <line x1="45" y1="32" x2="45" y2="68" />
        {/* Left arm — holding scale left */}
        <path d="M45 45 Q30 40 18 42" />
        {/* Right arm pointing right */}
        <path d="M45 45 Q60 42 72 38" />
        {/* Scale pole up from left hand */}
        <line x1="18" y1="42" x2="18" y2="28" />
        {/* Scale beam — tilted */}
        <path d="M8 30 L28 26" />
        {/* Left pan — lower */}
        <line x1="10" y1="30" x2="10" y2="40" />
        <path d="M5 40 Q10 44 15 40" />
        {/* Right pan — higher */}
        <line x1="26" y1="28" x2="26" y2="34" />
        <path d="M21 34 Q26 38 31 34" />
        {/* Mint coin in left pan */}
        <circle cx="10" cy="38" r="3" fill="#A3FDA7" stroke="#000" strokeWidth="1" />
        {/* Legs */}
        <path d="M45 68 Q41 84 39 96" />
        <path d="M45 68 Q49 84 51 96" />
        {/* Pointing arrow toward right */}
        <path d="M68 40 L80 38 M76 34 L80 38 L76 42" strokeWidth="1.3" />
      </svg>
    </div>
  );
}

// ── Doodle Background Strip ───────────────────────────────────────────
function DoodleBackground() {
  return (
    <div className="w-full mt-auto" aria-hidden>
      <svg
        viewBox="0 0 1200 160"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full block"
        preserveAspectRatio="xMidYMax meet"
        fill="none"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Ground */}
        <line x1="0" y1="148" x2="1200" y2="148" strokeWidth="1" stroke="#E8E8E3" />

        {/* ── SHOP LEFT ── */}
        <rect x="18" y="80" width="52" height="68" rx="4" strokeWidth="1.3" />
        <line x1="18" y1="98" x2="70" y2="98" strokeWidth="1" />
        <rect x="30" y="110" width="16" height="20" rx="2" strokeWidth="1.1" />
        <rect x="50" y="118" width="10" height="12" rx="1.5" strokeWidth="1" />
        <path d="M14 80 Q44 60 74 80" strokeWidth="1.3" />
        <line x1="44" y1="60" x2="44" y2="80" strokeWidth="1" />

        {/* Person 1 — near shop */}
        <circle cx="88" cy="88" r="7" strokeWidth="1.3" />
        <path d="M88 95 Q88 118 88 128" strokeWidth="1.3" />
        <path d="M88 103 Q80 98 74 96" strokeWidth="1.3" />
        <path d="M88 103 Q96 100 102 104" strokeWidth="1.3" />
        <path d="M88 128 Q84 140 82 148" strokeWidth="1.3" />
        <path d="M88 128 Q92 140 94 148" strokeWidth="1.3" />

        {/* Person 2 — phone in hand */}
        <circle cx="116" cy="86" r="7" strokeWidth="1.3" />
        <path d="M116 93 Q116 115 116 126" strokeWidth="1.3" />
        <path d="M116 102 Q108 99 105 103" strokeWidth="1.3" />
        <path d="M116 102 Q124 98 130 92" strokeWidth="1.3" />
        <rect x="126" y="88" width="9" height="13" rx="2" strokeWidth="1.1" />
        <path d="M116 126 Q112 138 110 148" strokeWidth="1.3" />
        <path d="M116 126 Q120 138 122 148" strokeWidth="1.3" />
        <circle cx="131" cy="95" r="2" fill="#A3FDA7" stroke="none" />

        {/* ── HOUSE ── */}
        <rect x="148" y="100" width="46" height="48" rx="3" strokeWidth="1.3" />
        <path d="M144 102 L171 74 L198 102" strokeWidth="1.4" />
        <rect x="161" y="120" width="12" height="16" rx="2" strokeWidth="1.1" />
        <rect x="152" y="108" width="10" height="9" rx="1.5" strokeWidth="1" />
        <rect x="178" y="108" width="10" height="9" rx="1.5" strokeWidth="1" />
        <rect x="176" y="76" width="6" height="14" rx="1" strokeWidth="1.1" />

        {/* ── DELIVERY CYCLIST ── */}
        <circle cx="228" cy="90" r="7" strokeWidth="1.3" />
        <path d="M221 88 Q228 78 235 88" strokeWidth="1.2" fill="#A3FDA7" stroke="#000" />
        <path d="M228 97 L228 114" strokeWidth="1.3" />
        <path d="M228 106 L218 112 L218 130" strokeWidth="1.3" />
        <path d="M228 106 L238 108" strokeWidth="1.3" />
        <circle cx="218" cy="132" r="10" strokeWidth="1.4" />
        <circle cx="218" cy="132" r="3" strokeWidth="1" />
        <rect x="230" y="100" width="18" height="14" rx="2" strokeWidth="1.1" />

        {/* ── DINING TABLE ── */}
        <rect x="290" y="118" width="80" height="8" rx="3" strokeWidth="1.3" />
        <line x1="300" y1="126" x2="300" y2="148" strokeWidth="1.2" />
        <line x1="360" y1="126" x2="360" y2="148" strokeWidth="1.2" />
        <ellipse cx="315" cy="118" rx="10" ry="4" strokeWidth="1" />
        <ellipse cx="345" cy="118" rx="10" ry="4" strokeWidth="1" />
        <path d="M308 118 L310 104 M310 104 L314 104 M314 104 L316 118" strokeWidth="1" />
        <path d="M338 118 L340 104 M340 104 L344 104 M344 104 L346 118" strokeWidth="1" />
        {/* Diners */}
        <circle cx="296" cy="85" r="7" strokeWidth="1.3" />
        <path d="M296 92 Q296 110 296 118" strokeWidth="1.3" />
        <path d="M296 100 Q285 97 282 100" strokeWidth="1.3" />
        <path d="M296 100 Q306 97 310 104" strokeWidth="1.3" />
        <circle cx="365" cy="85" r="7" strokeWidth="1.3" />
        <path d="M365 92 Q365 110 365 118" strokeWidth="1.3" />
        <path d="M365 100 Q356 98 352 104" strokeWidth="1.3" />
        <path d="M365 100 Q375 97 380 92" strokeWidth="1.3" />
        {/* Bill receipt */}
        <rect x="375" y="88" width="14" height="18" rx="2" strokeWidth="1.1" />
        <line x1="378" y1="93" x2="386" y2="93" strokeWidth="0.8" />
        <line x1="378" y1="97" x2="386" y2="97" strokeWidth="0.8" />
        <line x1="378" y1="101" x2="384" y2="101" strokeWidth="0.8" />

        {/* ── SCALE CHARACTER ── */}
        <circle cx="435" cy="82" r="7.5" strokeWidth="1.4" />
        <path d="M435 90 Q435 115 435 126" strokeWidth="1.4" />
        <path d="M435 100 Q420 95 410 96" strokeWidth="1.3" />
        <path d="M435 100 Q450 95 462 96" strokeWidth="1.3" />
        <line x1="436" y1="72" x2="436" y2="96" strokeWidth="1.2" />
        <line x1="410" y1="96" x2="462" y2="96" strokeWidth="1.4" />
        <line x1="418" y1="96" x2="418" y2="108" strokeWidth="1" />
        <path d="M412 108 Q418 112 424 108" strokeWidth="1.2" />
        <line x1="454" y1="96" x2="454" y2="102" strokeWidth="1" />
        <path d="M448 102 Q454 106 460 102" strokeWidth="1.2" />
        <circle cx="418" cy="106" r="3.5" fill="#A3FDA7" stroke="#000" strokeWidth="1" />
        <path d="M435 126 Q431 138 429 148" strokeWidth="1.3" />
        <path d="M435 126 Q439 138 441 148" strokeWidth="1.3" />

        {/* ── WALKING COUPLE ── */}
        <circle cx="510" cy="86" r="7" strokeWidth="1.3" />
        <path d="M510 93 Q510 116 510 126" strokeWidth="1.3" />
        <path d="M510 103 Q500 100 497 106" strokeWidth="1.3" />
        <path d="M510 103 Q520 100 525 96" strokeWidth="1.3" />
        <path d="M510 126 Q506 138 504 148" strokeWidth="1.3" />
        <path d="M510 126 Q514 138 516 148" strokeWidth="1.3" />
        <circle cx="538" cy="88" r="7" strokeWidth="1.3" />
        <path d="M538 95 Q538 116 538 126" strokeWidth="1.3" />
        <path d="M538 105 Q530 102 525 96" strokeWidth="1.3" />
        <path d="M538 105 Q546 102 550 106" strokeWidth="1.3" />
        <path d="M538 126 Q534 138 532 148" strokeWidth="1.3" />
        <path d="M538 126 Q542 138 544 148" strokeWidth="1.3" />

        {/* ── PHONE PAYMENT ── */}
        <circle cx="595" cy="84" r="7" strokeWidth="1.3" />
        <path d="M595 91 Q595 113 595 124" strokeWidth="1.3" />
        <path d="M595 101 Q585 98 582 103" strokeWidth="1.3" />
        <path d="M595 101 Q605 98 609 101" strokeWidth="1.3" />
        <path d="M609 101 L609 118" strokeWidth="1.3" />
        <rect x="604" y="96" width="22" height="34" rx="3" strokeWidth="1.2" />
        <line x1="607" y1="101" x2="623" y2="101" strokeWidth="0.8" />
        <path d="M609 116 L612 120 L620 111" stroke="#A3FDA7" strokeWidth="1.8" fill="none" />
        <path d="M595 124 Q591 136 589 148" strokeWidth="1.3" />
        <path d="M595 124 Q599 136 601 148" strokeWidth="1.3" />

        {/* ── TREE ── */}
        <line x1="650" y1="148" x2="650" y2="100" strokeWidth="1.5" />
        <ellipse cx="650" cy="88" rx="16" ry="18" strokeWidth="1.3" />
        <ellipse cx="638" cy="98" rx="11" ry="12" strokeWidth="1.1" />
        <ellipse cx="662" cy="96" rx="12" ry="13" strokeWidth="1.1" />

        {/* ── CAFÉ ── */}
        <rect x="680" y="90" width="56" height="58" rx="4" strokeWidth="1.3" />
        <line x1="680" y1="108" x2="736" y2="108" strokeWidth="1" />
        <rect x="688" y="78" width="40" height="14" rx="3" strokeWidth="1.1" />
        <path d="M676 90 L708 76 L740 90" strokeWidth="1.3" />
        <rect x="690" y="118" width="14" height="20" rx="2" strokeWidth="1.1" />
        <rect x="710" y="120" width="18" height="12" rx="2" strokeWidth="1" />
        <circle cx="756" cy="88" r="7" strokeWidth="1.3" />
        <path d="M756 95 Q756 114 756 124" strokeWidth="1.3" />
        <path d="M756 104 Q746 101 740 104" strokeWidth="1.3" />
        <path d="M756 104 Q766 101 770 104" strokeWidth="1.3" />
        <path d="M756 124 Q752 136 750 148" strokeWidth="1.3" />
        <path d="M756 124 Q760 136 762 148" strokeWidth="1.3" />

        {/* ── BILL SPLIT COUNTER ── */}
        <rect x="800" y="110" width="60" height="6" rx="2" strokeWidth="1.3" />
        <line x1="808" y1="116" x2="808" y2="148" strokeWidth="1.2" />
        <line x1="852" y1="116" x2="852" y2="148" strokeWidth="1.2" />
        <rect x="824" y="90" width="14" height="22" rx="2" strokeWidth="1.1" />
        <line x1="827" y1="95" x2="835" y2="95" strokeWidth="0.8" />
        <line x1="827" y1="99" x2="835" y2="99" strokeWidth="0.8" />
        <line x1="827" y1="103" x2="833" y2="103" strokeWidth="0.8" />
        <circle cx="808" cy="82" r="7" strokeWidth="1.3" />
        <path d="M808 89 Q808 106 808 112" strokeWidth="1.3" />
        <path d="M808 99 Q800 96 797 100" strokeWidth="1.3" />
        <path d="M808 99 Q817 96 822 92" strokeWidth="1.3" />
        <circle cx="852" cy="82" r="7" strokeWidth="1.3" />
        <path d="M852 89 Q852 106 852 112" strokeWidth="1.3" />
        <path d="M852 99 Q844 96 840 92" strokeWidth="1.3" />
        <path d="M852 99 Q860 96 863 100" strokeWidth="1.3" />
        <path d="M820 96 L826 96" strokeWidth="1" strokeDasharray="2,2" />
        <path d="M842 96 L836 96" strokeWidth="1" strokeDasharray="2,2" />

        {/* ── DOG WALKER ── */}
        <ellipse cx="890" cy="138" rx="16" ry="8" strokeWidth="1.3" />
        <circle cx="906" cy="132" r="7" strokeWidth="1.3" />
        <path d="M900 132 Q903 124 906 128" strokeWidth="1.1" />
        <line x1="874" y1="138" x2="872" y2="148" strokeWidth="1.2" />
        <line x1="882" y1="142" x2="880" y2="148" strokeWidth="1.2" />
        <line x1="892" y1="144" x2="890" y2="148" strokeWidth="1.2" />
        <line x1="900" y1="142" x2="898" y2="148" strokeWidth="1.2" />
        <path d="M874 136 Q868 128 872 124" strokeWidth="1.2" />
        <circle cx="930" cy="84" r="7" strokeWidth="1.3" />
        <path d="M930 91 Q930 113 930 124" strokeWidth="1.3" />
        <path d="M930 101 Q920 98 916 103" strokeWidth="1.3" />
        <path d="M930 101 Q940 98 944 101" strokeWidth="1.3" />
        <path d="M930 124 Q926 136 924 148" strokeWidth="1.3" />
        <path d="M930 124 Q934 136 936 148" strokeWidth="1.3" />
        <path d="M916 103 Q912 120 906 134" strokeWidth="1" strokeDasharray="3,2" />

        {/* ── HOUSE RIGHT ── */}
        <rect x="980" y="100" width="50" height="48" rx="3" strokeWidth="1.3" />
        <path d="M976 102 L1005 72 L1034 102" strokeWidth="1.4" />
        <rect x="994" y="120" width="14" height="18" rx="2" strokeWidth="1.1" />
        <rect x="983" y="108" width="11" height="10" rx="1.5" strokeWidth="1" />
        <rect x="1010" y="108" width="11" height="10" rx="1.5" strokeWidth="1" />
        <rect x="1012" y="76" width="7" height="12" rx="1" strokeWidth="1.1" />

        {/* ── PERSON RIGHT ── */}
        <circle cx="1055" cy="86" r="7" strokeWidth="1.3" />
        <path d="M1055 93 Q1055 114 1055 124" strokeWidth="1.3" />
        <path d="M1055 103 Q1045 100 1040 104" strokeWidth="1.3" />
        <path d="M1055 103 Q1065 100 1070 105" strokeWidth="1.3" />
        <path d="M1055 124 Q1051 136 1049 148" strokeWidth="1.3" />
        <path d="M1055 124 Q1059 136 1061 148" strokeWidth="1.3" />
        <rect x="1065" y="101" width="14" height="18" rx="3" strokeWidth="1.1" />
        <path d="M1068 101 Q1068 97 1072 97 Q1076 97 1076 101" strokeWidth="1" />

        {/* ── SCOOTER ── */}
        <circle cx="1120" cy="134" r="10" strokeWidth="1.4" />
        <circle cx="1120" cy="134" r="3" strokeWidth="1" />
        <circle cx="1168" cy="134" r="10" strokeWidth="1.4" />
        <circle cx="1168" cy="134" r="3" strokeWidth="1" />
        <path d="M1130 134 L1158 134" strokeWidth="1.5" />
        <path d="M1136 134 L1142 118 L1162 118 L1165 128" strokeWidth="1.3" />
        <circle cx="1142" cy="104" r="7" strokeWidth="1.3" />
        <path d="M1142 111 L1142 124" strokeWidth="1.3" />
        <path d="M1142 118 L1132 122" strokeWidth="1.3" />
        <path d="M1142 118 L1152 118" strokeWidth="1.3" />
        <path d="M1135 102 Q1142 93 1149 102" strokeWidth="1.2" fill="#A3FDA7" stroke="#000" />
      </svg>
    </div>
  );
}

// ── Main Auth Page ────────────────────────────────────────────────────
export default function AuthPage({ initialTab = "login" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F5F5F0" }}
    >
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 md:px-10 lg:px-16">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left */}
          <AuthLeftContent />

          {/* Right — card + character */}
          <div className="relative flex justify-center lg:justify-end">
            <DoodleCharacter />
            <AuthCard activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      </div>

      {/* Doodle strip — sticks to bottom */}
      <DoodleBackground />
    </div>
  );
}
