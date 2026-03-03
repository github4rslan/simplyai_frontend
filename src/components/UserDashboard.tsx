import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  User,
  FileText,
  LogOut,
  CheckSquare,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/api";
import { UserProfile } from "./dashboard/UserProfile";
import { UserReports } from "./dashboard/UserReports";
import { UserQuestionnaires } from "./dashboard/UserQuestionnaires";
import { UserSubscriptions } from "./dashboard/UserSubscriptions";

type DashboardTab = "questionnaires" | "reports" | "subscriptions" | "profile";

const NAV_ITEMS: Array<{ key: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "questionnaires", label: "Questionnaires", icon: CheckSquare },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { key: "profile", label: "Profile", icon: User },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, loading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>("questionnaires");
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.innerWidth < 768;
  });
  const [siteName, setSiteName] = useState("SimplyAI");
  const [logoUrl, setLogoUrl] = useState("/logo.png");

  useEffect(() => {
    if (!loading && !token) {
      navigate("/login");
    }
  }, [loading, token, navigate]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        const result = await response.json();

        if (result.success && result.data) {
          setSiteName(result.data.site_name || "SimplyAI");
          if (result.data.logo) {
            setLogoUrl(result.data.logo);
          }
        }
      } catch (error) {
        setLogoUrl("/logo.png");
      }
    };

    if (token) {
      loadSettings();
    }
  }, [token]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logged out", description: "Your session has ended." });
      navigate("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cyan-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!token) {
    return null;
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-cyan-100 p-5">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt={siteName}
            onError={() => setLogoUrl("/logo.png")}
            className="h-10 w-10 rounded-xl border border-cyan-100 object-contain"
          />
          <div>
            <p className="text-sm text-slate-500">Workspace</p>
            <p className="text-sm font-semibold text-slate-900">{siteName}</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.key;

          return (
            <Button
              key={item.key}
              variant="ghost"
              onClick={() => setActiveTab(item.key)}
              className={`w-full justify-start gap-2 ${
                selected
                  ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-100"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </div>

      <div className="border-t border-cyan-100 p-3">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-cyan-50 via-white to-slate-100">
      {!isMobile && <aside className="hidden w-72 border-r border-cyan-100 bg-white/90 md:block"><Sidebar /></aside>}

      <main className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-cyan-100 bg-white/85 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <Sidebar />
                  </SheetContent>
                </Sheet>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-cyan-700">Dashboard</p>
                <h1 className="text-lg font-semibold text-slate-900">Welcome{user?.firstName ? `, ${user.firstName}` : ""}</h1>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        <section className="flex-1 p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)} className="space-y-4">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
              {NAV_ITEMS.map((item) => (
                <TabsTrigger
                  key={item.key}
                  value={item.key}
                  className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-slate-600 data-[state=active]:border-cyan-600 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="questionnaires">
              <UserQuestionnaires />
            </TabsContent>
            <TabsContent value="reports">
              <UserReports />
            </TabsContent>
            <TabsContent value="subscriptions">
              <UserSubscriptions />
            </TabsContent>
            <TabsContent value="profile">
              <UserProfile />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default UserDashboard;
