import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  MoreVertical,
  Trash2,
  Copy,
  Edit,
  FileText,
  Layout,
  Eye,
  Upload,
} from "lucide-react";
import FormImportDialog from "@/components/admin/FormImportDialog";
import { API_BASE_URL } from "@/config/api";

interface Form {
  id: string;
  title: string;
  description?: string;
  status: "published" | "draft";
  questions?: object;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  logo?: string | null;
}

const FormBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shortcodeFormId, setShortcodeFormId] = useState<string | null>(null);
  const [shortcodeDialogOpen, setShortcodeDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const fetchForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/forms`);
      if (!res.ok) throw new Error("Error fetching forms");
      const result = await res.json();

      if (result.success) {
        setForms(result.data || []);
      } else {
        throw new Error(result.message || "Error fetching forms");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
    // Refetch forms when page regains focus
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchForms();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const filteredForms = (Array.isArray(forms) ? forms : []).filter((form) => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = form.status === "published";
    const matchesActiveState = showInactiveOnly ? !isActive : true;
    return matchesSearch && matchesActiveState;
  });

  const handleCreateNew = () => {
    navigate("/admin/form-builder/edit/new");
  };

  const handleEdit = (formId: string) => {
    navigate(`/admin/form-builder/edit/${formId}`);
  };

  const handleDuplicate = (formId: string) => {
    const formsArray = Array.isArray(forms) ? forms : [];
    const formToDuplicate = formsArray.find((f) => f.id === formId);
    if (formToDuplicate) {
      const newForm = {
        ...formToDuplicate,
        id: (formsArray.length + 1).toString(),
        title: `${formToDuplicate.title} (Copy)`,
        createdAt: new Date().toISOString().split("T")[0],
      };

      setForms([...formsArray, newForm]);
      toast({
        title: "Form duplicated",
        description: `"${formToDuplicate.title}" has been duplicated successfully.`,
      });
    }
  };

  const handleDelete = (formId: string) => {
    setDeleteFormId(formId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteFormId) return;

    try {
      console.log("Deleting form with ID:", deleteFormId);

      const response = await fetch(`${API_BASE_URL}/forms/${deleteFormId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      console.log("Delete response:", result);

      if (!response.ok) {
        throw new Error(
          result.message || `Failed to delete form: ${response.status}`
        );
      }

      if (result.success) {
        // Only remove from local state if backend deletion was successful
        const formsArray = Array.isArray(forms) ? forms : [];
        setForms(formsArray.filter((f) => f.id !== deleteFormId));
        setDeleteDialogOpen(false);
        setDeleteFormId(null);

        toast({
          title: "Form deleted",
          description: `The form "${
            result.data?.title || "unnamed"
          }" has been deleted successfully.`,
        });

        console.log(
          "✅ Form deleted successfully from both backend and frontend"
        );
      } else {
        throw new Error(result.message || "Delete operation failed");
      }
    } catch (error) {
      console.error("❌ Error deleting form:", error);

      toast({
        title: "Error deleting form",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting the form.",
        variant: "destructive",
      });

      // Keep the dialog open so user can retry
    }
  };

  const handleToggleActive = async (formId: string) => {
    const formsArray = Array.isArray(forms) ? forms : [];
    const form = formsArray.find((f) => f.id === formId);
    if (!form) return;

    const newStatus = form.status === "published" ? "draft" : "published";

    try {
      // Update the status in the backend
      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: parseInt(formId, 10),
          title: form.title,
          description: form.description || "",
          surveyJSON: form.questions || {},
          logo: form.logo || null,
          status: newStatus,
          createdBy: "admin",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the local state
        setForms(
          formsArray.map((f) => {
            if (f.id === formId) {
              return { ...f, status: newStatus };
            }
            return f;
          })
        );

        toast({
          title: "Status updated",
          description: `The form "${form.title}" is now ${
            newStatus === "published" ? "active" : "inactive"
          }.`,
        });
      } else {
        throw new Error(
          result.message || "Error updating status"
        );
      }
    } catch (error) {
      console.error("Error toggling form status:", error);
      toast({
        title: "Error",
        description: "Error updating form status",
        variant: "destructive",
      });
    }
  };

  const handleShowShortcode = (formId: string) => {
    setShortcodeFormId(formId);
    setShortcodeDialogOpen(true);
  };

  const handleEditPageLayout = (formId: string) => {
    navigate(`/admin/form-builder/page-layout/${formId}`);
    toast({
      title: "Page layout editor",
      description:
        "Edit the description and layout of the page that displays the form",
    });
  };

  const handleImportSuccess = () => {
    // Refetch forms after successful import
    fetchForms();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Form Builder</h1>
          <p className="text-muted-foreground mt-2">
            Manage your forms and questionnaires
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Form
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Form
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Input
            type="search"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="show-inactive" className="text-sm font-medium">
            Show inactive only
          </Label>
          <Switch
            id="show-inactive"
            checked={showInactiveOnly}
            onCheckedChange={setShowInactiveOnly}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center p-10">Loading...</div>
        ) : error ? (
          <div className="col-span-full text-center text-red-500 p-10">
            {error}
          </div>
        ) : (
          filteredForms.map((form) => (
            <Card
              key={form.id}
              className={`${form.status === "draft" ? "border-dashed" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="flex items-center min-w-0">
                      <span className="max-w-full break-words whitespace-normal">
                        {form.title}
                      </span>
                      {form.status === "draft" && (
                        <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600 whitespace-nowrap">
                          Inactive
                        </span>
                      )}
                      {form.status === "published" && (
                        <span className="ml-2 text-xs bg-green-200 px-2 py-0.5 rounded-full text-green-700 whitespace-nowrap">
                          Active
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[220px] md:max-w-[260px] lg:max-w-[320px]">
                      {form.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 min-w-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuItem onClick={() => handleEdit(form.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span className="truncate">Edit Form</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `/questionnaire-surveyjs/${form.id}`,
                            "_blank"
                          )
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        <span className="truncate">Test Form</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditPageLayout(form.id)}
                      >
                        <Layout className="mr-2 h-4 w-4" />
                        <span className="truncate">Form Page Editor</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(form.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        <span className="truncate">Duplicate</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleShowShortcode(form.id)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="truncate">Shortcode</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(form.id)}
                      >
                        <Switch
                          checked={form.status === "published"}
                          className="mr-2"
                        />
                        <span className="truncate">
                          {form.status === "published" ? "Deactivate" : "Activate"}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(form.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span className="truncate">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate">
                    Questions:{" "}
                    {Array.isArray(form.questions)
                      ? form.questions.reduce(
                          (acc, page) => acc + (page.fields?.length || 0),
                          0
                        )
                      : 0}
                  </span>
                  <span className="text-muted-foreground truncate">
                    Created: {form.createdAt}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-col gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 py-2"
                  onClick={() => handleEdit(form.id)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="font-medium">Edit Form</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 py-2"
                  onClick={() => handleEditPageLayout(form.id)}
                >
                  <Layout className="h-4 w-4" />
                  <span className="font-medium">Page Editor</span>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {filteredForms.length === 0 && !loading && (
        <div className="text-center p-10 border rounded-md">
          <p className="text-muted-foreground">No forms found</p>
          {searchTerm && (
            <p className="text-sm mt-2">
              Try adjusting the search criteria
            </p>
          )}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this form? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shortcodeDialogOpen} onOpenChange={setShortcodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Form Shortcode</DialogTitle>
            <DialogDescription>
              Copy this shortcode to embed the form in a page
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto my-4">
            [simoly_form id="{shortcodeFormId}"]
          </div>
          <p className="text-sm text-muted-foreground">
            Add this shortcode to any page to display the form to visitors.
            Only authenticated users will be able to fill it out.
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(
                  `[simoly_form id="${shortcodeFormId}"]`
                );
                toast({
                  title: "Shortcode copied",
                  description: "The shortcode has been copied to the clipboard.",
                });
                setShortcodeDialogOpen(false);
              }}
            >
              Copy Shortcode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FormImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default FormBuilder;
