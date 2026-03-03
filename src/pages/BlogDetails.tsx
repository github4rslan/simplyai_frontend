import React from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const articles: Record<string, { title: string; body: string[] }> = {
  "building-ai-roadmap": {
    title: "Building an AI Roadmap for SMBs",
    body: [
      "Start by mapping decisions that happen frequently and have clear business impact. Those are your strongest automation candidates.",
      "Run one pilot end-to-end, measure cycle-time and output quality, then scale only what proves value.",
    ],
  },
  "questionnaire-design": {
    title: "Questionnaire Design That Produces Better Data",
    body: [
      "Keep sections short, sequence questions from easy to detailed, and show progress indicators to reduce abandonment.",
      "Prefer focused options over open text when the response needs to be comparable across submissions.",
    ],
  },
  "operational-reporting": {
    title: "Operational Reporting for Fast Decision Cycles",
    body: [
      "Reports should state issues, root causes, and next actions in that order so teams can execute quickly.",
      "Use a fixed report template to make monthly comparisons meaningful and easy to scan.",
    ],
  },
};

const BlogDetails = () => {
  const { id } = useParams<{ id: string }>();
  const article = (id && articles[id]) || {
    title: "Article not found",
    body: ["The requested article is unavailable.", "Browse the latest posts from our blog overview."],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-cyan-100 bg-white/95 p-8 shadow-sm md:p-12">
          <Link to="/blog" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">Back to blog</Link>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">{article.title}</h1>
          <div className="mt-6 space-y-4 text-slate-700">
            {article.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetails;
