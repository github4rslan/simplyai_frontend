import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { appConfig } from './config'

// Expose API config to global scope for use in index.html
declare global {
  interface Window {
    __APP_CONFIG__: {
      API_BASE_URL: string;
    };
  }
}

window.__APP_CONFIG__ = {
  API_BASE_URL: appConfig.api.baseUrl
};

createRoot(document.getElementById("root")!).render(<App />);
