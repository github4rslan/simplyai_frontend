import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-creator-core/survey-creator-core.css";
import "survey-core/survey-core.css";
import { Serializer, SurveyModel } from "survey-core";
import { registerCustomProperties } from "@/lib/surveyjs-properties";
import FormImportDialog from "@/components/admin/FormImportDialog";
import { FileUp } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

export default function FormBuilderEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const creatorRef = useRef<SurveyCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Configure custom properties
  useEffect(() => {
    console.log("Setting up FormBuilderEditor with image upload support");

    // Register all custom properties
    registerCustomProperties();

    // Add 'score' property to choices - this will appear in the Choice table
    if (!Serializer.findProperty("itemvalue", "score")) {
      Serializer.addProperty("itemvalue", {
        name: "score:number",
        displayName: "Score (Points)",
        category: "general",
        visibleIndex: 3, // This will place it right after text and value in the Choice table
        minValue: 0,
        maxValue: 100,
        default: 0,
        isRequired: false,
      });
    }

    // Also add score property to question level for total score display
    if (!Serializer.findProperty("question", "showScores")) {
      Serializer.addProperty("question", {
        name: "showScores:boolean",
        displayName: "Show Answer Scores",
        category: "Custom Properties",
        visibleIndex: 104,
        default: false,
      });
    }

    // Add 'description' property to all questions if not already present
    if (!Serializer.findProperty("question", "description")) {
      Serializer.addProperty("question", {
        name: "description:text",
        displayName: "Description",
        category: "General",
        visibleIndex: 2, // Show after title
        isRequired: false,
      });
    }
  }, []);

  if (!creatorRef.current) {
    creatorRef.current = new SurveyCreator({
      showToolbox: true,
      showLogicTab: true,
      isAutoSave: false,
      showTranslationTab: false,
      showThemeTab: true,
      showTestSurveyTab: true,
      showJSONEditorTab: true,
      showSidebar: true, // Use showSidebar instead of showPropertyGrid for V2
      showOptions: true,
      allowDefaultToolboxItems: true,
      allowModifyPages: true,
      allowModifyQuestions: true,
      allowModifyChoices: true,
      allowModifySurvey: true,
      storeOthersAsComment: false,
      // Enable file upload support
      showFileOptions: true,
    });

    // Configure image upload for SurveyJS Creator
    creatorRef.current.uploadFiles = (files, question, callback) => {
      console.log("SurveyJS uploadFiles called with:", {
        files,
        question,
        callback,
      });

      if (!files || files.length === 0) {
        console.log("No files provided to uploadFiles");
        if (callback) {
          callback("error", []);
        }
        return;
      }

      const file = files[0];
      console.log("Processing file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      const formData = new FormData();
      formData.append("file", file);

      console.log("Sending upload request to", `${API_BASE_URL}/upload/image`);

      fetch(`${API_BASE_URL}/upload/image`, {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          console.log("Upload response received:", {
            status: response.status,
            ok: response.ok,
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Upload response data:", data);

          if (data.success && data.data && data.data.content) {
            // SurveyJS Creator expects the callback to be called with (status, files)
            // The files array should contain objects with 'name' and 'content' properties
            const uploadedFiles = [
              {
                name: data.data.name,
                content: data.data.content,
              },
            ];

            console.log(
              "Upload successful, calling callback with:",
              uploadedFiles
            );

            // Call the callback with 'success' status and the uploaded files array
            if (callback) {
              callback("success", uploadedFiles);

              // Force update the property that was being edited
              setTimeout(() => {
                if (creatorRef.current) {
                  console.log("Force updating survey/question with image URL");

                  // Check if this is a survey logo upload (no specific question)
                  if (
                    !question ||
                    creatorRef.current.selectedElement ===
                      creatorRef.current.survey
                  ) {
                    console.log("Setting survey logo to:", data.data.content);
                    creatorRef.current.survey.logo = data.data.content;

                    // Also update the survey JSON to ensure it's saved
                    const currentJSON = creatorRef.current.JSON;
                    currentJSON.logo = data.data.content;
                    creatorRef.current.JSON = currentJSON;

                    console.log(
                      "Survey logo set, current survey.logo:",
                      creatorRef.current.survey.logo
                    );
                  }
                  // If this is a question image upload
                  else if (question) {
                    console.log(
                      "Setting question image to:",
                      data.data.content
                    );

                    // For image picker questions, we need to handle choices differently
                    if (
                      question.getType &&
                      question.getType() === "imagepicker"
                    ) {
                      console.log("Handling imagepicker upload");

                      // Get current choices
                      const currentChoices = question.choices
                        ? [...question.choices]
                        : [];
                      console.log(
                        "Current choices before upload:",
                        currentChoices
                      );

                      // Check if there's an empty choice that was just created by SurveyJS
                      const lastChoice =
                        currentChoices[currentChoices.length - 1];
                      if (
                        lastChoice &&
                        (!lastChoice.imageLink || lastChoice.imageLink === "")
                      ) {
                        // Replace the empty choice with our uploaded image
                        console.log(
                          "Replacing empty choice with uploaded image"
                        );
                        lastChoice.imageLink = data.data.content;
                        lastChoice.text = data.data.name;
                        if (!lastChoice.value) {
                          lastChoice.value = `choice_${Date.now()}`;
                        }
                      } else {
                        // Add a new choice if no empty choice exists
                        console.log("Adding new choice with uploaded image");
                        const newChoice = {
                          value: `choice_${Date.now()}`,
                          imageLink: data.data.content,
                          text: data.data.name,
                        };
                        currentChoices.push(newChoice);
                      }

                      question.choices = currentChoices;
                      console.log(
                        "Updated imagepicker choices:",
                        currentChoices
                      );

                      // Force the question to update by triggering a property change
                      try {
                        if (
                          question.onPropertyChanged &&
                          typeof question.onPropertyChanged.fire === "function"
                        ) {
                          question.onPropertyChanged.fire(question, {
                            name: "choices",
                            newValue: currentChoices,
                          });
                        }
                      } catch (error) {
                        console.warn(
                          "Could not trigger property change event:",
                          error
                        );
                      }

                      // Force update the creator's JSON to reflect changes
                      const currentJSON = creatorRef.current.JSON;
                      creatorRef.current.JSON = { ...currentJSON };

                      console.log(
                        "ImagePicker question updated with new image choice"
                      );
                    }
                    // For other questions, set as questionImage property
                    else {
                      console.log(
                        "Setting question image for general question"
                      );

                      // Try to set the questionImage property
                      if (typeof question.setPropertyValue === "function") {
                        question.setPropertyValue(
                          "questionImage",
                          data.data.content
                        );
                        console.log(
                          "Set questionImage using setPropertyValue:",
                          data.data.content
                        );
                      } else if (question.questionImage !== undefined) {
                        question.questionImage = data.data.content;
                        console.log(
                          "Set questionImage directly:",
                          data.data.content
                        );
                      }

                      // Also try setting imageLink for backward compatibility
                      if (typeof question.setPropertyValue === "function") {
                        question.setPropertyValue(
                          "imageLink",
                          data.data.content
                        );
                      } else if (question.imageLink !== undefined) {
                        question.imageLink = data.data.content;
                      }
                    }
                  }

                  // Refresh the creator interface
                  try {
                    // Trigger property grid update by changing selection
                    const currentSelection = creatorRef.current.selectedElement;
                    creatorRef.current.selectedElement = null;
                    setTimeout(() => {
                      if (creatorRef.current) {
                        creatorRef.current.selectedElement = currentSelection;
                      }
                    }, 50);
                  } catch (error) {
                    console.warn("Could not refresh property grid:", error);
                  }
                }
              }, 200);

              // Verify the image URL is accessible by creating a test image
              const testImg = new Image();
              testImg.onload = () => {
                console.log(
                  "✅ Uploaded image is accessible at:",
                  data.data.content
                );
              };
              testImg.onerror = () => {
                console.error(
                  "❌ Uploaded image is NOT accessible at:",
                  data.data.content
                );
              };
              testImg.src = data.data.content;
            }

            // Also notify the creator that files have been uploaded
            console.log("Notifying creator of successful upload");
          } else {
            console.error("Upload response indicates failure:", data);
            if (callback) {
              callback("error", []);
            }
          }
        })
        .catch((error) => {
          console.error("Upload request failed:", error);
          if (callback) {
            callback("error", []);
          }
        });
    };

    // Set additional creator properties for image handling
    if (creatorRef.current.onUploadFile) {
      creatorRef.current.onUploadFile.add((_, options) => {
        console.log("onUploadFile event triggered:", options);
      });
    }

    // Ensure survey object has proper image handling
    creatorRef.current.onSurveyInstanceCreated.add((_, options) => {
      console.log("Survey instance created, configuring image handling");
      const survey = options.survey;

      // Configure upload files for the survey runtime
      if (survey) {
        survey.uploadFiles = (question, name, files, callback) => {
          console.log("Survey uploadFiles called:", {
            question: question?.name,
            name,
            files: files?.length,
          });

          if (!files || files.length === 0) {
            callback([], ["No files provided"]);
            return;
          }

          const formData = new FormData();
          formData.append("file", files[0]);

          fetch(`${API_BASE_URL}/upload/image`, {
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.success && data.data) {
                // Return the uploaded file info to SurveyJS
                callback([
                  {
                    name: data.data.name,
                    content: data.data.content,
                  },
                ]);
              } else {
                callback([], ["Upload failed"]);
              }
            })
            .catch((error) => {
              console.error("Survey upload error:", error);
              callback([], ["Upload error: " + error.message]);
            });
        };
      }
    });

    // Add image display support for preview surveys
    creatorRef.current.onPreviewSurveyCreated.add((_, options) => {
      console.log("Preview survey created, adding image display support");
      const survey = options.survey;

      if (survey) {
        // Add the same image display logic as in the main survey
        survey.onAfterRenderQuestion.add((sender, options) => {
          const question = options.question;
          const questionElement = options.htmlElement;

          if (!questionElement) return;

          console.log("=== Preview Question Rendering ===");
          console.log("Question Name:", question.name);
          console.log("Question Type:", question.getType());

          // Get the question image from multiple sources
          let questionImageUrl = null;

          // Method 1: Direct property access
          if (question.questionImage) {
            questionImageUrl = question.questionImage;
            console.log(
              "✅ Preview Method 1 - Found questionImage via direct access:",
              questionImageUrl
            );
          }

          // Method 2: Try getPropertyValue if available
          if (
            !questionImageUrl &&
            typeof question.getPropertyValue === "function"
          ) {
            try {
              const propValue = question.getPropertyValue("questionImage");
              if (propValue) {
                questionImageUrl = propValue;
                console.log(
                  "✅ Preview Method 2 - Found questionImage via getPropertyValue:",
                  questionImageUrl
                );
              }
            } catch (e) {
              console.log("Preview Method 2 failed:", e);
            }
          }

          // Method 3: Check question JSON
          if (!questionImageUrl && question.toJSON) {
            try {
              const questionJson = question.toJSON();
              if (questionJson.questionImage) {
                questionImageUrl = questionJson.questionImage;
                console.log(
                  "✅ Preview Method 3 - Found questionImage in JSON:",
                  questionImageUrl
                );
              }
            } catch (e) {
              console.log("Preview Method 3 failed:", e);
            }
          }

          // Method 4: Try to access from the creator's current JSON
          if (!questionImageUrl && creatorRef.current) {
            try {
              const creatorJSON = creatorRef.current.JSON;
              if (creatorJSON.pages) {
                creatorJSON.pages.forEach((page) => {
                  if (page.elements) {
                    page.elements.forEach((element) => {
                      if (
                        element.name === question.name &&
                        element.questionImage
                      ) {
                        questionImageUrl = element.questionImage;
                        console.log(
                          "✅ Preview Method 4 - Found questionImage in creator JSON:",
                          questionImageUrl
                        );
                      }
                    });
                  }
                });
              }
            } catch (e) {
              console.log("Preview Method 4 failed:", e);
            }
          }

          console.log(
            "=== Preview Final questionImageUrl ===",
            questionImageUrl
          );

          // Add question image if present
          if (questionImageUrl) {
            console.log("🖼️ Adding image to preview question:", question.name);

            // Check if image container already exists to avoid duplicates
            const existingImageContainer = questionElement.querySelector(
              ".question-image-container"
            );
            if (existingImageContainer) {
              existingImageContainer.remove();
              console.log("Removed existing image container from preview");
            }

            const questionImageContainer = document.createElement("div");
            questionImageContainer.className = "question-image-container";
            questionImageContainer.style.cssText =
              "margin: 10px 0 15px 0; padding: 0; clear: both;";
            questionImageContainer.innerHTML = `
              <img src="${questionImageUrl}" alt="Question Image" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; max-height: 300px; display: block; margin: 0;" onload="console.log('✅ Preview image loaded successfully:', this.src)" onerror="console.error('❌ Preview image failed to load:', this.src)" />
            `;

            // Enhanced insertion strategies for preview (same as main survey)
            let inserted = false;

            console.log("=== Preview DOM Structure Analysis ===");
            console.log("Question element:", questionElement);
            console.log("Question element classes:", questionElement.className);

            // Strategy 1: Look for title element and insert immediately after it
            const titleSelectors = [
              ".sv-question__title",
              ".sv-string-viewer",
              ".sv-question__content .sv-string-viewer",
              '[data-name="title"]',
              ".sv-question-title",
            ];

            for (const selector of titleSelectors) {
              const titleElement = questionElement.querySelector(selector);
              if (titleElement) {
                console.log(
                  `Preview: Found title element with selector: ${selector}`,
                  titleElement
                );

                // Find the best insertion point - right after the title container
                let insertionTarget = titleElement;
                let insertionParent = titleElement.parentNode as HTMLElement;

                // If the title is deeply nested, find a better insertion point
                if (titleElement.closest(".sv-question__content")) {
                  insertionTarget = titleElement.closest(
                    ".sv-question__content"
                  ) as HTMLElement;
                  insertionParent = insertionTarget.parentNode as HTMLElement;
                }

                if (insertionParent) {
                  insertionParent.insertBefore(
                    questionImageContainer,
                    insertionTarget.nextSibling
                  );
                  console.log(
                    "✅ Preview: Image inserted after title element using selector:",
                    selector
                  );
                  inserted = true;
                  break;
                }
              }
            }

            // Strategy 2: Look for question header/content containers
            if (!inserted) {
              const headerSelectors = [
                ".sv-question__header",
                ".sv-question__content",
                ".sv-question-content",
              ];

              for (const selector of headerSelectors) {
                const headerElement = questionElement.querySelector(selector);
                if (headerElement) {
                  console.log(
                    `Preview: Found header element with selector: ${selector}`,
                    headerElement
                  );
                  headerElement.insertBefore(
                    questionImageContainer,
                    headerElement.firstChild
                  );
                  console.log(
                    "✅ Preview: Image inserted at beginning of header element using selector:",
                    selector
                  );
                  inserted = true;
                  break;
                }
              }
            }

            // Strategy 3: Insert right after any description element
            if (!inserted) {
              const descriptionElement = questionElement.querySelector(
                ".sv-question__description, .sv-question-description"
              );
              if (descriptionElement && descriptionElement.parentNode) {
                descriptionElement.parentNode.insertBefore(
                  questionImageContainer,
                  descriptionElement.nextSibling
                );
                console.log(
                  "✅ Preview: Image inserted after question description"
                );
                inserted = true;
              }
            }

            // Strategy 4: Find the main question container and insert at the top
            if (!inserted) {
              // Look for the main question content area
              const questionContent = questionElement.querySelector(
                ".sv-question, .sv-q, .question"
              );
              if (questionContent) {
                questionContent.insertBefore(
                  questionImageContainer,
                  questionContent.firstChild
                );
                console.log(
                  "✅ Preview: Image inserted at beginning of question content"
                );
                inserted = true;
              }
            }

            // Strategy 5: Fallback - insert at the very beginning of the question element
            if (!inserted) {
              questionElement.insertBefore(
                questionImageContainer,
                questionElement.firstChild
              );
              console.log(
                "✅ Preview: Image inserted at beginning of question element (fallback)"
              );
              inserted = true;
            }

            if (inserted) {
              console.log(
                "🎉 Preview: Question image successfully added to DOM with URL:",
                questionImageUrl
              );
            } else {
              console.error(
                "❌ Preview: Failed to insert question image into DOM"
              );
            }
          } else {
            console.log(
              "ℹ️ Preview: No question image found for:",
              question.name
            );
          }
        });
      }
    });

    // Add custom image upload to question cards
    creatorRef.current.onDesignerSurveyCreated.add((_, options) => {
      const survey = options.survey;

      // Add custom rendering for questions in the designer
      survey.onAfterRenderQuestion.add((sender, options) => {
        const question = options.question;
        const questionElement = options.htmlElement;

        if (!questionElement) return;

        // Add image upload section below question title with a slight delay
        // This ensures the DOM is fully rendered before we add our custom UI
        setTimeout(() => {
          addImageUploadToQuestion(question, questionElement);
        }, 100);
      });
    });

    // Also listen for element selection changes to refresh image upload UI
    creatorRef.current.onSelectedElementChanged.add((_, options) => {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        const selectedElement = creatorRef.current?.selectedElement;
        if (
          selectedElement &&
          selectedElement.getType &&
          selectedElement.getType() !== "survey"
        ) {
          // Get the selected element's name safely
          const selectedElementName = (selectedElement as any)?.name;
          if (!selectedElementName) return;

          // Find the specific question element in the DOM for the selected element
          const questionElements = document.querySelectorAll(
            ".svc-question__content, .sv-question"
          );
          questionElements.forEach((element) => {
            // Check if this element belongs to the selected question by matching question names
            const questionTitle = element.querySelector(
              ".svc-string-editor__content, .sv-string-editor"
            );
            if (questionTitle && element instanceof HTMLElement) {
              // Only refresh the upload UI for the currently selected question
              const existingUpload = element.querySelector(
                `[data-question-name="${selectedElementName}"]`
              );
              if (existingUpload) {
                // Remove only the upload section for this specific question
                existingUpload.remove();
                // Re-add it for this specific question
                addImageUploadToQuestion(selectedElement, element);
              } else if (
                !element.querySelector(".question-image-upload-section")
              ) {
                // If no upload section exists for this question, add one
                addImageUploadToQuestion(selectedElement, element);
              }
            }
          });
        }
      }, 150);
    });
  }

  // Load existing form if editing
  useEffect(() => {
    const loadForm = async () => {
      // Only try to load if we have a valid ID (not 'new', '0', or undefined)
      // Accept both numeric IDs and UUIDs
      if (id && id !== "new" && id !== "0" && id.trim() !== "") {
        try {
          setLoading(true);
          console.log("Loading form with ID:", id);
          const response = await fetch(`${API_BASE_URL}/forms/${id}`);
          if (!response.ok) {
            throw new Error("Form not found");
          }
          const result = await response.json();
          console.log("Form data received:", result);

          if (result.success && result.data) {
            const form = result.data;
            console.log("Setting form data:", form.questions);
            // Set the form data in SurveyJS Creator
            creatorRef.current.JSON = form.questions || {};
            // Set form title and description
            creatorRef.current.survey.title = form.title || "";
            creatorRef.current.survey.description = form.description || "";
            // Set form logo if it exists
            if (form.logo) {
              creatorRef.current.survey.logo = form.logo;
            }
          }
        } catch (error) {
          console.error("Error loading form:", error);
          toast({
            title: "Errore",
            description: "Impossibile caricare il form: " + error.message,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      } else {
        // For new forms or invalid IDs, just set loading to false without trying to fetch
        console.log("Skipping form load for ID:", id);
        setLoading(false);
      }
    };

    loadForm();
  }, [id, toast]);

  // Function to add image upload UI to question cards
  const addImageUploadToQuestion = (
    question: any,
    questionElement: HTMLElement
  ) => {
    // Check if image upload UI already exists
    if (questionElement.querySelector(".question-image-upload-section")) {
      return;
    }

    console.log("Adding image upload UI to question:", question.name);

    // Get current image URL from question properties
    let currentImageUrl = "";
    if (typeof question.getPropertyValue === "function") {
      currentImageUrl = question.getPropertyValue("questionImage") || "";
    } else {
      currentImageUrl = question.questionImage || "";
    }

    console.log("Current image URL for question:", currentImageUrl);

    // Create image upload section with unique identifier for this specific question
    const imageUploadSection = document.createElement("div");
    imageUploadSection.className = "question-image-upload-section";
    imageUploadSection.setAttribute("data-question-name", question.name); // Add unique identifier
    imageUploadSection.style.cssText = `
      margin: 8px 0 12px 0;
      padding: 12px;
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `;

    // Create upload UI HTML
    const createUploadHTML = (imageUrl: string) => {
      if (imageUrl) {
        return `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #495057;">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Question Image
          </div>
          <div class="image-upload-content">
            <div class="current-image" style="margin-bottom: 10px;">
              <img src="${imageUrl}" alt="Question image" style="max-width: 100%; max-height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #dee2e6; display: block;">
              <div style="font-size: 11px; color: #6c757d; margin-top: 4px;">Current question image</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="replace-image-btn" style="padding: 6px 12px; background-color: #007bff; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background-color 0.2s;">
                Replace Image
              </button>
              <button class="remove-image-btn" style="padding: 6px 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background-color 0.2s;">
                Remove Image
              </button>
            </div>
          </div>
        `;
      } else {
        return `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #495057;">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Question Image
          </div>
          <div class="image-upload-content">
            <div class="upload-area" style="border: 2px dashed #ced4da; border-radius: 4px; padding: 16px; text-align: center; background-color: #fff; transition: border-color 0.2s;">
              <div style="color: #6c757d; font-size: 12px; margin-bottom: 8px;">
                Add an image to display with this question
              </div>
              <button class="upload-image-btn" style="padding: 8px 16px; background-color: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background-color 0.2s;">
                <svg style="width: 12px; height: 12px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Choose Image
              </button>
            </div>
          </div>
        `;
      }
    };

    imageUploadSection.innerHTML =
      createUploadHTML(currentImageUrl) +
      '<input type="file" class="image-file-input" accept="image/*" style="display: none;">';

    // Enhanced event handling
    const setupEventListeners = () => {
      const fileInput = imageUploadSection.querySelector(
        ".image-file-input"
      ) as HTMLInputElement;
      const uploadBtn = imageUploadSection.querySelector(".upload-image-btn");
      const replaceBtn = imageUploadSection.querySelector(".replace-image-btn");
      const removeBtn = imageUploadSection.querySelector(".remove-image-btn");
      const uploadArea = imageUploadSection.querySelector(".upload-area");

      const handleFileUpload = async (file: File) => {
        if (!file) return;

        console.log("Uploading file for question:", question.name, file.name);

        // Show loading state
        const contentDiv = imageUploadSection.querySelector(
          ".image-upload-content"
        ) as HTMLElement;
        contentDiv.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="color: #6c757d; font-size: 12px; margin-bottom: 8px;">Uploading image...</div>
            <div style="width: 100%; background-color: #e9ecef; border-radius: 4px; overflow: hidden;">
              <div style="width: 0%; height: 4px; background-color: #28a745; transition: width 0.3s;" class="upload-progress"></div>
            </div>
          </div>
        `;

        // Animate progress bar
        const progressBar = contentDiv.querySelector(
          ".upload-progress"
        ) as HTMLElement;
        if (progressBar) {
          setTimeout(() => (progressBar.style.width = "60%"), 100);
        }

        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch(`${API_BASE_URL}/upload/image`, {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (progressBar) {
            progressBar.style.width = "100%";
          }

          if (data.success && data.data) {
            const imageUrl = data.data.content;
            console.log(
              "Upload successful, setting questionImage to:",
              imageUrl
            );

            // Update question property using the proper SurveyJS method
            if (typeof question.setPropertyValue === "function") {
              question.setPropertyValue("questionImage", imageUrl);
              console.log(
                "Set questionImage using setPropertyValue for question:",
                question.name
              );
            } else {
              question.questionImage = imageUrl;
              console.log(
                "Set questionImage directly for question:",
                question.name
              );
            }

            // Update ONLY this specific question's UI by targeting the exact upload section
            setTimeout(() => {
              const specificUploadSection = questionElement.querySelector(
                `[data-question-name="${question.name}"]`
              );
              if (specificUploadSection) {
                specificUploadSection.innerHTML =
                  createUploadHTML(imageUrl) +
                  '<input type="file" class="image-file-input" accept="image/*" style="display: none;">';
                setupEventListeners();
                console.log(
                  "✅ Updated UI for specific question:",
                  question.name
                );
              } else {
                console.warn(
                  "Could not find specific upload section for question:",
                  question.name
                );
              }
            }, 500);

            console.log("✅ Question image uploaded successfully:", imageUrl);
          } else {
            throw new Error(data.message || "Upload failed");
          }
        } catch (error) {
          console.error("Upload error:", error);
          const contentDiv = imageUploadSection.querySelector(
            ".image-upload-content"
          ) as HTMLElement;
          contentDiv.innerHTML = `
            <div style="text-align: center; color: #dc3545; font-size: 12px; padding: 12px; background-color: #f8d7da; border-radius: 4px;">
              Upload failed: ${error.message}
            </div>
          `;
          setTimeout(() => {
            const specificUploadSection = questionElement.querySelector(
              `[data-question-name="${question.name}"]`
            );
            if (specificUploadSection) {
              specificUploadSection.innerHTML =
                createUploadHTML("") +
                '<input type="file" class="image-file-input" accept="image/*" style="display: none;">';
              setupEventListeners();
            }
          }, 3000);
        }
      };

      const handleRemoveImage = () => {
        console.log("Removing image from question:", question.name);

        // Remove image from question
        if (typeof question.setPropertyValue === "function") {
          question.setPropertyValue("questionImage", "");
        } else {
          question.questionImage = "";
        }

        // Update ONLY this specific question's UI
        const specificUploadSection = questionElement.querySelector(
          `[data-question-name="${question.name}"]`
        );
        if (specificUploadSection) {
          specificUploadSection.innerHTML =
            createUploadHTML("") +
            '<input type="file" class="image-file-input" accept="image/*" style="display: none;">';
          setupEventListeners();
          console.log("✅ Removed image for specific question:", question.name);
        } else {
          console.warn(
            "Could not find specific upload section for question:",
            question.name
          );
        }
      };

      // Event listeners with enhanced interaction
      if (uploadBtn) {
        uploadBtn.addEventListener("click", () => fileInput.click());
        uploadBtn.addEventListener("mouseenter", (e) => {
          (e.target as HTMLElement).style.backgroundColor = "#218838";
        });
        uploadBtn.addEventListener("mouseleave", (e) => {
          (e.target as HTMLElement).style.backgroundColor = "#28a745";
        });
      }

      if (replaceBtn) {
        replaceBtn.addEventListener("click", () => fileInput.click());
        replaceBtn.addEventListener("mouseenter", (e) => {
          (e.target as HTMLElement).style.backgroundColor = "#0056b3";
        });
        replaceBtn.addEventListener("mouseleave", (e) => {
          (e.target as HTMLElement).style.backgroundColor = "#007bff";
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener("click", handleRemoveImage);
        removeBtn.addEventListener("mouseenter", (e) => {
          (e.target as HTMLElement).style.backgroundColor = "#c82333";
        });
        removeBtn.addEventListener("mouseleave", (e) => {
          (e.target as HTMLElement).style.backgroundColor = "#dc3545";
        });
      }

      // Drag and drop functionality for upload area
      if (uploadArea) {
        uploadArea.addEventListener("dragover", (e) => {
          e.preventDefault();
          (e.target as HTMLElement).style.borderColor = "#28a745";
          (e.target as HTMLElement).style.backgroundColor = "#f8fff9";
        });

        uploadArea.addEventListener("dragleave", (e) => {
          e.preventDefault();
          (e.target as HTMLElement).style.borderColor = "#ced4da";
          (e.target as HTMLElement).style.backgroundColor = "#fff";
        });

        uploadArea.addEventListener("drop", (e: DragEvent) => {
          e.preventDefault();
          const files = e.dataTransfer?.files;
          if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith("image/")) {
              handleFileUpload(file);
            }
          }
          (e.target as HTMLElement).style.borderColor = "#ced4da";
          (e.target as HTMLElement).style.backgroundColor = "#fff";
        });
      }

      fileInput.addEventListener("change", (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleFileUpload(file);
        }
      });
    };

    setupEventListeners();

    // Enhanced insertion logic with multiple fallback strategies
    let inserted = false;

    // Strategy 1: Insert after question title in SurveyJS Creator
    const titleElement = questionElement.querySelector(
      ".svc-string-editor__content, .svc-question__title, .sv-question__title"
    );
    if (titleElement && titleElement.parentNode) {
      titleElement.parentNode.insertBefore(
        imageUploadSection,
        titleElement.nextSibling
      );
      console.log("✅ Image upload UI inserted after question title");
      inserted = true;
    }

    // Strategy 2: Insert after description if available
    if (!inserted) {
      const descriptionElement = questionElement.querySelector(
        ".svc-question__description, .sv-question__description"
      );
      if (descriptionElement && descriptionElement.parentNode) {
        descriptionElement.parentNode.insertBefore(
          imageUploadSection,
          descriptionElement.nextSibling
        );
        console.log("✅ Image upload UI inserted after question description");
        inserted = true;
      }
    }

    // Strategy 3: Insert at the beginning of question content
    if (!inserted) {
      const contentElement = questionElement.querySelector(
        ".svc-question__content, .sv-question__content"
      );
      if (contentElement) {
        contentElement.insertBefore(
          imageUploadSection,
          contentElement.firstChild
        );
        console.log(
          "✅ Image upload UI inserted at beginning of question content"
        );
        inserted = true;
      }
    }

    // Strategy 4: Fallback - insert at the beginning of question element
    if (!inserted) {
      questionElement.insertBefore(
        imageUploadSection,
        questionElement.firstChild
      );
      console.log(
        "✅ Image upload UI inserted at beginning of question element (fallback)"
      );
      inserted = true;
    }

    if (inserted) {
      console.log(
        "🎉 Question image upload UI successfully added to question:",
        question.name
      );
    } else {
      console.error("❌ Failed to insert question image upload UI");
    }
  };

  // Function to refresh the image upload section UI
  const refreshImageUploadSection = (
    section: HTMLElement,
    question: any,
    imageUrl: string
  ) => {
    const contentDiv = section.querySelector(
      ".image-upload-content"
    ) as HTMLElement;

    if (imageUrl) {
      contentDiv.innerHTML = `
        <div class="current-image" style="margin-bottom: 10px;">
          <img src="${imageUrl}" alt="Question image" style="max-width: 200px; max-height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #dee2e6;">
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="replace-image-btn" style="padding: 6px 12px; background-color: #007bff; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Replace Image
          </button>
          <button class="remove-image-btn" style="padding: 6px 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Remove Image
          </button>
        </div>
      `;
    } else {
      contentDiv.innerHTML = `
        <div class="upload-area" style="border: 2px dashed #ced4da; border-radius: 4px; padding: 20px; text-align: center; background-color: #fff;">
          <div style="color: #6c757d; font-size: 12px; margin-bottom: 10px;">
            Upload an image for this question
          </div>
          <button class="upload-image-btn" style="padding: 8px 16px; background-color: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Choose Image
          </button>
        </div>
      `;
    }

    // Re-attach event listeners
    const fileInput = section.querySelector(
      ".image-file-input"
    ) as HTMLInputElement;
    const uploadBtn = section.querySelector(".upload-image-btn");
    const replaceBtn = section.querySelector(".replace-image-btn");
    const removeBtn = section.querySelector(".remove-image-btn");

    const handleFileUpload = async (file: File) => {
      if (!file) return;

      contentDiv.innerHTML =
        '<div style="text-align: center; color: #6c757d; font-size: 12px;">Uploading...</div>';

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/upload/image`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success && data.data) {
          const newImageUrl = data.data.content;

          if (typeof question.setPropertyValue === "function") {
            question.setPropertyValue("questionImage", newImageUrl);
          } else {
            question.questionImage = newImageUrl;
          }

          refreshImageUploadSection(section, question, newImageUrl);
        } else {
          throw new Error(data.message || "Upload failed");
        }
      } catch (error) {
        console.error("Upload error:", error);
        contentDiv.innerHTML = `<div style="text-align: center; color: #dc3545; font-size: 12px;">Upload failed: ${error.message}</div>`;
        setTimeout(() => {
          refreshImageUploadSection(section, question, "");
        }, 2000);
      }
    };

    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => fileInput.click());
    }
    if (replaceBtn) {
      replaceBtn.addEventListener("click", () => fileInput.click());
    }
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        if (typeof question.setPropertyValue === "function") {
          question.setPropertyValue("questionImage", "");
        } else {
          question.questionImage = "";
        }
        refreshImageUploadSection(section, question, "");
      });
    }

    fileInput.addEventListener("change", (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    });
  };

  // SAVE handler - should set status to "draft"
  const handleSave = async () => {
    const creator = creatorRef.current;
    if (!creator) {
      toast({
        title: "Errore",
        description: "Form creator non disponibile",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true); // ← Use setSaving, not setPublishing!

      const surveyJSON = creator.JSON;

      // Validate required fields
      if (!creator.survey.title || creator.survey.title.trim() === "") {
        toast({
          title: "Errore",
          description: "Il titolo del form è obbligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!surveyJSON || !surveyJSON.pages || surveyJSON.pages.length === 0) {
        toast({
          title: "Errore",
          description: "Il form deve contenere almeno una pagina con domande",
          variant: "destructive",
        });
        return;
      }

      const logo = creator.survey.logo || surveyJSON.logo || null;

      console.log("Saving form with data:", {
        id: id && id !== "new" && id !== "0" ? id : null,
        title: creator.survey.title,
        description: creator.survey.description,
        logo: logo,
      });

      const formData = {
        id: id && id !== "new" && id !== "0" ? id : undefined,
        title: creator.survey.title.trim(),
        description: creator.survey.description?.trim() || "",
        surveyJSON: surveyJSON,
        logo: logo,
        status: "draft", // ← SAVE as draft
        createdBy: "admin",
      };

      console.log("Sending form data to backend:", formData);

      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Backend response:", result);

      if (result.success) {
        toast({
          title: "Successo",
          description:
            id && id !== "new" && id !== "0"
              ? "Form aggiornato con successo"
              : "Form salvato come bozza con successo",
        });

        // If this was a new form, navigate to the edit URL with the new ID
        if (!id || id === "new" || id === "0") {
          console.log("Navigating to edit form with ID:", result.id);
          setTimeout(() => {
            navigate(`/admin/form-builder/edit/${result.id}`);
          }, 500);
        }
      } else {
        throw new Error(
          result.message || "Errore sconosciuto durante il salvataggio"
        );
      }
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Errore",
        description:
          "Errore durante il salvataggio: " +
          (error.message || "Errore sconosciuto"),
        variant: "destructive",
      });
    } finally {
      setSaving(false); // ← Reset saving state
    }
  };

  // PUBLISH handler - should set status to "published"
  const handlePublish = async () => {
    const creator = creatorRef.current;
    if (!creator) {
      toast({
        title: "Errore",
        description: "Form creator non disponibile",
        variant: "destructive",
      });
      return;
    }

    try {
      setPublishing(true); // ← Use setPublishing

      const surveyJSON = creator.JSON;

      // Validate required fields
      if (!creator.survey.title || creator.survey.title.trim() === "") {
        toast({
          title: "Errore",
          description: "Il titolo del form è obbligatorio per la pubblicazione",
          variant: "destructive",
        });
        return; // Will go to finally block
      }

      if (!surveyJSON || !surveyJSON.pages || surveyJSON.pages.length === 0) {
        toast({
          title: "Errore",
          description:
            "Il form deve contenere almeno una pagina con domande per essere pubblicato",
          variant: "destructive",
        });
        return; // Will go to finally block
      }

      const logo = creator.survey.logo || surveyJSON.logo || null;

      console.log("Publishing form with data:", {
        id: id && id !== "new" && id !== "0" ? id : null,
        title: creator.survey.title,
        description: creator.survey.description,
        logo: logo,
      });

      const formData = {
        id: id && id !== "new" && id !== "0" ? id : undefined,
        title: creator.survey.title.trim(),
        description: creator.survey.description?.trim() || "",
        surveyJSON: surveyJSON,
        logo: logo,
        status: "published", // ← PUBLISH the form
        createdBy: "admin",
      };

      console.log("Publishing form data to backend:", formData);

      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, response: ${responseText}`
        );
      }

      const result = await response.json();
      console.log("Publish backend response:", result);

      if (result.success) {
        toast({
          title: "Successo",
          description:
            id && id !== "new" && id !== "0"
              ? "Form aggiornato e pubblicato con successo"
              : "Form creato e pubblicato con successo",
        });

        // Always redirect to the formbuilder page after publishing
        setTimeout(() => {
          navigate("/admin/form-builder");
        }, 1000);
      } else {
        throw new Error(
          result.message || "Errore sconosciuto durante la pubblicazione"
        );
      }
    } catch (error) {
      console.error("Error publishing form:", error);
      toast({
        title: "Errore",
        description:
          "Errore durante la pubblicazione: " +
          (error.message || "Errore sconosciuto"),
        variant: "destructive",
      });
    } finally {
      setPublishing(false); // ← Reset publishing state
    }
  };
  // Import success handler
  const handleImportSuccess = () => {
    // Refresh the page to load the newly imported form
    // The FormImportDialog creates a new form and we want to navigate to it
    navigate("/admin/form-builder");
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Caricamento form...</div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh" }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {id && id !== "new" && !isNaN(Number(id))
            ? "Modifica Form"
            : "Nuovo Form"}{" "}
          (SurveyJS)
        </h1>
        <div className="flex gap-2">
          <Button
            type="button" // ← ADD THIS
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileUp size={16} />
            Import Questions
          </Button>
          <Button
            type="button" // ← ADD THIS
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salva Form"}
          </Button>
          <Button
            type="button" // ← ADD THIS - CRITICAL!
            onClick={handlePublish}
            disabled={publishing || saving}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            {publishing ? "Pubblicando..." : "Pubblica Form"}
          </Button>
        </div>
      </div>
      <div style={{ position: "relative", height: "calc(100vh - 120px)" }}>
        <SurveyCreatorComponent creator={creatorRef.current} />
      </div>

      <FormImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
