import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Business intelligence, simplified</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Assess faster. Decide better. Scale confidently.
              </h1>
              <p className="mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
                Run structured assessments, generate AI-backed reports, and align your team on the next best actions.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/register" className="rounded-full bg-cyan-700 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-800">
                  Start free
                </Link>
                <Link to="/pricing" className="rounded-full border border-cyan-200 bg-white px-6 py-3 text-sm font-semibold text-cyan-800 hover:bg-cyan-50">
                  View plans
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-xl">
              <div className="rounded-2xl bg-slate-900 p-5 text-slate-100">
                <p className="text-xs uppercase tracking-wide text-cyan-300">Preview</p>
                <h2 className="mt-2 text-xl font-semibold">Assessment Snapshot</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="rounded-lg bg-white/10 p-3">Operational maturity: <span className="font-semibold text-cyan-300">72/100</span></li>
                  <li className="rounded-lg bg-white/10 p-3">Top priority: Process automation in customer onboarding</li>
                  <li className="rounded-lg bg-white/10 p-3">Expected outcome: 28% cycle-time reduction</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-7xl gap-4 md:grid-cols-3">
            {[
              { title: "Smart questionnaires", text: "Multi-step forms with logic and progression controls." },
              { title: "Actionable reports", text: "AI-generated summaries with practical recommendations." },
              { title: "Continuous tracking", text: "Repeat cycles to measure trend and execution impact." },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
