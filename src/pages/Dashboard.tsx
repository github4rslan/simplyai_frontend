import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/dashboard/UserProfile";
import { UserReports } from "@/components/dashboard/UserReports";
import QuestionnaireView from "@/components/dashboard/QuestionnaireView";
import { UserSubscriptions } from "@/components/dashboard/UserSubscriptions";
import { User, FileText, LogOut, FileDown, Bell } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("questionnaire");

  useEffect(() => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Access required",
        description: "Please log in to access the dashboard",
      });
      navigate("/login");
    }
  }, [user, navigate, toast]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                User Dashboard
              </h1>
              <p className="text-slate-600 mt-1">
                Manage questionnaires, reports, subscriptions, and profile details.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={signOut}
              className="flex items-center gap-2 border-slate-300"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6 h-auto flex flex-wrap gap-2 bg-transparent p-0">
            <TabsTrigger
              value="questionnaire"
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 data-[state=active]:bg-cyan-700 data-[state=active]:text-white"
            >
              <Bell className="h-4 w-4" />
              Questionnaires
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 data-[state=active]:bg-cyan-700 data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4" />
              My reports
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 data-[state=active]:bg-cyan-700 data-[state=active]:text-white"
            >
              <FileDown className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 data-[state=active]:bg-cyan-700 data-[state=active]:text-white"
            >
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questionnaire" className="mt-0">
            <QuestionnaireView />
          </TabsContent>
          <TabsContent value="reports" className="mt-0">
            <UserReports />
          </TabsContent>
          <TabsContent value="subscriptions" className="mt-0">
            <UserSubscriptions />
          </TabsContent>
          <TabsContent value="profile" className="mt-0">
            <UserProfile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
