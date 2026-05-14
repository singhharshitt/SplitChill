import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getBlogTopic } from "../lib/blogTopics.js";

export default function BlogArticle() {
  const { slug } = useParams();
  const topic = getBlogTopic(slug);

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans selection:bg-[#A3FDA7]/30">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">
        <Link to="/blog" className="text-xs text-gray-500 hover:text-black transition-colors">
          Back to blog
        </Link>

        <article className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase text-emerald-700 font-bold mb-3">
              {topic.eyebrow}
            </p>
            <h1 className="font-serif text-4xl md:text-6xl leading-tight text-black">
              {topic.title}
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              {topic.summary}
            </p>
            <div className="mt-8 overflow-hidden rounded-[24px] border border-black/[0.04] shadow-[0_2px_24px_rgba(0,0,0,0.04)] bg-white">
              <img src={topic.image} alt={topic.imageAlt} className="h-64 md:h-80 w-full object-cover" />
              <p className="px-5 py-3 text-[10px] text-gray-400">Image: {topic.imageSource}</p>
            </div>

            <div className="mt-10 bg-white rounded-[24px] border border-black/[0.04] shadow-[0_2px_24px_rgba(0,0,0,0.04)] p-6 md:p-8 space-y-8">
              {topic.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-serif text-2xl text-black mb-3">{section.heading}</h2>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">{section.body}</p>
                </section>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 bg-white rounded-[24px] border border-black/[0.04] shadow-[0_2px_24px_rgba(0,0,0,0.04)] p-6">
            <div className="bg-[#FAFAF8] rounded-[20px] min-h-56 flex items-center justify-center border border-black/[0.03]">
              <img src={topic.sticker} alt="" className="max-h-48 max-w-[82%] object-contain" />
            </div>
            <p className="mt-5 text-xs text-gray-500 leading-relaxed">
              This guide is connected to the same feature area that opened it, so demo clicks stay contextual.
            </p>
          </aside>
        </article>
      </main>
      <Footer />
    </div>
  );
}
