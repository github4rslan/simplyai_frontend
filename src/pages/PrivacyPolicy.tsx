import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-cyan-100 bg-white/95 p-8 shadow-sm md:p-12">
          <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: March 3, 2026</p>

          <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Data we collect</h2>
              <p>We collect account details, questionnaire responses, and usage diagnostics needed to run the service.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-slate-900">How we use data</h2>
              <p>Data is used to authenticate users, generate reports, provide support, and improve platform quality.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Retention and deletion</h2>
              <p>We retain data only as long as required for operations and legal obligations. You can request deletion through support.</p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
