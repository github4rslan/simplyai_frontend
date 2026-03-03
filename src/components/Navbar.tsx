import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/api";

const DEFAULT_LOGO = "/logo.png";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [siteName, setSiteName] = useState("SimplyAI");
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/settings`);
        const json = await res.json();
        if (json.success && json.data) {
          setSiteName(json.data.site_name || "SimplyAI");
          setLogoUrl(json.data.logo || DEFAULT_LOGO);
        }
      } catch {
        setLogoUrl(DEFAULT_LOGO);
      }
    };

    loadSettings();
  }, []);

  const navLinks = [
    { to: "/about", label: "About" },
    { to: "/services", label: "Services" },
    { to: "/guide", label: "Guide" },
    { to: "/pricing", label: "Pricing" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-100 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt={siteName}
            onError={() => setLogoUrl(DEFAULT_LOGO)}
            className="h-11 w-11 rounded-xl border border-cyan-100 bg-white p-1 object-contain"
          />
          <div className="hidden sm:block">
            <p className="text-sm text-slate-500">AI Platform</p>
            <p className="text-base font-semibold text-slate-900">{siteName}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-slate-600 hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button size="sm" className="bg-cyan-700 text-white hover:bg-cyan-800">Dashboard</Button>
              </Link>
              <Link to="/profile">
                <Button size="sm" variant="outline" className="border-cyan-200 text-cyan-800 hover:bg-cyan-50">Account</Button>
              </Link>
              <Button
                onClick={() => signOut()}
                variant="outline"
                size="sm"
                className="border-slate-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button size="sm" variant="outline" className="border-cyan-200 text-cyan-800 hover:bg-cyan-50">Log in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-cyan-700 text-white hover:bg-cyan-800">Get started</Button>
              </Link>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t border-cyan-100 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-cyan-50"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-cyan-700 text-white hover:bg-cyan-800">Dashboard</Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-cyan-700 text-white hover:bg-cyan-800">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
