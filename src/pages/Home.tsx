import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchPageData } from "@/services/pagesService";

type Page = { id: string; title: string; content: string };

const fallbackContent = `
  <div class="min-h-screen flex flex-col">
    <section class="flex-grow flex flex-col justify-center items-center text-center px-4 py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
          Optimize your business with AI-powered insights
        </h1>
        <p class="text-lg md:text-xl mb-8 text-slate-200 max-w-2xl mx-auto">
          Complete a guided questionnaire and receive strategic recommendations tailored to your company.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/pricing" class="text-base md:text-lg px-7 py-4 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-center font-medium transition-colors">
            Get started
          </a>
          <a href="/guide" class="text-base md:text-lg px-7 py-4 rounded-full border border-slate-300 text-slate-100 text-center hover:bg-slate-700/30 transition-colors">
            Learn more
          </a>
          <a href="/register?plan=80d9fe63-0484-4a3b-ac1a-758cce2f9433&type=free" class="text-base md:text-lg px-7 py-4 rounded-full bg-white text-slate-900 border border-slate-200 text-center hover:bg-slate-100 transition-colors">
            Try free assessment
          </a>
        </div>
      </div>
    </section>

    <section class="py-16 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-center mb-12 text-slate-900">How it works</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
            <div class="text-3xl mb-4">1</div>
            <h3 class="text-xl font-semibold mb-2 text-slate-900">Complete the questionnaire</h3>
            <p class="text-slate-600">Answer practical business questions in a few minutes.</p>
          </div>
          <div class="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
            <div class="text-3xl mb-4">2</div>
            <h3 class="text-xl font-semibold mb-2 text-slate-900">AI analyzes your data</h3>
            <p class="text-slate-600">Our engine maps strengths, risks, and growth opportunities.</p>
          </div>
          <div class="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
            <div class="text-3xl mb-4">3</div>
            <h3 class="text-xl font-semibold mb-2 text-slate-900">Receive an action plan</h3>
            <p class="text-slate-600">Get a clear report with prioritized next steps.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 px-4 bg-cyan-50">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl font-bold mb-4 text-slate-900">Ready to scale with confidence?</h2>
        <p class="text-lg mb-8 text-slate-700">Choose the plan that matches your current stage and goals.</p>
        <a href="/pricing" class="inline-block text-base md:text-lg px-8 py-4 rounded-full bg-cyan-700 hover:bg-cyan-800 text-white font-medium transition-colors">
          View plans
        </a>
      </div>
    </section>
  </div>
`;

const Home = () => {
  const [pageData, setPageData] = useState<Page>({
    id: "home",
    title: "Home",
    content: fallbackContent,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPageData("home");
        if (data?.content) {
          setPageData(data);
        }
      } catch (error) {
        console.error("Failed to load home page content", error);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div id="homeJSX" dangerouslySetInnerHTML={{ __html: pageData.content }} />
      <Footer />
    </div>
  );
};

export default Home;
