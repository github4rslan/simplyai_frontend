
import { supabase } from "@/integrations/supabase/client";
import type { PromptTemplate, PromptVariable } from "@/types/supabase";

// Fetch all prompt templates for a specific plan
export const fetchPlanPromptTemplates = async (planId: string): Promise<PromptTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('plan_id', planId)
      .order('sequence_index', { ascending: true });
      
    if (error) throw error;
    
    return data as PromptTemplate[] || [];
  } catch (error) {
    console.error('Error fetching prompt templates:', error);
    return [];
  }
};

// Fetch specific prompt template
export const fetchPromptTemplate = async (promptId: string): Promise<PromptTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', promptId)
      .maybeSingle();
      
    if (error) throw error;
    return data as PromptTemplate;
  } catch (error) {
    console.error('Error fetching prompt template:', error);
    return null;
  }
};

// Fetch prompt template for a specific plan and questionnaire
export const fetchPromptForQuestionnaire = async (
  planId: string, 
  questionnaireId: string,
  sequenceIndex: number = 0
): Promise<PromptTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('plan_id', planId)
      .eq('questionnaire_id', questionnaireId)
      .eq('sequence_index', sequenceIndex)
      .maybeSingle();
      
    if (error) throw error;
    return data as PromptTemplate;
  } catch (error) {
    console.error('Error fetching prompt template:', error);
    return null;
  }
};

// Fetch all prompts for a specific questionnaire
export const fetchPromptsForQuestionnaire = async (
  questionnaireId: string
): Promise<PromptTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('sequence_index', { ascending: true });
      
    if (error) throw error;
    return data as PromptTemplate[] || [];
  } catch (error) {
    console.error('Error fetching questionnaire prompts:', error);
    return [];
  }
};

// Fetch prompts for all questionnaires in a plan
export const fetchPromptsForPlanQuestionnaires = async (
  planId: string,
  questionnaireIds: string[]
): Promise<Record<string, PromptTemplate[]>> => {
  try {
    if (!questionnaireIds.length) return {};
    
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('plan_id', planId)
      .in('questionnaire_id', questionnaireIds)
      .order('sequence_index', { ascending: true });
      
    if (error) throw error;
    
    // Group prompts by questionnaire_id
    const promptsByQuestionnaire: Record<string, PromptTemplate[]> = {};
    
    (data as PromptTemplate[]).forEach(prompt => {
      if (!promptsByQuestionnaire[prompt.questionnaire_id]) {
        promptsByQuestionnaire[prompt.questionnaire_id] = [];
      }
      promptsByQuestionnaire[prompt.questionnaire_id].push(prompt);
    });
    
    return promptsByQuestionnaire;
  } catch (error) {
    console.error('Error fetching plan questionnaire prompts:', error);
    return {};
  }
};

// ChartConfig type for chart settings
export interface ChartConfig {
  width?: string | number;
  height?: number;
  colors?: string[];
  title?: {
    text?: string;
    align?: 'left' | 'center' | 'right';
    style?: {
      fontSize?: string;
      fontWeight?: string | number;
      color?: string;
    };
  };
  subtitle?: {
    text?: string;
    align?: 'left' | 'center' | 'right';
    style?: {
      fontSize?: string;
      fontWeight?: string | number;
      color?: string;
    };
  };
  xaxis?: {
    title?: string;
    categories?: string[];
    labels?: {
      rotate?: number;
      style?: {
        fontSize?: string;
        colors?: string | string[];
      };
    };
  };
  yaxis?: {
    title?: string;
    labels?: {
      style?: {
        fontSize?: string;
        colors?: string | string[];
      };
    };
  };
  legend?: {
    show?: boolean;
    position?: 'top' | 'right' | 'bottom' | 'left';
    horizontalAlign?: 'left' | 'center' | 'right';
    floating?: boolean;
    fontSize?: string;
  };
  tooltip?: {
    enabled?: boolean;
    style?: {
      fontSize?: string;
    };
  };
  dataLabels?: {
    enabled?: boolean;
    style?: {
      fontSize?: string;
      colors?: string[];
    };
  };
  stroke?: {
    width?: number;
    curve?: 'smooth' | 'straight' | 'stepline';
  };
  grid?: {
    show?: boolean;
    borderColor?: string;
    row?: {
      colors?: string[];
    };
  };
  animations?: {
    enabled?: boolean;
    speed?: number;
  };
  theme?: {
    mode?: 'light' | 'dark';
    palette?: string;
  };
  series?: any[];
}

