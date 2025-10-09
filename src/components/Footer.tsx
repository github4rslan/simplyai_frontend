import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';

const Footer = () => {
  const { settings } = useSettings();
  return (
    <footer className="w-full bg-white border-t border-gray-100 py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/favicon.ico" alt="SimolyAI Logo" className="h-8" />
          <span className="font-semibold text-gray-700">SimolyAI</span>
        </div>
        <div className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} SimolyAI. Tutti i diritti riservati.</div>
        <div className="flex gap-4">
          {settings?.site_url ? (
            <a 
              href={settings.site_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[var(--color-primary)]"
            >
              {settings.site_url}
            </a>
          ) : (
            <a 
              href={`mailto:${settings?.contact_email || 'info@simolyai.com'}`}
              className="hover:text-[var(--color-primary)]"
            >
              {settings?.contact_email || 'info@simolyai.com'}
            </a>
          )}
          <a href="https://facebook.com/simolyai" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)]">Facebook</a>
          <a href="https://twitter.com/simolyai" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)]">Twitter</a>
          <a href="https://linkedin.com/company/simolyai" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)]">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
