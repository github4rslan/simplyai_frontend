// API Configuration
const DEFAULT_API_BASE_URL = "/api";
const runtimeConfiguredBaseUrl =
  typeof window !== "undefined" ? window.__APP_CONFIG__?.API_BASE_URL : undefined;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  runtimeConfiguredBaseUrl ||
  DEFAULT_API_BASE_URL;

if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    "[API CONFIG] VITE_API_BASE_URL is not set. Falling back to",
    DEFAULT_API_BASE_URL
  );
}

if (import.meta.env.DEV) {
  console.log("API Config - VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
  console.log("API Config - Final API_BASE_URL:", API_BASE_URL);
}