// Tipo per le sezioni dei report con prompt specifici
export interface ReportSectionWithPrompt {
  id: string;
  title: string;
  shortcode: string;
  prompt?: string;
  type?: string;
  chartType?: string;
  tableType?: string;
  config?: ChartConfig;
}

// Struttura per i dati delle sezioni
export interface SectionsData {
  text: ReportSectionWithPrompt[];
  charts: ReportSectionWithPrompt[];
  tables: ReportSectionWithPrompt[];
}

// Estendi il tipo PromptTemplate per includere le nuove proprietà
declare module "@/types/supabase" {
  interface PromptTemplate {
    sections_data?: SectionsData;
    report_template?: string;
  }
}

// Interface per i prompt template con sezioni
export interface PromptTemplateWithSections {
  id: string;
  plan_id: string;
  questionnaire_id: string;
  title: string;
  content: string;
  system_prompt: string;
  variables: PromptVariable[];
  sequence_index: number;
  created_at: string;
  updated_at: string;
  reportTemplate?: string;
  sections?: SectionsData;
}

export const savePromptTemplate = async (
  template: PromptTemplateWithSections
): Promise<PromptTemplate | null> => {
  try {
    // Ensure required fields
    if (!template.questionnaire_id) {
      throw new Error('Questionnaire ID is required');
    }

    // Estrai le sezioni dal template per salvarle separatamente
    const { sections, reportTemplate, ...baseTemplate } = template;
    
    // Converti le sezioni in formato JSON 
    const sectionsData = sections ? {
      text: sections.text || [],
      charts: sections.charts || [],
      tables: sections.tables || []
    } : undefined;
    
    // Aggiungi sectionsData e reportTemplate al template base
    const templateToSave = {
      ...baseTemplate,
      sections_data: sectionsData,
      report_template: reportTemplate
    };

    if (template.id) {
      const { data, error } = await supabase
        .from('prompt_templates')
        .update({
          title: templateToSave.title,
          content: templateToSave.content,
          system_prompt: templateToSave.system_prompt,
          variables: templateToSave.variables || [],
          sequence_index: templateToSave.sequence_index || 0,
          sections_data: templateToSave.sections_data,
          report_template: templateToSave.report_template,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id)
        .select()
        .maybeSingle();
        
      if (error) throw error;
      return data as PromptTemplate;
    } else {
      const { data, error } = await supabase
        .from('prompt_templates')
        .insert({
          plan_id: template.plan_id,
          questionnaire_id: template.questionnaire_id,
          sequence_index: template.sequence_index || 0,
          title: template.title || 'Nuovo Prompt',
          content: template.content || '',
          system_prompt: template.system_prompt || '',
          variables: template.variables || [],
          sections_data: templateToSave.sections_data,
          report_template: templateToSave.report_template,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();
        
      if (error) throw error;
      return data as PromptTemplate;
    }
  } catch (error) {
    console.error('Error saving prompt template:', error);
    return null;
  }
};

export const deletePromptTemplate = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting prompt template:', error);
    return false;
  }
};

// Report templates management
export const saveReportTemplate = async (
  template: {
    id?: string;
    plan_id: string;
    title: string;
    content: string;
    description?: string;
    is_default?: boolean;
  }
): Promise<boolean> => {
  try {
    if (template.id) {
      const { error } = await supabase
        .from('report_templates')
        .update({
          title: template.title,
          content: template.content,
          description: template.description,
          is_default: template.is_default || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);
        
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('report_templates')
        .insert({
          plan_id: template.plan_id,
          title: template.title,
          content: template.content,
          description: template.description || '',
          is_default: template.is_default || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
    }
    return true;
  } catch (error) {
    console.error('Error saving report template:', error);
    return false;
  }
};

export const fetchReportTemplate = async (templateId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching report template:', error);
    return null;
  }
};

export const fetchPlanReportTemplates = async (planId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('plan_id', planId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching report templates:', error);
    return [];
  }
};
