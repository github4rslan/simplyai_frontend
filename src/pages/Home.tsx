import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAppSettings,
  fetchColorProfiles,
} from "@/services/settingsService";
import { fetchPageData, savePageData } from "@/services/pagesService";

type Page = { id: string; title: string; content: string };

const fallbackContent = `
  <div class="min-h-screen flex flex-col">
    <section class="flex-grow flex flex-col justify-center items-center text-center px-4 py-16 bg-[#7c6cc4]">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl md:text-6xl font-bold mb-6 bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-indigo)]">
          Ottimizza il tuo business con l'intelligenza artificiale
        </h1>
        <p class="text-xl mb-8 text-gray-700 max-w-2xl mx-auto">
          Rispondi a semplici domande e ottieni un report personalizzato per migliorare la tua azienda, creato con tecnologia AI avanzata.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/pricing" class="text-lg px-8 py-6 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)] text-white text-center">
            Inizia ora
          </a>
          <a href="/guide" class="text-lg px-8 py-6 rounded-full border border-gray-300 text-gray-700 text-center">
            Scopri di più
          </a>
          <a href="/register?plan=80d9fe63-0484-4a3b-ac1a-758cce2f9433&type=free" class="text-lg px-8 py-6 rounded-full bg-[#7c6cc4] text-gray-800 border border-gray-200 text-center">
            Fai un breve test gratuito
          </a>
        </div>
      </div>
    </section>

    <section class="py-16 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-center mb-12">Come funziona</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-[#7c6cc4] p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-4xl mb-4">📝</div>
            <h3 class="text-xl font-semibold mb-2">Rispondi al questionario</h3>
            <p class="text-gray-600">Compila un semplice questionario con domande sulla tua attività</p>
          </div>
          <div class="bg-[#7c6cc4] p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-4xl mb-4">🤖</div>
            <h3 class="text-xl font-semibold mb-2">Analisi AI</h3>
            <p class="text-gray-600">Il nostro sistema analizza le tue risposte e genera un report personalizzato</p>
          </div>
          <div class="bg-[#7c6cc4] p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-4xl mb-4">📈</div>
            <h3 class="text-xl font-semibold mb-2">Ottieni risultati</h3>
            <p class="text-gray-600">Ricevi consigli pratici e strategie per migliorare la tua azienda</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 px-4 bg-purple-50">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl font-bold mb-4">Pronto a trasformare la tua azienda?</h2>
        <p class="text-xl mb-8 text-gray-700">Scegli il piano più adatto alle tue esigenze e inizia oggi stesso.</p>
        <a href="/pricing" class="inline-block text-lg px-8 py-6 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)] text-white">
          Visualizza i piani
        </a>
      </div>
    </section>
  </div>
`;

const Home = () => {
  const { logout } = useAuth();
  const [colorProfiles, setColorProfiles] = React.useState([]);
  const [pageData, setPageData] = React.useState<Page>({
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
      {/* Hero Section */}
      <div
        id="homeJSX"
        dangerouslySetInnerHTML={{ __html: pageData.content }}
      ></div>
      <Footer />
    </div>
  );
};

export default Home;
