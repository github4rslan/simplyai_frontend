
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import ShortcodeProcessor from '@/components/report-components/ShortcodeProcessor';
import { ShortcodeMap } from '@/components/report-components/ShortcodeProcessor';
import { saveReportTemplate, fetchReportTemplate } from '@/services/prompt-templates';

const ReportTemplateEditor = () => {
  const { planId, templateId } = useParams<{ planId: string; templateId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [template, setTemplate] = useState({
    id: '',
    plan_id: planId || '',
    title: 'New Report Template',
    content: '[section_intro]\n\n## General Information\n\nThis data has been processed based on the provided answers.\n\n[chart_overview]\n\n## Detailed Analysis\n\n[section_details]\n\n[table_summary]',
    description: 'Template for displaying reports',
    is_default: true
  });
  
  const [isEditing, setIsEditing] = useState(true);
  
  useEffect(() => {
    const loadTemplate = async () => {
      if (templateId && templateId !== 'new') {
        setLoading(true);
        const data = await fetchReportTemplate(templateId);
        if (data) {
          setTemplate(data);
        }
        setLoading(false);
      }
    };
    
    loadTemplate();
  }, [templateId]);
  
  // Preview shortcode examples
  const previewShortcodes: ShortcodeMap = {
    text: {
      'section_intro': 'Welcome to your personalised report. This analysis is based on the answers provided in the questionnaire.',
      'section_details': 'Based on the answers provided, here are some important aspects to consider:\n\n- The overall score is above average\n- There are areas that could be improved\n- The strategies implemented are producing positive results'
    },
    charts: {
      'chart_overview': {
        type: 'bar',
        title: 'Results Overview',
        data: {
          labels: ['Category A', 'Category B', 'Category C', 'Category D'],
          datasets: [
            {
              label: 'Score',
              data: [75, 60, 85, 40],
              backgroundColor: '#4f46e5'
            },
            {
              label: 'Average',
              data: [50, 50, 50, 50],
              backgroundColor: '#94a3b8'
            }
          ]
        }
      }
    },
    tables: {
      'table_summary': {
        title: 'Data Summary',
        headers: ['Area', 'Score', 'Average', 'Difference'],
        rows: [
          ['Communication', '85/100', '70/100', '+15%'],
          ['Organisation', '62/100', '65/100', '-3%'],
          ['Innovation', '78/100', '60/100', '+18%'],
          ['Leadership', '80/100', '75/100', '+5%']
        ]
      }
    }
  };

  const handleSave = async () => {
    if (!template.plan_id || !template.title || !template.content) {
      toast({
        title: 'Missing data',
        description: 'Fill in all required fields to save the template',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setSaving(true);
      const success = await saveReportTemplate(template);
      
      if (success) {
        toast({
          title: 'Template saved',
          description: 'The report template has been saved successfully'
        });

        // Return to template list
        navigate(`/admin/plans/${planId}/reports`);
      } else {
        toast({
          title: 'Error',
          description: 'An error occurred while saving the template',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving the template',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/admin/plans/${planId}/prompts`)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to report templates
        </Button>
        <h1 className="text-2xl font-bold ml-4">
          {templateId && templateId !== 'new' ? 'Edit Report Template' : 'New Report Template'}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Editor</CardTitle>
            <CardDescription>
              Create the template that will define the structure of generated reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-title">Template Title</Label>
                <Input
                  id="template-title"
                  value={template.title}
                  onChange={(e) => setTemplate({...template, title: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  value={template.description}
                  onChange={(e) => setTemplate({...template, description: e.target.value})}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="template-content">Template Content</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Default</span>
                    <Switch
                      checked={template.is_default}
                      onCheckedChange={(checked) => setTemplate({...template, is_default: checked})}
                    />
                  </div>
                </div>
                <Textarea
                  id="template-content"
                  rows={20}
                  value={template.content}
                  onChange={(e) => setTemplate({...template, content: e.target.value})}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Use shortcodes in square brackets [shortcode] to insert AI-generated sections
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSave} disabled={saving || !template.title || !template.content}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              Preview of how the generated report will appear
            </CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                checked={!isEditing}
                onCheckedChange={(checked) => setIsEditing(!checked)}
              />
              <span>Show preview</span>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="border rounded-md p-4 min-h-[500px] bg-muted">
                <p className="text-center text-muted-foreground">
                  Enable the toggle above to view the report preview
                </p>
              </div>
            ) : (
              <div className="border rounded-md p-6 min-h-[500px] bg-white">
                <div className="prose max-w-none">
                  <h1 className="text-center text-2xl mb-6">{template.title}</h1>
                  <ShortcodeProcessor
                    content={template.content}
                    shortcodeMap={previewShortcodes}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Available Shortcodes</CardTitle>
          <CardDescription>
            Shortcodes you can use in the template to insert AI-generated sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-2">Text Sections</h3>
              <div className="space-y-2">
                {Object.keys(previewShortcodes.text).map(code => (
                  <div key={code} className="p-2 bg-muted rounded flex justify-between items-center">
                    <code className="text-sm">[{code}]</code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`[${code}]`);
                        toast({
                          title: 'Shortcode copied',
                          description: `The shortcode [${code}] has been copied to the clipboard`
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Charts</h3>
              <div className="space-y-2">
                {Object.keys(previewShortcodes.charts).map(code => (
                  <div key={code} className="p-2 bg-muted rounded flex justify-between items-center">
                    <code className="text-sm">[{code}]</code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`[${code}]`);
                        toast({
                          title: 'Shortcode copied',
                          description: `The shortcode [${code}] has been copied to the clipboard`
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Tables</h3>
              <div className="space-y-2">
                {Object.keys(previewShortcodes.tables).map(code => (
                  <div key={code} className="p-2 bg-muted rounded flex justify-between items-center">
                    <code className="text-sm">[{code}]</code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`[${code}]`);
                        toast({
                          title: 'Shortcode copied',
                          description: `The shortcode [${code}] has been copied to the clipboard`
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportTemplateEditor;
