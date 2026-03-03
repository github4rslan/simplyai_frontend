import React, { useEffect, useMemo, useState } from "react";
import { format, subDays, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Calendar, Download, FileCheck, Filter, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchUserStatistics,
  fetchQuestionnaireStatistics,
  fetchSubscriptionStatistics,
  fetchQuestionAnswerStats,
  fetchAllQuestions,
} from "@/services/admin-statistics";
import { toast } from "@/components/ui/use-toast";

const COLORS = ["#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#a855f7"];

type DateRange = { from: Date | null; to: Date | null };

const datePresets = [
  { value: "30", label: "Last 30 days", getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { value: "90", label: "Last 90 days", getRange: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { value: "180", label: "Last 6 months", getRange: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
  { value: "365", label: "Last 12 months", getRange: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
];

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState("30");
  const [dateRange, setDateRange] = useState<DateRange>(datePresets[0].getRange());

  const [userStats, setUserStats] = useState<any>(null);
  const [questionnaireStats, setQuestionnaireStats] = useState<any>(null);
  const [subscriptionStats, setSubscriptionStats] = useState<any>(null);

  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [questionData, setQuestionData] = useState<any>(null);

  const dateLabel = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return "All time";
    return `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`;
  }, [dateRange]);

  const exportCsv = (rows: Record<string, any>[], filename: string) => {
    if (!rows?.length) {
      toast({ title: "No data", description: "There is no data to export.", variant: "destructive" });
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : String(value ?? "");
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Export ready", description: `Downloaded ${filename}.csv` });
  };

  const loadStatistics = async (range: DateRange) => {
    try {
      setLoading(true);
      const [users, questionnaires, subscriptions] = await Promise.all([
        fetchUserStatistics(range, {}),
        fetchQuestionnaireStatistics(range, {}),
        fetchSubscriptionStatistics(range, {}),
      ]);
      setUserStats(users);
      setQuestionnaireStats(questionnaires);
      setSubscriptionStats(subscriptions);
    } catch (error) {
      console.error("Failed loading reports:", error);
      toast({ title: "Load failed", description: "Unable to fetch analytics data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics(dateRange);
  }, [dateRange]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const allQuestions = await fetchAllQuestions();
        setQuestions(allQuestions || []);
        if (allQuestions?.length) {
          setSelectedQuestion(allQuestions[0].questionId);
        }
      } catch (error) {
        console.error("Failed loading questions:", error);
      }
    };
    loadQuestions();
  }, []);

  useEffect(() => {
    const loadQuestionData = async () => {
      if (!selectedQuestion) return;
      try {
        const data = await fetchQuestionAnswerStats(selectedQuestion, dateRange, {});
        setQuestionData(data);
      } catch (error) {
        console.error("Failed loading question stats:", error);
      }
    };
    loadQuestionData();
  }, [selectedQuestion, dateRange]);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const item = datePresets.find((d) => d.value === value);
    if (item) {
      setDateRange(item.getRange());
    }
  };

  if (loading && !userStats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-cyan-100 bg-white/95 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Analytics Reports</h1>
          <p className="mt-1 text-sm text-slate-600">Platform metrics and trends for the selected period.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
            <Calendar className="mr-2 h-4 w-4" />
            {dateLabel}
          </Button>
          <Select value={preset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-[180px] border-cyan-200">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {datePresets.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-cyan-100 bg-white/95 shadow-sm">
          <CardHeader className="pb-2"><CardDescription>Users</CardDescription><CardTitle className="text-3xl">{userStats?.totalUsers || 0}</CardTitle></CardHeader>
          <CardContent><Badge className="bg-cyan-100 text-cyan-700">Total accounts</Badge></CardContent>
        </Card>
        <Card className="border-cyan-100 bg-white/95 shadow-sm">
          <CardHeader className="pb-2"><CardDescription><FileCheck className="mr-1 inline h-4 w-4" />Completed questionnaires</CardDescription><CardTitle className="text-3xl">{questionnaireStats?.completedResponses || 0}</CardTitle></CardHeader>
          <CardContent><Badge className="bg-emerald-100 text-emerald-700">Completed responses</Badge></CardContent>
        </Card>
        <Card className="border-cyan-100 bg-white/95 shadow-sm">
          <CardHeader className="pb-2"><CardDescription><CreditCard className="mr-1 inline h-4 w-4" />Monthly revenue</CardDescription><CardTitle className="text-3xl">${subscriptionStats?.monthlyRevenue?.toFixed(2) || "0.00"}</CardTitle></CardHeader>
          <CardContent><Badge className="bg-indigo-100 text-indigo-700">Active subscriptions: {subscriptionStats?.activeSubscriptions || 0}</Badge></CardContent>
        </Card>
      </section>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="rounded-full border border-cyan-200 bg-white p-1">
          <TabsTrigger value="overview" className="rounded-full">Overview</TabsTrigger>
          <TabsTrigger value="questionnaires" className="rounded-full">Questionnaires</TabsTrigger>
          <TabsTrigger value="subscriptions" className="rounded-full">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border-cyan-100 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle>User Role Distribution</CardTitle>
                <CardDescription>Role share across registered users.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {userStats?.usersByRole?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={userStats.usersByRole} dataKey="count" nameKey="role" outerRadius={100} label>
                        {userStats.usersByRole.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-slate-500">No data available</div>}
              </CardContent>
            </Card>

            <Card className="border-cyan-100 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle>User Registration Trend</CardTitle>
                <CardDescription>New user signups over time.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {userStats?.registrationTrend?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userStats.registrationTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-slate-500">No data available</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questionnaires">
          <Card className="border-cyan-100 bg-white/95 shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Question Response Analysis</CardTitle>
                  <CardDescription>Analyze distribution for a specific question.</CardDescription>
                </div>
                <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
                  <SelectTrigger className="w-full lg:w-[320px] border-cyan-200">
                    <SelectValue placeholder="Select a question" />
                  </SelectTrigger>
                  <SelectContent>
                    {questions.map((q) => (
                      <SelectItem key={q.questionId} value={q.questionId}>{q.title?.slice(0, 80)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {questionData?.answerDistribution?.length ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-slate-600">Total responses: {questionData.totalResponses}</p>
                    <Button
                      variant="outline"
                      className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                      onClick={() => exportCsv(questionData.answerDistribution, "question-response-distribution")}
                    >
                      <Download className="mr-2 h-4 w-4" />Export data
                    </Button>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={questionData.answerDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="answer" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No response data for this question yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border-cyan-100 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle>Plan Revenue</CardTitle>
                <CardDescription>Revenue by subscription plan.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {subscriptionStats?.subscriptionsByPlan?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subscriptionStats.subscriptionsByPlan}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="planName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-slate-500">No data available</div>}
              </CardContent>
            </Card>

            <Card className="border-cyan-100 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle>Subscription Trend</CardTitle>
                <CardDescription>Total and active subscriptions over time.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {subscriptionStats?.subscriptionTrend?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={subscriptionStats.subscriptionTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#06b6d4" />
                      <Line type="monotone" dataKey="active" stroke="#6366f1" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-slate-500">No data available</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
