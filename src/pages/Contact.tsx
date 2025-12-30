import React, { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";
import { fetchPageData, savePageData } from "@/services/pagesService";
import { useSettings } from "@/contexts/SettingsContext";

// Define the Page type
type Page = { id: string; title: string; content: string };

// Static JSX content for the Contact page (without Navbar since it's rendered separately)
// Note: This uses default values since it's rendered outside React context
const staticContactData = (
    <div
      className="flex-grow py-16 px-4 bg-gradient-to-b from-white to-[var(--color-primary-100)]"
      id="contactJSX"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Contattaci</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Siamo qui per rispondere a tutte le tue domande e aiutarti a
            ottenere il massimo dalla nostra piattaforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Info di contatto */}
          <div className="md:col-span-1 space-y-8">
            <div className="bg-[#7c6cc4] p-6 rounded-xl shadow-sm hover:drop-shadow-md transition-all duration-300">
              <div className="flex items-start">
                <div className="bg-[var(--color-primary-100)] p-3 rounded-lg mr-4">
                  <Mail className="h-6 w-6 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-1">Email</h3>
                  <p className="text-gray-600">info@simolyai.com</p>
                </div>
              </div>
            </div>

            <div className="bg-[#7c6cc4] p-6 rounded-xl shadow-sm hover:drop-shadow-md transition-all duration-300">
              <div className="flex items-start">
                <div className="bg-[var(--color-primary-100)] p-3 rounded-lg mr-4">
                  <Phone className="h-6 w-6 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-1">Telefono</h3>
                  <p className="text-gray-600">+39 123 456 7890</p>
                </div>
              </div>
            </div>

            <div className="bg-[#7c6cc4] p-6 rounded-xl shadow-sm hover:drop-shadow-md transition-all duration-300">
              <div className="flex items-start">
                <div className="bg-[var(--color-primary-100)] p-3 rounded-lg mr-4">
                  <MapPin className="h-6 w-6 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-1">Indirizzo</h3>
                  <p className="text-gray-600">
                    Via Roma 123, 00100 Roma, Italy
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

const fallbackContent = renderToStaticMarkup(staticContactData);

const Contact = () => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simula l'invio del form
    setTimeout(() => {
      toast.success(
        "Messaggio inviato con successo! Ti risponderemo al più presto."
      );
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const [pageData, setPageData] = React.useState<Page>({
    id: "contact",
    title: "Contatti",
    content: fallbackContent,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPageData("contact");
        if (data?.content) {
          setPageData(data);
        }
      } catch (error) {
        console.error("Failed to load contact page content", error);
      }
    };
    loadData();
  }, []);

  // useEffect(() => {
  //   const savePageDataDB = async () => {
  //     const data = document.getElementById("contactJSX");
  //     console.log(data);
  //     const response = await savePageData({
  //       id: "contact",
  //       title: "Contatti",
  //       content: data.innerHTML,
  //     });
  //   };
  //   savePageDataDB();
  // }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-16 px-4 bg-gradient-to-b from-white to-[var(--color-primary-100)] mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Contattaci</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Siamo qui per rispondere a tutte le tue domande e aiutarti a
              ottenere il massimo dalla nostra piattaforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Info di contatto */}
            <div className="md:col-span-1 space-y-8">
              <div className="bg-[#7c6cc4] p-6 rounded-xl shadow-sm hover:drop-shadow-md transition-all duration-300">
                <div className="flex items-start">
                  <div className="bg-[var(--color-primary-100)] p-3 rounded-lg mr-4">
                    <Mail className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">Email</h3>
                    <p className="text-gray-600">{settings?.contact_email || 'info@simolyai.com'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#7c6cc4] p-6 rounded-xl shadow-sm hover:drop-shadow-md transition-all duration-300">
                <div className="flex items-start">
                  <div className="bg-[var(--color-primary-100)] p-3 rounded-lg mr-4">
                    <Phone className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">Telefono</h3>
                    <p className="text-gray-600">+39 123 456 7890</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#7c6cc4] p-6 rounded-xl shadow-sm hover:drop-shadow-md transition-all duration-300">
                <div className="flex items-start">
                  <div className="bg-[var(--color-primary-100)] p-3 rounded-lg mr-4">
                    <MapPin className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">Indirizzo</h3>
                    <p className="text-gray-600">
                      Via Roma 123, 00100 Roma, Italy
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form di contatto - rendered as React component */}
            <div className="md:col-span-2 bg-[#7c6cc4] p-8 rounded-xl shadow-sm">
              <h2 className="text-2xl font-semibold mb-6">
                Inviaci un messaggio
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nome
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Il tuo nome"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="La tua email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Oggetto
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Oggetto del messaggio"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Messaggio
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Il tuo messaggio"
                    rows={5}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full py-6 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Invio in corso..." : "Invia messaggio"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
