import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, BarChart3, FileText, LayoutGrid, Settings, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { dashboardService } from "@/services/dashboardService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type DashboardStats = {
  totalUsers: number;
  activeQuestionnaires: number;
  completedQuestionnaires: number;
  totalReports: number;
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeQuestionnaires: 0,
    completedQuestionnaires: 0,
    totalReports: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentQuestionnaires, setRecentQuestionnaires] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(false);

        const [statsData, usersData, responsesData] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getRecentUsers().catch(() => []),
          dashboardService.getRecentResponses().catch(() => []),
        ]);

        setStats({
          totalUsers: statsData?.totalUsers || 0,
          activeQuestionnaires: statsData?.activeQuestionnaires || 0,
          completedQuestionnaires: statsData?.completedQuestionnaires || 0,
          totalReports: statsData?.totalReports || 0,
        });
        setRecentUsers(usersData || []);
        setRecentQuestionnaires(responsesData || []);
      } catch (err) {
        setError(true);
        toast({
          title: "Dashboard error",
          description: "Could not load admin analytics.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [toast]);

  if (loading) {
    return <div className="rounded-2xl border border-cyan-100 bg-white p-8 text-center">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-cyan-100 bg-white/90 p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Admin Overview</h1>
        <p className="mt-1 text-sm text-slate-600">Monitor platform activity and manage core workflows.</p>
      </section>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <p className="font-medium">Data source issue</p>
            <p className="text-sm">Some dashboard data could not be loaded.</p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Users", value: stats.totalUsers, href: "/admin/users", icon: Users },
          { label: "Active Questionnaires", value: stats.activeQuestionnaires, href: "/admin/form-builder", icon: FileText },
          { label: "Completed Questionnaires", value: stats.completedQuestionnaires, href: "/admin/form-builder", icon: LayoutGrid },
          { label: "Reports", value: stats.totalReports, href: "/admin/reports", icon: BarChart3 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-cyan-100 bg-white/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-3xl">{item.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to={item.href}>
                  <Button variant="outline" className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                    <Icon className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="rounded-full border border-cyan-200 bg-white p-1">
          <TabsTrigger value="users" className="rounded-full">Recent Users</TabsTrigger>
          <TabsTrigger value="responses" className="rounded-full">Recent Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="border-cyan-100 bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle>Latest Registered Users</CardTitle>
              <CardDescription>Most recent user signups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-slate-500">No recent users.</p>
              ) : (
                recentUsers.slice(0, 8).map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <p className="font-medium text-slate-900">{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}</p>
                      <p className="text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString("en-US")}</p>
                    </div>
                    <Link to={`/admin/users/${user.id}`}>
                      <Button size="sm" variant="outline">Details</Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <Card className="border-cyan-100 bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle>Latest Questionnaire Responses</CardTitle>
              <CardDescription>Recently submitted forms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentQuestionnaires.length === 0 ? (
                <p className="text-sm text-slate-500">No recent responses.</p>
              ) : (
                recentQuestionnaires.slice(0, 8).map((response) => (
                  <div key={response.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900">Response #{String(response.id).slice(0, 8)}</p>
                      <span className={`rounded-full px-2 py-1 text-xs ${response.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {response.status === "completed" ? "Completed" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{new Date(response.created_at).toLocaleDateString("en-US")}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-cyan-100 bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/admin/users"><Button variant="outline" className="w-full justify-start">User Management</Button></Link>
            <Link to="/admin/page-editor"><Button variant="outline" className="w-full justify-start">Page Editor</Button></Link>
            <Link to="/admin/form-builder"><Button variant="outline" className="w-full justify-start">Form Builder</Button></Link>
            <Link to="/admin/settings"><Button variant="outline" className="w-full justify-start">System Settings</Button></Link>
          </CardContent>
        </Card>

        <Card className="border-cyan-100 bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="flex justify-between border-b pb-2"><span>Version</span><span>1.0.0</span></div>
            <div className="flex justify-between border-b pb-2"><span>Database</span><span className={error ? "text-red-600" : "text-emerald-600"}>{error ? "Issue" : "Online"}</span></div>
            <div className="flex justify-between border-b pb-2"><span>Storage</span><span className="text-emerald-600">Online</span></div>
            <div className="flex justify-between"><span>Total Reports</span><span>{stats.totalReports}</span></div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminDashboard;
