
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Download } from 'lucide-react';
import { fetchReportsByUser, UserReport } from '@/services/report';

export const UserReports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<UserReport[]>([]);
  
  useEffect(() => {
    const loadReports = async () => {
      if (!user) {
        console.log('User not found:', user);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log('Fetching reports for user:', user.id);
        const userReports = await fetchReportsByUser(user.id);
        console.log('Received reports:', userReports);
        setReports(userReports);
      } catch (error) {
        console.error('Errore nel caricamento dei report:', error);
        toast({
          variant: 'destructive',
          title: 'Errore',
          description: 'Non è stato possibile caricare i report',
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
  
  const handleExportPDF = (report: UserReport) => {
    // In un'implementazione reale, qui gestiremmo l'esportazione in PDF
    // Per ora, simuliamo un'esportazione con un toast
    toast({
      title: 'Esportazione avviata',
      description: `Il report "${report.title}" verrà scaricato a breve`,
    });
    
    // Se esiste un URL del PDF, lo apriamo in una nuova finestra
    if (report.pdf_url) {
      window.open(report.pdf_url, '_blank');
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
            {reports.map(report => (
              <Card key={report.id} className="hover:bg-gray-50 transition-colors">
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{report.title}</h3>
                    <div className="flex space-x-4 text-sm text-muted-foreground mt-1">
                      <span>Data: {new Date(report.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExportPDF(report)}
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Esporta PDF
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
