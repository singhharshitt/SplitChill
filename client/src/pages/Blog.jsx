import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { blogTopicList } from "../lib/blogTopics.js";

export default function Blog() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans selection:bg-[#A3FDA7]/30">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] tracking-[0.22em] uppercase text-gray-500 font-medium mb-3">
            SplitChill Blog
          </p>
          <h1 className="font-serif text-4xl md:text-6xl leading-tight text-black">
            Guides for fairer shared money.
          </h1>
          <p className="mt-5 text-gray-600 leading-relaxed">
            Short, demo-friendly explainers for AI splits, group balance, receipts, chat, analytics, and payments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogTopicList.map((topic) => (
            <Link
              key={topic.slug}
              to={`/blog/${topic.slug}`}
              className="group bg-white rounded-[24px] border border-black/[0.04] shadow-[0_2px_24px_rgba(0,0,0,0.04)] overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <div className="relative h-44 bg-[#FAFAF8] border-b border-black/[0.03] overflow-hidden">
                <img src={topic.image} alt={topic.imageAlt} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                <div className="absolute bottom-3 right-3 h-16 w-16 rounded-2xl bg-white/90 border border-black/[0.04] flex items-center justify-center shadow-sm">
                  <img src={topic.sticker} alt="" className="max-h-14 max-w-14 object-contain" />
                </div>
              </div>
              <div className="p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold mb-2">
                  {topic.eyebrow}
                </p>
                <h2 className="font-serif text-2xl text-black leading-tight">{topic.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed mt-3">{topic.summary}</p>
                <span className="inline-flex mt-5 text-xs font-medium text-black group-hover:translate-x-1 transition-transform">
                  Read guide
                </span>
                <p className="mt-3 text-[10px] text-gray-400">Image: {topic.imageSource}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
