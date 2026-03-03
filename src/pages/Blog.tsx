import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const posts = [
  { id: "building-ai-roadmap", title: "Building an AI Roadmap for SMBs", excerpt: "How to prioritize high-impact AI initiatives without overengineering your stack." },
  { id: "questionnaire-design", title: "Questionnaire Design That Produces Better Data", excerpt: "Practical patterns to reduce drop-off and increase answer quality." },
  { id: "operational-reporting", title: "Operational Reporting for Fast Decision Cycles", excerpt: "Turn raw responses into executive-ready recommendations." },
];

const Blog = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-100 bg-white/95 p-8 shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Blog</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900 md:text-5xl">Insights for data-driven teams</h1>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-slate-900">{post.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
                <Link to={`/blog/${post.id}`} className="mt-4 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Read article
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
