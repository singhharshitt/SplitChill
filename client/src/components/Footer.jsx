import React from "react";
import footer from '../assets/footer.png'

const FooterColumn = ({ title, links }) => (
  <div className="flex flex-col gap-3">
    <h4 className="text-[11px] tracking-[0.15em] text-gray-500 uppercase font-semibold mb-1">
      {title}
    </h4>
    {links.map((link) => (
      <a
        key={link}
        href="#"
        className="text-sm text-gray-700 hover:text-black transition-colors duration-300 relative group w-fit"
      >
        {link}
        <span className="absolute bottom-0 left-0 w-0 h-px bg-black group-hover:w-full transition-all duration-300" />
      </a>
    ))}
  </div>
);

export default function Footer() {
  const [email, setEmail] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);

  const footerLinks = {
    Product: ["Smart Splitting", "Fairness Engine", "Predictions", "Analytics"],
    "Use Cases": ["Trips", "Shared Living", "Events", "Dining"],
    Company: ["About", "Blog", "Careers"],
    Resources: ["Docs", "Help", "API"],
    Legal: ["Privacy", "Terms"],
  };

  return (
    <footer className="bg-[#F5F5F0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div>
              <h3 className="text-2xl font-serif text-black tracking-tight">SplitChill</h3>
              <p className="text-sm text-gray-500 mt-1 italic">Equal ≠ Fair</p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
              Smart expense splitting that adapts to people, not formulas.
            </p>
            <div className="relative max-w-xs">
              <div 
                className={`absolute -inset-[1px] rounded-full transition-opacity duration-500 ${isFocused ? "opacity-100" : "opacity-0"}`}
                style={{ background: "linear-gradient(90deg, rgba(163,253,167,0.4), rgba(163,253,167,0.1))", filter: "blur(8px)" }}
              />
              <div className="relative flex items-center bg-white border border-gray-200 rounded-full px-5 py-3 transition-all duration-300 focus-within:border-gray-400 focus-within:shadow-sm">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="flex-1 bg-transparent text-sm text-black placeholder-gray-400 outline-none"
                />
                <button className="ml-3 w-8 h-8 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center transition-colors duration-300 cursor-pointer group" aria-label="Subscribe">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-300">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
              {Object.entries(footerLinks).map(([title, links]) => (
                <FooterColumn key={title} title={title} links={links} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-black/[0.06]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© 2026 SplitChill. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {["Twitter", "LinkedIn", "GitHub"].map((social) => (
              <a key={social} href="#" className="text-xs text-gray-500 hover:text-black transition-colors duration-300">{social}</a>
            ))}
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#F5F5F0] to-transparent z-10 pointer-events-none" />
        <img
          src={footer}
          alt="Fairness ecosystem illustration"
          className="w-full h-[460px] object-cover block"
        />
      </div>
    </footer>
  );
}
