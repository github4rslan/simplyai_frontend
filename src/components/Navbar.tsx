import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/api";
// import { getAppSettings } from '@/integrations/supabase/client';
import { LogOut } from "lucide-react";

const DEFAULT_LOGO = "/logo.png";

type LogoUpdateDetail = {
  logoUrl?: string;
  cacheKey?: number;
};

const buildVersionedAssetUrl = (url: string, cacheKey?: number | string) => {
  if (!url) {
    return DEFAULT_LOGO;
  }

  let parsedCacheValue: number | undefined;
  if (typeof cacheKey === "number") {
    parsedCacheValue = cacheKey;
  } else if (typeof cacheKey === "string") {
    const parsed = Date.parse(cacheKey);
    if (!Number.isNaN(parsed)) {
      parsedCacheValue = parsed;
    }
  }

  const finalCacheKey = parsedCacheValue ?? Date.now();

  // Normalize URL - if it's an absolute URL from a different origin, convert to relative
  let normalizedUrl = url;
  try {
    const parsedUrl = new URL(url, window.location.origin);
    // If it's from a different origin, use just the pathname
    if (parsedUrl.origin !== window.location.origin && url.startsWith('http')) {
      normalizedUrl = parsedUrl.pathname;
    }
  } catch {
    // If URL parsing fails, assume it's already relative or malformed
    normalizedUrl = url;
  }

  // If it's already a relative URL starting with /, use it directly
  if (normalizedUrl.startsWith('/')) {
    const separator = normalizedUrl.includes("?") ? "&" : "?";
    return `${normalizedUrl}${separator}v=${finalCacheKey}`;
  }

  // Otherwise, try to build a proper URL
  try {
    const parsedUrl = new URL(normalizedUrl, window.location.origin);
    parsedUrl.searchParams.set("v", String(finalCacheKey));
    return parsedUrl.toString();
  } catch {
    const separator = normalizedUrl.includes("?") ? "&" : "?";
    return `${normalizedUrl}${separator}v=${finalCacheKey}`;
  }
};

const preloadImage = (url: string) => {
  if (!url) return;
  const img = new Image();
  img.src = url;
};

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [siteName, setSiteName] = useState("SimplyAI");
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [logoReady, setLogoReady] = useState(true);

  const updateLogo = (rawUrl?: string, cacheKey?: number | string) => {
    if (!rawUrl) {
      setLogoUrl(DEFAULT_LOGO);
      setLogoReady(true);
      return;
    }
    
    // If the URL is absolute but doesn't match current origin, convert to relative
    let processedUrl = rawUrl;
    try {
      const url = new URL(rawUrl, window.location.origin);
      // If it's an absolute URL from a different origin, use relative path
      if (url.origin !== window.location.origin && rawUrl.startsWith('http')) {
        // Extract just the pathname
        processedUrl = url.pathname;
      }
    } catch {
      // If URL parsing fails, use as-is (might be relative already)
      processedUrl = rawUrl;
    }
    
    const nextLogoUrl = buildVersionedAssetUrl(processedUrl, cacheKey);
    preloadImage(nextLogoUrl);
    setLogoReady(false);
    setLogoUrl(nextLogoUrl);
  };

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      const json = await res.json();
      console.log("App settings loaded:", {
        success: json.success,
        logo: json.data?.logo,
        logoVersion: json.data?.logo_version,
        updatedAt: json.data?.updated_at
      });
      if (json.success && json.data) {
        setSiteName(json.data.site_name || "SimplyAI");
        if (json.data.logo) {
          console.log("Updating logo with URL:", json.data.logo);
          updateLogo(json.data.logo, json.data.logo_version || json.data.updated_at);
        } else {
          console.log("No logo in settings, using default");
          setLogoUrl(DEFAULT_LOGO);
          setLogoReady(true);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      // Fallback to default logo on error
      setLogoUrl(DEFAULT_LOGO);
      setLogoReady(true);
    }
  };

  useEffect(() => {
    loadSettings();

    // Listen for logo update events
    const handleLogoUpdate = (event: Event) => {
      console.log("Logo update event received, refreshing logo...");
      const detail = (event as CustomEvent<LogoUpdateDetail>).detail;
      if (detail?.logoUrl) {
        updateLogo(detail.logoUrl, detail.cacheKey);
      } else {
        loadSettings();
      }
    };

    // Add event listener for logo updates
    window.addEventListener("logoUpdated", handleLogoUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener(
        "logoUpdated",
        handleLogoUpdate as EventListener
      );
    };
  }, []);

  return (
    <nav className="w-full py-3 px-4 md:px-6 flex justify-between items-center border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center min-w-0">
        <Link
          to="/"
          className="text-2xl font-bold text-[var(--color-primary)] flex items-center min-w-0"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              onLoad={() => {
                console.log("Logo loaded successfully:", logoUrl);
                setLogoReady(true);
              }}
              onError={(e) => {
                console.error("Logo failed to load:", logoUrl, e);
                // Fallback to default logo on error
                setLogoUrl(DEFAULT_LOGO);
                setLogoReady(true);
              }}
              className={`h-12 w-12 md:h-14 md:w-14 mr-3 rounded-lg object-contain site-logo transition-opacity duration-200 ${
                logoReady ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : null}

          {/* <span>{siteName}</span> */}
        </Link>
        <div className="hidden md:flex ml-8 space-x-6">
          <Link to="/about" className="text-slate-600 hover:text-slate-900 transition-colors">
            About Us
          </Link>
          <Link to="/guide" className="text-slate-600 hover:text-slate-900 transition-colors">
            Guide
          </Link>
          <Link to="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">
            Pricing
          </Link>
          <Link to="/contact" className="text-slate-600 hover:text-slate-900 transition-colors">
            Contact
          </Link>
        </div>
      </div>
      <div className="space-x-2 shrink-0">
        {user ? (
          <div className="flex items-center space-x-2">
            <Link to="/dashboard">
              <Button size="sm" className="bg-cyan-700 hover:bg-cyan-800 text-white">Dashboard</Button>
            </Link>
            <Link to="/profile" className="hidden sm:inline-flex">
              <Button size="sm" variant="outline" className="border-slate-300">Account</Button>
            </Link>
            <Button
              onClick={() => {
                if (window.confirm("Are you sure you want to log out?")) signOut();
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-slate-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link to="/login">
              <Button size="sm" variant="outline" className="border-slate-300">Log In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-cyan-700 hover:bg-cyan-800 text-white">Register</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
