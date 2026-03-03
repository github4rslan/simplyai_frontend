import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/api";
import { fetchReportsByUser, UserReport } from "@/services/report";
import { fetchUserQuestionnairesWithAccess } from "@/services/ApiService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const UserReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string>("");
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    const loadReports = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userReports = await fetchReportsByUser(user.id);
        setReports(userReports);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Load failed",
          description: "Could not load your reports.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [user, toast]);

  useEffect(() => {
    const loadQuestionnaires = async () => {
      if (!user) {
        return;
      }

      try {
        const result = await fetchUserQuestionnairesWithAccess(user.id);
        const mapped = (result?.data || []).map((q: any) => ({
          id: q.id,
          title: q.title || "Questionnaire",
        }));
        setAvailableQuestionnaires(mapped);
        if (mapped.length > 0) {
          setSelectedQuestionnaireId(mapped[0].id);
        }
      } catch (error) {
        setAvailableQuestionnaires([]);
      }
    };

    loadQuestionnaires();
  }, [user]);

  const handleExportPDF = async (report: UserReport) => {
    try {
      setExportingReportId(report.id);

      const ensurePdfResponse = report.pdf_url
        ? await fetch(`${API_BASE_URL}/ai/pdf/${report.id}`)
        : await fetch(`${API_BASE_URL}/ai/regenerate-pdf/${report.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

      if (!ensurePdfResponse.ok) {
        throw new Error("PDF request failed");
      }

      if (!report.pdf_url) {
        const regenerate = await ensurePdfResponse.json();
        if (!regenerate.success) {
          throw new Error("PDF generation failed");
        }
      }

      const response = await fetch(`${API_BASE_URL}/ai/pdf/${report.id}`);
      if (!response.ok) {
        throw new Error("PDF download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(report.title || "report").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "PDF ready", description: "Your report has been downloaded." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not export this report as PDF.",
      });
    } finally {
      setExportingReportId(null);
    }
  };

  const handleGenerateReport = async () => {
    if (!user?.id || !selectedQuestionnaireId) {
      toast({
        variant: "destructive",
        title: "Select a questionnaire",
        description: "Choose a questionnaire before generating a report.",
      });
      return;
    }

    try {
      setIsGenerating(true);

      const subRes = await fetch(`${API_BASE_URL}/users/${user.id}/subscription`);
      if (!subRes.ok) {
        throw new Error("Plan retrieval failed");
      }

      const subData = await subRes.json();
      const planId = subData?.planId || subData?.plan_id || subData?.data?.planId;
      if (!planId) {
        throw new Error("No active plan found");
      }

      const genRes = await fetch(`${API_BASE_URL}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireId: selectedQuestionnaireId,
          planId,
          userId: user.id,
          title: "Report generated from dashboard",
        }),
      });

      if (!genRes.ok) {
        throw new Error("Report generation failed");
      }

      const genData = await genRes.json();
      if (!genData.success || !genData.reportId) {
        throw new Error("Invalid report response");
      }

      toast({ title: "Report generated", description: "Opening report view." });
      navigate(`/report/${genData.reportId}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error?.message || "Could not generate report.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-cyan-100 bg-white/90 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Reports</CardTitle>
            <CardDescription>Generate and download your report history.</CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="h-10 rounded-md border border-cyan-200 bg-white px-3 text-sm outline-none focus:border-cyan-500"
              value={selectedQuestionnaireId}
              onChange={(e) => setSelectedQuestionnaireId(e.target.value)}
              disabled={availableQuestionnaires.length === 0}
            >
              {availableQuestionnaires.length === 0 ? (
                <option value="">No questionnaires available</option>
              ) : (
                availableQuestionnaires.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))
              )}
            </select>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !selectedQuestionnaireId}
              className="bg-cyan-600 text-white hover:bg-cyan-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate report"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{report.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(report.created_at).toLocaleDateString("en-US")}
                    {report.pdf_url ? " - PDF available" : " - PDF not generated"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExportPDF(report)}
                    disabled={exportingReportId === report.id}
                    className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                  >
                    {exportingReportId === report.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        {report.pdf_url ? "Download PDF" : "Generate PDF"}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => navigate(`/report/${report.id}`)}
                    className="bg-slate-900 text-white hover:bg-slate-800"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-700">No reports generated yet</p>
            <p className="mt-1 text-sm text-slate-500">Complete a questionnaire to create your first report.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
