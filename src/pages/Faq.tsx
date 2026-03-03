import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Faq = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-100 bg-white/95 p-8 shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">FAQ</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900">Common questions</h1>

          <Accordion type="single" collapsible className="mt-8 w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How long does an assessment take?</AccordionTrigger>
              <AccordionContent>Most users complete it in 15-25 minutes depending on detail level.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I update responses later?</AccordionTrigger>
              <AccordionContent>Yes. You can re-open questionnaires and submit updated data for a new report cycle.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Do you support recurring assessments?</AccordionTrigger>
              <AccordionContent>Yes. Periodic plan options support repeated questionnaires and progress tracking.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Faq;
