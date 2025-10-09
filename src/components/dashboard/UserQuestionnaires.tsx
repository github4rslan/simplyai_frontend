import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Plus, CheckSquare, Calendar, Clock, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { fetchUserQuestionnairesWithAccess } from '@/services/ApiService';

interface Questionnaire {
  id: string;
  title: string;
  status: string;
  description?: string;
  sequence_order?: number;
  canAccess: boolean;
  reason: string;
  nextAvailableDate?: string;
  completionCount: number;
  lastCompletedAt?: string;
}

interface PlanInfo {
  planId: string;
  planName: string;
  planOptions: any;
}

export const UserQuestionnaires = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  
  useEffect(() => {
    const loadQuestionnaires = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        console.log('Fetching user questionnaires with plan-based access...');
        
        const result = await fetchUserQuestionnairesWithAccess(user.id);
        console.log('Fetched user questionnaires with access:', result);
        
        if (result.success && result.data) {
          setQuestionnaires(result.data);
          if (result.planInfo) {
            setPlanInfo(result.planInfo);
          }
        } else {
          console.error('Invalid API response structure:', result);
          setQuestionnaires([]);
          toast({
            variant: 'default',
            title: 'Info',
            description: result.message || 'Nessun questionario disponibile per il tuo piano',
          });
        }
      } catch (error) {
        console.error('Errore nel caricamento dei questionari:', error);
        toast({
          variant: 'destructive',
          title: 'Errore',
          description: 'Non è stato possibile caricare i questionari per il tuo piano',
        });
        setQuestionnaires([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuestionnaires();
  }, [user, toast]);
  
  const handleStartQuestionnaire = (questionnaire: Questionnaire) => {
    if (questionnaire.canAccess) {
      navigate(`/questionnaire/${questionnaire.id}`);
    } else {
      toast({
        variant: 'default',
        title: 'Accesso non disponibile',
        description: questionnaire.reason,
      });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">Completato</span>;
      case 'in_progress':
        return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">In corso</span>;
      case 'available':
        return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">Disponibile</span>;
      case 'locked':
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">Bloccato</span>;
      case 'waiting':
        return <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">In attesa</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">Non iniziato</span>;
    }
  };
  
  const getButtonText = (questionnaire: Questionnaire) => {
    if (!questionnaire.canAccess) {
      switch(questionnaire.status) {
        case 'waiting':
          return questionnaire.nextAvailableDate ? `Disponibile ${questionnaire.nextAvailableDate}` : 'In attesa';
        case 'locked':
          return 'Non disponibile';
        default:
          return 'Non disponibile';
      }
    }
    
    switch(questionnaire.status) {
      case 'completed':
        return questionnaire.completionCount > 1 ? `Completato (${questionnaire.completionCount}x)` : 'Completato';
      case 'available':
        return questionnaire.completionCount > 0 ? 'Ripeti' : 'Inizia';
      default:
        return 'Inizia';
    }
  };
  
  const isButtonDisabled = (questionnaire: Questionnaire) => {
    return !questionnaire.canAccess;
  };
  
  const getButtonIcon = (questionnaire: Questionnaire) => {
    if (!questionnaire.canAccess) {
      switch(questionnaire.status) {
        case 'waiting':
          return <Clock className="h-4 w-4 mr-1" />;
        case 'locked':
          return <Lock className="h-4 w-4 mr-1" />;
        default:
          return <Lock className="h-4 w-4 mr-1" />;
      }
    }
    
    switch(questionnaire.status) {
      case 'completed':
        return <FileText className="h-4 w-4 mr-1" />;
      case 'available':
        return <CheckSquare className="h-4 w-4 mr-1" />;
      default:
        return <CheckSquare className="h-4 w-4 mr-1" />;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (questionnaires.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="mb-4">Non hai ancora questionari disponibili</p>
            <p className="text-sm text-gray-500">
              Controlla più tardi o contatta l'assistenza per maggiori informazioni
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
    
      
      {questionnaires.map(questionnaire => (
        <Card key={questionnaire.id} className="hover:bg-gray-50 transition-colors">
          <CardContent className="p-6 flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getStatusBadge(questionnaire.status)}
                {questionnaire.sequence_order && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    #{questionnaire.sequence_order}
                  </span>
                )}
                {questionnaire.completionCount > 0 && (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                    {questionnaire.completionCount} completati
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg">{questionnaire.title}</h3>
              {questionnaire.description && (
                <p className="text-gray-600 text-sm mt-1">{questionnaire.description}</p>
              )}
              {!questionnaire.canAccess && (
                <p className="text-orange-600 text-sm mt-2 italic">
                  💡 {questionnaire.reason}
                </p>
              )}
            </div>
            <Button 
              onClick={() => handleStartQuestionnaire(questionnaire)}
              variant={questionnaire.status === 'completed' ? 'outline' : 'default'}
              disabled={isButtonDisabled(questionnaire)}
              className={`
                ${questionnaire.canAccess && questionnaire.status === 'available' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : ''
                }
                ${!questionnaire.canAccess 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
                }
              `}
            >
              {getButtonIcon(questionnaire)}
              {getButtonText(questionnaire)}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
