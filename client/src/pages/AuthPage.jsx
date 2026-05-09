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

      <div className="flex items-center gap-2.5 mb-14">
        <span
          className="font-serif text-2xl text-black tracking-[-0.02em]"
          
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
        Just balance...the way it should be.
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

            <AuthCard activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      </div>
    </div>
  );
}
