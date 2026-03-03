import React from "react";
import { Link } from "react-router-dom";
import { User, Settings, LayoutDashboard } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Account = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-cyan-50 via-white to-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-3xl border border-cyan-100 bg-white/90 p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-700">
            Account Center
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage your account</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Access your dashboard, update your profile information, and manage preferences.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-cyan-100 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <LayoutDashboard className="h-4 w-4 text-cyan-600" />
                Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-cyan-600 text-white hover:bg-cyan-700">
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-cyan-100 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-cyan-600" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                <Link to="/profile">Edit profile</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-cyan-100 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4 text-cyan-600" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                <Link to="/settings">Open settings</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
