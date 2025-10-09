import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import QuestionSaveConfirmation from '../questionSaveConfirmation';
import { HelpCircle } from 'lucide-react';
import { fetchQuestionnaireCompletions, transformCompletionHistory, fetchUserPlanOptions, UserPlanOptions } from '@/services/questionnaireService';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'choice' | 'multiple';
  options?: string[];
  guide?: string;
}

interface QuestionnaireAccess {
  id: string;
  title: string;
  description?: string;
  isAvailable: boolean;
  nextAvailableDate?: string;
  completionCount: number;
  lastCompletedDate?: string;
  accessReason?: string; // Why it's available/unavailable
  waitingPeriodDays?: number;
}

interface PlanOptions {
  reminderCount: number;
  maxRepetitions: number;
  reminderMessage: string;
  minWaitingPeriod: number;
  reminderFrequency: string;
  verificationAfter: boolean;
  emailNotifications: boolean;
  reminderDaysBefore: number;
  verificationPeriod: number;
  singleQuestionnaire: boolean;
  multipleQuestionnaires: boolean;
  periodicQuestionnaires: boolean;
  progressQuestionnaires: boolean;
}

const QuestionnaireView = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredQuestion, setHoveredQuestion] = useState<string | null>(null);
  const [upcomingQuestionnaires, setUpcomingQuestionnaires] = useState<any[]>([]);
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [guidePopoverOpen, setGuidePopoverOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<PlanOptions | null>(null);
  const [questionnaireAccess, setQuestionnaireAccess] = useState<QuestionnaireAccess[]>([]);
  const [currentQuestionnaireId, setCurrentQuestionnaireId] = useState<string>('questionnaire-1');
  
  useEffect(() => {
    const loadQuestionnaire = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Load user's subscription plan options
        await loadUserPlan();
        
        // In un'implementazione reale, recupereremmo il questionario da Supabase
        // Per ora, utilizziamo dei dati di esempio
        const demoQuestions: Question[] = [
          {
            id: '1',
            text: 'Qual è il livello di maturità digitale della tua azienda?',
            type: 'choice',
            options: ['Base', 'Intermedio', 'Avanzato'],
            guide: 'La maturità digitale fa riferimento al livello di adozione e integrazione delle tecnologie digitali nei processi aziendali.'
          },
          {
            id: '2',
            text: 'Quali tecnologie digitali utilizzi già nella tua azienda?',
            type: 'multiple',
            options: ['CRM', 'ERP', 'E-commerce', 'Social media', 'Analisi dati', 'Cloud computing'],
            guide: 'Considera tutti i sistemi e le tecnologie attualmente in uso, anche se non utilizzate in tutti i reparti.'
          },
          {
            id: '3',
            text: 'Quali sono le principali sfide digitali che affronti?',
            type: 'text',
            guide: 'Pensa alle difficoltà che la tua azienda incontra nell\'adozione o nell\'utilizzo di tecnologie digitali.'
          },
          {
            id: '4',
            text: 'Quanto investi annualmente in tecnologie digitali?',
            type: 'choice',
            options: ['Meno di 5.000€', 'Tra 5.000€ e 20.000€', 'Tra 20.000€ e 50.000€', 'Più di 50.000€'],
            guide: 'Considera tutti gli investimenti in hardware, software, servizi digitali e formazione del personale.'
          },
          {
            id: '5',
            text: 'Quali sono i tuoi obiettivi principali per la trasformazione digitale nei prossimi 12 mesi?',
            type: 'text',
            guide: 'I principali obiettivi che la tua azienda intende raggiungere attraverso la trasformazione digitale.'
          }
        ];
        
        setQuestions(demoQuestions);
        
        // Load questionnaire access based on plan
        await loadQuestionnaireAccess();
        
      } catch (error) {
        console.error('Errore nel caricamento del questionario:', error);
        toast({
          variant: 'destructive',
          title: 'Errore',
          description: 'Non è stato possibile caricare il questionario',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuestionnaire();
  }, [user, toast]);
  
  // Load questionnaire access when user plan is loaded
  useEffect(() => {
    if (userPlan) {
      loadQuestionnaireAccess();
    }
  }, [userPlan]);
  
  const loadUserPlan = async () => {
    try {
      if (!user?.id) return;

      // Fetch user's subscription plan from database
      const { data: userSubscription, error: userError } = await supabase
        .from('user_subscriptions')
        .select(`
          plan_id,
          subscription_plans!inner(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (userError) {
        console.error('Error fetching user subscription:', userError);
        toast({
          variant: 'destructive',
          title: 'Errore',
          description: 'Non è stato possibile caricare le informazioni del piano',
        });
        return;
      }

      if (userSubscription?.subscription_plans) {
        const planData = userSubscription.subscription_plans as any;
        
        // Parse the option JSON from the subscription_plans table
        let planOptions: PlanOptions;
        
        if (planData.option) {
          planOptions = planData.option as PlanOptions;
        } else {
          // Fallback to default options if option column doesn't exist or is null
          planOptions = {
            reminderCount: 1,
            maxRepetitions: 1,
            reminderMessage: "È il momento di completare il tuo questionario!",
            minWaitingPeriod: 7,
            reminderFrequency: "once",
            verificationAfter: false,
            emailNotifications: false,
            reminderDaysBefore: 7,
            verificationPeriod: 30,
            singleQuestionnaire: true,
            multipleQuestionnaires: false,
            periodicQuestionnaires: false,
            progressQuestionnaires: false
          };
        }
        
        // Ensure all required fields have default values
        const completePlanOptions: PlanOptions = {
          reminderCount: planOptions.reminderCount || 1,
          maxRepetitions: planOptions.maxRepetitions || 1,
          reminderMessage: planOptions.reminderMessage || "È il momento di completare il tuo questionario!",
          minWaitingPeriod: planOptions.minWaitingPeriod || 7,
          reminderFrequency: planOptions.reminderFrequency || "once",
          verificationAfter: planOptions.verificationAfter || false,
          emailNotifications: planOptions.emailNotifications || false,
          reminderDaysBefore: planOptions.reminderDaysBefore || 7,
          verificationPeriod: planOptions.verificationPeriod || 30,
          singleQuestionnaire: planOptions.singleQuestionnaire || false,
          multipleQuestionnaires: planOptions.multipleQuestionnaires || false,
          periodicQuestionnaires: planOptions.periodicQuestionnaires || false,
          progressQuestionnaires: planOptions.progressQuestionnaires || false
        };

        setUserPlan(completePlanOptions);
        
        console.log('Loaded user plan options:', completePlanOptions);
        console.log('Plan name:', planData.name);
      } else {
        console.error('No subscription plan found for user');
        toast({
          variant: 'destructive',
          title: 'Errore',
          description: 'Nessun piano di sottoscrizione trovato',
        });
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Errore nel caricamento del piano utente',
      });
    }
  };
  
  const loadQuestionnaireAccess = async () => {
    if (!userPlan || !user?.id) return;
    
    try {
      // For now, use demo questionnaires since the questionnaires table doesn't exist yet
      // You can run the database_setup.sql file to create the necessary tables
      const demoQuestionnaires = [
        { id: 'questionnaire-1', title: 'Valutazione Maturità Digitale', description: 'Analisi del livello di digitalizzazione aziendale' },
        { id: 'questionnaire-2', title: 'Analisi Processi Aziendali', description: 'Ottimizzazione dei processi interni' },
        { id: 'questionnaire-3', title: 'Strategia Marketing Digitale', description: 'Sviluppo strategia di marketing online' },
        { id: 'questionnaire-4', title: 'Sicurezza Informatica', description: 'Valutazione della sicurezza IT' }
      ];

      // Fetch completion history from database using REST API
      let completionHistory: any[] = [];
      try {
        const completions = await fetchQuestionnaireCompletions(user.id);
        if (completions && completions.length > 0) {
          completionHistory = transformCompletionHistory(completions, demoQuestionnaires);
        }
      } catch (error) {
        console.log('Error fetching completion history:', error);
      }

      // If no real completion history, use demo data for testing
      if (completionHistory.length === 0) {
        completionHistory = [
          {
            questionnaireId: 'questionnaire-1',
            completionCount: 1,
            lastCompletedDate: '2025-01-15T10:00:00Z',
            completedAt: ['2025-01-15T10:00:00Z']
          },
          {
            questionnaireId: 'questionnaire-2',
            completionCount: 0,
            lastCompletedDate: null,
            completedAt: []
          },
          {
            questionnaireId: 'questionnaire-3',
            completionCount: 2,
            lastCompletedDate: '2025-01-20T14:30:00Z',
            completedAt: ['2025-01-10T09:00:00Z', '2025-01-20T14:30:00Z']
          },
          {
            questionnaireId: 'questionnaire-4',
            completionCount: 0,
            lastCompletedDate: null,
            completedAt: []
          }
        ];
      }

      const accessList: QuestionnaireAccess[] = [];
      
      for (const questionnaire of demoQuestionnaires) {
        const history = completionHistory.find(h => h.questionnaireId === questionnaire.id);
        const access = calculateQuestionnaireAccess(questionnaire, history, userPlan, completionHistory);
        accessList.push(access);
      }
      
      setQuestionnaireAccess(accessList);
    } catch (error) {
      console.error('Error loading questionnaire access:', error);
    }
  };
  
  const calculateQuestionnaireAccess = (
    questionnaire: { id: string; title: string; description?: string },
    history: any,
    plan: PlanOptions,
    allHistory: any[]
  ): QuestionnaireAccess => {
    const now = new Date();
    const completionCount = history?.completionCount || 0;
    const lastCompletedDate = history?.lastCompletedDate ? new Date(history.lastCompletedDate) : null;
    
    let isAvailable = false;
    let nextAvailableDate: string | undefined;
    let accessReason = '';
    let waitingPeriodDays: number | undefined;
    
    if (plan.multipleQuestionnaires) {
      // Type 3: Multiple questionnaires - always available
      isAvailable = true;
      accessReason = 'Accesso illimitato con il tuo piano';
    } else if (plan.verificationAfter) {
      // Type 1: verificationAfter - can access once, then after verification period (total 2 times)
      if (completionCount === 0) {
        isAvailable = true;
        accessReason = 'Prima compilazione disponibile';
      } else if (completionCount === 1) {
        if (lastCompletedDate) {
          const nextAvailable = new Date(lastCompletedDate);
          nextAvailable.setDate(nextAvailable.getDate() + plan.verificationPeriod);
          
          if (now >= nextAvailable) {
            isAvailable = true;
            accessReason = 'Seconda compilazione disponibile';
          } else {
            isAvailable = false;
            nextAvailableDate = nextAvailable.toLocaleDateString('it-IT');
            waitingPeriodDays = Math.ceil((nextAvailable.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            accessReason = `Disponibile dopo il periodo di verifica (${waitingPeriodDays} giorni)`;
          }
        }
      } else {
        isAvailable = false;
        accessReason = 'Limite di 2 compilazioni raggiunto';
      }
    } else if (plan.periodicQuestionnaires) {
      // Type 2: Periodic - limited repetitions with waiting period
      if (completionCount < plan.maxRepetitions) {
        if (completionCount === 0) {
          isAvailable = true;
          accessReason = 'Prima compilazione disponibile';
        } else if (lastCompletedDate) {
          const nextAvailable = new Date(lastCompletedDate);
          nextAvailable.setDate(nextAvailable.getDate() + plan.verificationPeriod);
          
          if (now >= nextAvailable) {
            isAvailable = true;
            accessReason = `Compilazione ${completionCount + 1} di ${plan.maxRepetitions} disponibile`;
          } else {
            isAvailable = false;
            nextAvailableDate = nextAvailable.toLocaleDateString('it-IT');
            waitingPeriodDays = Math.ceil((nextAvailable.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            accessReason = `Prossima compilazione tra ${waitingPeriodDays} giorni`;
          }
        }
      } else {
        isAvailable = false;
        accessReason = `Limite di ${plan.maxRepetitions} compilazioni raggiunto`;
      }
    } else if (plan.progressQuestionnaires) {
      // Type 4: Progressive - one after another with waiting period
      const questionnaireIndex = parseInt(questionnaire.id.split('-')[1]) - 1;
      
      if (questionnaireIndex === 0) {
        // First questionnaire
        if (completionCount === 0) {
          isAvailable = true;
          accessReason = 'Primo questionario del percorso';
        } else {
          isAvailable = false;
          accessReason = 'Questionario già completato';
        }
      } else {
        // Check if previous questionnaire is completed
        const previousQuestionnaireId = `questionnaire-${questionnaireIndex}`;
        const previousHistory = allHistory.find(h => h.questionnaireId === previousQuestionnaireId);
        
        if (previousHistory && previousHistory.completionCount > 0) {
          const previousCompletedDate = new Date(previousHistory.lastCompletedDate);
          const nextAvailable = new Date(previousCompletedDate);
          nextAvailable.setDate(nextAvailable.getDate() + plan.minWaitingPeriod);
          
          if (completionCount === 0) {
            if (now >= nextAvailable) {
              isAvailable = true;
              accessReason = 'Disponibile dopo il completamento del questionario precedente';
            } else {
              isAvailable = false;
              nextAvailableDate = nextAvailable.toLocaleDateString('it-IT');
              waitingPeriodDays = Math.ceil((nextAvailable.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              accessReason = `Disponibile tra ${waitingPeriodDays} giorni`;
            }
          } else {
            isAvailable = false;
            accessReason = 'Questionario già completato';
          }
        } else {
          isAvailable = false;
          accessReason = 'Completa prima il questionario precedente';
        }
      }
    } else {
      // Default: single questionnaire
      if (completionCount === 0) {
        isAvailable = true;
        accessReason = 'Disponibile per la compilazione';
      } else {
        isAvailable = false;
        accessReason = 'Questionario già completato';
      }
    }
    
    return {
      id: questionnaire.id,
      title: questionnaire.title,
      description: questionnaire.description,
      isAvailable,
      nextAvailableDate,
      completionCount,
      lastCompletedDate: lastCompletedDate?.toLocaleDateString('it-IT'),
      accessReason,
      waitingPeriodDays
    };
  };
  
  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const handleSaveDraft = async () => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // In un'implementazione reale, qui invieremmo le risposte al backend come bozza
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Bozza salvata',
        description: 'Il tuo questionario è stato salvato come bozza',
      });
      
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Errore nel salvataggio della bozza:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Non è stato possibile salvare la bozza',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // In un'implementazione reale, qui invieremmo le risposte al backend
      // Per ora, simula un ritardo e poi reindirizza alla pagina del report
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const reportId = "demo-report-1"; // In un'implementazione reale, questo verrebbe dal backend
      
      toast({
        title: 'Questionario completato',
        description: 'Il tuo report è stato generato con successo',
      });
      
      // Reindirizza alla pagina del report
      navigate(`/report/${reportId}`);
      
    } catch (error) {
      console.error('Errore nell\'invio delle risposte:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Non è stato possibile inviare le risposte',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleStartQuestionnaire = (questionnaireId: string) => {
    const access = questionnaireAccess.find(a => a.id === questionnaireId);
    
    if (!access || !access.isAvailable) {
      toast({
        variant: 'destructive',
        title: 'Questionario non disponibile',
        description: access?.accessReason || 'Questo questionario non è attualmente disponibile.',
      });
      return;
    }
    
    // Set the current questionnaire and load its questions
    setCurrentQuestionnaireId(questionnaireId);
    
    toast({
      title: 'Questionario avviato',
      description: `Hai iniziato: ${access.title}`,
    });
    
    // In a real implementation, you would navigate to the specific questionnaire
    // For now, we'll just start with the demo questions
    setCurrentQuestion(0);
    setAnswers({});
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
  
  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <p className="text-lg">Nessun questionario disponibile al momento.</p>
            <p className="text-sm text-gray-500 mt-2">Controlla più tardi o contatta l'assistenza.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const currentQ = questions[currentQuestion];
  
  return (
    <div className="grid md:grid-cols-4 gap-6">
      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Questionario di Valutazione</CardTitle>
            <CardDescription>
              Rispondi alle domande per ricevere il tuo report personalizzato
              {currentQuestionnaireId && (
                <div className="mt-2 text-sm text-purple-600 font-medium">
                  Attualmente compilando: {questionnaireAccess.find(a => a.id === currentQuestionnaireId)?.title || currentQuestionnaireId}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Domanda {currentQuestion + 1} di {questions.length}</span>
                <span className="text-sm text-gray-500">{Math.round((currentQuestion + 1) / questions.length * 100)}% completato</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${(currentQuestion + 1) / questions.length * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mb-8">
              <div className="flex items-center">
                <h3 className="text-xl font-medium mr-2">{currentQ.text}</h3>
                {currentQ.guide && (
                  <Popover open={guidePopoverOpen} onOpenChange={setGuidePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="ml-1 flex items-center justify-center rounded-full border border-blue-300 bg-white text-purple-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-purple-400" style={{ width: 28, height: 28 }}>
                        <HelpCircle className="h-5 w-5" color="#7c3aed" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs">
                      <div className="font-semibold mb-1">Guida</div>
                      <div className="text-sm text-blue-800">{currentQ.guide}</div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              
              <div className="mt-4">
                {currentQ.type === 'text' && (
                  <textarea
                    className="w-full p-3 border rounded-lg min-h-32"
                    placeholder="Scrivi la tua risposta qui..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  />
                )}
                
                {currentQ.type === 'choice' && currentQ.options && (
                  <div className="space-y-2">
                    {currentQ.options.map((option, idx) => (
                      <div key={idx} className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors hover:border-purple-500 hover:bg-purple-50"
                           onClick={() => handleAnswer(currentQ.id, option)}>
                        <input
                          type="radio"
                          id={`option-${idx}`}
                          name={`question-${currentQ.id}`}
                          checked={answers[currentQ.id] === option}
                          onChange={() => handleAnswer(currentQ.id, option)}
                          className="text-purple-600"
                        />
                        <label htmlFor={`option-${idx}`} className="text-gray-700 w-full cursor-pointer ml-3">{option}</label>
                      </div>
                    ))}
                  </div>
                )}
                
                {currentQ.type === 'multiple' && currentQ.options && (
                  <div className="space-y-2">
                    {currentQ.options.map((option, idx) => {
                      const selectedOptions = answers[currentQ.id] || [];
                      const isChecked = selectedOptions.includes(option);
                      
                      return (
                        <div key={idx} className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors hover:border-purple-500 hover:bg-purple-50"
                             onClick={() => {
                               if (isChecked) {
                                 handleAnswer(
                                   currentQ.id,
                                   selectedOptions.filter(item => item !== option)
                                 );
                               } else {
                                 handleAnswer(currentQ.id, [...selectedOptions, option]);
                               }
                             }}>
                          <input
                            type="checkbox"
                            id={`option-multi-${idx}`}
                            className="mr-3 text-purple-600"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                handleAnswer(
                                  currentQ.id,
                                  selectedOptions.filter(item => item !== option)
                                );
                              } else {
                                handleAnswer(currentQ.id, [...selectedOptions, option]);
                              }
                            }}
                          />
                          <label htmlFor={`option-multi-${idx}`} className="text-gray-700 w-full cursor-pointer">{option}</label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              Precedente
            </Button>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setDraftConfirmOpen(true)} 
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                Salva in bozza
              </Button>
              
              {currentQuestion < questions.length - 1 ? (
                <Button onClick={handleNextQuestion}>Successiva</Button>
              ) : (
                <Button 
                  onClick={() => setSubmitConfirmOpen(true)} 
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      Invia <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Pannello laterale destro */}
      <div className="md:col-span-1">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Informazioni Domanda</CardTitle>
            </CardHeader>
            <CardContent>
              {guidePopoverOpen && currentQ.guide ? (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-semibold text-sm mb-1">Guida</h4>
                  <p className="text-sm text-blue-800">{currentQ.guide}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Clicca il pulsante <span className="font-bold">?</span> per visualizzare la guida, se disponibile.
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Questionari Disponibili</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questionnaireAccess.length > 0 ? (
                questionnaireAccess.map((access) => (
                  <div 
                    key={access.id} 
                    className={`border rounded-md p-3 ${
                      access.isAvailable 
                        ? 'cursor-pointer hover:border-purple-400 hover:bg-purple-50 border-green-300 bg-green-50' 
                        : 'border-gray-300 bg-gray-50'
                    }`}
                    onClick={() => access.isAvailable ? handleStartQuestionnaire(access.id) : null}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm">{access.title}</p>
                      {access.isAvailable ? (
                        <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                          Disponibile
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded">
                          Non disponibile
                        </span>
                      )}
                    </div>
                    
                    {access.description && (
                      <p className="text-xs text-gray-600 mb-2">{access.description}</p>
                    )}
                    
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">{access.accessReason}</p>
                      
                      {access.completionCount > 0 && (
                        <p className="text-xs text-blue-600">
                          Completato {access.completionCount} volte
                          {access.lastCompletedDate && ` (ultima: ${access.lastCompletedDate})`}
                        </p>
                      )}
                      
                      {access.nextAvailableDate && (
                        <p className="text-xs text-orange-600">
                          Prossima disponibilità: {access.nextAvailableDate}
                          {access.waitingPeriodDays && ` (tra ${access.waitingPeriodDays} giorni)`}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Caricamento questionari in corso...</p>
              )}
            </CardContent>
          </Card>
          
          {userPlan && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Informazioni Piano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {userPlan.multipleQuestionnaires && (
                    <div className="bg-green-50 p-2 rounded text-green-800">
                      <strong>Piano Unlimited:</strong> Accesso illimitato a tutti i questionari
                    </div>
                  )}
                  {userPlan.verificationAfter && (
                    <div className="bg-blue-50 p-2 rounded text-blue-800">
                      <strong>Piano Verification:</strong> 2 accessi per questionario con periodo di verifica di {userPlan.verificationPeriod} giorni
                    </div>
                  )}
                  {userPlan.periodicQuestionnaires && (
                    <div className="bg-purple-50 p-2 rounded text-purple-800">
                      <strong>Piano Periodico:</strong> Massimo {userPlan.maxRepetitions} ripetizioni con attesa di {userPlan.verificationPeriod} giorni tra le compilazioni
                    </div>
                  )}
                  {userPlan.progressQuestionnaires && (
                    <div className="bg-orange-50 p-2 rounded text-orange-800">
                      <strong>Piano Progressivo:</strong> Questionari sequenziali con attesa di {userPlan.minWaitingPeriod} giorni tra i livelli
                    </div>
                  )}
                  
                  {userPlan.emailNotifications && (
                    <p className="text-xs text-gray-600 mt-2">
                      📧 Notifiche email attive
                      {userPlan.reminderDaysBefore > 0 && ` (promemoria ${userPlan.reminderDaysBefore} giorni prima)`}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Dialogo di conferma salvataggio bozza */}
      <QuestionSaveConfirmation
        mode="draft"
        open={draftConfirmOpen}
        onOpenChange={setDraftConfirmOpen}
        onConfirm={handleSaveDraft}
      />
      
      {/* Dialogo di conferma invio */}
      <QuestionSaveConfirmation
        mode="submit"
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        onConfirm={handleSubmit}
      />
    </div>
  );
};

export default QuestionnaireView;
