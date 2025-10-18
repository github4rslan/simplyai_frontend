import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchAppSettings } from "@/services/settingsService";

interface AppSettings {
  site_name?: string;
  site_description?: string;
  contact_email?: string;
  site_url?: string;
  logo?: string;
  favicon?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
  font_size?: string;
  button_style?: string;
  enable_registration?: boolean;
  require_email_verification?: boolean;
  max_storage_per_user?: number;
  // Add other settings as needed
}

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  refetchSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refetchSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchAppSettings();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchSettings();
  }, []);

  const value = {
    settings,
    loading,
    refetchSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
