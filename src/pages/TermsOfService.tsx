import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-cyan-100 bg-white/95 p-8 shadow-sm md:p-12">
          <h1 className="text-3xl font-semibold text-slate-900">Terms of Service</h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: March 3, 2026</p>

          <div className="mt-6 space-y-5 text-sm leading-6 text-slate-700">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Use of service</h2>
              <p>You agree to use the platform lawfully and keep account credentials secure.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Billing and plans</h2>
              <p>Paid features are governed by plan terms shown during checkout and may change with notice.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Limitations</h2>
              <p>Generated reports are decision-support materials and do not replace legal, medical, or financial advice.</p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
