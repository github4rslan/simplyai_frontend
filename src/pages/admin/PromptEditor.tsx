/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronLeft,
  PlusCircle,
  Save,
  Trash2,
  Info,
} from "lucide-react";
import { fetchPlan } from "@/services/plans-mysql";
import { fetchPlanQuestionnaires } from "@/services/questionnaire-config-mysql";
import {
  fetchPromptTemplate,
  savePromptTemplate,
  fetchPromptForQuestionnaire,
  ReportSectionWithPrompt,
  PromptTemplateWithSections,
  PromptTemplate,
  PromptVariable,
} from "@/services/prompt-templates-mysql";
import type {
  SubscriptionPlan,
  PlanQuestionnaire,
  PlanSettings,
} from "@/types/supabase";
import { chartTypeOptions, tableTypeOptions } from "@/services/chart-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const PromptEditor = () => {
  const { planId, promptId } = useParams<{
    planId: string;
    promptId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const state = location.state as {
    duplicate?: boolean;
    template?: PromptTemplateWithSections;
    questionnaireId?: string;
  } | null;

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [planSettings, setPlanSettings] = useState<PlanSettings | null>(null);
  const [questionnaires, setQuestionnaires] = useState<PlanQuestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("prompt");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionType, setEditingSectionType] = useState<
    "text" | "charts" | "tables" | null
  >(null);
  const [showAiResponseDialog, setShowAiResponseDialog] = useState(false);
  const [aiResponseData, setAiResponseData] = useState<any>(null);
  const [promptPreviewData, setPromptPreviewData] = useState<string>("");
  // State for storing reference questionnaire selections (now supports multiple per section)
  const [referenceSelectedQuestionnaires, setReferenceSelectedQuestionnaires] =
    useState<{
      [sectionId: string]: {
        questionnaireId: string;
        shortcode: string;
        sectionType: "text" | "charts" | "tables";
      }[];
    }>({});

  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<
    string | null
  >(null);
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState<number>(0);

  const [promptTemplate, setPromptTemplate] =
    useState<PromptTemplateWithSections>({
      id: "",
      plan_id: planId || "",
      questionnaire_id: "",
      title: "",
      content: "",
      system_prompt:
        "Sei un assistente esperto che analizza i dati dei questionari.",
      variables: [],
      sequence_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reportTemplate: "",
      sections: {
        text: [],
        charts: [],
        tables: [],
      },
    });

  const [currentSectionPrompt, setCurrentSectionPrompt] = useState({
    id: "",
    type: "",
    title: "",
    prompt: "",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!planId) return;

      try {
        setLoading(true);

        const planData = await fetchPlan(planId);
        if (planData) {
          setPlan(planData.plan as SubscriptionPlan);
          setPlanSettings(planData.settings as PlanSettings);

          const questionnairesData = await fetchPlanQuestionnaires(planId);
          setQuestionnaires(questionnairesData as PlanQuestionnaire[]);

          if (state?.questionnaireId) {
            setSelectedQuestionnaireId(state.questionnaireId);
          } else if (questionnairesData.length > 0) {
            setSelectedQuestionnaireId(questionnairesData[0].questionnaire_id);
          }

          if (promptId && promptId !== "new") {
            const template = await fetchPromptTemplate(promptId);
            console.log(template, " fetched template-----------------");

            if (template) {
              // Simply use the template sections as-is if they exist
              // Only provide defaults if sections are truly missing or empty
              const sections = {
                text:
                  template.sections?.text &&
                  Array.isArray(template.sections.text) &&
                  template.sections.text.length > 0
                    ? template.sections.text
                    : [
                        {
                          id: "1",
                          title: "Introduzione",
                          shortcode: "intro",
                          prompt: "",
                        },
                        {
                          id: "2",
                          title: "Analisi Generale",
                          shortcode: "analisi_generale",
                          prompt: "",
                        },
                      ],
                charts:
                  template.sections?.charts &&
                  Array.isArray(template.sections.charts) &&
                  template.sections.charts.length > 0
                    ? template.sections.charts
                    : [
                        {
                          id: "1",
                          title: "Panoramica Risultati",
                          shortcode: "chart_overview",
                          type: "bar",
                          prompt: "",
                        },
                      ],
                tables:
                  template.sections?.tables &&
                  Array.isArray(template.sections.tables) &&
                  template.sections.tables.length > 0
                    ? template.sections.tables
                    : [
                        {
                          id: "1",
                          title: "Riepilogo Dati",
                          shortcode: "table_summary",
                          type: "simple",
                          prompt: "",
                        },
                      ],
              };

              // Load reference questionnaires if they exist
              if (
                template.reference_questionnaires &&
                Object.keys(template.reference_questionnaires).length > 0
              ) {
                const loadedReferences: { [sectionId: string]: any[] } = {};

                Object.entries(template.reference_questionnaires).forEach(
                  ([sectionId, data]) => {
                    if (Array.isArray(data)) {
                      loadedReferences[sectionId] = data;
                    } else if (data && typeof data === "object") {
                      loadedReferences[sectionId] = [data];
                    }
                  }
                );

                setReferenceSelectedQuestionnaires(loadedReferences);
              }

              // Set the complete template
              setPromptTemplate({
                id: template.id || "",
                plan_id: template.plan_id || planId || "",
                questionnaire_id: template.questionnaire_id || "",
                title: template.title || "",
                content: template.content || "",
                system_prompt:
                  template.system_prompt ||
                  "Sei un assistente esperto che analizza i dati dei questionari.",
                variables: Array.isArray(template.variables)
                  ? template.variables
                  : [],
                sequence_index: template.sequence_index || 0,
                created_at: template.created_at || new Date().toISOString(),
                updated_at: template.updated_at || new Date().toISOString(),
                reportTemplate:
                  template.reportTemplate || template.report_template || "",
                sections,
              });

              setSelectedQuestionnaireId(template.questionnaire_id);
              setSelectedSequenceIndex(template.sequence_index || 0);
            } else {
              toast({
                title: "Errore",
                description: "Template non trovato",
                variant: "destructive",
              });
              navigate(`/admin/plans/${planId}/prompts`);
            }
          } else if (state?.duplicate && state.template) {
            // Duplica un template esistente
            const { id, ...rest } = state.template;

            setPromptTemplate({
              ...rest,
              id: "",
              title: `Copia di ${rest.title}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              variables: Array.isArray(rest.variables) ? rest.variables : [],
            });
            setSelectedQuestionnaireId(rest.questionnaire_id);
            setSelectedSequenceIndex(rest.sequence_index);
          } else {
            // Template di default per nuovi prompt
            setPromptTemplate({
              id: "",
              plan_id: planId || "",
              questionnaire_id: state?.questionnaireId || "",
              title: "Nuovo Prompt",
              content: "",
              system_prompt:
                "Sei un assistente esperto che analizza i dati dei questionari.",
              variables: [],
              sequence_index: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              reportTemplate: "",
              sections: {
                text: [
                  {
                    id: "1",
                    title: "Introduzione",
                    shortcode: "intro",
                    prompt: "",
                  },
                  {
                    id: "2",
                    title: "Analisi Generale",
                    shortcode: "analisi_generale",
                    prompt: "",
                  },
                ],
                charts: [
                  {
                    id: "1",
                    title: "Panoramica Risultati",
                    shortcode: "chart_overview",
                    type: "bar",
                    prompt: "",
                  },
                ],
                tables: [
                  {
                    id: "1",
                    title: "Riepilogo Dati",
                    shortcode: "table_summary",
                    type: "simple",
                    prompt: "",
                  },
                ],
              },
            });
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore nel caricamento dei dati",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [planId, promptId, toast, state, navigate]);
  // Load existing prompt data when questionnaire is selected
  useEffect(() => {
    const loadExistingPrompt = async () => {
      if (!planId || !selectedQuestionnaireId || promptId !== "new") return;

      try {
        const existingPrompt = await fetchPromptForQuestionnaire(
          planId,
          selectedQuestionnaireId,
          selectedSequenceIndex
        );
        console.log(existingPrompt, " existingPrompt-----------------");

        if (existingPrompt) {
          // fetchPromptForQuestionnaire should also parse JSON fields
          // If it doesn't, you'll need to update that function too
          const sections = {
            text:
              existingPrompt.sections?.text?.length > 0
                ? existingPrompt.sections.text
                : [
                    {
                      id: "1",
                      title: "Introduzione",
                      shortcode: "intro",
                      prompt: "",
                    },
                    {
                      id: "2",
                      title: "Analisi Generale",
                      shortcode: "analisi_generale",
                      prompt: "",
                    },
                  ],
            charts:
              existingPrompt.sections?.charts?.length > 0
                ? existingPrompt.sections.charts
                : [
                    {
                      id: "1",
                      title: "Panoramica Risultati",
                      shortcode: "chart_overview",
                      type: "bar",
                      prompt: "",
                    },
                  ],
            tables:
              existingPrompt.sections?.tables?.length > 0
                ? existingPrompt.sections.tables
                : [
                    {
                      id: "1",
                      title: "Riepilogo Dati",
                      shortcode: "table_summary",
                      type: "simple",
                      prompt: "",
                    },
                  ],
          };

          setPromptTemplate({
            ...existingPrompt,
            sections,
            variables: existingPrompt.variables || [],
          });
        }
      } catch (error) {
        console.error("Error loading existing prompt:", error);
      }
    };

    loadExistingPrompt();
  }, [planId, selectedQuestionnaireId, selectedSequenceIndex, promptId]);

  const getMaxSequences = () => {
    if (!planSettings) return 1;

    if (planSettings.is_periodic && planSettings.retake_limit) {
      return planSettings.retake_limit;
    } else if (planSettings.can_retake && planSettings.retake_limit) {
      return planSettings.retake_limit + 1;
    }

    return 1;
  };

  const sequenceIndexes = Array.from(
    { length: getMaxSequences() },
    (_, i) => i
  );

  // Function to get questionnaire title by ID
  const getQuestionnaireTitle = (questionnaireId: string | null) => {
    if (!questionnaireId) return "Seleziona questionario";
    const questionnaire = questionnaires.find(
      (q) => q.questionnaire_id === questionnaireId
    );
    return questionnaire?.questionnaire?.title || "Questionario non trovato";
  };

  // Function to import sections from another questionnaire
  const handleImportSectionsFromQuestionnaire = async (
    questionnaireId: string,
    sectionType: "text" | "charts" | "tables"
  ) => {
    try {
      // Fetch the prompt template for the selected questionnaire
      const existingPrompt = await fetchPromptForQuestionnaire(
        planId!,
        questionnaireId,
        0 // or selectedSequenceIndex if needed
      );

      if (
        existingPrompt &&
        existingPrompt.sections_data &&
        existingPrompt.sections_data[sectionType]
      ) {
        const sectionsToImport = existingPrompt.sections_data[sectionType];

        setPromptTemplate((prev) => ({
          ...prev,
          sections: {
            ...prev.sections!,
            [sectionType]: [
              ...(prev.sections?.[sectionType] || []),
              ...sectionsToImport,
            ],
          },
        }));

        toast({
          title: "Sezioni importate",
          description: `${
            sectionsToImport.length
          } sezioni ${sectionType} importate con successo da ${getQuestionnaireTitle(
            questionnaireId
          )}`,
        });
      } else {
        toast({
          title: "Nessuna sezione trovata",
          description: `Il questionario selezionato non ha sezioni ${sectionType} configurate`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing sections:", error);
      toast({
        title: "Errore",
        description:
          "Si è verificato un errore durante l'importazione delle sezioni",
        variant: "destructive",
      });
    }
  };

  // Function to import a specific section into a target section
  const handleImportSpecificSection = async (
    sourceQuestionnaireId: string,
    sectionType: "text" | "charts" | "tables",
    sourceSectionId: string,
    targetSectionId: string
  ) => {
    try {
      const existingPrompt = await fetchPromptForQuestionnaire(
        planId!,
        sourceQuestionnaireId,
        0
      );

      if (
        existingPrompt &&
        existingPrompt.sections_data &&
        existingPrompt.sections_data[sectionType]
      ) {
        const sourceSection = existingPrompt.sections_data[sectionType].find(
          (section: any) => section.id === sourceSectionId
        );

        if (sourceSection) {
          // Update the target section with the source section's data
          setPromptTemplate((prev) => ({
            ...prev,
            sections: {
              ...prev.sections!,
              [sectionType]: prev.sections![sectionType].map((item) =>
                item.id === targetSectionId
                  ? {
                      ...item,
                      title: sourceSection.title,
                      shortcode: sourceSection.shortcode,
                      prompt: sourceSection.prompt || "",
                      ...(sectionType === "charts" && {
                        type: sourceSection.type,
                      }),
                      ...(sectionType === "tables" && {
                        type: sourceSection.type,
                      }),
                    }
                  : item
              ),
            },
          }));

          toast({
            title: "Sezione importata",
            description: `Sezione "${sourceSection.title}" importata con successo`,
          });
        } else {
          toast({
            title: "Sezione non trovata",
            description: "La sezione selezionata non è stata trovata",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error importing specific section:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'importazione",
        variant: "destructive",
      });
    }
  };

  // Function to get available sections from a questionnaire
  const getAvailableSections = async (
    questionnaireId: string,
    sectionType: "text" | "charts" | "tables"
  ) => {
    try {
      const existingPrompt = await fetchPromptForQuestionnaire(
        planId!,
        questionnaireId,
        0
      );

      if (
        existingPrompt &&
        existingPrompt.sections_data &&
        existingPrompt.sections_data[sectionType]
      ) {
        return existingPrompt.sections_data[sectionType];
      }
      return [];
    } catch (error) {
      console.error("Error fetching available sections:", error);
      return [];
    }
  };

  // Function to check if a questionnaire has any sections of a specific type configured
  const hasConfiguredSections = async (
    questionnaireId: string,
    sectionType: "text" | "charts" | "tables"
  ): Promise<boolean> => {
    try {
      const availableSections = await getAvailableSections(
        questionnaireId,
        sectionType
      );
      return availableSections.length > 0;
    } catch (error) {
      return false;
    }
  };

  // Function to handle questionnaire selection for each section (supports multiple selections)
  const handleQuestionnaireSelection = (
    questionnaireId: string,
    sectionType: "text" | "charts" | "tables",
    sectionId: string,
    shortcode: string
  ) => {
    setReferenceSelectedQuestionnaires((prev) => {
      const currentSelections = prev[sectionId] || [];

      // Check if this questionnaire is already selected
      const isAlreadySelected = currentSelections.some(
        (sel) => sel.questionnaireId === questionnaireId
      );

      if (isAlreadySelected) {
        toast({
          title: "Questionario già selezionato",
          description: `Questo questionario è già associato alla sezione [${shortcode}]`,
          variant: "destructive",
        });
        return prev;
      }

      // Add the new questionnaire to the array
      const newSelection = {
        questionnaireId,
        shortcode,
        sectionType,
      };

      return {
        ...prev,
        [sectionId]: [...currentSelections, newSelection],
      };
    });

    toast({
      title: "Questionario aggiunto",
      description: `Questionario associato alla sezione [${shortcode}]`,
    });
  };

  // Function to get the selected questionnaires for a section (returns array)
  const getSelectedQuestionnairesForSection = (sectionId: string) => {
    return referenceSelectedQuestionnaires[sectionId] || [];
  };

  // Function to remove a specific questionnaire from a section
  const removeQuestionnaireFromSection = (
    sectionId: string,
    questionnaireId: string
  ) => {
    setReferenceSelectedQuestionnaires((prev) => {
      const currentSelections = prev[sectionId] || [];
      const filteredSelections = currentSelections.filter(
        (sel) => sel.questionnaireId !== questionnaireId
      );

      if (filteredSelections.length === 0) {
        // If no selections left, remove the section entirely
        const newState = { ...prev };
        delete newState[sectionId];
        return newState;
      }

      return {
        ...prev,
        [sectionId]: filteredSelections,
      };
    });
  };

  // Function to get the selected questionnaire for a section
  const getSelectedQuestionnaireForSection = (sectionId: string) => {
    const questionnaires = referenceSelectedQuestionnaires[sectionId];
    return questionnaires && questionnaires.length > 0
      ? questionnaires[0]
      : null;
  };

  // Helper function to get questionnaire by ID
  const getQuestionnaireById = (questionnaireId: string) => {
    return questionnaires.find((q) => q.questionnaire_id === questionnaireId);
  };

  // Component to display selected questionnaires list (supports multiple)
  const SelectedQuestionnairesList = ({
    sectionId,
    sectionType,
  }: {
    sectionId: string;
    sectionType: "text" | "charts" | "tables";
  }) => {
    const selectedQuestionnaires =
      getSelectedQuestionnairesForSection(sectionId);

    if (selectedQuestionnaires.length === 0) {
      return (
        <div className="mt-2 p-2 bg-muted/50 rounded-md border-dashed border">
          <p className="text-xs text-muted-foreground italic">
            Nessun questionario di riferimento selezionato
          </p>
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Questionari di riferimento ({selectedQuestionnaires.length}):
        </p>
        {selectedQuestionnaires.map((selectedQuestionnaire, index) => {
          const questionnaire = getQuestionnaireById(
            selectedQuestionnaire.questionnaireId
          );

          return (
            <div
              key={`${selectedQuestionnaire.questionnaireId}-${index}`}
              className="p-3 bg-primary/5 border border-primary/20 rounded-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">
                      {questionnaire?.questionnaire?.title ||
                        "Questionario selezionato"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Shortcode associato: [{selectedQuestionnaire.shortcode}]
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID:{" "}
                      {selectedQuestionnaire.questionnaireId.substring(0, 8)}...
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removeQuestionnaireFromSection(
                      sectionId,
                      selectedQuestionnaire.questionnaireId
                    );
                    toast({
                      title: "Questionario rimosso",
                      description: `Riferimento rimosso dalla sezione [${selectedQuestionnaire.shortcode}]`,
                    });
                  }}
                  className="h-8 w-8 p-0 hover:bg-destructive/10"
                  title="Rimuovi questionario di riferimento"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleAddVariable = () => {
    setPromptTemplate((prev) => ({
      ...prev,
      variables: [...(prev.variables || []), { name: "", description: "" }],
    }));
  };

  const handleVariableChange = (
    index: number,
    field: keyof PromptVariable,
    value: string
  ) => {
    setPromptTemplate((prev) => {
      const variables = [...(prev.variables || [])];
      variables[index] = {
        ...variables[index],
        [field]: value,
      };
      return { ...prev, variables };
    });
  };

  const handleRemoveVariable = (index: number) => {
    setPromptTemplate((prev) => {
      const variables = [...(prev.variables || [])];
      variables.splice(index, 1);
      return { ...prev, variables };
    });
  };

  const handleAddTextSection = () => {
    const sections = promptTemplate.sections || {
      text: [],
      charts: [],
      tables: [],
    };
    const newId = (sections.text.length + 1).toString();
    const newShortcode = `sezione_testo_${newId}`;

    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        text: [
          ...(prev.sections?.text || []),
          {
            id: newId,
            title: `Nuova Sezione Testo ${newId}`,
            shortcode: newShortcode,
            prompt: "",
          },
        ],
      },
    }));
  };

  const handleAddChartSection = () => {
    const sections = promptTemplate.sections || {
      text: [],
      charts: [],
      tables: [],
    };
    const newId = (sections.charts.length + 1).toString();
    const newShortcode = `grafico_${newId}`;

    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        charts: [
          ...(prev.sections?.charts || []),
          {
            id: newId,
            title: `Grafico ${newId}`,
            type: "bar",
            shortcode: newShortcode,
            prompt: "",
            config: {
              colors: ["#4f46e5", "#2dd4bf", "#fbbf24"],
              height: 350,
              animations: { enabled: true },
            },
          },
        ],
      },
    }));
  };

  const handleAddTableSection = () => {
    const sections = promptTemplate.sections || {
      text: [],
      charts: [],
      tables: [],
    };
    const newId = (sections.tables.length + 1).toString();
    const newShortcode = `tabella_${newId}`;

    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        tables: [
          ...(prev.sections?.tables || []),
          {
            id: newId,
            title: `Tabella ${newId}`,
            type: "simple",
            shortcode: newShortcode,
            prompt: "",
            config: {
              headers: ["Colonna 1", "Colonna 2", "Colonna 3"],
              sortable: true,
            },
          },
        ],
      },
    }));
  };

  const handleRemoveSection = (
    type: "text" | "charts" | "tables",
    id: string
  ) => {
    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        [type]: prev.sections![type].filter((item) => item.id !== id),
      },
    }));
  };

  const handleSectionChange = (
    type: "text" | "charts" | "tables",
    id: string,
    field: string,
    value: any
  ) => {
    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        [type]: prev.sections![type].map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const openSectionPromptDialog = (
    type: "text" | "charts" | "tables",
    id: string
  ) => {
    const section = promptTemplate.sections![type].find(
      (item) => item.id === id
    );
    if (section) {
      setEditingSectionType(type);
      setEditingSectionId(id);
      setCurrentSectionPrompt({
        id,
        type,
        title: section.title,
        prompt: section.prompt || "",
      });
    }
  };

  const saveSectionPrompt = () => {
    if (!editingSectionType || !editingSectionId) return;

    setPromptTemplate((prev) => ({
      ...prev,
      sections: {
        ...prev.sections!,
        [editingSectionType]: prev.sections![editingSectionType].map((item) =>
          item.id === editingSectionId
            ? { ...item, prompt: currentSectionPrompt.prompt }
            : item
        ),
      },
    }));

    setEditingSectionId(null);
    setEditingSectionType(null);
  };

  const handleSaveTemplate = async () => {
    if (!planId || !selectedQuestionnaireId) {
      toast({
        title: "Errore",
        description: "Manca il questionario selezionato",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Clean up sections data by removing reference_questionnaires attributes
      const cleanedSections = promptTemplate.sections
        ? {
            text: promptTemplate.sections.text.map((section) => {
              const { reference_questionnaires, ...cleanSection } =
                section as any;
              return cleanSection;
            }),
            charts: promptTemplate.sections.charts.map((chart) => {
              const { reference_questionnaires, ...cleanChart } = chart as any;
              return cleanChart;
            }),
            tables: promptTemplate.sections.tables.map((table) => {
              const { reference_questionnaires, ...cleanTable } = table as any;
              return cleanTable;
            }),
          }
        : undefined;

      // Prepare reference questionnaires data for database storage (now handles arrays)
      const referenceQuestionnaires = Object.entries(
        referenceSelectedQuestionnaires
      ).reduce((acc, [sectionId, questionnairesArray]) => {
        acc[sectionId] = questionnairesArray.map((data) => ({
          questionnaireId: data.questionnaireId,
          shortcode: data.shortcode,
          sectionType: data.sectionType,
        }));
        return acc;
      }, {} as Record<string, any>);

      // Salva il template del prompt con le sezioni pulite e i riferimenti ai questionari
      const templateToSave: PromptTemplateWithSections = {
        ...promptTemplate,
        plan_id: planId,
        questionnaire_id: selectedQuestionnaireId,
        sequence_index: selectedSequenceIndex,
        sections: cleanedSections,
        reference_questionnaires: referenceQuestionnaires,
      };

      console.log(
        "Saving template with cleaned sections and reference questionnaires:",
        {
          ...templateToSave,
          reference_questionnaires: referenceQuestionnaires,
        }
      );

      const savedTemplate = await savePromptTemplate(templateToSave as any);

      if (savedTemplate) {
        toast({
          title: "Template salvato",
          description: "Il template del prompt è stato salvato con successo",
        });

        // ✅ Parse AI response
        const aiResponse =
          typeof savedTemplate.ai_response === "string"
            ? JSON.parse(savedTemplate.ai_response)
            : savedTemplate.ai_response;

        // ✅ Generate prompt preview text with AI response data
        const promptPreview = generatePromptPreview(
          savedTemplate,
          referenceQuestionnaires,
          aiResponse
        );
        setPromptPreviewData(promptPreview);

        // ✅ Set AI response data
        setAiResponseData(aiResponse);

        setShowAiResponseDialog(true);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore nel salvataggio del template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ Updated function to generate the prompt preview
  const generatePromptPreview = (
    template: any,
    referenceQuestionnaires: Record<string, any>,
    aiResponseData: any
  ) => {
    let preview = `=== COMPLETE PROMPT THAT WILL BE SENT TO CHATGPT ===\n\n`;

    // System Prompt
    preview += `📋 SYSTEM PROMPT (General Instructions):\n`;
    preview += `${
      aiResponseData?.prompt_structure?.system_prompt ||
      template.system_prompt ||
      "No system prompt defined"
    }\n\n`;

    preview += `---\n\n`;

    // Argument Prompt
    preview += `💬 ARGUMENT PROMPT (Main Content):\n`;
    preview += `${
      aiResponseData?.prompt_structure?.main_prompt ||
      template.content ||
      template.prompt_principale ||
      "No argument prompt defined"
    }\n\n`;

    preview += `---\n\n`;

    // ✅ QUESTIONNAIRE QUESTIONS
    if (aiResponseData?.main_questionnaire) {
      preview += `❓ QUESTIONNAIRE: ${
        aiResponseData.main_questionnaire.title || "Untitled"
      }\n`;

      if (aiResponseData.main_questionnaire.description) {
        preview += `   Description: ${aiResponseData.main_questionnaire.description}\n`;
      }

      preview += `\n`;

      if (aiResponseData.main_questionnaire.questions) {
        const questionnaireConfig = aiResponseData.main_questionnaire.questions;

        // Handle SurveyJS format
        if (
          questionnaireConfig.pages &&
          Array.isArray(questionnaireConfig.pages)
        ) {
          let questionNumber = 1;

          questionnaireConfig.pages.forEach((page: any) => {
            if (page.title) {
              preview += `  📄 ${page.title}\n`;
            }

            if (page.elements && Array.isArray(page.elements)) {
              page.elements.forEach((element: any) => {
                preview += `\n  ${questionNumber}. ${
                  element.title || element.name
                }\n`;

                if (element.description) {
                  preview += `     Description: ${element.description}\n`;
                }

                preview += `     Type: ${element.type}\n`;
                preview += `     Required: ${
                  element.isRequired ? "Yes" : "No"
                }\n`;

                // Show choices for select-type questions
                if (element.choices && Array.isArray(element.choices)) {
                  preview += `     Options:\n`;
                  element.choices.forEach((choice: any) => {
                    const choiceText =
                      typeof choice === "string" ? choice : choice.text;
                    const choiceScore =
                      typeof choice === "object" && choice.score
                        ? ` (Score: ${choice.score})`
                        : "";
                    preview += `        - ${choiceText}${choiceScore}\n`;
                  });
                }

                // Show conditional logic if exists
                if (element.visibleIf) {
                  preview += `     Conditional: ${element.visibleIf}\n`;
                }

                // Show guide if exists
                if (element.guide) {
                  preview += `     Guide: ${element.guide}\n`;
                }

                questionNumber++;
              });
            }

            preview += `\n`;
          });
        }
      }

      preview += `---\n\n`;
    }

    // ✅ REFERENCE QUESTIONNAIRES QUESTIONS
    if (
      aiResponseData?.reference_questionnaires_data &&
      Object.keys(aiResponseData.reference_questionnaires_data).length > 0
    ) {
      preview += `📎 REFERENCE QUESTIONNAIRES DATA:\n\n`;

      Object.entries(aiResponseData.reference_questionnaires_data).forEach(
        ([qId, qData]: [string, any]) => {
          preview += `  📋 Questionnaire: ${qData.title} (ID: ${qId})\n`;
          if (qData.description) {
            preview += `     Description: ${qData.description}\n`;
          }
          preview += `\n`;

          if (qData.questions) {
            const refQuestionnaireConfig = qData.questions;

            // Handle SurveyJS format
            if (
              refQuestionnaireConfig.pages &&
              Array.isArray(refQuestionnaireConfig.pages)
            ) {
              let questionNumber = 1;

              refQuestionnaireConfig.pages.forEach((page: any) => {
                if (page.elements && Array.isArray(page.elements)) {
                  page.elements.forEach((element: any) => {
                    preview += `    ${questionNumber}. ${
                      element.title || element.name
                    } (${element.type})\n`;

                    if (element.choices && Array.isArray(element.choices)) {
                      const choicesText = element.choices
                        .map((c: any) => (typeof c === "string" ? c : c.text))
                        .join(", ");
                      preview += `       Options: ${choicesText}\n`;
                    }

                    questionNumber++;
                  });
                }
              });
            }
          }

          preview += `\n`;
        }
      );

      preview += `---\n\n`;
    }

    // Sections Configuration
    preview += `📊 SECTIONS CONFIGURATION:\n\n`;

    let sectionsData =
      aiResponseData?.prompt_structure?.sections_data ||
      template.sections_data ||
      template.sections;
    if (typeof sectionsData === "string") {
      try {
        sectionsData = JSON.parse(sectionsData);
      } catch (e) {
        sectionsData = {};
      }
    }

    // Text Sections
    if (sectionsData?.text && sectionsData.text.length > 0) {
      preview += `📝 TEXT SECTIONS:\n`;
      sectionsData.text.forEach((section: any, index: number) => {
        preview += `  ${index + 1}. Title: "${section.title}"\n`;
        preview += `     Shortcode: ${section.shortcode}\n`;
        if (section.prompt) {
          preview += `     Instructions: "${section.prompt}"\n`;
        }

        const refs = referenceQuestionnaires[section.id];
        if (refs && refs.length > 0) {
          preview += `     📎 Other Questionnaires to Use:\n`;
          refs.forEach((ref: any) => {
            preview += `        - Questionnaire ID: ${ref.questionnaireId}, Shortcode: ${ref.shortcode}\n`;
          });
        }
        preview += `\n`;
      });
    }

    // Chart Sections
    if (sectionsData?.charts && sectionsData.charts.length > 0) {
      preview += `📊 CHART SECTIONS:\n`;
      sectionsData.charts.forEach((section: any, index: number) => {
        preview += `  ${index + 1}. Title: "${section.title}"\n`;
        preview += `     Shortcode: ${section.shortcode}\n`;
        preview += `     Type of Chart: ${section.type}\n`;
        if (section.prompt) {
          preview += `     Instructions: "${section.prompt}"\n`;
        }

        const refs = referenceQuestionnaires[section.id];
        if (refs && refs.length > 0) {
          preview += `     📎 Other Questionnaires to Use:\n`;
          refs.forEach((ref: any) => {
            preview += `        - Questionnaire ID: ${ref.questionnaireId}, Shortcode: ${ref.shortcode}\n`;
          });
        }
        preview += `\n`;
      });
    }

    // Table Sections
    if (sectionsData?.tables && sectionsData.tables.length > 0) {
      preview += `📋 TABLE SECTIONS:\n`;
      sectionsData.tables.forEach((section: any, index: number) => {
        preview += `  ${index + 1}. Title: "${section.title}"\n`;
        preview += `     Shortcode: ${section.shortcode}\n`;
        preview += `     Type: ${section.type}\n`;
        if (section.prompt) {
          preview += `     Instructions: "${section.prompt}"\n`;
        }

        const refs = referenceQuestionnaires[section.id];
        if (refs && refs.length > 0) {
          preview += `     📎 Other Questionnaires to Use:\n`;
          refs.forEach((ref: any) => {
            preview += `        - Questionnaire ID: ${ref.questionnaireId}, Shortcode: ${ref.shortcode}\n`;
          });
        }
        preview += `\n`;
      });
    }

    preview += `---\n\n`;

    preview += `ℹ️ NOTE:\n`;
    preview += `When a user completes the questionnaire, ChatGPT will receive:\n`;
    preview += `- All the above structure and questions\n`;
    preview += `- The user's actual answers to all questions\n`;
    preview += `- Data from reference questionnaires (if configured)\n`;
    preview += `- Then ChatGPT will generate the personalized report based on these instructions\n`;

    return preview;
  };

  const getShortcodesForTemplate = () => {
    if (!promptTemplate.sections) return "";

    let allShortcodes = "";

    // Aggiungi shortcode per le sezioni di testo
    promptTemplate.sections.text.forEach((section) => {
      allShortcodes += `[${section.shortcode}]\n\n`;
    });

    // Aggiungi shortcode per i grafici
    promptTemplate.sections.charts.forEach((chart) => {
      allShortcodes += `[${chart.shortcode}]\n\n`;
    });

    // Aggiungi shortcode per le tabelle
    promptTemplate.sections.tables.forEach((table) => {
      allShortcodes += `[${table.shortcode}]\n\n`;
    });

    return allShortcodes;
  };

  // Funzione per ottenere il titolo del questionario selezionato
  const getSelectedQuestionnaireTitle = () => {
    const questionnaire = questionnaires.find(
      (q) => q.questionnaire_id === selectedQuestionnaireId
    );
    return questionnaire?.questionnaire?.title || "Questionario selezionato";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/plans/${planId}/prompts`)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Torna alla lista dei prompt
          </Button>
          <h1 className="text-2xl font-bold ml-4">
            {promptId && promptId !== "new"
              ? "Modifica Prompt"
              : "Nuovo Prompt"}
          </h1>
        </div>
        <Button
          onClick={handleSaveTemplate}
          disabled={saving || !selectedQuestionnaireId || !promptTemplate.title}
        >
          <Save className="h-4 w-4 mr-2" />
          Salva Template
        </Button>
      </div>

      <div className="mb-6 flex space-x-4">
        <div className="w-full">
          <h2 className="text-lg font-medium mb-2">
            {selectedQuestionnaireId
              ? `Configurazione Prompt per "${getSelectedQuestionnaireTitle()}"`
              : "Seleziona un questionario"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Questionario</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between mt-1"
                  >
                    {selectedQuestionnaireId
                      ? getSelectedQuestionnaireTitle()
                      : "Seleziona questionario"}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {questionnaires.length > 0 ? (
                    questionnaires.map((item) => (
                      <DropdownMenuItem
                        key={item.questionnaire_id}
                        onClick={() =>
                          setSelectedQuestionnaireId(item.questionnaire_id)
                        }
                      >
                        {item.questionnaire?.title || "Questionario senza nome"}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      Nessun questionario disponibile
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <Label>Sequenza</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between mt-1"
                  >
                    {selectedSequenceIndex === 0
                      ? "Prima compilazione"
                      : `Verifica ${selectedSequenceIndex}`}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {sequenceIndexes.map((index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => setSelectedSequenceIndex(index)}
                    >
                      {index === 0 ? "Prima compilazione" : `Verifica ${index}`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="prompt" className="flex-1">
            Configurazione Prompt Generale
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex-1">
            Sezioni Report e Prompt
          </TabsTrigger>
          <TabsTrigger value="template" className="flex-1">
            Struttura Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>
                Configura il Prompt Generale per{" "}
                {selectedQuestionnaireId
                  ? getSelectedQuestionnaireTitle()
                  : "il questionario"}
              </CardTitle>
              <CardDescription>
                Imposta il prompt base utilizzato da ChatGPT per analizzare le
                risposte e generare il report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="template-title">Titolo del Template</Label>
                <Input
                  id="template-title"
                  value={promptTemplate.title || ""}
                  onChange={(e) =>
                    setPromptTemplate({
                      ...promptTemplate,
                      title: e.target.value,
                    })
                  }
                  placeholder="Es. Analisi iniziale del questionario"
                />
              </div>

              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  rows={3}
                  value={promptTemplate.system_prompt || ""}
                  onChange={(e) =>
                    setPromptTemplate({
                      ...promptTemplate,
                      system_prompt: e.target.value,
                    })
                  }
                  placeholder="Es. Sei un assistente esperto in analisi di questionari aziendali..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Il system prompt definisce il comportamento generale
                  dell'assistente AI
                </p>
              </div>

              <div>
                <Label htmlFor="prompt-content">Prompt Principale</Label>
                <Textarea
                  id="prompt-content"
                  rows={8}
                  value={promptTemplate.content || ""}
                  onChange={(e) =>
                    setPromptTemplate({
                      ...promptTemplate,
                      content: e.target.value,
                    })
                  }
                  placeholder="Inserisci qui il contenuto del prompt generale con le variabili tra parentesi graffe, es: {nome_variabile}..."
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Questo è il prompt generale per tutto il report. I prompt
                  specifici per ogni sezione possono essere definiti nella
                  scheda "Sezioni Report e Prompt". Usa {"{questionnaire_data}"}{" "}
                  per includere automaticamente i dati del questionario.
                </p>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Variabili</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariable}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> Aggiungi Variabile
                  </Button>
                </div>

                {(promptTemplate.variables || []).length > 0 ? (
                  <div className="space-y-2">
                    {(promptTemplate.variables || []).map((variable, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={variable.name}
                          onChange={(e) =>
                            handleVariableChange(index, "name", e.target.value)
                          }
                          placeholder="Nome variabile"
                          className="w-1/3"
                        />
                        <Input
                          value={variable.description}
                          onChange={(e) =>
                            handleVariableChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Descrizione"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVariable(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Nessuna variabile definita. Le variabili ti permettono di
                    personalizzare il prompt con dati specifici.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                onClick={handleSaveTemplate}
                disabled={
                  saving || !selectedQuestionnaireId || !promptTemplate.title
                }
              >
                <Save className="h-4 w-4 mr-2" />
                Salva Template
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sezioni di Testo</CardTitle>
                <CardDescription>
                  Definisci le sezioni di testo con i relativi prompt specifici
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {promptTemplate.sections?.text.map((section) => (
                  <div
                    key={section.id}
                    className="border rounded-md p-3 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`text-title-${section.id}`}>
                        Titolo Sezione
                      </Label>
                      <div className="flex items-center space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Importa sezione
                              <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-72 max-h-60 overflow-y-auto">
                            <DropdownMenuItem
                              disabled
                              className="text-xs font-medium"
                            >
                              Seleziona questionario di riferimento:
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // Clear all selections for this section
                                setReferenceSelectedQuestionnaires((prev) => {
                                  const newState = { ...prev };
                                  delete newState[section.id];
                                  return newState;
                                });
                                toast({
                                  title: "Tutte le selezioni rimosse",
                                  description: `Tutti i questionari rimossi dalla sezione [${section.shortcode}]`,
                                });
                              }}
                              className={
                                getSelectedQuestionnairesForSection(section.id)
                                  .length === 0
                                  ? "bg-muted"
                                  : ""
                              }
                            >
                              🚫 Rimuovi tutti i questionari
                            </DropdownMenuItem>
                            {questionnaires && questionnaires.length > 0 ? (
                              questionnaires
                                .filter((questionnaire) => {
                                  // Filter out current questionnaire and already selected questionnaires
                                  const isCurrentQuestionnaire =
                                    questionnaire.questionnaire_id ===
                                    selectedQuestionnaireId;
                                  const isAlreadySelected =
                                    getSelectedQuestionnairesForSection(
                                      section.id
                                    ).some(
                                      (sel) =>
                                        sel.questionnaireId ===
                                        questionnaire.questionnaire_id
                                    );
                                  return (
                                    !isCurrentQuestionnaire &&
                                    !isAlreadySelected
                                  );
                                })
                                .map((questionnaire) => (
                                  <DropdownMenuItem
                                    key={questionnaire.questionnaire_id}
                                    onClick={() => {
                                      handleQuestionnaireSelection(
                                        questionnaire.questionnaire_id,
                                        "text",
                                        section.id,
                                        section.shortcode
                                      );
                                    }}
                                  >
                                    📝{" "}
                                    {questionnaire.questionnaire?.title ||
                                      "Questionario senza nome"}
                                  </DropdownMenuItem>
                                ))
                            ) : (
                              <DropdownMenuItem disabled>
                                Nessun questionario disponibile per questo piano
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveSection("text", section.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      id={`text-title-${section.id}`}
                      value={section.title}
                      onChange={(e) =>
                        handleSectionChange(
                          "text",
                          section.id,
                          "title",
                          e.target.value
                        )
                      }
                    />
                    <div>
                      <Label htmlFor={`text-shortcode-${section.id}`}>
                        Shortcode
                      </Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id={`text-shortcode-${section.id}`}
                          value={section.shortcode}
                          onChange={(e) =>
                            handleSectionChange(
                              "text",
                              section.id,
                              "shortcode",
                              e.target.value
                            )
                          }
                          className="font-mono"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `[${section.shortcode}]`
                            );
                            toast({
                              title: "Copiato",
                              description: `Shortcode [${section.shortcode}] copiato negli appunti`,
                            });
                          }}
                          className="ml-2"
                        >
                          Copia
                        </Button>
                      </div>
                    </div>
                    <SelectedQuestionnairesList
                      sectionId={section.id}
                      sectionType="text"
                    />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        {section.prompt
                          ? "Prompt configurato"
                          : "Nessun prompt specifico"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openSectionPromptDialog("text", section.id)
                        }
                      >
                        {section.prompt ? "Modifica Prompt" : "Aggiungi Prompt"}
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddTextSection}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Aggiungi Sezione Testo
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grafici</CardTitle>
                  <CardDescription>
                    Definisci i grafici con i relativi prompt specifici
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {promptTemplate.sections?.charts.map((chart) => (
                    <div
                      key={chart.id}
                      className="border rounded-md p-3 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <Label htmlFor={`chart-title-${chart.id}`}>
                          Titolo Grafico
                        </Label>
                        <div className="flex items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Importa grafico
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-72 max-h-60 overflow-y-auto">
                              <DropdownMenuItem
                                disabled
                                className="text-xs font-medium"
                              >
                                Seleziona questionario di riferimento:
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  // Clear all selections for this section
                                  setReferenceSelectedQuestionnaires((prev) => {
                                    const newState = { ...prev };
                                    delete newState[chart.id];
                                    return newState;
                                  });
                                  toast({
                                    title: "Tutte le selezioni rimosse",
                                    description: `Tutti i questionari rimossi dalla sezione [${chart.shortcode}]`,
                                  });
                                }}
                                className={
                                  getSelectedQuestionnairesForSection(chart.id)
                                    .length === 0
                                    ? "bg-muted"
                                    : ""
                                }
                              >
                                🚫 Rimuovi tutti i questionari
                              </DropdownMenuItem>
                              {questionnaires && questionnaires.length > 0 ? (
                                questionnaires
                                  .filter((questionnaire) => {
                                    // Filter out current questionnaire and already selected questionnaires
                                    const isCurrentQuestionnaire =
                                      questionnaire.questionnaire_id ===
                                      selectedQuestionnaireId;
                                    const isAlreadySelected =
                                      getSelectedQuestionnairesForSection(
                                        chart.id
                                      ).some(
                                        (sel) =>
                                          sel.questionnaireId ===
                                          questionnaire.questionnaire_id
                                      );
                                    return (
                                      !isCurrentQuestionnaire &&
                                      !isAlreadySelected
                                    );
                                  })
                                  .map((questionnaire) => (
                                    <DropdownMenuItem
                                      key={questionnaire.questionnaire_id}
                                      onClick={() => {
                                        handleQuestionnaireSelection(
                                          questionnaire.questionnaire_id,
                                          "charts",
                                          chart.id,
                                          chart.shortcode
                                        );
                                      }}
                                    >
                                      📊{" "}
                                      {questionnaire.questionnaire?.title ||
                                        "Questionario senza nome"}
                                    </DropdownMenuItem>
                                  ))
                              ) : (
                                <DropdownMenuItem disabled>
                                  Nessun questionario disponibile per questo
                                  piano
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveSection("charts", chart.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        id={`chart-title-${chart.id}`}
                        value={chart.title}
                        onChange={(e) =>
                          handleSectionChange(
                            "charts",
                            chart.id,
                            "title",
                            e.target.value
                          )
                        }
                      />
                      <div>
                        <Label htmlFor={`chart-type-${chart.id}`}>
                          Tipo di Grafico
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between mt-1"
                            >
                              {chart.type || "bar"}
                              <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                            {chartTypeOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() =>
                                  handleSectionChange(
                                    "charts",
                                    chart.id,
                                    "type",
                                    option.value
                                  )
                                }
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <Label htmlFor={`chart-shortcode-${chart.id}`}>
                          Shortcode
                        </Label>
                        <div className="flex items-center mt-1">
                          <Input
                            id={`chart-shortcode-${chart.id}`}
                            value={chart.shortcode}
                            onChange={(e) =>
                              handleSectionChange(
                                "charts",
                                chart.id,
                                "shortcode",
                                e.target.value
                              )
                            }
                            className="font-mono"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `[${chart.shortcode}]`
                              );
                              toast({
                                title: "Copiato",
                                description: `Shortcode [${chart.shortcode}] copiato negli appunti`,
                              });
                            }}
                            className="ml-2"
                          >
                            Copia
                          </Button>
                        </div>
                      </div>
                      <SelectedQuestionnairesList
                        sectionId={chart.id}
                        sectionType="charts"
                      />
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground">
                          {chart.prompt
                            ? "Prompt configurato"
                            : "Nessun prompt specifico"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openSectionPromptDialog("charts", chart.id)
                          }
                        >
                          {chart.prompt ? "Modifica Prompt" : "Aggiungi Prompt"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddChartSection}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Aggiungi Grafico
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tabelle</CardTitle>
                  <CardDescription>
                    Definisci le tabelle con i relativi prompt specifici
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {promptTemplate.sections?.tables.map((table) => (
                    <div
                      key={table.id}
                      className="border rounded-md p-3 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <Label htmlFor={`table-title-${table.id}`}>
                          Titolo Tabella
                        </Label>
                        <div className="flex items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Importa tabella
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-72 max-h-60 overflow-y-auto">
                              <DropdownMenuItem
                                disabled
                                className="text-xs font-medium"
                              >
                                Seleziona questionario di riferimento:
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  // Clear all selections for this section
                                  setReferenceSelectedQuestionnaires((prev) => {
                                    const newState = { ...prev };
                                    delete newState[table.id];
                                    return newState;
                                  });
                                  toast({
                                    title: "Tutte le selezioni rimosse",
                                    description: `Tutti i questionari rimossi dalla sezione [${table.shortcode}]`,
                                  });
                                }}
                                className={
                                  getSelectedQuestionnairesForSection(table.id)
                                    .length === 0
                                    ? "bg-muted"
                                    : ""
                                }
                              >
                                🚫 Rimuovi tutti i questionari
                              </DropdownMenuItem>
                              {questionnaires && questionnaires.length > 0 ? (
                                questionnaires
                                  .filter((questionnaire) => {
                                    // Filter out current questionnaire and already selected questionnaires
                                    const isCurrentQuestionnaire =
                                      questionnaire.questionnaire_id ===
                                      selectedQuestionnaireId;
                                    const isAlreadySelected =
                                      getSelectedQuestionnairesForSection(
                                        table.id
                                      ).some(
                                        (sel) =>
                                          sel.questionnaireId ===
                                          questionnaire.questionnaire_id
                                      );
                                    return (
                                      !isCurrentQuestionnaire &&
                                      !isAlreadySelected
                                    );
                                  })
                                  .map((questionnaire) => (
                                    <DropdownMenuItem
                                      key={questionnaire.questionnaire_id}
                                      onClick={() => {
                                        handleQuestionnaireSelection(
                                          questionnaire.questionnaire_id,
                                          "tables",
                                          table.id,
                                          table.shortcode
                                        );
                                      }}
                                    >
                                      📋{" "}
                                      {questionnaire.questionnaire?.title ||
                                        "Questionario senza nome"}
                                    </DropdownMenuItem>
                                  ))
                              ) : (
                                <DropdownMenuItem disabled>
                                  Nessun questionario disponibile per questo
                                  piano
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveSection("tables", table.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        id={`table-title-${table.id}`}
                        value={table.title}
                        onChange={(e) =>
                          handleSectionChange(
                            "tables",
                            table.id,
                            "title",
                            e.target.value
                          )
                        }
                      />
                      <div>
                        <Label htmlFor={`table-type-${table.id}`}>
                          Tipo di Tabella
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between mt-1"
                            >
                              {tableTypeOptions.find(
                                (o) => o.value === table.type
                              )?.label ||
                                table.type ||
                                "simple"}
                              <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            {tableTypeOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() =>
                                  handleSectionChange(
                                    "tables",
                                    table.id,
                                    "type",
                                    option.value
                                  )
                                }
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div>
                        <Label htmlFor={`table-shortcode-${table.id}`}>
                          Shortcode
                        </Label>
                        <div className="flex items-center mt-1">
                          <Input
                            id={`table-shortcode-${table.id}`}
                            value={table.shortcode}
                            onChange={(e) =>
                              handleSectionChange(
                                "tables",
                                table.id,
                                "shortcode",
                                e.target.value
                              )
                            }
                            className="font-mono"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `[${table.shortcode}]`
                              );
                              toast({
                                title: "Copiato",
                                description: `Shortcode [${table.shortcode}] copiato negli appunti`,
                              });
                            }}
                            className="ml-2"
                          >
                            Copia
                          </Button>
                        </div>
                      </div>
                      <SelectedQuestionnairesList
                        sectionId={table.id}
                        sectionType="tables"
                      />
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground">
                          {table.prompt
                            ? "Prompt configurato"
                            : "Nessun prompt specifico"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openSectionPromptDialog("tables", table.id)
                          }
                        >
                          {table.prompt ? "Modifica Prompt" : "Aggiungi Prompt"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddTableSection}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Aggiungi Tabella
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Struttura del Report</CardTitle>
              <CardDescription>
                Definisci la struttura del report usando gli shortcode delle
                sezioni create.
                <br />
                <strong>
                  Per mettere più sezioni sulla stessa riga, separale con il
                  carattere | (pipe)
                </strong>
                <br />
                Esempio: [sezione1] | [sezione2] | [sezione3]
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={20}
                placeholder="Inserisci la struttura del report utilizzando gli shortcode tra parentesi quadre [shortcode]...

Esempi:
[intro]
[analisi_generale] | [aree_forza]
[grafico_profilo] | [grafico_rischio] | [tabella_punteggi]
[raccomandazioni]"
                className="font-mono"
                value={
                  promptTemplate.reportTemplate || getShortcodesForTemplate()
                }
                onChange={(e) =>
                  setPromptTemplate({
                    ...promptTemplate,
                    reportTemplate: e.target.value,
                  })
                }
              />
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="text-sm font-semibold mb-2">
                  Shortcode Disponibili:
                </h3>
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <strong>💡 Suggerimento:</strong> Per mettere più sezioni
                  sulla stessa riga, usa il carattere | tra gli shortcode:
                  <br />
                  <code className="bg-white p-1 rounded">
                    [shortcode1] | [shortcode2] | [shortcode3]
                  </code>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <h4 className="text-xs font-medium mb-1">
                      Sezioni di Testo:
                    </h4>
                    <div className="space-y-1">
                      {promptTemplate.sections?.text.map((section) => (
                        <div
                          key={section.id}
                          className="text-xs bg-background p-1 rounded flex justify-between items-center"
                        >
                          <code>[{section.shortcode}]</code>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `[${section.shortcode}]`
                                );
                                toast({
                                  title: "Copiato",
                                  description: `Shortcode [${section.shortcode}] copiato negli appunti`,
                                });
                              }}
                              className="h-6 px-2"
                              title="Copia shortcode singolo"
                            >
                              📋
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Get current textarea content
                                const currentContent =
                                  promptTemplate.reportTemplate ||
                                  getShortcodesForTemplate();
                                const newContent =
                                  currentContent + `[${section.shortcode}] | `;
                                setPromptTemplate({
                                  ...promptTemplate,
                                  reportTemplate: newContent,
                                });
                                toast({
                                  title: "Aggiunto",
                                  description: `Shortcode [${section.shortcode}] aggiunto come parte di una riga`,
                                });
                              }}
                              className="h-6 px-2"
                              title="Aggiungi alla riga corrente"
                            >
                              ➕
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium mb-1">Grafici:</h4>
                    <div className="space-y-1">
                      {promptTemplate.sections?.charts.map((chart) => (
                        <div
                          key={chart.id}
                          className="text-xs bg-background p-1 rounded flex justify-between items-center"
                        >
                          <code>[{chart.shortcode}]</code>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `[${chart.shortcode}]`
                                );
                                toast({
                                  title: "Copiato",
                                  description: `Shortcode [${chart.shortcode}] copiato negli appunti`,
                                });
                              }}
                              className="h-6 px-2"
                              title="Copia shortcode singolo"
                            >
                              📋
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentContent =
                                  promptTemplate.reportTemplate ||
                                  getShortcodesForTemplate();
                                const newContent =
                                  currentContent + `[${chart.shortcode}] | `;
                                setPromptTemplate({
                                  ...promptTemplate,
                                  reportTemplate: newContent,
                                });
                                toast({
                                  title: "Aggiunto",
                                  description: `Shortcode [${chart.shortcode}] aggiunto come parte di una riga`,
                                });
                              }}
                              className="h-6 px-2"
                              title="Aggiungi alla riga corrente"
                            >
                              ➕
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium mb-1">Tabelle:</h4>
                    <div className="space-y-1">
                      {promptTemplate.sections?.tables.map((table) => (
                        <div
                          key={table.id}
                          className="text-xs bg-background p-1 rounded flex justify-between items-center"
                        >
                          <code>[{table.shortcode}]</code>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `[${table.shortcode}]`
                                );
                                toast({
                                  title: "Copiato",
                                  description: `Shortcode [${table.shortcode}] copiato negli appunti`,
                                });
                              }}
                              className="h-6 px-2"
                              title="Copia shortcode singolo"
                            >
                              📋
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentContent =
                                  promptTemplate.reportTemplate ||
                                  getShortcodesForTemplate();
                                const newContent =
                                  currentContent + `[${table.shortcode}] | `;
                                setPromptTemplate({
                                  ...promptTemplate,
                                  reportTemplate: newContent,
                                });
                                toast({
                                  title: "Aggiunto",
                                  description: `Shortcode [${table.shortcode}] aggiunto come parte di una riga`,
                                });
                              }}
                              className="h-6 px-2"
                              title="Aggiungi alla riga corrente"
                            >
                              ➕
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="text-sm font-medium mb-2">
                    📋 Template di Esempio:
                  </h4>
                  <div className="space-y-1 text-xs font-mono bg-white p-2 rounded">
                    <div>[intro]</div>
                    <div>[analisi_generale] | [aree_forza]</div>
                    <div>
                      [grafico_profilo] | [grafico_rischio] | [tabella_punteggi]
                    </div>
                    <div>[raccomandazioni]</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const exampleTemplate = `[intro]

[analisi_generale] | [aree_forza]

[grafico_profilo] | [grafico_rischio] | [tabella_punteggi]

[raccomandazioni]
`;
                      setPromptTemplate({
                        ...promptTemplate,
                        reportTemplate: exampleTemplate,
                      });
                      toast({
                        title: "Template di esempio applicato",
                        description:
                          "Puoi modificare la struttura come preferisci",
                      });
                    }}
                  >
                    Usa Template di Esempio
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                onClick={handleSaveTemplate}
                disabled={
                  saving || !selectedQuestionnaireId || !promptTemplate.title
                }
              >
                <Save className="h-4 w-4 mr-2" />
                Salva Template
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog per modificare i prompt specifici per sezione */}
      <Dialog
        open={editingSectionId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSectionId(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Prompt specifico per: {currentSectionPrompt.title}
            </DialogTitle>
            <DialogDescription>
              Configura il prompt che ChatGPT utilizzerà per generare
              specificamente questa sezione del report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                Questo prompt verrà utilizzato per generare specificamente il
                contenuto di questa sezione. Puoi fare riferimento ai dati del
                questionario con {"{questionnaire_data}"}.
              </p>
            </div>

            <Textarea
              value={currentSectionPrompt.prompt}
              onChange={(e) =>
                setCurrentSectionPrompt({
                  ...currentSectionPrompt,
                  prompt: e.target.value,
                })
              }
              placeholder="Inserisci qui il prompt specifico per questa sezione..."
              rows={12}
              className="font-mono"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annulla</Button>
            </DialogClose>
            <Button onClick={saveSectionPrompt}>Salva Prompt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showAiResponseDialog}
        onOpenChange={setShowAiResponseDialog}
      >
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Verifica Template Prompt e Anteprima Risposta AI
            </DialogTitle>
            <DialogDescription>
              Verifica il prompt completo che hai creato e vedi un esempio della
              risposta generata da ChatGPT
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 p-4">
            {/* PROMPT PREVIEW SECTION */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                📝 Prompt Completo Creato
              </h3>
              <div className="bg-slate-50 border rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {promptPreviewData}
                </pre>
              </div>
            </div>

            {/* AI RESPONSE SECTION */}
            {aiResponseData?.ai_generated_response?.sections &&
            aiResponseData.ai_generated_response.sections.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  🤖 Esempio Risposta AI Generata
                </h3>
                <div className="space-y-4">
                  {aiResponseData.ai_generated_response.sections.map(
                    (section: any, index: number) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline">
                            {section.section_type}
                          </Badge>
                          <h4 className="font-semibold">{section.title}</h4>
                          <span className="text-sm text-muted-foreground">
                            ({section.shortcode})
                          </span>
                        </div>
                        {section.section_type === "text" && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-700">
                            {section.content}
                          </p>
                        )}
                        {section.section_type === "chart" && (
                          <div className="bg-slate-50 p-4 rounded border">
                            <p className="text-sm font-medium mb-2">
                              📊 Tipo di Grafico: <Badge>{section.type}</Badge>
                            </p>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Labels:</span>
                                <span className="text-slate-600 ml-2">
                                  {/* Format 1: Array of objects with label/value */}
                                  {Array.isArray(section.data) &&
                                  section.data.length > 0 &&
                                  "label" in section.data[0]
                                    ? section.data
                                        .map((item) => item.label)
                                        .join(", ")
                                    : /* Format 2: Object with labels/values arrays */
                                    Array.isArray(section.data?.labels)
                                    ? section.data.labels.join(", ")
                                    : /* Format 3: Nested data.data array (handling potential nested structure) */
                                    Array.isArray(section.data?.data) &&
                                      section.data.data.length > 0 &&
                                      "label" in section.data.data[0]
                                    ? section.data.data
                                        .map((item) => item.label)
                                        .join(", ")
                                    : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Values:</span>
                                <span className="text-slate-600 ml-2">
                                  {/* Format 1: Array of objects with label/value */}
                                  {Array.isArray(section.data) &&
                                  section.data.length > 0 &&
                                  "value" in section.data[0]
                                    ? section.data
                                        .map((item) => item.value)
                                        .join(", ")
                                    : /* Format 2: Object with labels/values arrays */
                                    Array.isArray(section.data?.values)
                                    ? section.data.values.join(", ")
                                    : /* Format 3: Nested data.data array */
                                    Array.isArray(section.data?.data) &&
                                      section.data.data.length > 0 &&
                                      "value" in section.data.data[0]
                                    ? section.data.data
                                        .map((item) => item.value)
                                        .join(", ")
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {section.section_type === "table" && (
                          <div className="overflow-x-auto border rounded">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50">
                                  {/* Handle all header formats with safety checks */}
                                  {section.headers
                                    ? section.headers.map(
                                        (header: string, i: number) => (
                                          <th
                                            key={i}
                                            className="border-b p-2 text-left font-medium"
                                          >
                                            {header}
                                          </th>
                                        )
                                      )
                                    : Array.isArray(section.data) &&
                                      section.data.length > 0
                                    ? Object.keys(section.data[0]).map(
                                        (header: string, i: number) => (
                                          <th
                                            key={i}
                                            className="border-b p-2 text-left font-medium"
                                          >
                                            {header}
                                          </th>
                                        )
                                      )
                                    : null}
                                </tr>
                              </thead>
                              <tbody>
                                {/* Case 1: Using rows as array of arrays */}
                                {Array.isArray(section.rows) &&
                                section.rows.length > 0 &&
                                Array.isArray(section.rows[0])
                                  ? section.rows.map(
                                      (row: any[], i: number) => (
                                        <tr
                                          key={i}
                                          className="border-b last:border-b-0"
                                        >
                                          {row.map((cell: any, j: number) => (
                                            <td
                                              key={j}
                                              className="p-2 text-slate-700"
                                            >
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      )
                                    )
                                  : null}

                                {/* Case 2: Using rows as array of objects */}
                                {Array.isArray(section.rows) &&
                                section.rows.length > 0 &&
                                !Array.isArray(section.rows[0]) &&
                                typeof section.rows[0] === "object"
                                  ? section.rows.map((row: any, i: number) => (
                                      <tr
                                        key={i}
                                        className="border-b last:border-b-0"
                                      >
                                        {Object.values(row).map(
                                          (cell: any, j: number) => (
                                            <td
                                              key={j}
                                              className="p-2 text-slate-700"
                                            >
                                              {cell}
                                            </td>
                                          )
                                        )}
                                      </tr>
                                    ))
                                  : null}

                                {/* Case 3: Using data directly as array of objects */}
                                {(!section.rows || section.rows.length === 0) &&
                                Array.isArray(section.data)
                                  ? section.data.map((row: any, i: number) => (
                                      <tr
                                        key={i}
                                        className="border-b last:border-b-0"
                                      >
                                        {Object.values(row).map(
                                          (cell: any, j: number) => (
                                            <td
                                              key={j}
                                              className="p-2 text-slate-700"
                                            >
                                              {cell}
                                            </td>
                                          )
                                        )}
                                      </tr>
                                    ))
                                  : null}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800">
                  ⚠️ Nessuna risposta AI disponibile al momento. La risposta AI
                  verrà generata quando un utente compila il questionario.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(promptPreviewData);
                toast({
                  title: "Copiato!",
                  description: "Il prompt è stato copiato negli appunti",
                });
              }}
            >
              📋 Copia Prompt
            </Button>
            <Button
              onClick={() => {
                setShowAiResponseDialog(false);
                navigate(`/admin/plans/${planId}/prompts`);
              }}
            >
              Chiudi e Torna alla Lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptEditor;
