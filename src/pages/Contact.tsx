import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

const Contact = () => {
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      toast.success("Message sent successfully. We will contact you soon.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              Contact SimplyAI
            </h1>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Reach out with questions, product requests, or onboarding help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-4 space-y-4">
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-cyan-100 p-2 text-cyan-700">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Email</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {settings?.contact_email || "info@simplyai.it"}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-cyan-100 p-2 text-cyan-700">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Phone</h3>
                    <p className="text-sm text-slate-600 mt-1">+39 123 456 7890</p>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-cyan-100 p-2 text-cyan-700">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Address</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Via Roma 123, 00100 Rome, Italy
                    </p>
                  </div>
                </div>
              </article>
            </section>

            <section className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">
                Send a message
              </h2>
              <p className="text-sm text-slate-600 mt-1 mb-6">
                We usually respond within one business day.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-slate-700"
                    >
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="h-11 rounded-lg border-slate-300 focus-visible:ring-cyan-600"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      className="h-11 rounded-lg border-slate-300 focus-visible:ring-cyan-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="subject"
                    className="text-sm font-medium text-slate-700"
                  >
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    className="h-11 rounded-lg border-slate-300 focus-visible:ring-cyan-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="message"
                    className="text-sm font-medium text-slate-700"
                  >
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Share your request..."
                    rows={6}
                    className="rounded-lg border-slate-300 focus-visible:ring-cyan-600"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 w-full sm:w-auto rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white"
                >
                  {isSubmitting ? "Sending..." : "Send message"}
                </Button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
