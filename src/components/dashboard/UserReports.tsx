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

export const UserReports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [exportingReportId, setExportingReportId] = useState<string | null>(
    null
  );

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
          title: "Errore",
          description: "Non è stato possibile caricare i report",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [user, toast]);

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
        a.download = `${report.title.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "PDF scaricato",
          description: `Il report "${report.title}" è stato scaricato con successo`,
        });
      } else {
        // PDF doesn't exist, regenerate it
        toast({
          title: "Generazione PDF in corso...",
          description: "Attendere prego",
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
          a.download = `${report.title.replace(/\s+/g, "_")}.pdf`;
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
            title: "PDF generato e scaricato",
            description: `Il report "${report.title}" è stato scaricato con successo`,
          });
        }
      }
    } catch (error) {
      console.error("Errore esportazione PDF:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Non è stato possibile esportare il PDF",
      });
    } finally {
      setExportingReportId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>I miei report</CardTitle>
        <CardDescription>
          Visualizza e gestisci i report generati dai tuoi questionari
        </CardDescription>
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
                        Data:{" "}
                        {new Date(report.created_at).toLocaleDateString(
                          "it-IT"
                        )}
                      </span>
                      {report.pdf_url && (
                        <span className="text-green-600">
                          ✓ PDF disponibile
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
                          Elaborazione...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          {report.pdf_url ? "Scarica PDF" : "Genera PDF"}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleViewReport(report.id)}
                      size="sm"
                      className="flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Visualizza
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="mb-4">Non hai ancora generato report</p>
            <p className="text-sm text-gray-500">
              Compila un questionario per generare un report personalizzato
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
