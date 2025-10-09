import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

interface ParsedQuestion {
  number?: number;
  page?: number;
  title: string;
  type: string;
  choices?: string[];
  description?: string;
  lesson?: string;
  guide?: string;
  required?: boolean;
  imagePath?: string;
  conditionLogic?: string;
}

export default function FormImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: FormImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<"file" | "text">("file");
  const [fileFormat, setFileFormat] = useState<"txt" | "csv">("txt");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const resetForm = () => {
    setSelectedFile(null);
    setTextContent("");
    setFormTitle("");
    setFormDescription("");
    setParsedQuestions([]);
    setPreviewMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      parseFile(file);
    }
  };

  const parseFile = async (file: File) => {
    try {
      const text = await file.text();
      console.log("File content:", text);

      const questions = parseQuestions(text, fileFormat);
      console.log("Parsed questions:", questions);

      setParsedQuestions(questions);

      // Auto-generate form title from filename if not set
      if (!formTitle) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setFormTitle(fileName);
      }
    } catch (error) {
      console.error("File parsing error:", error);
      toast({
        title: "Error parsing file",
        description: "Could not read the selected file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const parseQuestions = (
    content: string,
    format: "txt" | "csv"
  ): ParsedQuestion[] => {
    if (format === "csv") {
      return parseCSV(content);
    } else {
      return parseTXT(content);
    }
  };

  const parseTXT = (content: string): ParsedQuestion[] => {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    const questions: ParsedQuestion[] = [];
    let currentQuestion: Partial<ParsedQuestion> = {};
    let inOptionsSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for field patterns
      if (line.startsWith("Number of the Question:")) {
        // Start new question
        if (currentQuestion.title) {
          questions.push(currentQuestion as ParsedQuestion);
        }
        currentQuestion = {
          number:
            parseInt(line.replace("Number of the Question:", "").trim()) || 1,
          type: "text", // Default type
          required: false,
        };
        inOptionsSection = false;
      } else if (line.startsWith("Page:")) {
        currentQuestion.page = parseInt(line.replace("Page:", "").trim()) || 1;
      } else if (line.startsWith("Type of question:")) {
        currentQuestion.type = line
          .replace("Type of question:", "")
          .trim()
          .toLowerCase();
      } else if (line.startsWith("Description:")) {
        const desc = line.replace("Description:", "").trim();
        if (desc) {
          currentQuestion.description = desc;
          // Use description as title if no explicit title found
          if (!currentQuestion.title) {
            currentQuestion.title = desc;
          }
        }
      } else if (line.startsWith("Image path:")) {
        const imagePath = line.replace("Image path:", "").trim();
        if (imagePath) {
          currentQuestion.imagePath = imagePath;
        }
      } else if (line.startsWith("Options/ answers:")) {
        inOptionsSection = true;
        currentQuestion.choices = [];
      } else if (line.startsWith("Guide:")) {
        currentQuestion.guide = line.replace("Guide:", "").trim();
        inOptionsSection = false;
      } else if (line.startsWith("Lesson:")) {
        currentQuestion.lesson = line.replace("Lesson:", "").trim();
        inOptionsSection = false;
      } else if (line.startsWith("Condition logic:")) {
        currentQuestion.conditionLogic = line
          .replace("Condition logic:", "")
          .trim();
        inOptionsSection = false;
      } else if (inOptionsSection && /^[a-z]\)/.test(line)) {
        // Parse option with format: a) Always, I learn (score: 1)
        if (!currentQuestion.choices) {
          currentQuestion.choices = [];
        }

        // Extract choice text and score
        const choiceMatch = line.match(
          /^[a-z]\)\s*(.+?)(?:\s*\(score:\s*(\d+)\))?$/
        );
        if (choiceMatch) {
          const choiceText = choiceMatch[1].trim();
          const score = choiceMatch[2] ? parseInt(choiceMatch[2]) : undefined;

          // Store choice with score information
          currentQuestion.choices.push(
            score !== undefined ? `${choiceText} (score: ${score})` : choiceText
          );
        }
      }
      // Handle legacy format (backward compatibility)
      else if (/^\d+\./.test(line) || line.startsWith("Q:")) {
        if (currentQuestion.title) {
          questions.push(currentQuestion as ParsedQuestion);
        }
        currentQuestion = {
          title: line.replace(/^\d+\.\s*|^Q:\s*/, ""),
          type: "text",
          required: false,
        };
        inOptionsSection = false;
      } else if (line.startsWith("D:")) {
        currentQuestion.description = line.substring(2).trim();
      } else if (line.startsWith("L:")) {
        currentQuestion.lesson = line.substring(2).trim();
      } else if (line.startsWith("G:")) {
        currentQuestion.guide = line.substring(2).trim();
      } else if (line.startsWith("T:")) {
        currentQuestion.type = line.substring(2).trim().toLowerCase();
      } else if (line.startsWith("R:")) {
        currentQuestion.required =
          line.substring(2).trim().toLowerCase() === "yes";
      } else if (
        (line.startsWith("-") || line.startsWith("*")) &&
        !inOptionsSection
      ) {
        if (!currentQuestion.choices) {
          currentQuestion.choices = [];
        }
        currentQuestion.choices.push(line.substring(1).trim());
      }
    }

    // Add the last question
    if (currentQuestion.title || currentQuestion.description) {
      // Use description as title if no title is set
      if (!currentQuestion.title && currentQuestion.description) {
        currentQuestion.title = currentQuestion.description;
      }
      if (currentQuestion.title) {
        questions.push(currentQuestion as ParsedQuestion);
      }
    }

    return questions;
  };

  const parseCSV = (content: string): ParsedQuestion[] => {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    const questions: ParsedQuestion[] = [];

    if (lines.length < 2) return questions;

    // Parse header to find column indices
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const dataLines = lines.slice(1);

    for (const line of dataLines) {
      // Split CSV line, handling quoted strings
      const columns = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          columns.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      columns.push(current.trim()); // Add the last column

      if (columns.length < 2) continue;

      const question: ParsedQuestion = {
        title: "",
        type: "text",
        required: false,
      };

      // Map columns based on headers
      headers.forEach((header, index) => {
        const value = columns[index]
          ? columns[index].replace(/^"|"$/g, "")
          : "";

        switch (header) {
          case "number":
            question.number = parseInt(value) || undefined;
            break;
          case "page":
            question.page = parseInt(value) || undefined;
            break;
          case "title":
            question.title = value;
            break;
          case "type":
            question.type = value || "text";
            break;
          case "choices":
            if (value) {
              question.choices = value.split("|").map((c) => c.trim());
            }
            break;
          case "description":
            question.description = value;
            break;
          case "lesson":
            question.lesson = value;
            break;
          case "guide":
            question.guide = value;
            break;
          case "required":
            question.required = value.toLowerCase() === "yes";
            break;
          case "imagepath":
            question.imagePath = value;
            break;
          case "conditionlogic":
            question.conditionLogic = value;
            break;
        }
      });

      if (question.title) {
        questions.push(question);
      }
    }

    return questions;
  };

  const handleTextContentChange = () => {
    if (textContent.trim()) {
      const questions = parseQuestions(textContent, fileFormat);
      setParsedQuestions(questions);
    } else {
      setParsedQuestions([]);
    }
  };

  const convertToSurveyJS = (questions: ParsedQuestion[]) => {
    // Group questions by page
    const pageGroups: { [key: number]: ParsedQuestion[] } = {};
    questions.forEach((q) => {
      const pageNum = q.page || 1;
      if (!pageGroups[pageNum]) {
        pageGroups[pageNum] = [];
      }
      pageGroups[pageNum].push(q);
    });

    // Create pages
    const pages = Object.keys(pageGroups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((pageNum) => {
        const pageQuestions = pageGroups[parseInt(pageNum)];

        const elements = pageQuestions.map((q, index) => {
          const element: any = {
            name: q.number ? `question_${q.number}` : `question_${index + 1}`,
            title: q.title,
            type: q.type,
            isRequired: q.required || false,
          };

          if (q.description) {
            element.description = q.description;
          }

          if (q.lesson) {
            element.lesson = q.lesson;
          }

          if (q.guide) {
            element.guide = q.guide;
          }

          // Add image if available
          if (q.imagePath) {
            element.questionImage = q.imagePath;
          }

          // Add condition logic if available
          if (q.conditionLogic) {
            element.visibleIf = q.conditionLogic;
          }

          if (q.choices && q.choices.length > 0) {
            element.choices = q.choices.map((choice, choiceIndex) => {
              // Parse score from choice text: "Option text (score: 5)"
              const scoreMatch = choice.match(/^(.+?)\s*\(score:\s*(\d+)\)$/);
              if (scoreMatch) {
                return {
                  value: `choice_${choiceIndex + 1}`,
                  text: scoreMatch[1].trim(),
                  score: parseInt(scoreMatch[2]),
                };
              } else {
                return {
                  value: `choice_${choiceIndex + 1}`,
                  text: choice,
                };
              }
            });
          }

          return element;
        });

        return {
          name: `page_${pageNum}`,
          title: `Page ${pageNum}`,
          elements: elements,
        };
      });

    return {
      pages:
        pages.length > 0
          ? pages
          : [
              {
                name: "page1",
                title: "Page 1",
                elements: questions.map((q, index) => {
                  const element: any = {
                    name: q.number
                      ? `question_${q.number}`
                      : `question_${index + 1}`,
                    title: q.title,
                    type: q.type,
                    isRequired: q.required || false,
                  };

                  if (q.description) element.description = q.description;
                  if (q.lesson) element.lesson = q.lesson;
                  if (q.guide) element.guide = q.guide;
                  if (q.imagePath) element.questionImage = q.imagePath;
                  if (q.conditionLogic) element.visibleIf = q.conditionLogic;

                  if (q.choices && q.choices.length > 0) {
                    element.choices = q.choices.map((choice, choiceIndex) => {
                      const scoreMatch = choice.match(
                        /^(.+?)\s*\(score:\s*(\d+)\)$/
                      );
                      if (scoreMatch) {
                        return {
                          value: `choice_${choiceIndex + 1}`,
                          text: scoreMatch[1].trim(),
                          score: parseInt(scoreMatch[2]),
                        };
                      } else {
                        return {
                          value: `choice_${choiceIndex + 1}`,
                          text: choice,
                        };
                      }
                    });
                  }

                  return element;
                }),
              },
            ],
    };
  };

  const handleImport = async () => {
    if (!formTitle.trim()) {
      toast({
        title: "Form title required",
        description: "Please enter a title for the form.",
        variant: "destructive",
      });
      return;
    }

    if (parsedQuestions.length === 0) {
      toast({
        title: "No questions found",
        description: "Please provide questions to import.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const surveyJSON = convertToSurveyJS(parsedQuestions);

      console.log("Importing form with data:", {
        title: formTitle,
        description: formDescription,
        surveyJSON: surveyJSON,
        status: "draft",
      });

      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "https://simplyai.it/api";

      console.log("Making API call to:", `${API_BASE_URL}/forms`);
      console.log(
        "Request body:",
        JSON.stringify(
          {
            title: formTitle,
            description: formDescription,
            surveyJSON: surveyJSON,
            status: "draft",
          },
          null,
          2
        )
      );

      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          surveyJSON: surveyJSON,
          status: "published",
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const result = await response.json();
      console.log("Response result:", result);

      if (result.success) {
        toast({
          title: "Import successful",
          description: `Form "${formTitle}" has been imported with ${parsedQuestions.length} questions.`,
        });
        onImportSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        throw new Error(result.message || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Questionnaire
          </DialogTitle>
          <DialogDescription>
            Import questions from a text file or CSV file. Supported formats:
            TXT and CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Type Selection */}
          <div className="space-y-4">
            <Label>Import Method</Label>
            <div className="flex gap-4">
              <Button
                variant={importType === "file" ? "default" : "outline"}
                onClick={() => setImportType("file")}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Upload File
              </Button>
              <Button
                variant={importType === "text" ? "default" : "outline"}
                onClick={() => setImportType("text")}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Paste Text
              </Button>
            </div>
          </div>

          {/* File Format Selection */}
          <div className="space-y-2">
            <Label>File Format</Label>
            <Select
              value={fileFormat}
              onValueChange={(value: "txt" | "csv") => setFileFormat(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">Text File (.txt)</SelectItem>
                <SelectItem value="csv">CSV File (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          {importType === "file" && (
            <div className="space-y-2">
              <Label>Select File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept={fileFormat === "csv" ? ".csv" : ".txt"}
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {selectedFile.name} selected
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          {importType === "text" && (
            <div className="space-y-2">
              <Label>Paste your questions</Label>
              <Textarea
                placeholder={
                  fileFormat === "txt"
                    ? `1. What is your name?
D: Please enter your full name
T: text
R: yes

2. What is your favorite color?
T: radiogroup
- Red
- Blue
- Green
- Yellow

3. Tell us about yourself
D: Please provide some information about yourself
T: comment
L: This is a lesson about self-reflection
G: Take your time to think about your answer`
                    : `title,type,choices,description,lesson,guide,required
"What is your name?",text,,Please enter your full name,,,yes
"What is your favorite color?",radiogroup,"Red|Blue|Green|Yellow",,,,no
"Tell us about yourself",comment,,Please provide some information,This is a lesson about self-reflection,Take your time to think about your answer,no`
                }
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value);
                  handleTextContentChange();
                }}
                rows={10}
              />
            </div>
          )}

          {/* Form Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Form Title *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter form title"
              />
            </div>
            <div className="space-y-2">
              <Label>Form Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter form description (optional)"
                rows={3}
              />
            </div>
          </div>

          {/* Preview */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Preview ({parsedQuestions.length} questions)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>

              {previewMode && (
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-3">
                  {parsedQuestions.map((question, index) => (
                    <div key={index} className="border-b pb-3 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {question.number
                            ? `${question.number}. `
                            : `${index + 1}. `}
                          {question.title}
                        </div>
                        <div className="flex gap-2 text-xs">
                          {question.page && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Page {question.page}
                            </span>
                          )}
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {question.type}
                          </span>
                          {question.required && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                      </div>

                      {question.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Description:</span>{" "}
                          {question.description}
                        </div>
                      )}

                      {question.imagePath && (
                        <div className="text-sm text-purple-600 mt-1">
                          <span className="font-medium">Image:</span>{" "}
                          {question.imagePath}
                        </div>
                      )}

                      {question.choices && question.choices.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Choices:</span>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            {question.choices.map((choice, i) => (
                              <li key={i}>{choice}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {question.lesson && (
                        <div className="text-sm text-yellow-600 mt-1">
                          <span className="font-medium">Lesson:</span>{" "}
                          {question.lesson}
                        </div>
                      )}

                      {question.guide && (
                        <div className="text-sm text-blue-600 mt-1">
                          <span className="font-medium">Guide:</span>{" "}
                          {question.guide}
                        </div>
                      )}

                      {question.conditionLogic && (
                        <div className="text-sm text-green-600 mt-1">
                          <span className="font-medium">Condition:</span>{" "}
                          {question.conditionLogic}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Format Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Format Instructions:</div>
                {fileFormat === "txt" ? (
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>New Format:</strong>
                    </div>
                    <div>• Number of the Question: [number]</div>
                    <div>• Page: [page number]</div>
                    <div>
                      • Type of question: [text, radiogroup, checkbox, etc.]
                    </div>
                    <div>• Description: [question description]</div>
                    <div>• Image path: [/uploads/image.jpg or empty]</div>
                    <div>
                      • Options/ answers: [followed by a) option (score: 1)]
                    </div>
                    <div>• Guide: [guide text]</div>
                    <div>• Lesson: [lesson text]</div>
                    <div>• Condition logic: [if Q6 &gt;= 4 then show Q7]</div>
                    <div className="pt-1 text-xs text-gray-500">
                      <strong>Legacy format also supported:</strong> Questions
                      start with numbers (1., 2.) or Q:, D: for description, L:
                      for lesson, G: for guide, T: for type, R: yes/no for
                      required, choices start with - or *
                    </div>
                  </div>
                ) : (
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>New CSV Format:</strong>
                    </div>
                    <div>
                      • Columns: number, page, title, type, choices,
                      description, lesson, guide, required, imagePath,
                      conditionLogic
                    </div>
                    <div>• Separate multiple choices with | (pipe)</div>
                    <div>• Include scores in choices: "Option (score: 1)"</div>
                    <div>• Use quotes for text containing commas</div>
                    <div className="pt-1 text-xs text-gray-500">
                      <strong>Legacy format also supported:</strong> title,
                      type, choices, description, lesson, guide, required
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <div className="font-medium">Download Templates:</div>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          "/templates/questionnaire-template.txt",
                          "_blank"
                        )
                      }
                    >
                      Download TXT Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          "/templates/questionnaire-template.csv",
                          "_blank"
                        )
                      }
                    >
                      Download CSV Template
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              loading || parsedQuestions.length === 0 || !formTitle.trim()
            }
          >
            {loading ? "Importing..." : "Import Form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
