import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-100 bg-white/95 p-8 shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">About SimplyAI</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-slate-900 md:text-5xl">
            We turn complex business data into clear next actions.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            SimplyAI helps teams understand where they stand, what to improve, and how to execute with confidence using guided questionnaires and AI-generated reports.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { title: "Clarity", text: "Structured outputs your whole team can act on." },
              { title: "Speed", text: "From input to report in minutes, not weeks." },
              { title: "Progress", text: "Track improvements over time with repeatable workflows." },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-100 bg-cyan-50/70 p-8 md:p-10">
          <h2 className="text-2xl font-semibold text-slate-900">Built for operators, not only analysts</h2>
          <p className="mt-3 max-w-3xl text-slate-700">
            Our product is designed so founders, managers, and teams can align on priorities quickly without a heavy BI setup.
          </p>
          <div className="mt-6">
            <Link to="/pricing" className="inline-flex rounded-full bg-cyan-700 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-800">
              See plans
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
