import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Guide = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-100 bg-white/95 p-8 shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Guide</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900">How SimplyAI works</h1>
          <p className="mt-4 max-w-2xl text-slate-600">A simple three-step process to go from data collection to decisions.</p>

          <ol className="mt-8 space-y-4">
            {[
              "Choose a plan that matches your reporting cadence.",
              "Complete your questionnaires with structured business inputs.",
              "Generate and review an AI-backed report with prioritized next actions.",
            ].map((step, index) => (
              <li key={step} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-700 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-sm text-slate-700">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <Link to="/contact" className="inline-flex rounded-full bg-cyan-700 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-800">
              Need help? Contact us
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Guide;
