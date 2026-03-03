import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Services = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-100 bg-white/95 p-8 shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Services</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900 md:text-5xl">What we deliver</h1>
          <p className="mt-4 max-w-2xl text-slate-600">End-to-end assessment workflows for teams that need better decisions and measurable outcomes.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { title: "AI Readiness Assessment", text: "Assess current process maturity and identify top improvement opportunities." },
              { title: "Custom Questionnaire Design", text: "Build multi-step forms aligned with your business model and goals." },
              { title: "Automated Reporting", text: "Generate report documents with clear recommendations and priorities." },
              { title: "Progress Tracking", text: "Repeat assessments periodically and compare trend lines over time." },
            ].map((service) => (
              <article key={service.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-xl font-semibold text-slate-900">{service.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{service.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8">
            <Link to="/contact" className="inline-flex rounded-full bg-cyan-700 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-800">
              Talk to us
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
