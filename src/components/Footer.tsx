import React from "react";
import { Link } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";

const Footer = () => {
  const { settings } = useSettings();

  return (
    <footer className="mt-auto border-t border-cyan-100 bg-slate-950 text-slate-200">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <h3 className="text-lg font-semibold text-white">SimplyAI</h3>
          <p className="mt-3 text-sm text-slate-400">
            AI-assisted questionnaires and reports built for business clarity.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link to="/guide" className="hover:text-white">Guide</Link></li>
            <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service" className="hover:text-white">Terms of Service</Link></li>
            <li>
              <a
                href={settings?.site_url || `mailto:${settings?.contact_email || "info@simplyai.it"}`}
                target={settings?.site_url ? "_blank" : undefined}
                rel={settings?.site_url ? "noopener noreferrer" : undefined}
                className="hover:text-white"
              >
                {settings?.site_url || settings?.contact_email || "info@simplyai.it"}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        Copyright {new Date().getFullYear()} SimplyAI. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
