/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainNavigation from "@/components/MainNavigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/api";
// Import SurveyJS React Renderer and core
import { Survey } from "survey-react-ui";
import { Model, Serializer } from "survey-core";
import "../assets/surveyjs-defaultV2.min.css";
import ReactModal from "react-modal";
import { registerCustomProperties } from "@/lib/surveyjs-properties";
import { saveQuestionnaireCompletion } from "@/services/questionnaireService";

const Questionnaire = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [surveyJson, setSurveyJson] = useState<any>(null);
  const [originalFormData, setOriginalFormData] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [guideModal, setGuideModal] = useState<{
    open: boolean;
    content: string;
    loading: boolean;
    error: string;
    questionName: string | null;
  }>({
    open: false,
    content: "",
    loading: false,
    error: "",
    questionName: null,
  });
  const [sidebarText, setSidebarText] = useState(
    "Hover over questions to see lesson content."
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [progress, setProgress] = useState(0);
  const [survey, setSurvey] = useState<Model | null>(null);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Check if on final page
  const isOnFinalPage = currentPage === totalPages - 1;
  // Register custom properties immediately when component loads
  useEffect(() => {
    console.log("Registering custom properties...");
    registerCustomProperties();
  }, []);

  // Fetch user's planId from subscription
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (user?.id) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/users/${user.id}/subscription`
          );
          const result = await response.json();
          if (result.success && result.data?.planId) {
            setPlanId(result.data.planId);
            console.log("User planId fetched:", result.data.planId);
          } else {
            console.warn("No planId found in user subscription");
          }
        } catch (error) {
          console.error("Error fetching user plan:", error);
          toast({
            title: "Avviso",
            description: "Impossibile caricare le informazioni del piano",
            variant: "destructive",
          });
        }
      }
    };

    fetchUserPlan();
  }, [user?.id, toast]);

  // Inject comprehensive styles to match the old UI design
  useEffect(() => {
    const injectOldUIStyles = () => {
      const styleId = "surveyjs-old-ui-style";
      let styleTag = document.getElementById(styleId);
      if (styleTag) styleTag.remove();

      styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.innerHTML = `
        /* Reset SurveyJS container to be transparent */
        .sv-container-modern,
        .sv-root,
        .sv-body {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Main survey wrapper - Card style with shadow */
        .sv-page {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          overflow: hidden !important;
          margin: 0 !important;
        }

        /* Question container - matches CardHeader + CardContent */
        .sv-question {
          background: transparent !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Question title - matches CardTitle */
        .sv-question__title,
        .sv-question__title .sv-string-viewer {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          line-height: 1.75rem !important;
          color: #111827 !important;
          padding: 1.5rem 1.5rem 0.5rem 1.5rem !important;
          margin: 0 !important;
          border-bottom: none !important;
        }

        /* Question content area - matches CardContent */
        .sv-question__content {
          padding: 0 1.5rem 0 1.5rem !important;
          margin: 0 !important;
        }

        /* Radio/Checkbox container styling */
        .sv-selectbase {
          margin-top: 1rem !important;
        }

        /* Individual radio/checkbox options - purple bordered cards */
        .sv-selectbase__item {
          display: flex !important;
          align-items: center !important;
          padding: 1rem !important;
          margin-bottom: 0.75rem !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 0.75rem !important;
          background: #ffffff !important;
          cursor: pointer !important;
          transition: all 0.2s ease-in-out !important;
        }

        .sv-selectbase__item:hover {
          border-color: #d8b4fe !important;
          background-color: #faf5ff !important;
        }

        .sv-selectbase__item--checked,
        .sv-selectbase__item--selected {
          border-color: #9333ea !important;
          background-color: #faf5ff !important;
        }

        /* Radio button and checkbox styling */
        .sv-selectbase__item input[type="radio"],
        .sv-selectbase__item input[type="checkbox"] {
          margin-right: 0.75rem !important;
          accent-color: #9333ea !important;
        }

        .sv-selectbase__item .sv-string-viewer {
          font-size: 0.875rem !important;
          color: #374151 !important;
          cursor: pointer !important;
          flex: 1 !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Text area styling */
        .sv-text,
        .sv-comment {
          width: 100% !important;
          min-height: 150px !important;
          padding: 1rem !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 0.75rem !important;
          margin-top: 1rem !important;
          font-family: inherit !important;
          font-size: 0.875rem !important;
          line-height: 1.5 !important;
          resize: vertical !important;
        }

        .sv-text:focus,
        .sv-comment:focus {
          outline: none !important;
          border-color: #c084fc !important;
          box-shadow: 0 0 0 3px rgba(196, 132, 252, 0.1) !important;
        }

        .sv-text::placeholder,
        .sv-comment::placeholder {
          color: #9ca3af !important;
        }

        /* Navigation footer - matches CardFooter */
        .sv-action-bar {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding: 1.5rem !important;
          border-top: 1px solid #e5e7eb !important;
          background: #ffffff !important;
          margin: 0 !important;
        }

        /* Button group on the right */
        .sv-action-bar .sv-action-bar-item {
          margin: 0 !important;
        }

        .sv-action-bar .sv-action-bar-item:not(:last-child) {
          margin-right: 0.5rem !important;
        }

        /* Base button styling */
        .sv-action-bar input[type="button"] {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          line-height: 1.25rem !important;
          border-radius: 0.375rem !important;
          padding: 0.5rem 1rem !important;
          transition: all 0.2s ease-in-out !important;
          cursor: pointer !important;
          border: 1px solid transparent !important;
          min-height: 2.25rem !important;
        }

        /* Previous button - purple outline variant */
        .sv-action-bar input[type="button"][value*="Previous"],
        .sv-action-bar input[value*="Previous"],
        input[type="button"][value*="Previous"] {
          background: #ffffff !important;
          border: 2px solid #9333ea !important;
          color: #9333ea !important;
          font-weight: 600 !important;
        }

        .sv-action-bar input[type="button"][value*="Previous"]:hover:not(:disabled),
        .sv-action-bar input[value*="Previous"]:hover:not(:disabled),
        input[type="button"][value*="Previous"]:hover:not(:disabled) {
          background: #faf5ff !important;
          border-color: #7c3aed !important;
          color: #7c3aed !important;
        }

        /* Next/Submit buttons - solid purple */
        .sv-action-bar input[type="button"]:not([value*="Previous"]),
        .sv-action-bar input[value*="Next"],
        .sv-action-bar input[value*="Submit"],
        input[type="button"][value*="Next"],
        input[type="button"][value*="Submit"] {
          background: #9333ea !important;
          color: #ffffff !important;
          border: 1px solid #9333ea !important;
          font-weight: 600 !important;
        }

        .sv-action-bar input[type="button"]:not([value*="Previous"]):hover:not(:disabled),
        .sv-action-bar input[value*="Next"]:hover:not(:disabled),
        .sv-action-bar input[value*="Submit"]:hover:not(:disabled),
        input[type="button"][value*="Next"]:hover:not(:disabled),
        input[type="button"][value*="Submit"]:hover:not(:disabled) {
          background: #7c3aed !important;
          border-color: #7c3aed !important;
        }

        /* Disabled state */
        .sv-action-bar input[type="button"]:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }

        /* Hide default SurveyJS progress bar */
        .sv-progress,
        .sv-progress-bar,
        .sv-header {
          display: none !important;
        }

        /* Custom progress bar responsiveness */
        @media (max-width: 768px) {
          .progress-steps {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .progress-step {
            min-width: 1.5rem;
          }
        }

        /* Remove default margins and paddings */
        .sv-page__content,
        .sv-question__header {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Ensure proper pointer events for hover functionality */
        .sv-question,
        .sv-question__content,
        .sv-question__title {
          pointer-events: auto !important;
        }

        /* Guide/help content styling */
        .sv-question__description {
          padding: 0 1.5rem !important;
          margin-bottom: 1rem !important;
        }

        .sv-question__description .sv-string-viewer {
          background: #dbeafe !important;
          color: #1e40af !important;
          padding: 0.75rem !important;
          border-radius: 0.375rem !important;
          font-size: 0.875rem !important;
          font-weight: normal !important;
        }

        /* Sidebar styling to match old UI */
        .questionnaire-sidebar {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          padding: 1.5rem !important;
          position: sticky !important;
          top: 6rem !important;
          max-height: calc(100vh - 8rem) !important;
          overflow-y: auto !important;
        }

        .questionnaire-sidebar h3 {
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          color: #111827 !important;
          margin: 0 0 1rem 0 !important;
        }

        .questionnaire-sidebar .guide-content h4 {
          font-size: 1rem !important;
          font-weight: 600 !important;
          color: #374151 !important;
          margin: 0 0 0.5rem 0 !important;
        }

        .questionnaire-sidebar .guide-content p {
          font-size: 0.875rem !important;
          color: #6b7280 !important;
          line-height: 1.5 !important;
          margin: 0 !important;
          transition: all 0.2s ease-in-out !important;
        }

        .questionnaire-sidebar .space-y-3 > div {
          background: #f9fafb !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 0.375rem !important;
          padding: 0.75rem !important;
        }

        .questionnaire-sidebar .space-y-3 p {
          margin: 0 !important;
          font-size: 0.875rem !important;
        }

        .questionnaire-sidebar .space-y-3 p.font-medium {
          font-weight: 500 !important;
          color: #111827 !important;
        }

        .questionnaire-sidebar .space-y-3 p.text-xs {
          font-size: 0.75rem !important;
          color: #6b7280 !important;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .sv-action-bar {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          
          .sv-action-bar input[type="button"] {
            width: 100% !important;
          }
          
          .questionnaire-sidebar {
            margin-top: 1.5rem !important;
            position: relative !important;
            top: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
          }
        }
      `;

      document.head.appendChild(styleTag);
      console.log("✅ Old UI styles applied to match original design");
    };

    // Apply styles with retries to ensure SurveyJS has rendered
    injectOldUIStyles();
    const timeout1 = setTimeout(injectOldUIStyles, 100);
    const timeout2 = setTimeout(injectOldUIStyles, 500);
    const timeout3 = setTimeout(injectOldUIStyles, 1000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      const styleTag = document.getElementById("surveyjs-old-ui-style");
      if (styleTag) styleTag.remove();
    };
  }, []);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE_URL}/forms/${id}`);
        if (!res.ok) throw new Error("Questionnaire not found");
        const result = await res.json();
        if (!result.success || !result.data)
          throw new Error("Invalid API response structure");
        const data = result.data;

        console.log("Fetched form data:", data);
        console.log("Questions JSON:", data.questions);

        // Store both the original form data and the survey JSON
        setOriginalFormData(data);
        setSurveyJson(data.questions); // SurveyJS JSON
        setTitle(data.title || "");
        setDescription(data.description || "");
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile caricare il questionario",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuestionnaire();
  }, [id, toast]);

  // Fetch guide content from backend
  const fetchGuide = async (questionName: string) => {
    setGuideModal({
      open: true,
      content: "",
      loading: true,
      error: "",
      questionName,
    });
    try {
      const url = `${API_BASE_URL}/forms/${id}/guide/${encodeURIComponent(
        questionName
      )}`;
      console.log("Fetching guide:", url); // <-- log the URL
      const res = await fetch(url);
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = null;
      }
      console.log("Guide response:", text); // <-- log the raw response
      if (!res.ok)
        throw new Error("La guida non è disponibile per questa domanda");
      if (!result || !result.success || !result.data)
        throw new Error("Risposta API non valida");
      setGuideModal({
        open: true,
        content: result.data.content,
        loading: false,
        error: "",
        questionName,
      });
    } catch (error: any) {
      setGuideModal({
        open: true,
        content: "",
        loading: false,
        error: error.message || "Errore",
        questionName,
      });
    }
  };
  const handleSaveDraft = () => {
    setShowSaveDraftModal(true);
  };
  const handleConfirmSaveDraft = async () => {
    if (!user || !id) {
      toast({
        title: "Errore",
        description: "Informazioni utente o questionario mancanti",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentResponses = survey.data;

      // Call the unified API with status='draft'
      const response = await fetch(
        `${API_BASE_URL}/save-questionnaire-completion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            questionnaire_id: id,
            questionnaire_title: title || "Questionario",
            responses: currentResponses,
            status: "draft", // This is the key difference
            created_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      const result = await response.json();

      setShowSaveDraftModal(false);
      toast({
        title: "Salvato in Bozza",
        description: "Il questionario è stato salvato in bozza con successo",
      });

      // Optional: Navigate to dashboard after saving draft
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error saving draft:", error);
      setShowSaveDraftModal(false);
      toast({
        title: "Errore",
        description: "Impossibile salvare il questionario in bozza",
        variant: "destructive",
      });
    }
  };
  const handleSubmitQuestionnaire = () => {
    setShowSubmitModal(true);
  };
  // Load existing draft if available
  useEffect(() => {
    const loadDraftIfExists = async () => {
      if (!user || !id || !survey) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/get-questionnaire-draft/${user.id}/${id}` // ✅ FIXED
        );

        if (!response.ok) return;

        const result = await response.json();

        if (result.success && result.draft && result.draft.answers) {
          // Load draft answers into survey
          survey.data = result.draft.answers;

          toast({
            title: "Bozza Caricata",
            description: `Hai una bozza salvata il ${new Date(
              result.draft.updated_at
            ).toLocaleDateString("it-IT")}`,
          });

          console.log("✅ Draft loaded successfully:", result.draft);
        }
      } catch (error) {
        console.error("Error loading draft:", error);
        // Fail silently - not critical
      }
    };

    // Only load draft after survey is created
    if (survey) {
      loadDraftIfExists();
    }
  }, [user, id, survey]);
  const handleConfirmSubmit = async () => {
    if (!user || !id) {
      toast({
        title: "Errore",
        description: "Informazioni utente o questionario mancanti",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentResponses = survey.data;

      // Call the unified API with status='completed' (default)
      const response = await fetch(
        `${API_BASE_URL}/save-questionnaire-completion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            questionnaire_id: id,
            questionnaire_title: title || "Questionario",
            responses: currentResponses,
            status: "completed", // Or omit this since it's the default
            created_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit questionnaire");
      }

      const result = await response.json();

      setShowSubmitModal(false);

      // Now trigger the report generation using your existing handleSurveyComplete
      await handleSurveyComplete(survey);
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      setShowSubmitModal(false);
      toast({
        title: "Errore",
        description:
          "Si è verificato un errore durante l'invio del questionario",
        variant: "destructive",
      });
    }
  };
  // SurveyJS onComplete handler
  const handleSurveyComplete = async (sender: Model) => {
    if (!user || !id) {
      toast({
        title: "Errore",
        description: "Informazioni utente o questionario mancanti",
        variant: "destructive",
      });
      return;
    }

    if (!planId) {
      toast({
        title: "Errore",
        description: "Piano utente non disponibile",
        variant: "destructive",
      });
      return;
    }

    console.log("Questionnaire ID from route:", id); // Debug log
    console.log("User planId:", planId);

    try {
      // First, check if a prompt template exists for this plan and questionnaire
      console.log("Checking for prompt template...");
      const templateCheckResponse = await fetch(
        `${API_BASE_URL}/prompt-templates/plan/${planId}/questionnaire/${id}`
      );
      const templateCheckResult = await templateCheckResponse.json();

      console.log("Template check result:", templateCheckResult);

      if (
        !templateCheckResult.success ||
        !templateCheckResult.data ||
        templateCheckResult.data.length === 0
      ) {
        // No prompt template found - save completion but don't generate report
        console.log(
          "No prompt template found, saving completion and redirecting to homepage"
        );

        const success = await saveQuestionnaireCompletion({
          user_id: user.id,
          questionnaire_id: id,
          questionnaire_title: title || "Questionario",
          responses: sender.data,
          completed_at: new Date().toISOString(),
        });

        if (success) {
          toast({
            title: "Questionario completato",
            description:
              "Il questionario è stato completato con successo. Il template per la generazione del report non è ancora configurato.",
          });
        }

        // Redirect to homepage after a short delay
        setTimeout(() => {
          navigate("/");
        }, 2000);
        return;
      }

      console.log("Prompt template found, proceeding with report generation");

      // Save questionnaire completion to MySQL database
      const success = await saveQuestionnaireCompletion({
        user_id: user.id,
        questionnaire_id: id,
        questionnaire_title: title || "Questionario",
        responses: sender.data,
        completed_at: new Date().toISOString(),
      });

      if (success) {
        toast({
          title: "Questionario inviato",
          description:
            "Il questionario è stato inviato con successo! Generazione del report in corso...",
        });

        // Call the AI generation endpoint (using ai-integration.js)
        const aiResponse = await fetch(`${API_BASE_URL}/ai/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionnaireId: id,
            responses: sender.data,
            userId: user.id,
            title: title || "Generated Report",
            planId: planId, // Use the fetched planId from state
          }),
        });

        if (!aiResponse.ok) throw new Error("Failed to generate AI response");
        const aiResult = await aiResponse.json();

        console.log("AI Response:", aiResult);

        navigate("/dashboard");
      } else {
        throw new Error("Failed to save questionnaire completion");
      }
    } catch (error) {
      console.error("Error in questionnaire completion process:", error);

      // Check if this is a template check error (early in the process)
      if (error.message && error.message.includes("template")) {
        toast({
          title: "Template non configurato",
          description:
            "Il template per la generazione del report non è configurato. Verrai reindirizzato alla homepage.",
          variant: "destructive",
        });

        // Try to save the completion anyway, but don't generate report
        try {
          await saveQuestionnaireCompletion({
            user_id: user.id,
            questionnaire_id: id,
            questionnaire_title: title || "Questionario",
            responses: sender.data,
            completed_at: new Date().toISOString(),
          });
        } catch (saveError) {
          console.error("Failed to save questionnaire completion:", saveError);
        }

        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        // General error handling
        toast({
          title: "Errore",
          description:
            "Si è verificato un errore durante l'invio del questionario",
          variant: "destructive",
        });
      }
    }
  };

  // Inject custom styles for Next and Previous buttons
  useEffect(() => {
    const styleId = "surveyjs-nav-btn-custom";
    let styleTag = document.getElementById(styleId);
    if (styleTag) styleTag.remove();
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    styleTag.innerHTML = `
      /* Next/Submit button: solid purple */
      .sv-footer input[type="button"][value="Next"],
      .sv-footer input[type="button"][value="Submit"],
      .sv-footer .sv-btn:not(.sv-btn--secondary):not([value="Previous"]) {
        background: #9333ea !important;
        color: #fff !important;
        border: 1px solid #9333ea !important;
        border-radius: 6px !important;
        font-weight: 600 !important;
        box-shadow: 0 1px 3px rgba(147,51,234,0.12);
        transition: all 0.2s ease-in-out !important;
      }
      .sv-footer input[type="button"][value="Next"]:hover,
      .sv-footer input[type="button"][value="Submit"]:hover {
        background: #7c3aed !important;
        border-color: #7c3aed !important;
        box-shadow: 0 2px 6px rgba(124,58,237,0.2);
      }
      /* Previous button: outlined purple */
      .sv-footer input[type="button"][value="Previous"],
      .sv-footer .sv-btn.sv-btn--secondary {
        background: #fff !important;
        color: #9333ea !important;
        border: 2px solid #9333ea !important;
        border-radius: 6px !important;
        font-weight: 600 !important;
        transition: all 0.2s ease-in-out !important;
      }
      .sv-footer input[type="button"][value="Previous"]:hover {
        background: #faf5ff !important;
        color: #7c3aed !important;
        border-color: #7c3aed !important;
        box-shadow: 0 1px 3px rgba(124,58,237,0.1);
      }
    `;
    document.head.appendChild(styleTag);
    return () => {
      styleTag.remove();
    };
  }, []);

  // Add observer to re-apply button styles when survey DOM changes
  useEffect(() => {
    if (!surveyJson) return;

    const observer = new MutationObserver(() => {
      // Re-apply button styles when DOM changes
      setTimeout(() => {
        const styleTag = document.getElementById("surveyjs-nav-btn-custom");
        if (styleTag) {
          console.log("🔄 Re-applying button styles after DOM change");
          // Force re-application by removing and re-adding
          styleTag.remove();
          const newStyleTag = document.createElement("style");
          newStyleTag.id = "surveyjs-nav-btn-custom";
          newStyleTag.innerHTML = styleTag.innerHTML;
          document.head.appendChild(newStyleTag);
        }
      }, 100);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [surveyJson]);

  // Create and configure survey when surveyJson is available
  useEffect(() => {
    if (!surveyJson) {
      setSurvey(null);
      return;
    }

    console.log("=== Survey Creation Debug ===");
    console.log("Survey JSON passed to model:", surveyJson);
    console.log("Original form data:", originalFormData);

    // Create SurveyJS model
    const newSurvey = new Model(surveyJson);

    // Verify survey was created properly
    if (!newSurvey) {
      console.error("Failed to create survey model");
      return;
    }

    console.log("Survey model created successfully:", newSurvey);
    console.log(
      "Available events on survey:",
      Object.keys(newSurvey).filter((key) => key.startsWith("on"))
    );

    // Debug: Check if the survey model preserves the custom properties
    if (
      newSurvey.pages &&
      newSurvey.pages.length > 0 &&
      newSurvey.pages[0].elements
    ) {
      console.log("Survey model elements:", newSurvey.pages[0].elements);
      newSurvey.pages[0].elements.forEach((element: any, index: number) => {
        console.log(`Survey Element ${index}:`, {
          name: element.name,
          type: element.getType(),
          questionImage: element.questionImage,
          rawElement: element,
        });
      });
    }

    // Update progress based on page progression only
    const updateProgress = () => {
      const currentPageNo = newSurvey.currentPageNo;
      const visiblePages =
        newSurvey.pages?.filter((page) => page.isVisible) || [];
      const totalPagesCount = visiblePages.length;

      setCurrentPage(currentPageNo);
      setTotalPages(totalPagesCount);

      // Calculate progress based purely on page progression
      let progressPercentage = 0;

      if (totalPagesCount > 0) {
        if (totalPagesCount === 1) {
          // Single page survey - always 100% when on the page
          progressPercentage = 100;
        } else {
          // Multi-page survey - calculate based on current page position
          progressPercentage = (currentPageNo / (totalPagesCount - 1)) * 100;
        }
      }

      setProgress(Math.min(100, Math.max(0, progressPercentage)));

      console.log("Progress updated (page-based):", {
        currentPage: currentPageNo,
        totalPages: totalPagesCount,
        progress: progressPercentage,
      });
    };

    // Set up event listeners for progress tracking (page-based only)
    const handleCurrentPageChanged = () => {
      updateProgress();
    };

    const handleVisibilityChanged = () => {
      console.log("Page visibility changed due to conditional logic");
      updateProgress();
    };

    // Add event listeners with safety checks
    try {
      if (
        newSurvey.onCurrentPageChanged &&
        typeof newSurvey.onCurrentPageChanged.add === "function"
      ) {
        newSurvey.onCurrentPageChanged.add(handleCurrentPageChanged);
        console.log("✅ onCurrentPageChanged listener added");
      } else {
        console.warn("⚠️ onCurrentPageChanged not available");
      }

      // We don't need onValueChanged for page-based progress
      // Keeping visibility change listeners for conditional logic that might show/hide pages

      // Check if onElementVisibilityChanged exists before adding listener
      if (
        newSurvey.onElementVisibilityChanged &&
        typeof newSurvey.onElementVisibilityChanged.add === "function"
      ) {
        newSurvey.onElementVisibilityChanged.add(handleVisibilityChanged);
        console.log("✅ onElementVisibilityChanged listener added");
      } else {
        console.warn("⚠️ onElementVisibilityChanged not available");
      }

      // Alternative event for visibility changes - onQuestionVisibilityChanged
      if (
        newSurvey.onQuestionVisibilityChanged &&
        typeof newSurvey.onQuestionVisibilityChanged.add === "function"
      ) {
        newSurvey.onQuestionVisibilityChanged.add(handleVisibilityChanged);
        console.log("✅ onQuestionVisibilityChanged listener added");
      } else {
        console.warn("⚠️ onQuestionVisibilityChanged not available");
      }

      // Also listen for page changes which can affect visibility
      if (
        newSurvey.onAfterPageDisplayed &&
        typeof newSurvey.onAfterPageDisplayed.add === "function"
      ) {
        newSurvey.onAfterPageDisplayed.add(handleVisibilityChanged);
        console.log("✅ onAfterPageDisplayed listener added");
      } else {
        console.warn("⚠️ onAfterPageDisplayed not available");
      }
    } catch (error) {
      console.error("Error setting up event listeners:", error);
    }

    // Create a map of question names to their original data for accessing custom properties
    const questionMap = new Map();
    if (originalFormData?.questions?.pages) {
      originalFormData.questions.pages.forEach((page: any) => {
        if (page.elements) {
          page.elements.forEach((element: any) => {
            questionMap.set(element.name, element);
            console.log(`Mapped question ${element.name}:`, {
              questionImage: element.questionImage,
              lesson: element.lesson,
              guide: element.guide,
            });
          });
        }
      });
    }

    // Set up question rendering event handlers
    newSurvey.onAfterRenderQuestion.add((survey, options) => {
      const titleEl = options.htmlElement.querySelector(
        ".sv-string-viewer, .sv-question__title"
      );
      const originalQuestionData = questionMap.get(options.question.name);

      // ===== ADD QUESTION IMAGE DISPLAY LOGIC =====
      // Add question image display if available
      setTimeout(() => {
        if (originalQuestionData && originalQuestionData.questionImage) {
          const questionImageUrl = originalQuestionData.questionImage;
          console.log(
            "📸 Adding question image for:",
            options.question.name,
            questionImageUrl
          );

          // Remove existing image container for this question
          const existingImage = options.htmlElement.querySelector(
            ".questionnaire-question-image"
          );
          if (existingImage) {
            existingImage.remove();
          }

          // Create image container
          const imageContainer = document.createElement("div");
          imageContainer.className = "questionnaire-question-image";
          imageContainer.style.cssText = `
            margin: 0 0 1rem 0;
            padding: 0;
            text-align: center;
            background: #f8f9fa;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
          `;

          imageContainer.innerHTML = `
            <img 
              src="${questionImageUrl}" 
              alt="Question Image" 
              style="
                max-width: 100%;
                height: auto;
                max-height: 300px;
                object-fit: contain;
                display: block;
                margin: 0 auto;
                border-radius: 8px;
              "
              onload="console.log('✅ Question image loaded successfully')"
              onerror="console.error('❌ Failed to load question image:', this.src)"
            />
          `;

          // Insert after the question title but before the content
          const questionContent = options.htmlElement.querySelector(
            ".sv-question__content"
          );
          if (questionContent) {
            questionContent.insertBefore(
              imageContainer,
              questionContent.firstChild
            );
          } else {
            // Fallback: insert at the beginning of the question element
            options.htmlElement.insertBefore(
              imageContainer,
              options.htmlElement.firstChild
            );
          }

          console.log(
            "✅ Question image added successfully for:",
            options.question.name
          );
        }
      }, 50);

      // Handle lesson display in sidebar without triggering React re-renders
      const handleMouseEnter = (e) => {
        e.stopPropagation();
        console.log("🐭 Mouse entered question:", options.question.name);
        // Target the guide content in the new UI structure
        const guideContent = document.querySelector(
          ".questionnaire-sidebar .guide-content p"
        );
        console.log("📍 Guide content element found:", guideContent);
        if (guideContent) {
          const lessonText =
            originalQuestionData?.lesson ||
            options.question.lesson ||
            "No lesson for this question.";
          console.log("📝 Setting lesson text:", lessonText);
          guideContent.textContent = lessonText;
        }
      };
      const handleMouseLeave = (e) => {
        e.stopPropagation();
        console.log("🐭 Mouse left question:", options.question.name);
        setTimeout(() => {
          // Target the guide content in the new UI structure
          const guideContent = document.querySelector(
            ".questionnaire-sidebar .guide-content p"
          );
          if (guideContent) {
            console.log("📝 Resetting to default text");
            guideContent.textContent =
              "Hover over questions to see lesson content.";
          }
        }, 50);
      };
      options.htmlElement.addEventListener("mouseenter", handleMouseEnter, {
        passive: true,
      });
      options.htmlElement.addEventListener("mouseleave", handleMouseLeave, {
        passive: true,
      });

      // Only add help icon
      if (titleEl && !titleEl.querySelector(".sv-question-help-icon")) {
        const span = document.createElement("span");
        span.className = "sv-question-help-icon";
        span.style.display = "inline-block";
        span.style.verticalAlign = "middle";
        span.style.cursor = "pointer";
        span.title = "Lesson";
        span.innerHTML = `
          <svg width="18" height="18" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="margin-left:4px;vertical-align:middle;">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
        `;
        span.onclick = (e) => {
          e.stopPropagation();
          fetchGuide(options.question.name);
        };
        titleEl.appendChild(span);
      }
    });

    newSurvey.onComplete.add(handleSurveyComplete);

    // Initial progress update
    updateProgress();

    setSurvey(newSurvey);
  }, [surveyJson, originalFormData]);

  // Force purple button styles with highest priority
  useEffect(() => {
    const forceButtonStyles = () => {
      const styleId = "force-purple-buttons";
      let styleTag = document.getElementById(styleId);
      if (styleTag) styleTag.remove();

      styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.innerHTML = `
        /* Force Previous button to purple outline style */
        button[title*="Previous"],
        input[value*="Previous"],
        .sv_nav input[value*="Previous"],
        .sv-action-bar input[value*="Previous"],
        .sv-footer input[value*="Previous"] {
          background: #ffffff !important;
          color: #9333ea !important;
          border: 2px solid #9333ea !important;
          font-weight: 600 !important;
          border-radius: 6px !important;
          transition: all 0.2s ease-in-out !important;
        }
        
        button[title*="Previous"]:hover,
        input[value*="Previous"]:hover,
        .sv_nav input[value*="Previous"]:hover,
        .sv-action-bar input[value*="Previous"]:hover,
        .sv-footer input[value*="Previous"]:hover {
          background: #faf5ff !important;
          color: #7c3aed !important;
          border-color: #7c3aed !important;
        }
        
        /* Force Next/Submit buttons to solid purple style */
        button[title*="Next"],
        input[value*="Next"],
        input[value*="Submit"],
        .sv_nav input[value*="Next"],
        .sv_nav input[value*="Submit"],
        .sv-action-bar input[value*="Next"],
        .sv-action-bar input[value*="Submit"],
        .sv-footer input[value*="Next"],
        .sv-footer input[value*="Submit"] {
          background: #9333ea !important;
          color: #ffffff !important;
          border: 1px solid #9333ea !important;
          font-weight: 600 !important;
          border-radius: 6px !important;
          transition: all 0.2s ease-in-out !important;
        }
        
        button[title*="Next"]:hover,
        input[value*="Next"]:hover,
        input[value*="Submit"]:hover,
        .sv_nav input[value*="Next"]:hover,
        .sv_nav input[value*="Submit"]:hover,
        .sv-action-bar input[value*="Next"]:hover,
        .sv-action-bar input[value*="Submit"]:hover,
        .sv-footer input[value*="Next"]:hover,
        .sv-footer input[value*="Submit"]:hover {
          background: #7c3aed !important;
          border-color: #7c3aed !important;
        }
      `;
      document.head.appendChild(styleTag);
    };

    // Apply styles immediately and on DOM changes
    forceButtonStyles();

    const observer = new MutationObserver(() => {
      setTimeout(forceButtonStyles, 100);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const styleTag = document.getElementById("force-purple-buttons");
      if (styleTag) styleTag.remove();
    };
  }, [survey]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <MainNavigation variant="questionnaire" title="Caricamento..." />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!surveyJson) {
    return (
      <div className="container mx-auto p-6">
        <MainNavigation variant="questionnaire" title="Errore" />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Questionario non trovato</h2>
          <button className="btn" onClick={() => navigate("/dashboard")}>
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Survey is created in useEffect above
  if (!survey) {
    return (
      <div className="container mx-auto p-6">
        <MainNavigation variant="questionnaire" title="Loading..." />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <MainNavigation variant="questionnaire" title={title} />

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}

          {/* Survey Logo Display */}
          {originalFormData?.logo && (
            <div className="mt-4 mb-6 text-center">
              <img
                src={originalFormData.logo}
                alt="Survey Logo"
                className="mx-auto max-w-xs max-h-32 object-contain border border-gray-200 rounded-lg p-2 bg-white shadow-sm"
                onLoad={() => console.log("✅ Survey logo loaded successfully")}
                onError={() => console.error("❌ Failed to load survey logo")}
              />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Progress Bar */}
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progress
                </span>
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1} of {totalPages}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Progress Steps */}
              {totalPages > 1 && (
                <div className="progress-steps flex justify-between mt-3">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <div
                      key={index}
                      className={`progress-step flex items-center ${
                        index <= currentPage
                          ? "text-purple-600"
                          : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                          index < currentPage
                            ? "bg-purple-600 border-purple-600 text-white"
                            : index === currentPage
                            ? "border-purple-600 bg-white text-purple-600"
                            : "border-gray-300 bg-white text-gray-400"
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < totalPages - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 ${
                            index < currentPage
                              ? "bg-purple-600"
                              : "bg-gray-300"
                          }`}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {progress >= 100 && (
                <div className="mt-3 text-center">
                  <span className="text-sm font-medium text-green-600">
                    ✓ Survey Complete!
                  </span>
                </div>
              )}
            </div>

            <Survey model={survey} />
          </div>

          <div className="md:col-span-1">
            <div className="questionnaire-sidebar">
              <h3>Informazioni Domanda</h3>
              <div className="guide-content">
                <h4>Lessons</h4>
                <p>{sidebarText}</p>
              </div>

              <div className="space-y-3 mt-6">
                <h3 className="font-medium">Questionari Futuri</h3>
                <div className="p-3 border rounded-md">
                  <p className="font-medium">Valutazione Bisogni Formativi</p>
                  <p className="text-xs text-gray-500">
                    Disponibile dal: 15/06/2025
                  </p>
                </div>
                <div className="p-3 border rounded-md">
                  <p className="font-medium">Indagine Soddisfazione Cliente</p>
                  <p className="text-xs text-gray-500">
                    Disponibile dal: 30/09/2025
                  </p>
                </div>
              </div>

              {/* Show buttons only on final page */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Azioni</h3>

                <div className="flex items-center gap-3">
                  {/* Salva in Bozza Button */}
                  <button
                    onClick={handleSaveDraft}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Salva in Bozza
                  </button>

                  {/* Invia Button */}
                  <button
                    onClick={handleSubmitQuestionnaire}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-colors font-medium shadow-md"
                  >
                    Invia
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReactModal
        isOpen={guideModal.open}
        onRequestClose={() => setGuideModal({ ...guideModal, open: false })}
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      >
        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            onClick={() => setGuideModal({ ...guideModal, open: false })}
            aria-label="Chiudi"
          >
            &times;
          </button>
          {guideModal.loading ? (
            <div className="text-center py-8">Caricamento...</div>
          ) : guideModal.error ? (
            <div className="text-center text-red-500 py-8">
              {guideModal.error}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-4">Lesson</h2>
              <div className="text-gray-700 whitespace-pre-line">
                {guideModal.content}
              </div>
            </div>
          )}
        </div>
      </ReactModal>

      {/* Salva in Bozza Modal */}
      <ReactModal
        isOpen={showSaveDraftModal}
        onRequestClose={() => setShowSaveDraftModal(false)}
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            onClick={() => setShowSaveDraftModal(false)}
            aria-label="Chiudi"
          >
            &times;
          </button>

          <h2 className="text-xl font-bold mb-4">Salvataggio in Bozza</h2>
          <p className="text-gray-600 mb-6">
            Salvando in Draft non perdite le domande già risposte, puoi
            sospendere il questionario, riprenderlo e cambiare alcune risposte.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSaveDraftModal(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmSaveDraft}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-colors"
            >
              Conferma salvataggio in draft
            </button>
          </div>
        </div>
      </ReactModal>

      {/* Invia Questionario Modal */}
      <ReactModal
        isOpen={showSubmitModal}
        onRequestClose={() => setShowSubmitModal(false)}
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            onClick={() => setShowSubmitModal(false)}
            aria-label="Chiudi"
          >
            &times;
          </button>

          <h2 className="text-xl font-bold mb-4">Invio Questionario</h2>
          <p className="text-gray-600 mb-6">
            ATTENZIONE: Il pulsante Invia salva definitivamente il questionario
            e attiva l'elaborazione del report definitivo. Quindi Conferma solo
            se le tue risposte sono corrette perché non potrai rifarlo.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Conferma definitivamente l'invio definitivo del questionario e
              ricevi il report
            </button>
          </div>
        </div>
      </ReactModal>
    </div>
  );
};

export default Questionnaire;
