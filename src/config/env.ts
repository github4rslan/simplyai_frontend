const DEFAULT_API_BASE_URL = "/api";

const runtimeConfiguredBaseUrl =
  typeof window !== "undefined" ? window.__APP_CONFIG__?.API_BASE_URL : undefined;

// Environment configuration
export const ENV = {
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ||
    runtimeConfiguredBaseUrl ||
    DEFAULT_API_BASE_URL,
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
} as const;

