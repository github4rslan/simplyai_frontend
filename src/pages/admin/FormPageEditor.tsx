
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
    pageContent: '<h1>Questionnaire</h1><p>Welcome to the questionnaire. Below you will find a series of questions to answer.</p>',
    instructions: '',
    headerImageUrl: '',
    footerContent: '<p class="text-center text-sm text-gray-500 mt-8">Thank you for completing the questionnaire. Your answers are important to us.</p>'
  });

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // In production, you should make an API call here to retrieve the form data
        if (formId) {
          // Simulate data loading
          setTimeout(() => {
            setFormData({
              id: formId,
              title: 'Assessment Questionnaire',
              description: 'Digital maturity assessment',
              pageContent: '<h1>Assessment Questionnaire</h1><p>Welcome to the digital maturity assessment questionnaire. Your answers will help us evaluate the level of digitalisation of your company.</p><p>For each question, select the most appropriate answer.</p>',
              instructions: 'Complete all questions to obtain an accurate assessment',
              headerImageUrl: 'https://via.placeholder.com/800x200',
              footerContent: '<p class="text-center text-sm text-gray-500 mt-8">© SimplyAI - All rights reserved</p>'
            });
            setLoading(false);
          }, 500);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast({
          title: 'Error',
          description: 'An error occurred while loading the form data',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchFormData();
  }, [formId, toast]);

  const handleInsertImage = (imageUrl: string) => {
    const imgHtml = `<figure class="image-container">
      <img src="${imageUrl}" alt="Uploaded image" class="max-w-full h-auto" />
    </figure>`;

    const editor = document.getElementById('page-content-editor');
    if (editor) {
      editor.innerHTML += imgHtml;
    }
  };

  const handleInsertHeading = (level: number) => {
    const editor = document.getElementById('page-content-editor');
    if (editor) {
      editor.innerHTML += `<h${level}>New heading ${level}</h${level}>`;
    }
  };

  const handleInsertParagraph = () => {
    const editor = document.getElementById('page-content-editor');
    if (editor) {
      editor.innerHTML += '<p>New paragraph of text. Click to edit.</p>';
    }
  };

  const handleInsertLayout = (columns: number) => {
    const editor = document.getElementById('page-content-editor');
    if (editor) {
      let layout = '<div class="grid grid-cols-' + columns + ' gap-4">';
      for (let i = 0; i < columns; i++) {
        layout += '<div class="col"><p>Column ' + (i+1) + '</p></div>';
      }
      layout += '</div>';
      editor.innerHTML += layout;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update page content from the editor
      const pageContent = document.getElementById('page-content-editor')?.innerHTML || '';
      const footerContent = document.getElementById('footer-content-editor')?.innerHTML || '';
      
      const updatedFormData = {
        ...formData,
        pageContent,
        footerContent
      };
      
      // In production, you should make an API call here to save the data
      // Simulate data saving
      setTimeout(() => {
        setFormData(updatedFormData);
        toast({
          title: 'Page saved',
          description: 'The changes to the form page have been saved successfully'
        });
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving form page:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving the page',
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
            Back to forms
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Form Page Editor</h1>
            <p className="text-muted-foreground mt-1">
              Edit the layout and description of the page that displays the form
            </p>
          </div>
        </div>
        
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
      
      {previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Form Page Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-6 bg-white">
              <div 
                className="prose max-w-none mb-8" 
                dangerouslySetInnerHTML={{ __html: formData.pageContent }} 
              />
              
              <div className="border-t border-b py-8 my-8">
                <div className="text-center text-lg font-medium mb-4">
                  [Form content will be displayed here]
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
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Edit the basic information of the form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="form-title">Form Title</Label>
                <Input
                  id="form-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Form title"
                />
              </div>
              
              <div>
                <Label htmlFor="form-description">Short description</Label>
                <Input
                  id="form-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the form"
                />
              </div>
              
              <div>
                <Label htmlFor="form-instructions">Completion instructions</Label>
                <Input
                  id="form-instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  placeholder="Instructions for completing the form"
                />
              </div>
              
              <div>
                <Label htmlFor="header-image">Header Image URL</Label>
                <Input
                  id="header-image"
                  value={formData.headerImageUrl}
                  onChange={(e) => setFormData({...formData, headerImageUrl: e.target.value})}
                  placeholder="URL of the header image"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Page Content (Before the Form)</CardTitle>
              <CardDescription>
                Edit the content that will be shown before the form
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
              <CardTitle>Footer Content (After the Form)</CardTitle>
              <CardDescription>
                Edit the content that will be shown after the form
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
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default FormPageEditor;
