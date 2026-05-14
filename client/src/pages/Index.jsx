import hero from "../assets/hero.png";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import Behaviour from "../sections/Landing/Behaviour";
import HowWorks from "../sections/Landing/HowWorks";
import Metrices from "../sections/Landing/Metrices";
import SplitChillCTA from "../sections/Landing/SplitChillCTA";
import SplitChillWork from "../sections/Landing/SplitChillWork";
import UnspokenMoments from "../sections/Landing/UnspokenMoments";
import UseCases from "../sections/Landing/UseCases";
import VisualProof from "../sections/Landing/VisualProof";

export default function Index() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative min-h-screen bg-[#F5F5F0] overflow-hidden">

        {/* Soft gradient glow */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-white to-transparent" />

        <Navbar />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">

          {/* HEADLINE */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-center text-black tracking-tight leading-[1.1]">
            Fairness in sharing <br /> starts here
          </h1>

          {/* SUBTEXT */}
          <p className="mt-6 text-lg text-center text-gray-600 max-w-2xl mx-auto leading-relaxed">
            SplitChill replaces basic bill splitting with a fairness-driven system 
            that adapts to income, participation, and real-world behavior.
          </p>

          {/* CTA BUTTONS */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5 mt-10">

            <Link to="/split" className="px-8 py-3.5 rounded-full bg-black text-white 
              hover:scale-105 transition-all duration-300 shadow-md">
              Split Fairly
            </Link>

            <Link to="/blog/fairness" className="px-8 py-3.5 rounded-full border border-black/10 
              bg-white/70 backdrop-blur-md text-black 
              hover:shadow-md transition-all duration-300">
              See How It Works
            </Link>

          </div>

          {/* HERO VISUAL */}
          <div className="mt-20 relative w-full max-w-5xl mx-auto">

            {/* Glow background */}
            <div className="absolute inset-0 bg-[#A3FDA7]/20 blur-3xl opacity-40" />

            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)] ring-1 ring-black/5">

              <img
                src={hero}
                alt="SplitChill dashboard preview"
                className="w-full h-full object-cover"
              />

            </div>
          </div>

        </div>
      </section>

      {/* SECTIONS FLOW */}
      <div className="bg-[#F5F5F0]">

        <SplitChillWork />
        <UseCases />
        <HowWorks />
        
        <Behaviour />
        <Metrices />
        <VisualProof />
        
        <UnspokenMoments />
        <SplitChillCTA />

      </div>

      <Footer />
    </>
  );
}
