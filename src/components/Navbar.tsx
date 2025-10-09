import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/api";
// import { getAppSettings } from '@/integrations/supabase/client';
import { LogOut } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [siteName, setSiteName] = useState("SimolyAI");
  const [logoUrl, setLogoUrl] = useState("/logo.png");

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      const json = await res.json();
      console.log("App settingsss:", json.data.logo);
      if (json.success && json.data) {
        setSiteName(json.data.site_name || "SimolyAI");
        if (json.data.logo) {
          // If the logo is a local file name (e.g. logo-xxxx.png), serve from public root
          setLogoUrl(`${json.data.logo}`);
        }
      }
    } catch (err) {
      // Optionally handle error
      console.error("Failed to load settings:", err);
    }
  };

  useEffect(() => {
    loadSettings();

    // Listen for logo update events
    const handleLogoUpdate = () => {
      console.log("Logo update event received, refreshing settings...");
      loadSettings();
    };

    // Add event listener for logo updates
    window.addEventListener("logoUpdated", handleLogoUpdate);

    // Cleanup
    return () => {
      window.removeEventListener("logoUpdated", handleLogoUpdate);
    };
  }, []);
  console.log("Logoooooooo do", logoUrl);
  return (
    <nav className="w-full py-4 px-6 flex justify-between items-center border-b border-gray-100">
      <div className="flex items-center">
        <Link
          to="/"
          className="text-2xl font-bold text-[var(--color-primary)] flex items-center"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-20 w-20 mr-3 rounded-lg object-contain site-logo"
            />
          ) : null}

          {/* <span>{siteName}</span> */}
        </Link>
        <div className="hidden md:flex ml-10 space-x-8">
          <Link to="/about" className="text-gray-600 hover:text-gray-900">
            Chi Siamo
          </Link>
          <Link to="/guide" className="text-gray-600 hover:text-gray-900">
            Guida
          </Link>
          <Link to="/pricing" className="text-gray-600 hover:text-gray-900">
            Prezzi
          </Link>
          <Link to="/contact" className="text-gray-600 hover:text-gray-900">
            Contatti
          </Link>
        </div>
      </div>
      <div className="space-x-2">
        {user ? (
          <div className="flex space-x-2">
            <Link to="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link to="/profile">
              <Button>Account</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm("Sei sicuro di voler uscire?")) signOut();
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Link to="/login">
              <Button variant="outline">Accedi</Button>
            </Link>
            <Link to="/register">
              <Button>Registrati</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
