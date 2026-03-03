import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ComingSoon = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl border border-cyan-100 bg-white/95 p-10 text-center shadow-sm md:p-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Coming Soon</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900">New experience in progress</h1>
          <p className="mt-3 text-slate-600">We are actively shipping this section. Check back shortly.</p>
          <div className="mt-6">
            <Link to="/" className="inline-flex rounded-full bg-cyan-700 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-800">
              Back to home
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ComingSoon;
