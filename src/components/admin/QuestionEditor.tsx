
import { useState } from 'react';
import { PlusCircle, Trash2, Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

export type QuestionType = 'single' | 'multiple' | 'scale' | 'text';

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: { id: string; text: string; value: number }[];
  guide?: string;
  minScale?: number;
  maxScale?: number;
  minLabel?: string;
  maxLabel?: string;
};

type QuestionEditorProps = {
  initialQuestions?: Question[];
  onSave: (questions: Question[]) => void;
};

const QuestionEditor = ({ initialQuestions = [], onSave }: QuestionEditorProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      text: 'New question',
      type: 'single',
      required: true,
      options: [{ id: generateId(), text: 'Option 1', value: 1 }],
    };
    
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
  };

  const updateQuestion = (updatedQuestion: Question) => {
    setQuestions(questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    ));
    setEditingQuestion(updatedQuestion);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (editingQuestion?.id === id) {
      setEditingQuestion(null);
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const updatedQuestion = {
      ...question,
      options: [
        ...(question.options || []),
        { id: generateId(), text: `Option ${(question.options?.length || 0) + 1}`, value: (question.options?.length || 0) + 1 }
      ]
    };
    
    updateQuestion(updatedQuestion);
  };

  const updateOption = (questionId: string, optionId: string, field: string, value: string | number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;
    
    const updatedOptions = question.options.map(option => 
      option.id === optionId ? { ...option, [field]: value } : option
    );
    
    updateQuestion({ ...question, options: updatedOptions });
  };

  const deleteOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;
    
    const updatedOptions = question.options.filter(option => option.id !== optionId);
    
    updateQuestion({ ...question, options: updatedOptions });
  };

  const handleSave = () => {
    if (questions.length === 0) {
      toast({
        title: "No questions",
        description: "Add at least one question to the questionnaire.",
        variant: "destructive",
      });
      return;
    }

    onSave(questions);
    toast({
      title: "Questionnaire saved",
      description: `${questions.length} questions saved successfully.`,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {questions.map((question, index) => (
                <div 
                  key={question.id}
                  className={`p-3 border rounded-md cursor-pointer flex justify-between items-center ${
                    editingQuestion?.id === question.id ? 'border-simoly-purple bg-simoly-accent-purple/10' : 'border-gray-200'
                  }`}
                  onClick={() => setEditingQuestion(question)}
                >
                  <div>
                    <span className="font-medium">{index + 1}. </span>
                    <span>{question.text}</span>
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteQuestion(question.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button 
                className="w-full mt-4 bg-simoly-purple hover:bg-simoly-purple-dark"
                onClick={addQuestion}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        {editingQuestion ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit Question</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingQuestion(null)}
              >
                <Settings className="h-4 w-4 mr-2" /> Advanced Options
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Question text</label>
                  <Input
                    value={editingQuestion.text}
                    onChange={(e) => updateQuestion({...editingQuestion, text: e.target.value})}
                    placeholder="Enter the question..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Question guide</label>
                  <Textarea
                    value={editingQuestion.guide || ''}
                    onChange={(e) => updateQuestion({...editingQuestion, guide: e.target.value})}
                    placeholder="Enter a help text for this question (optional)..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Answer type</label>
                    <Select
                      value={editingQuestion.type}
                      onValueChange={(value) => updateQuestion({
                        ...editingQuestion,
                        type: value as QuestionType,
                        options: value === 'single' || value === 'multiple'
                          ? editingQuestion.options || [{ id: generateId(), text: 'Option 1', value: 1 }]
                          : undefined
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single choice</SelectItem>
                        <SelectItem value="multiple">Multiple choice</SelectItem>
                        <SelectItem value="scale">Numeric scale</SelectItem>
                        <SelectItem value="text">Free text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={editingQuestion.required}
                      onCheckedChange={(checked) => updateQuestion({...editingQuestion, required: checked})}
                    />
                    <label htmlFor="required" className="text-sm font-medium">
                      Required question
                    </label>
                  </div>
                </div>

                {(editingQuestion.type === 'single' || editingQuestion.type === 'multiple') && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Answer options</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(editingQuestion.id)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" /> Add
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {editingQuestion.options?.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Input
                            value={option.text}
                            onChange={(e) => updateOption(editingQuestion.id, option.id, 'text', e.target.value)}
                            placeholder="Option text"
                            className="flex-grow"
                          />
                          <Input
                            type="number"
                            value={option.value}
                            onChange={(e) => updateOption(editingQuestion.id, option.id, 'value', parseInt(e.target.value))}
                            placeholder="Value"
                            className="w-20"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOption(editingQuestion.id, option.id)}
                            disabled={editingQuestion.options?.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editingQuestion.type === 'scale' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minimum value</label>
                      <Input
                        type="number"
                        value={editingQuestion.minScale || 1}
                        onChange={(e) => updateQuestion({...editingQuestion, minScale: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maximum value</label>
                      <Input
                        type="number"
                        value={editingQuestion.maxScale || 5}
                        onChange={(e) => updateQuestion({...editingQuestion, maxScale: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minimum label</label>
                      <Input
                        value={editingQuestion.minLabel || ''}
                        onChange={(e) => updateQuestion({...editingQuestion, minLabel: e.target.value})}
                        placeholder="E.g. Not at all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maximum label</label>
                      <Input
                        value={editingQuestion.maxLabel || ''}
                        onChange={(e) => updateQuestion({...editingQuestion, maxLabel: e.target.value})}
                        placeholder="E.g. Very much"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center p-10 border-2 border-dashed rounded-xl border-gray-300">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-medium text-gray-600">Select a question to edit it</h3>
              <p className="text-gray-500">Or add a new question from the menu on the left</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={addQuestion}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            className="bg-simoly-purple hover:bg-simoly-purple-dark"
            onClick={handleSave}
          >
            <Save className="mr-2 h-4 w-4" /> Save Questionnaire
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
