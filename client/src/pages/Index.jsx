import Navbar from "../components/Navbar";
import Behaviour from "../sections/Landing/Behaviour";
import HowWorks from "../sections/Landing/HowWorks";
import Metrices from "../sections/Landing/Metrices";
import SplitChillWork from "../sections/Landing/SplitChillWork";
import VisualProof from "../sections/Landing/VisualProof";

export default function Index() {
    return (
        <>
            <section className="relative min-h-screen overflow-hidden bg-[#F2FFE4]">
               
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-170 bg-gradient-to-b from-[#FDFFFB] to-transparent " />

                <div className="min-h-full relative z-0">
                    <Navbar />
                    <section className="relative">
                        <div className="mt-28 pt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-center text-gray-900 tracking-tight leading-tight">
                                The Future of Expense Splitting
                            </h1>
                            <p className="mt-6 text-base sm:text-lg text-center text-gray-700 max-w-2xl mx-auto leading-relaxed">
                                SplitChill replaces basic bill splitting with an AI-driven system that ensures
                                fair, balanced expenses through intelligent insights and seamless group management.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-10">
                                <button className="px-8 py-3.5 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors duration-200 shadow-lg hover:shadow-xl cursor-pointer">
                                    Explore
                                </button>
                                <button className="px-8 py-3.5 bg-white/80 backdrop-blur-sm text-gray-900 font-semibold rounded-full border border-gray-200 hover:bg-white transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer">
                                    Learn More
                                </button>
                            </div>
                            <div className="mt-16 sm:mt-20 relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-900/10">
                                <video 
                                    autoPlay 
                                    muted 
                                    loop 
                                    playsInline 
                                    className="w-full h-full object-cover"
                                >
                                    <source src="/video.mp4" type="video/mp4" />
                                </video>
                            </div>
                        </div>
                    </section>
                   
                </div>
            </section>
             <SplitChillWork/>
            <HowWorks/>
            <Behaviour/>
            <Metrices/>
            <VisualProof/>
        </>
    );
}