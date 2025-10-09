
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import PageEditorToolbar from '@/components/admin/PageEditorToolbar';

const FormPageEditor = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    pageContent: '<h1>Questionario</h1><p>Benvenuto al questionario. Di seguito troverai una serie di domande a cui rispondere.</p>',
    instructions: '',
    headerImageUrl: '',
    footerContent: '<p class="text-center text-sm text-gray-500 mt-8">Grazie per aver compilato il questionario. Le tue risposte sono importanti per noi.</p>'
  });

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // In produzione, qui dovresti fare una chiamata API per ottenere i dati del form
        if (formId) {
          // Simulazione caricamento dati
          setTimeout(() => {
            setFormData({
              id: formId,
              title: 'Questionario di Valutazione',
              description: 'Valutazione della maturità digitale',
              pageContent: '<h1>Questionario di Valutazione</h1><p>Benvenuto al questionario di valutazione della maturità digitale. Le tue risposte ci aiuteranno a valutare il livello di digitalizzazione della tua azienda.</p><p>Per ciascuna domanda seleziona la risposta più appropriata.</p>',
              instructions: 'Compila tutte le domande per ottenere una valutazione accurata',
              headerImageUrl: 'https://via.placeholder.com/800x200',
              footerContent: '<p class="text-center text-sm text-gray-500 mt-8">© SimplyAI - Tutti i diritti riservati</p>'
            });
            setLoading(false);
          }, 500);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast({
          title: 'Errore',
          description: 'Si è verificato un errore nel caricamento dei dati del form',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchFormData();
  }, [formId, toast]);

  const handleInsertImage = (imageUrl: string) => {
    const imgHtml = `<figure class="image-container">
      <img src="${imageUrl}" alt="Immagine caricata" class="max-w-full h-auto" />
    </figure>`;

    const editor = document.getElementById('page-content-editor');
    if (editor) {
      editor.innerHTML += imgHtml;
    }
  };

  const handleInsertHeading = (level: number) => {
    const editor = document.getElementById('page-content-editor');
    if (editor) {
      editor.innerHTML += `<h${level}>Nuovo titolo ${level}</h${level}>`;
    }
  };

  const handleInsertParagraph = () => {
    const editor = document.getElementById('page-content-editor');
    if (editor) {
      editor.innerHTML += '<p>Nuovo paragrafo di testo. Fare clic per modificare.</p>';
    }
  };

  const handleInsertLayout = (columns: number) => {
    const editor = document.getElementById('page-content-editor');
    if (editor) {
      let layout = '<div class="grid grid-cols-' + columns + ' gap-4">';
      for (let i = 0; i < columns; i++) {
        layout += '<div class="col"><p>Colonna ' + (i+1) + '</p></div>';
      }
      layout += '</div>';
      editor.innerHTML += layout;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Aggiorna il contenuto della pagina dall'editor
      const pageContent = document.getElementById('page-content-editor')?.innerHTML || '';
      const footerContent = document.getElementById('footer-content-editor')?.innerHTML || '';
      
      const updatedFormData = {
        ...formData,
        pageContent,
        footerContent
      };
      
      // In produzione, qui dovresti fare una chiamata API per salvare i dati
      // Simulazione salvataggio dati
      setTimeout(() => {
        setFormData(updatedFormData);
        toast({
          title: 'Pagina salvata',
          description: 'Le modifiche alla pagina del form sono state salvate con successo'
        });
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving form page:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore nel salvataggio della pagina',
        variant: 'destructive'
      });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/admin/form-builder')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ai form
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editor Pagina Form</h1>
            <p className="text-muted-foreground mt-1">
              Modifica il layout e la descrizione della pagina che visualizza il form
            </p>
          </div>
        </div>
        
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Modifica' : 'Anteprima'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>
      
      {previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Anteprima Pagina Form</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-6 bg-white">
              <div 
                className="prose max-w-none mb-8" 
                dangerouslySetInnerHTML={{ __html: formData.pageContent }} 
              />
              
              <div className="border-t border-b py-8 my-8">
                <div className="text-center text-lg font-medium mb-4">
                  [Contenuto del form verrà visualizzato qui]
                </div>
              </div>
              
              <div 
                className="mt-8" 
                dangerouslySetInnerHTML={{ __html: formData.footerContent }} 
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Base</CardTitle>
              <CardDescription>
                Modifica le informazioni di base del form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="form-title">Titolo Form</Label>
                <Input
                  id="form-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Titolo del form"
                />
              </div>
              
              <div>
                <Label htmlFor="form-description">Descrizione breve</Label>
                <Input
                  id="form-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Breve descrizione del form"
                />
              </div>
              
              <div>
                <Label htmlFor="form-instructions">Istruzioni di compilazione</Label>
                <Input
                  id="form-instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  placeholder="Istruzioni per la compilazione del form"
                />
              </div>
              
              <div>
                <Label htmlFor="header-image">URL Immagine Intestazione</Label>
                <Input
                  id="header-image"
                  value={formData.headerImageUrl}
                  onChange={(e) => setFormData({...formData, headerImageUrl: e.target.value})}
                  placeholder="URL dell'immagine di intestazione"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contenuto Pagina (Prima del Form)</CardTitle>
              <CardDescription>
                Modifica il contenuto che verrà mostrato prima del form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <PageEditorToolbar 
                  onInsertHeading={handleInsertHeading}
                  onInsertParagraph={handleInsertParagraph}
                  onInsertLayout={handleInsertLayout}
                  onInsertImage={handleInsertImage}
                  onSave={() => {
                    const pageContent = document.getElementById('page-content-editor')?.innerHTML || '';
                    setFormData({...formData, pageContent});
                  }}
                />
                
                <div 
                  id="page-content-editor" 
                  className="min-h-[300px] p-4 border rounded-md bg-white overflow-auto" 
                  contentEditable={true}
                  dangerouslySetInnerHTML={{ __html: formData.pageContent }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contenuto Footer (Dopo il Form)</CardTitle>
              <CardDescription>
                Modifica il contenuto che verrà mostrato dopo il form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                id="footer-content-editor" 
                className="min-h-[150px] p-4 border rounded-md bg-white overflow-auto" 
                contentEditable={true}
                dangerouslySetInnerHTML={{ __html: formData.footerContent }}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default FormPageEditor;
