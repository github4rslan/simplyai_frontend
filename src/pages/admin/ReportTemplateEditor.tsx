
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
    title: 'Nuovo Template Report',
    content: '[section_intro]\n\n## Informazioni Generali\n\nQuesti dati sono stati elaborati in base alle risposte fornite.\n\n[chart_overview]\n\n## Analisi Dettagliata\n\n[section_details]\n\n[table_summary]',
    description: 'Template per la visualizzazione dei report',
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
  
  // Esempio di shortcode per l'anteprima
  const previewShortcodes: ShortcodeMap = {
    text: {
      'section_intro': 'Benvenuto al tuo report personalizzato. Questa analisi è basata sulle risposte fornite nel questionario.',
      'section_details': 'In base alle risposte fornite, ecco alcuni aspetti importanti da considerare:\n\n- Il punteggio complessivo è superiore alla media\n- Ci sono aree che potrebbero essere migliorate\n- Le strategie implementate stanno dando risultati positivi'
    },
    charts: {
      'chart_overview': {
        type: 'bar',
        title: 'Panoramica Risultati',
        data: {
          labels: ['Categoria A', 'Categoria B', 'Categoria C', 'Categoria D'],
          datasets: [
            {
              label: 'Punteggio',
              data: [75, 60, 85, 40],
              backgroundColor: '#4f46e5'
            },
            {
              label: 'Media',
              data: [50, 50, 50, 50],
              backgroundColor: '#94a3b8'
            }
          ]
        }
      }
    },
    tables: {
      'table_summary': {
        title: 'Riepilogo Dati',
        headers: ['Area', 'Punteggio', 'Media', 'Differenza'],
        rows: [
          ['Comunicazione', '85/100', '70/100', '+15%'],
          ['Organizzazione', '62/100', '65/100', '-3%'],
          ['Innovazione', '78/100', '60/100', '+18%'],
          ['Leadership', '80/100', '75/100', '+5%']
        ]
      }
    }
  };

  const handleSave = async () => {
    if (!template.plan_id || !template.title || !template.content) {
      toast({
        title: 'Dati mancanti',
        description: 'Compila tutti i campi obbligatori per salvare il template',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setSaving(true);
      const success = await saveReportTemplate(template);
      
      if (success) {
        toast({
          title: 'Template salvato',
          description: 'Il template del report è stato salvato con successo'
        });
        
        // Torna alla lista dei template
        navigate(`/admin/plans/${planId}/reports`);
      } else {
        toast({
          title: 'Errore',
          description: 'Si è verificato un errore nel salvataggio del template',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Errore nel salvataggio del template:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore nel salvataggio del template',
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
          Torna ai template report
        </Button>
        <h1 className="text-2xl font-bold ml-4">
          {templateId && templateId !== 'new' ? 'Modifica Template Report' : 'Nuovo Template Report'}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Editor Template</CardTitle>
            <CardDescription>
              Crea il template che definirà la struttura dei report generati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-title">Titolo Template</Label>
                <Input
                  id="template-title"
                  value={template.title}
                  onChange={(e) => setTemplate({...template, title: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Descrizione</Label>
                <Input
                  id="template-description"
                  value={template.description}
                  onChange={(e) => setTemplate({...template, description: e.target.value})}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="template-content">Contenuto Template</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Predefinito</span>
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
                  Usa gli shortcode tra parentesi quadre [shortcode] per inserire le sezioni generate dall'AI
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSave} disabled={saving || !template.title || !template.content}>
              <Save className="h-4 w-4 mr-2" />
              Salva Template
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Anteprima Report</CardTitle>
            <CardDescription>
              Anteprima di come apparirà il report generato
            </CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                checked={!isEditing}
                onCheckedChange={(checked) => setIsEditing(!checked)}
              />
              <span>Mostra anteprima</span>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="border rounded-md p-4 min-h-[500px] bg-muted">
                <p className="text-center text-muted-foreground">
                  Attiva l'interruttore sopra per visualizzare l'anteprima del report
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
          <CardTitle>Shortcode Disponibili</CardTitle>
          <CardDescription>
            Shortcode che puoi utilizzare nel template per inserire le sezioni generate dall'AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-2">Sezioni Testo</h3>
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
                          title: 'Shortcode copiato',
                          description: `Lo shortcode [${code}] è stato copiato negli appunti`
                        });
                      }}
                    >
                      Copia
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Grafici</h3>
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
                          title: 'Shortcode copiato',
                          description: `Lo shortcode [${code}] è stato copiato negli appunti`
                        });
                      }}
                    >
                      Copia
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Tabelle</h3>
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
                          title: 'Shortcode copiato',
                          description: `Lo shortcode [${code}] è stato copiato negli appunti`
                        });
                      }}
                    >
                      Copia
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
