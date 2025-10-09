
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, Plus, Pencil, Copy, Trash2, FileText } from 'lucide-react';
import { fetchPlan } from '@/services/plans-mysql';
import { fetchPlanQuestionnaires, fetchAllQuestionnaires, addQuestionnaireToPlan } from '@/services/questionnaire-config-mysql';
import { 
  fetchPlanPromptTemplates, 
  deletePromptTemplate, 
  fetchPromptsForPlanQuestionnaires 
} from '@/services/prompt-templates-mysql';
import type { 
  Plan, 
  PlanQuestionnaire,
  PromptTemplate
} from '@/services/plans-mysql';
import type { Questionnaire } from '@/services/questionnaire-config-mysql';

const PromptTemplatesList = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [questionnaires, setQuestionnaires] = useState<PlanQuestionnaire[]>([]);
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<Questionnaire[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [promptsByQuestionnaire, setPromptsByQuestionnaire] = useState<Record<string, PromptTemplate[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [addQuestionnaireDialogOpen, setAddQuestionnaireDialogOpen] = useState(false);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | undefined>(undefined);
  const [isAddingQuestionnaire, setIsAddingQuestionnaire] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!planId) return;
      
      try {
        setLoading(true);
        
        // Carica i dettagli del piano
        const planData = await fetchPlan(planId);
        if (planData) {
          setPlan(planData.plan);
          
          // Carica tutti i questionari collegati al piano
          const questionnairesData = await fetchPlanQuestionnaires(planId);
          console.log('Questionari caricati:', questionnairesData);
          setQuestionnaires(questionnairesData);
          
          // Carica tutti i template prompt per il piano
          const templates = await fetchPlanPromptTemplates(planId);
          setPromptTemplates(templates);
          
          // Se abbiamo questionari, carica i prompt per questionario
          if (questionnairesData.length > 0) {
            const questionnaireIds = questionnairesData.map(q => q.questionnaire_id);
            const prompts = await fetchPromptsForPlanQuestionnaires(planId, questionnaireIds);
            setPromptsByQuestionnaire(prompts);
          }
        }

        // Carica tutti i questionari disponibili
        const allQuestionnaires = await fetchAllQuestionnaires();
        console.log('Tutti i questionari disponibili:', allQuestionnaires);
        setAvailableQuestionnaires(allQuestionnaires || []);
        
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Errore',
          description: 'Si è verificato un errore nel caricamento dei dati',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [planId, toast]);

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      const success = await deletePromptTemplate(templateToDelete);
      
      if (success) {
        // Aggiorna entrambe le liste
        setPromptTemplates(prev => prev.filter(t => t.id !== templateToDelete));
        
        // Aggiorna promptsByQuestionnaire
        const updatedPrompts = { ...promptsByQuestionnaire };
        Object.keys(updatedPrompts).forEach(questionnaireId => {
          updatedPrompts[questionnaireId] = updatedPrompts[questionnaireId].filter(
            t => t.id !== templateToDelete
          );
        });
        setPromptsByQuestionnaire(updatedPrompts);
        
        toast({
          title: 'Eliminato',
          description: 'Template del prompt eliminato con successo'
        });
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del template:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore nell\'eliminazione del template',
        variant: 'destructive'
      });
    } finally {
      setTemplateToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const confirmDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const duplicateTemplate = (template: PromptTemplate) => {
    navigate(`/admin/plans/${planId}/prompts/new`, { 
      state: { 
        duplicate: true,
        template: {
          ...template,
          id: undefined,
          title: `Copia di ${template.title}`
        }
      } 
    });
  };

  const getQuestionnaireTitle = (id: string) => {
    const questionnaire = questionnaires.find(q => q.questionnaire_id === id);
    return questionnaire?.questionnaire?.title || 'Questionario sconosciuto';
  };

  const handleQuestionnaireButtonClick = (questionnaireId: string) => {
    navigate(`/admin/plans/${planId}/prompts/new`, {
      state: { questionnaireId }
    });
  };

  const handleAddQuestionnaires = () => {
    setAddQuestionnaireDialogOpen(true);
  };

  const getAvailableQuestionnaires = () => {
    // Filtra i questionari che sono già associati a questo piano
    const existingIds = questionnaires.map(q => q.questionnaire_id);
    return availableQuestionnaires.filter(q => !existingIds.includes(q.id));
  };

  const handleAddQuestionnaire = async () => {
    if (!selectedQuestionnaireId || !planId) return;
    
    try {
      setIsAddingQuestionnaire(true);
      
      const result = await addQuestionnaireToPlan(planId, selectedQuestionnaireId, questionnaires.length);
      
      if (result) {
        // Aggiorna la lista dei questionari
        const updatedQuestionnaires = await fetchPlanQuestionnaires(planId);
        console.log('Questionari aggiornati dopo aggiunta:', updatedQuestionnaires);
        setQuestionnaires(updatedQuestionnaires);
        
        toast({
          title: 'Questionario aggiunto',
          description: 'Il questionario è stato aggiunto al piano con successo'
        });
        
        setAddQuestionnaireDialogOpen(false);
        setSelectedQuestionnaireId(undefined);
      } else {
        throw new Error('Impossibile aggiungere il questionario');
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta del questionario:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore nell\'aggiunta del questionario',
        variant: 'destructive'
      });
    } finally {
      setIsAddingQuestionnaire(false);
    }
  };

  // Funzione per creare un nuovo prompt senza selezionare un questionario
  const handleCreateNewPrompt = () => {
    navigate(`/admin/plans/${planId}/prompts/new`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/admin/chatgpt')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Torna a Integrazione ChatGPT
          </Button>
          <h1 className="text-2xl font-bold ml-4">
            Prompt per {plan?.name || 'Piano'}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => navigate(`/admin/plans/${planId}/reports`)}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Template Report
          </Button>
          <Button 
            onClick={handleCreateNewPrompt}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Prompt
          </Button>
        </div>
      </div>

      {/* Questionari come bottoni */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Questionari</CardTitle>
          <CardDescription>
            Seleziona un questionario per creare o modificare i suoi prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && questionnaires.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {questionnaires.map((questionnaire) => {
                const questionnaireId = questionnaire.questionnaire_id;
                const questionnaireTitle = questionnaire.questionnaire?.title || 'Questionario sconosciuto';
                const questionnairePrompts = promptsByQuestionnaire[questionnaireId] || [];
                
                return (
                  <Button
                    key={questionnaireId}
                    onClick={() => handleQuestionnaireButtonClick(questionnaireId)}
                    className="flex-1 min-w-[180px] h-[80px] flex flex-col"
                    variant="outline"
                  >
                    <span className="font-medium text-sm line-clamp-2 mb-1">{questionnaireTitle}</span>
                    <span className="text-xs text-muted-foreground">
                      {questionnairePrompts.length} prompt
                    </span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-4">
                {loading ? 
                  "Caricamento questionari..." : 
                  "Nessun questionario associato a questo piano."}
              </p>
              {!loading && (
                <div className="flex flex-col items-center gap-4">
                  <Button onClick={handleAddQuestionnaires}>
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Questionari al Piano
                  </Button>
                  <Button variant="outline" onClick={handleCreateNewPrompt}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crea Prompt Senza Questionario
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tutti i Template Prompt</CardTitle>
          <CardDescription>
            Elenco completo di tutti i prompt per questo piano
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : promptTemplates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Questionario</TableHead>
                  <TableHead>Sequenza</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promptTemplates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.title}</TableCell>
                    <TableCell>{getQuestionnaireTitle(template.questionnaire_id)}</TableCell>
                    <TableCell>
                      {template.sequence_index === 0 
                        ? 'Prima compilazione' 
                        : `Verifica ${template.sequence_index}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/admin/plans/${planId}/prompts/edit/${template.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Modifica</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => duplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Duplica</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => confirmDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Elimina</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-4">
                Nessun prompt configurato per questo piano. Crea il tuo primo prompt!
              </p>
              <Button 
                onClick={handleCreateNewPrompt}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crea Prompt
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finestra di dialogo per eliminare il prompt */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo template di prompt? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTemplate}
            >
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finestra di dialogo per aggiungere un questionario */}
      <Dialog open={addQuestionnaireDialogOpen} onOpenChange={setAddQuestionnaireDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Questionario al Piano</DialogTitle>
            <DialogDescription>
              Seleziona un questionario da aggiungere a questo piano
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select onValueChange={(value) => setSelectedQuestionnaireId(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona questionario" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableQuestionnaires().length > 0 ? (
                  getAvailableQuestionnaires().map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Nessun questionario disponibile
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAddQuestionnaireDialogOpen(false);
                setSelectedQuestionnaireId(undefined);
              }}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleAddQuestionnaire}
              disabled={!selectedQuestionnaireId || isAddingQuestionnaire}
            >
              {isAddingQuestionnaire ? 'Aggiungendo...' : 'Aggiungi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptTemplatesList;
