import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CreditCard,
  FileEdit,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type AdminLayoutProps = {
  children?: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (path: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    match: (path) => path === "/admin",
  },
  {
    label: "Page Editor",
    href: "/admin/page-editor",
    icon: FileEdit,
    match: (path) => path.startsWith("/admin/page-editor"),
  },
  {
    label: "Form Builder",
    href: "/admin/form-builder",
    icon: Wrench,
    match: (path) => path.startsWith("/admin/form-builder"),
  },
  {
    label: "Plans",
    href: "/admin/plans",
    icon: CreditCard,
    match: (path) => path.startsWith("/admin/plans"),
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    match: (path) => path.startsWith("/admin/reports"),
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    match: (path) => path.startsWith("/admin/users"),
  },
  {
    label: "AI Providers",
    href: "/admin/chatgpt",
    icon: MessageSquare,
    match: (path) => path.startsWith("/admin/chatgpt"),
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    match: (path) => path.startsWith("/admin/settings"),
  },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "administrator") {
      navigate("/admin/login");
    }
  }, [user, navigate]);

  const currentSection = useMemo(() => {
    const item = NAV_ITEMS.find((nav) => nav.match(location.pathname));
    return item?.label || "Admin";
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const Sidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <aside className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-5 py-5">
        <Link to="/" className="block">
          <p className="text-xs uppercase tracking-wide text-cyan-300">SimplyAI</p>
          <h1 className="mt-1 text-lg font-semibold">Admin Console</h1>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match(location.pathname);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                active
                  ? "bg-cyan-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-slate-100">
      <div className="md:hidden border-b border-cyan-100 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-cyan-700">Admin</p>
            <p className="text-sm font-semibold text-slate-900">{currentSection}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen((prev) => !prev)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 md:hidden">
            <Sidebar isMobile />
          </div>
        </>
      )}

      <div className="mx-auto flex w-full max-w-[1600px]">
        <div className="hidden h-screen w-72 md:sticky md:top-0 md:block">
          <Sidebar />
        </div>

        <div className="flex-1">
          <header className="hidden border-b border-cyan-100 bg-white/85 px-6 py-4 backdrop-blur md:block">
            <p className="text-xs uppercase tracking-wide text-cyan-700">Administration</p>
            <h2 className="text-xl font-semibold text-slate-900">{currentSection}</h2>
          </header>
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
