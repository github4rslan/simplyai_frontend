import { API_BASE_URL } from "./api";
import { ENV } from "./env";

const getWindowLocation = () => {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.location.origin;
};

const deriveBackendUrl = (apiBaseUrl: string) => {
  const withoutApi = apiBaseUrl.replace(/\/api\/?$/, "");
  return withoutApi || apiBaseUrl;
};

const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || getWindowLocation() || "https://simplyai.it";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || deriveBackendUrl(API_BASE_URL);

const STRIPE_PUBLISHABLE_KEY = ENV.STRIPE_PUBLISHABLE_KEY || "";

export type AppConfig = {
  env: {
    mode: string;
    isDev: boolean;
    isProd: boolean;
  };
  api: {
    baseUrl: string;
  };
  frontend: {
    url: string;
  };
  backend: {
    url: string;
  };
  stripe: {
    publishableKey: string;
  };
};

export const appConfig: AppConfig = {
  env: {
    mode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  },
  api: {
    baseUrl: API_BASE_URL,
  },
  frontend: {
    url: FRONTEND_URL,
  },
  backend: {
    url: BACKEND_URL,
  },
  stripe: {
    publishableKey: STRIPE_PUBLISHABLE_KEY,
  },
};

export const getConfig = () => appConfig;

