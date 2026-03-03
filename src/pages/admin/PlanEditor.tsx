import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Clock,
  Copy,
  CheckSquare,
  RotateCcw,
  Bell,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  fetchPlan,
  savePlan,
  fetchAllQuestionnaires,
  fetchPlanQuestionnaires,
  savePlanQuestionnaires,
} from "@/services/ApiService";
import { format } from "date-fns";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_free: boolean;
  features: string[];
  options: {
    singleQuestionnaire: boolean;
    verificationAfter: boolean;
    periodicQuestionnaires: boolean;
    multipleQuestionnaires: boolean;
    progressQuestionnaires: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    whatsappNotifications?: boolean;
    verificationPeriod?: number;
    maxRepetitions?: number;
    reminderDaysBefore?: number;
    reminderFrequency?: string;
    reminderMessage?: string;
    reminderCount?: number;
    // New property for progression learning condition
    minWaitingPeriod?: number;
  };
  questionnaires: Array<{
    id: string;
    sequence?: number;
    periodicity?: number;
    repetitions?: number;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PlanEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState([]);

  const [plan, setPlan] = useState<Plan>({
    id: "",
    name: "",
    description: "",
    price: 0,
    is_free: false,
    features: [""],
    options: {
      singleQuestionnaire: true,
      verificationAfter: false,
      periodicQuestionnaires: false,
      multipleQuestionnaires: false,
      progressQuestionnaires: false,
      emailNotifications: true,
      verificationPeriod: 90,
      reminderDaysBefore: 7,
      reminderFrequency: "once",
      reminderMessage:
        "It's time to complete your questionnaire! Log in to continue your journey.",
      reminderCount: 1,
      // Default value for progression learning condition
      minWaitingPeriod: 7,
    },
    questionnaires: [],
    isActive: true,
    createdAt: "",
    updatedAt: "",
  });

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      try {
        const questionnaires = await fetchAllQuestionnaires();
        setAvailableQuestionnaires(questionnaires);
      } catch (error) {
        console.error("Error fetching questionnaires:", error);
        // Fallback to static data if API fails
        setAvailableQuestionnaires([
          { id: "1", title: "Valutazione Aziendale" },
          { id: "2", title: "Analisi Bisogni Formativi" },
          { id: "3", title: "Soddisfazione Cliente" },
          { id: "4", title: "Leadership Assessment" },
          { id: "5", title: "Valutazione Competenze Digitali" },
        ]);
      }
    };

    fetchQuestionnaires();
  }, []);

  useEffect(() => {
    const fetchPlanData = async () => {
      if (id) {
        try {
          const response = await fetchPlan(id);
          const planData = response.data;
          console.log("Fetched planData:", planData);

          if (planData) {
            const features = Array.isArray(planData.features)
              ? planData.features
              : JSON.parse((planData.features as string) || "[]");

            // Fetch questionnaires for this plan
            let planQuestionnaires = [];
            try {
              const questionnairesData = await fetchPlanQuestionnaires(id);
              planQuestionnaires = questionnairesData.map((q) => ({
                id: q.questionnaire_id,
                sequence: q.sequence_order,
                periodicity: 90, // Default value
                repetitions: 1, // Default value
              }));
            } catch (error) {
              console.error("Error fetching plan questionnaires:", error);
            }

            // Use options from planData if present, otherwise fallback to defaults
            const options = planData.options
              ? { ...planData.options }
              : {
                  singleQuestionnaire: planQuestionnaires.length <= 1,
                  verificationAfter: false,
                  periodicQuestionnaires: false,
                  multipleQuestionnaires: planQuestionnaires.length > 1,
                  progressQuestionnaires: false,
                  emailNotifications: true,
                  smsNotifications: false,
                  whatsappNotifications: false,
                  verificationPeriod: 90,
                  maxRepetitions: 4,
                  reminderDaysBefore: 7,
                  reminderFrequency: "once",
                  reminderMessage:
                    "It's time to complete your questionnaire! Log in to continue your journey.",
                  reminderCount: 1,
                  minWaitingPeriod: 7,
                };

            const newPlan = {
              id: planData.id,
              name: planData.name,
              description: planData.description || "",
              price: planData.price || 0,
              is_free: Boolean(planData.is_free),
              features: features,
              options: options,
              questionnaires: planQuestionnaires,
              isActive: Boolean(planData.active),
              createdAt: planData.created_at,
              updatedAt: planData.updated_at,
            };
            console.log("Setting plan state:", newPlan);
            setPlan(newPlan);
          }
        } catch (error) {
          console.error("Error loading plan:", error);
          toast({
            title: "Error",
            description: "Unable to load the requested plan",
            variant: "destructive",
          });

          setPlan({
            id: id || "", // Ensure id is set from URL param
            name: "Premium Plan",
            description: "Advanced plan with access to all questionnaires",
            price: 9999,
            is_free: false,
            features: [
              "Access to all questionnaires",
              "Periodic verifications",
              "Progress tracking",
              "Personalized reports",
              "Dedicated consultation",
            ],
            options: {
              singleQuestionnaire: false,
              verificationAfter: false,
              periodicQuestionnaires: true,
              multipleQuestionnaires: true,
              progressQuestionnaires: false,
              verificationPeriod: 90,
              maxRepetitions: 4,
              emailNotifications: true,
              reminderDaysBefore: 7,
              reminderFrequency: "once",
              reminderMessage:
                "It's time to complete your questionnaire! Log in to continue your journey.",
              reminderCount: 1,
              minWaitingPeriod: 7,
            },
            questionnaires: [{ id: "1" }, { id: "2" }, { id: "3" }],
            isActive: true,
            createdAt: "2023-07-22",
            updatedAt: "2023-08-15",
          });
        }
      } else {
        setPlan({
          id: id ? id : uuidv4(), // Always set id from URL param if present
          name: "New Plan",
          description: "Description of the new plan",
          price: 0,
          is_free: true,
          features: [""],
          options: {
            singleQuestionnaire: true,
            verificationAfter: false,
            periodicQuestionnaires: false,
            multipleQuestionnaires: false,
            progressQuestionnaires: false,
            emailNotifications: true,
            reminderDaysBefore: 7,
            reminderFrequency: "once",
            reminderMessage:
              "It's time to complete your questionnaire! Log in to continue your journey.",
            reminderCount: 1,
            minWaitingPeriod: 7,
          },
          questionnaires: [],
          isActive: true,
          createdAt: "",
          updatedAt: "",
        });
      }

      setIsLoading(false);
    };

    fetchPlanData();
  }, [id, toast]);

  const handleBack = () => {
    navigate("/admin/plans");
  };
  const formatDateForMySQL = (date) => format(date, "yyyy-MM-dd HH:mm:ss");

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const now = new Date();
      const isEditMode = window.location.pathname.includes("/edit/"); // Check if we're in edit mode based on URL

      const planData = {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.is_free ? 0 : plan.price,
        is_free: plan.is_free,
        features: plan.features,
        active: plan.isActive,
        button_text: plan.is_free ? "Get Started Free" : "Select Plan",
        button_variant: plan.is_free ? "default" : "outline",
        sort_order: 0,
        interval: "month",
        is_popular: false,
        created_at:
          plan.createdAt && plan.createdAt !== ""
            ? formatDateForMySQL(new Date(plan.createdAt))
            : formatDateForMySQL(now),
        updated_at: formatDateForMySQL(now),
        plan_type: getPlanType(),
        options: plan.options,
      };

      console.log("Sending planData to backend:", planData);
      console.log("Is edit mode:", isEditMode);

      const response = await savePlan(planData, isEditMode);
      console.log("Backend response:", response);

      // Save questionnaires associations
      if (plan.questionnaires.length > 0) {
        try {
          await savePlanQuestionnaires(plan.id, plan.questionnaires);
          console.log("Questionnaires saved successfully");
        } catch (error) {
          console.error("Error saving questionnaires:", error);
        }
      }

      toast({
        title: "Plan saved",
        description: isEditMode
          ? "The plan has been updated successfully"
          : "The plan has been created successfully",
      });

      navigate("/admin/plans");
    } catch (error) {
      console.error("Error during save:", error);
      toast({
        title: "Error",
        description: "An error occurred during saving",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = <K extends keyof Plan>(key: K, value: Plan[K]) => {
    setPlan({
      ...plan,
      [key]: value,
    });
  };

  const handleOptionChange = <K extends keyof Plan["options"]>(
    key: K,
    value: any
  ) => {
    setPlan({
      ...plan,
      options: {
        ...plan.options,
        [key]: value,
      },
    });
  };

  const addFeature = () => {
    handleChange("features", [...plan.features, ""]);
  };

  const updateFeature = (index: number, value: string) => {
    const updatedFeatures = [...plan.features];
    updatedFeatures[index] = value;
    handleChange("features", updatedFeatures);
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = plan.features.filter((_, i) => i !== index);
    handleChange("features", updatedFeatures);
  };

  const addQuestionnaire = () => {
    if (plan.options.singleQuestionnaire && plan.questionnaires.length > 0) {
      toast({
        title: "Warning",
        description:
          "A single questionnaire plan can only have one questionnaire",
        variant: "default",
      });
      return;
    }

    const availableIds = availableQuestionnaires.map((q) => q.id);
    const usedIds = plan.questionnaires.map((q) => q.id);
    const unusedIds = availableIds.filter((id) => !usedIds.includes(id));

    if (unusedIds.length > 0) {
      const newQuestionnaire = {
        id: unusedIds[0],
        sequence: plan.options.progressQuestionnaires
          ? plan.questionnaires.length + 1
          : undefined,
        periodicity: plan.options.periodicQuestionnaires ? 90 : undefined,
        repetitions:
          plan.options.periodicQuestionnaires || plan.options.verificationAfter
            ? 1
            : undefined,
      };

      handleChange("questionnaires", [
        ...plan.questionnaires,
        newQuestionnaire,
      ]);
    } else {
      toast({
        title: "Warning",
        description: "All available questionnaires have already been added",
        variant: "destructive",
      });
    }
  };

  const removeQuestionnaire = (index: number) => {
    const updatedQuestionnaires = plan.questionnaires.filter(
      (_, i) => i !== index
    );

    if (plan.options.progressQuestionnaires) {
      updatedQuestionnaires.forEach((q, i) => {
        q.sequence = i + 1;
      });
    }

    handleChange("questionnaires", updatedQuestionnaires);
  };

  const updateQuestionnaire = (
    index: number,
    key: keyof (typeof plan.questionnaires)[0],
    value: any
  ) => {
    const updatedQuestionnaires = [...plan.questionnaires];
    updatedQuestionnaires[index] = {
      ...updatedQuestionnaires[index],
      [key]: value,
    };

    handleChange("questionnaires", updatedQuestionnaires);
  };

  const getQuestionnaireTitle = (id: string) => {
    const questionnaire = availableQuestionnaires.find((q) => q.id === id);
    return questionnaire ? questionnaire.title : "Questionnaire not found";
  };

  const handlePlanTypeChange = (type: string) => {
    let newOptions = {
      ...plan.options,
      singleQuestionnaire: false,
      verificationAfter: false,
      periodicQuestionnaires: false,
      multipleQuestionnaires: false,
      progressQuestionnaires: false,
    };

    switch (type) {
      case "single":
        newOptions.singleQuestionnaire = true;
        break;
      case "verification":
        newOptions.verificationAfter = true;
        newOptions.verificationPeriod = 90;
        break;
      case "periodic":
        newOptions.periodicQuestionnaires = true;
        newOptions.maxRepetitions = 4;
        break;
      case "multiple":
        newOptions.multipleQuestionnaires = true;
        break;
      case "progress":
        newOptions.progressQuestionnaires = true;
        // Set default value for progression learning condition
        newOptions.minWaitingPeriod = 7;
        break;
    }

    let updatedQuestionnaires = [...plan.questionnaires];

    if (newOptions.singleQuestionnaire && updatedQuestionnaires.length > 1) {
      updatedQuestionnaires = [updatedQuestionnaires[0]];
      toast({
        title: "Notice",
        description:
          "A single questionnaire plan can only have one questionnaire. The other questionnaires have been removed.",
      });
    }

    if (newOptions.progressQuestionnaires) {
      updatedQuestionnaires = updatedQuestionnaires.map((q, i) => ({
        ...q,
        sequence: i + 1,
      }));
    }

    if (newOptions.periodicQuestionnaires) {
      updatedQuestionnaires = updatedQuestionnaires.map((q) => ({
        ...q,
        periodicity: 90,
        repetitions: 4,
      }));
    }

    if (newOptions.verificationAfter) {
      updatedQuestionnaires = updatedQuestionnaires.map((q) => ({
        ...q,
        repetitions: 1,
      }));
    }

    setPlan({
      ...plan,
      options: newOptions,
      questionnaires: updatedQuestionnaires,
    });
  };

  const getPlanType = () => {
    if (plan.options.progressQuestionnaires) return "progress";
    if (plan.options.periodicQuestionnaires) return "periodic";
    if (plan.options.multipleQuestionnaires) return "multiple";
    if (plan.options.verificationAfter) return "verification";
    if (plan.options.singleQuestionnaire) return "single";
    return "single"; // Default
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Loading...</p>
      </div>
    );
  }

  const isEditMode = window.location.pathname.includes("/edit/");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {isEditMode ? "Edit Plan" : "Create New Plan"}
          </h1>
        </div>

        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Plan"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Plan Details</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic information for the plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={plan.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="E.g. Basic Plan"
                    />
                  </div>

                  <div>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <Label htmlFor="price">Price (€)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={plan.price}
                          onChange={(e) =>
                            handleChange(
                              "price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={plan.is_free}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="flex items-center h-10 gap-2">
                        <Switch
                          id="is_free"
                          checked={plan.is_free}
                          onCheckedChange={(checked) =>
                            handleChange("is_free", checked)
                          }
                        />
                        <Label htmlFor="is_free">Free</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={plan.description || ""}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Briefly describe this plan"
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Features</Label>
                    <Button variant="outline" size="sm" onClick={addFeature}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>

                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="E.g. Access to all questionnaires"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center mt-2">
                    <Switch
                      id="plan-active"
                      checked={plan.isActive}
                      onCheckedChange={(checked) =>
                        handleChange("isActive", checked)
                      }
                    />
                    <Label htmlFor="plan-active" className="ml-2">
                      Plan active and visible to users
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle>Plan Type</CardTitle>
              <CardDescription>
                Select the plan type and configure the related options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="plan-type">Plan Type</Label>
                <Select
                  value={getPlanType()}
                  onValueChange={handlePlanTypeChange}
                >
                  <SelectTrigger id="plan-type">
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">
                      <div className="flex items-center">
                        <CheckSquare className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Single Questionnaire</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="verification">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-amber-500" />
                        <span>Verification after period</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="periodic">
                      <div className="flex items-center">
                        <RotateCcw className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Periodic questionnaires</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="multiple">
                      <div className="flex items-center">
                        <Copy className="h-4 w-4 mr-2 text-green-500" />
                        <span>Multiple questionnaires</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="progress">
                      <div className="flex items-center">
                        <CheckSquare className="h-4 w-4 mr-2 text-purple-500" />
                        <span>Learning progression</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">
                  Description of the selected type
                </h3>
                {plan.options.singleQuestionnaire && (
                  <p className="text-sm text-muted-foreground">
                    This plan allows the user to complete a single
                    questionnaire only once.
                  </p>
                )}
                {plan.options.verificationAfter && (
                  <p className="text-sm text-muted-foreground">
                    This plan allows the user to complete a
                    questionnaire and then redo it after a specified period
                    for a progress verification.
                  </p>
                )}
                {plan.options.periodicQuestionnaires && (
                  <p className="text-sm text-muted-foreground">
                    This plan allows the user to complete the same
                    questionnaire periodically to monitor progress over
                    time.
                  </p>
                )}
                {plan.options.multipleQuestionnaires && (
                  <p className="text-sm text-muted-foreground">
                    This plan allows the user to complete multiple
                    different questionnaires whenever they wish, without limitations.
                  </p>
                )}
                {plan.options.progressQuestionnaires && (
                  <p className="text-sm text-muted-foreground">
                    This plan enables a progressive learning path
                    with sequential questionnaires, each one available
                    after completing the previous one.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {plan.options.verificationAfter && (
                  <div>
                    <Label htmlFor="verification-period">
                      Verification period (days)
                    </Label>
                    <Input
                      id="verification-period"
                      type="number"
                      min={1}
                      value={plan.options.verificationPeriod || 90}
                      onChange={(e) =>
                        handleOptionChange(
                          "verificationPeriod",
                          parseInt(e.target.value) || 90
                        )
                      }
                    />
                  </div>
                )}

                {plan.options.progressQuestionnaires && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">
                      Progression conditions
                    </h4>
                    <div>
                      <Label htmlFor="min-waiting-period">
                        Minimum waiting period between questionnaires (days)
                      </Label>
                      <Input
                        id="min-waiting-period"
                        type="number"
                        min={0}
                        value={plan.options.minWaitingPeriod || 7}
                        onChange={(e) =>
                          handleOptionChange(
                            "minWaitingPeriod",
                            parseInt(e.target.value) || 7
                          )
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum time the user must wait before being able
                        to access the next questionnaire
                      </p>
                    </div>
                  </div>
                )}

                {plan.options.periodicQuestionnaires && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="periodicity">Periodicity (days)</Label>
                      <Input
                        id="periodicity"
                        type="number"
                        min={1}
                        value={plan.options.verificationPeriod || 90}
                        onChange={(e) =>
                          handleOptionChange(
                            "verificationPeriod",
                            parseInt(e.target.value) || 90
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-repetitions">
                        Maximum number of repetitions
                      </Label>
                      <Input
                        id="max-repetitions"
                        type="number"
                        min={1}
                        value={plan.options.maxRepetitions || 4}
                        onChange={(e) =>
                          handleOptionChange(
                            "maxRepetitions",
                            parseInt(e.target.value) || 4
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questionnaires">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Questionnaires</CardTitle>
                  <CardDescription>
                    Select the questionnaires to include in the plan
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addQuestionnaire}
                  disabled={
                    plan.options.singleQuestionnaire &&
                    plan.questionnaires.length > 0
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Questionnaire
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {plan.questionnaires.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-md">
                  <p className="text-muted-foreground">
                    No questionnaire added
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={addQuestionnaire}
                    disabled={
                      plan.options.singleQuestionnaire &&
                      plan.questionnaires.length > 0
                    }
                  >
                    Add Questionnaire
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {plan.questionnaires.map((questionnaire, index) => (
                    <Card key={index}>
                      <CardHeader className="py-2">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">
                            {getQuestionnaireTitle(questionnaire.id)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestionnaire(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`questionnaire-${index}`}>
                              Questionnaire
                            </Label>
                            <Select
                              value={questionnaire.id}
                              onValueChange={(value) =>
                                updateQuestionnaire(index, "id", value)
                              }
                            >
                              <SelectTrigger id={`questionnaire-${index}`}>
                                <SelectValue placeholder="Select questionnaire" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableQuestionnaires.map((q) => (
                                  <SelectItem key={q.id} value={q.id}>
                                    {q.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {plan.options.progressQuestionnaires && (
                            <div>
                              <Label htmlFor={`sequence-${index}`}>
                                Sequence
                              </Label>
                              <Input
                                id={`sequence-${index}`}
                                type="number"
                                min={1}
                                value={questionnaire.sequence || index + 1}
                                onChange={(e) =>
                                  updateQuestionnaire(
                                    index,
                                    "sequence",
                                    parseInt(e.target.value) || index + 1
                                  )
                                }
                              />
                            </div>
                          )}

                          {(plan.options.periodicQuestionnaires ||
                            plan.options.verificationAfter) && (
                            <>
                              <div>
                                <Label htmlFor={`periodicity-${index}`}>
                                  Periodicity (days)
                                </Label>
                                <Input
                                  id={`periodicity-${index}`}
                                  type="number"
                                  min={1}
                                  value={questionnaire.periodicity || 90}
                                  onChange={(e) =>
                                    updateQuestionnaire(
                                      index,
                                      "periodicity",
                                      parseInt(e.target.value) || 90
                                    )
                                  }
                                />
                              </div>

                              <div>
                                <Label htmlFor={`repetitions-${index}`}>
                                  Repetitions
                                </Label>
                                <Input
                                  id={`repetitions-${index}`}
                                  type="number"
                                  min={1}
                                  value={questionnaire.repetitions || 1}
                                  onChange={(e) =>
                                    updateQuestionnaire(
                                      index,
                                      "repetitions",
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  disabled={plan.options.verificationAfter}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Configuration</CardTitle>
              <CardDescription>
                Configure notifications for this plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email-notifications"
                    checked={plan.options.emailNotifications || false}
                    onCheckedChange={(checked) =>
                      handleOptionChange("emailNotifications", checked)
                    }
                  />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="sms-notifications"
                    checked={plan.options.smsNotifications || false}
                    onCheckedChange={(checked) =>
                      handleOptionChange("smsNotifications", checked)
                    }
                  />
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="whatsapp-notifications"
                    checked={plan.options.whatsappNotifications || false}
                    onCheckedChange={(checked) =>
                      handleOptionChange("whatsappNotifications", checked)
                    }
                  />
                  <Label htmlFor="whatsapp-notifications">
                    WhatsApp Notifications
                  </Label>
                </div>
              </div>

              {(plan.options.emailNotifications ||
                plan.options.smsNotifications ||
                plan.options.whatsappNotifications) && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Reminder configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reminder-days">
                        Days before expiry
                      </Label>
                      <Input
                        id="reminder-days"
                        type="number"
                        min={1}
                        value={plan.options.reminderDaysBefore || 7}
                        onChange={(e) =>
                          handleOptionChange(
                            "reminderDaysBefore",
                            parseInt(e.target.value) || 7
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="reminder-count">
                        Number of reminders
                      </Label>
                      <Input
                        id="reminder-count"
                        type="number"
                        min={1}
                        max={10}
                        value={plan.options.reminderCount || 1}
                        onChange={(e) =>
                          handleOptionChange(
                            "reminderCount",
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reminder-frequency">
                      Reminder frequency
                    </Label>
                    <Select
                      value={plan.options.reminderFrequency || "once"}
                      onValueChange={(value) =>
                        handleOptionChange("reminderFrequency", value)
                      }
                    >
                      <SelectTrigger id="reminder-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Only once</SelectItem>
                        <SelectItem value="daily">Every day</SelectItem>
                        <SelectItem value="weekly">Every week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reminder-message">
                      Reminder message
                    </Label>
                    <Textarea
                      id="reminder-message"
                      value={
                        plan.options.reminderMessage ||
                        "It's time to complete your questionnaire! Log in to continue your journey."
                      }
                      onChange={(e) =>
                        handleOptionChange("reminderMessage", e.target.value)
                      }
                      placeholder="Enter the reminder message"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanEditor;

