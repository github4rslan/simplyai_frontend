import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type FieldOption = {
  label: string;
  value: string;
};

type BaseField = {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
};

type TextField = BaseField & { type: "text" | "number" };
type TextAreaField = BaseField & { type: "textarea" };
type RadioField = BaseField & { type: "radio"; options: FieldOption[] };
type CheckboxField = BaseField & { type: "checkbox"; options: FieldOption[] };
type FormFieldType = TextField | TextAreaField | RadioField | CheckboxField;

type FormValues = Record<string, string | boolean | string[]>;

const sampleForm: {
  id: string;
  title: string;
  description: string;
  fields: FormFieldType[];
} = {
  id: "form-1",
  title: "Service Experience Survey",
  description: "Help us improve with quick and focused feedback.",
  fields: [
    {
      id: "fullName",
      type: "text",
      label: "Full name",
      required: true,
      placeholder: "John Smith",
    },
    {
      id: "serviceRating",
      type: "radio",
      label: "How would you rate our service?",
      required: true,
      options: [
        { label: "Excellent", value: "5" },
        { label: "Good", value: "4" },
        { label: "Average", value: "3" },
        { label: "Poor", value: "2" },
        { label: "Very poor", value: "1" },
      ],
    },
    {
      id: "usedServices",
      type: "checkbox",
      label: "Which services did you use?",
      options: [
        { label: "Consulting", value: "consulting" },
        { label: "Technical support", value: "support" },
        { label: "Training", value: "training" },
        { label: "Other", value: "other" },
      ],
    },
    {
      id: "suggestions",
      type: "textarea",
      label: "Suggestions for improvement",
      placeholder: "Tell us what we should improve next...",
    },
  ],
};

const FormPreview = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({});

  const form = sampleForm;
  const requiredCount = useMemo(
    () => form.fields.filter((field) => field.required).length,
    [form.fields]
  );

  const handleChange = (fieldId: string, value: string | boolean | string[]) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const getCheckboxValues = (fieldId: string): string[] => {
    const value = formValues[fieldId];
    return Array.isArray(value) ? value : [];
  };

  const isFieldValid = (field: FormFieldType) => {
    if (!field.required) return true;
    const value = formValues[field.id];
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.length > 0;
    return false;
  };

  const completedRequired = form.fields.filter(isFieldValid).length;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const hasInvalidRequired = form.fields.some((field) => !isFieldValid(field));
    if (hasInvalidRequired) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please complete all required fields before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      console.log("Form submitted:", formValues);
      setIsSubmitting(false);
      setFormValues({});
      toast({
        title: "Form submitted",
        description: "Your answers were submitted successfully.",
      });
    }, 700);
  };

  const renderField = (field: FormFieldType) => {
    const requiredIndicator = field.required ? (
      <span className="text-rose-500 ml-1">*</span>
    ) : null;

    if (field.type === "text" || field.type === "number") {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className="text-slate-800">
            {field.label}
            {requiredIndicator}
          </Label>
          <Input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder || ""}
            value={(formValues[field.id] as string) || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="h-11 rounded-lg border-slate-300 focus-visible:ring-teal-500"
          />
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className="text-slate-800">
            {field.label}
            {requiredIndicator}
          </Label>
          <Textarea
            id={field.id}
            placeholder={field.placeholder || ""}
            value={(formValues[field.id] as string) || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            rows={5}
            className="rounded-lg border-slate-300 focus-visible:ring-teal-500"
          />
        </div>
      );
    }

    if (field.type === "radio") {
      return (
        <div key={field.id} className="space-y-3">
          <Label className="text-slate-800">
            {field.label}
            {requiredIndicator}
          </Label>
          <RadioGroup
            value={(formValues[field.id] as string) || ""}
            onValueChange={(value) => handleChange(field.id, value)}
            className="gap-2"
          >
            {field.options.map((option) => (
              <label
                key={option.value}
                htmlFor={`${field.id}-${option.value}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <RadioGroupItem
                  value={option.value}
                  id={`${field.id}-${option.value}`}
                />
                <span className="text-sm text-slate-700">{option.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-3">
        <Label className="text-slate-800">
          {field.label}
          {requiredIndicator}
        </Label>
        <div className="space-y-2">
          {field.options.map((option) => {
            const values = getCheckboxValues(field.id);
            const isChecked = values.includes(option.value);
            return (
              <label
                key={option.value}
                htmlFor={`${field.id}-${option.value}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <Checkbox
                  id={`${field.id}-${option.value}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const nextValues = checked
                      ? [...values, option.value]
                      : values.filter((value) => value !== option.value);
                    handleChange(field.id, nextValues);
                  }}
                />
                <span className="text-sm text-slate-700">{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/60 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Preview ID: {id || form.id}
            </div>
            <CardTitle className="text-3xl text-slate-900">{form.title}</CardTitle>
            <CardDescription className="text-base text-slate-600">
              {form.description}
            </CardDescription>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Required completed: {Math.min(completedRequired, requiredCount)} /{" "}
              {requiredCount}
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {form.fields.map(renderField)}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full h-11 rounded-lg bg-teal-700 hover:bg-teal-800 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit form"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default FormPreview;
