import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, RefreshCw } from "lucide-react";
import { fetchReportsByUser, UserReport } from "@/services/report";
import { API_BASE_URL } from "@/config/api";
import { fetchUserQuestionnairesWithAccess } from "@/services/ApiService";

export const UserReports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [exportingReportId, setExportingReportId] = useState<string | null>(
    null
  );
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<
    { id: string; title: string }[]
  >([]);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<
    string | null
  >(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      if (!user) {
        console.log("User not found:", user);
        return;
      }

      try {
        setIsLoading(true);
        console.log("Fetching reports for user:", user.id);
        const userReports = await fetchReportsByUser(user.id);
        console.log("Received reports:", userReports);
        setReports(userReports);
      } catch (error) {
        console.error("Errore nel caricamento dei report:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load the reports",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [user, toast]);

  useEffect(() => {
    const loadQuestionnaires = async () => {
      if (!user) return;
      try {
        const result = await fetchUserQuestionnairesWithAccess(user.id);
        const data = result?.data || [];
        const mapped = data.map((q: any) => ({
          id: q.id,
          title: q.title || "Questionnaire",
        }));
        setAvailableQuestionnaires(mapped);
        if (mapped.length > 0) {
          setSelectedQuestionnaireId(mapped[0].id);
        }
      } catch (error) {
        console.error("Errore caricamento questionari:", error);
      }
    };
    loadQuestionnaires();
  }, [user]);

  const handleViewReport = (reportId: string) => {
    navigate(`/report/${reportId}`);
  };

  const handleExportPDF = async (report: UserReport) => {
    try {
      setExportingReportId(report.id);

      // Check if PDF already exists
      if (report.pdf_url) {
        // PDF exists, download it directly
        const response = await fetch(`${API_BASE_URL}/ai/pdf/${report.id}`);

        if (!response.ok) {
          throw new Error("Failed to download PDF");
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

        toast({
          title: "PDF downloaded",
          description: `The report "${report.title}" has been downloaded successfully`,
        });
      } else {
        // PDF doesn't exist, regenerate it
        toast({
          title: "Generating PDF...",
          description: "Please wait",
        });

        const response = await fetch(
          `${API_BASE_URL}/ai/regenerate-pdf/${report.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate PDF");
        }

        const data = await response.json();

        if (data.success) {
          // Download the newly generated PDF
          const pdfResponse = await fetch(
            `${API_BASE_URL}/ai/pdf/${report.id}`
          );
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${(report.title || "report").replace(/\s+/g, "_")}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          // Update local report state
          setReports((prevReports) =>
            prevReports.map((r) =>
              r.id === report.id ? { ...r, pdf_url: data.pdfUrl } : r
            )
          );

          toast({
            title: "PDF generated and downloaded",
            description: `The report "${report.title}" has been downloaded successfully`,
          });
        }
      }
    } catch (error) {
      console.error("Errore esportazione PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not export the PDF",
      });
    } finally {
      setExportingReportId(null);
    }
  };

  const handleGenerateReport = async () => {
    if (!user?.id || !selectedQuestionnaireId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a questionnaire",
      });
      return;
    }
    try {
      setIsGenerating(true);

      // Fetch active planId
      const subRes = await fetch(
        `${API_BASE_URL}/users/${user.id}/subscription`
      );
      if (!subRes.ok) throw new Error("Could not retrieve plan");
      const subData = await subRes.json();
      const planId =
        subData?.planId || subData?.plan_id || subData?.data?.planId;
      if (!planId) throw new Error("No active plan found");

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
        const text = await genRes.text();
        throw new Error(text || "Generation error");
      }
      const genData = await genRes.json();
      if (!genData.success || !genData.reportId) {
        throw new Error(genData.message || "Generation failed");
      }

      toast({
        title: "Report requested",
        description: "Opening the generated report",
      });
      navigate(`/report/${genData.reportId}`);
    } catch (error: any) {
      console.error("Errore generazione report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Could not generate the report",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>My reports</CardTitle>
            <CardDescription>
              View and manage the reports generated from your questionnaires
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={selectedQuestionnaireId || ""}
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
              disabled={
                isGenerating ||
                !selectedQuestionnaireId ||
                availableQuestionnaires.length === 0
              }
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                </span>
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
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{report.title}</h3>
                    <div className="flex space-x-4 text-sm text-muted-foreground mt-1">
                      <span>
                        Date:{" "}
                        {new Date(report.created_at).toLocaleDateString(
                          "en-US"
                        )}
                      </span>
                      {report.pdf_url && (
                        <span className="text-green-600">
                          ✓ PDF available
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(report)}
                      disabled={exportingReportId === report.id}
                      className="flex items-center"
                    >
                      {exportingReportId === report.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          {report.pdf_url ? "Download PDF" : "Generate PDF"}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleViewReport(report.id)}
                      size="sm"
                      className="flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="mb-4">You have not generated any reports yet</p>
            <p className="text-sm text-gray-500">
              Complete a questionnaire to generate a personalized report
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
