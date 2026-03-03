/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ImageUploader from "@/components/admin/ImageUploader";
import LocalImageUploader from "@/components/admin/LocalImageUploader";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { fetchAppSettings, saveAppSettings } from "@/services/settingsService";
import { ColorPicker } from "@/components/admin/ColorPicker";
import { Loader2 } from "lucide-react";

// Define schema for form validation
const generalSettingsSchema = z.object({
  siteName: z.string().min(2, { message: "Site name is required" }),
  siteDescription: z.string().optional(),
  contactEmail: z
    .string()
    .email({ message: "Please enter a valid email address" }),
  enableRegistration: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(true),
  maxStoragePerUser: z
    .number()
    .min(1, { message: "Please specify a value greater than 0" }),
  primaryColor: z.string().default("#9b87f5"),
  secondaryColor: z.string().default("#7E69AB"),
  accentColor: z.string().default("#E5DEFF"),
  fontFamily: z.string().default("poppins"),
  fontSize: z.string().default("medium"),
  buttonStyle: z.string().default("rounded"),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  siteUrl: z.string().optional(),
  // Notification settings
  sendWelcomeEmail: z.boolean().default(true),
  sendCompletionEmail: z.boolean().default(true),
  sendReportEmail: z.boolean().default(true),
  adminNotifyNewUser: z.boolean().default(true),
  // Payment settings
  enablePayments: z.boolean().default(true),
  currency: z.string().default("EUR"),
  vatPercentage: z.number().min(0).max(100).default(22),
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

const Settings = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("general");

  // Initialize form with react-hook-form
  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "SimplyAI",
      siteDescription: "AI analysis platform",
      contactEmail: "info@simplyai.it",
      enableRegistration: true,
      requireEmailVerification: true,
      maxStoragePerUser: 100,
      primaryColor: "#9b87f5",
      secondaryColor: "#7E69AB",
      accentColor: "#E5DEFF",
      fontFamily: "poppins",
      fontSize: "medium",
      buttonStyle: "rounded",
      logo: "",
      favicon: "",
      siteUrl: "",
      // Notification settings
      sendWelcomeEmail: true,
      sendCompletionEmail: true,
      sendReportEmail: true,
      adminNotifyNewUser: true,
      // Payment settings
      enablePayments: true,
      currency: "EUR",
      vatPercentage: 22,
      stripePublicKey: "",
      stripeSecretKey: "",
    },
  });

  // Fetch settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchAppSettings();
        if (data) {
          form.reset({
            siteName:
              data.site_name && data.site_name.length > 1
                ? data.site_name
                : "SimplyAI",
            siteDescription: data.site_description ?? "",
            contactEmail:
              data.contact_email && data.contact_email.includes("@")
                ? data.contact_email
                : "info@simplyai.it",
            enableRegistration:
              typeof data.enable_registration === "boolean"
                ? data.enable_registration
                : Boolean(data.enable_registration),
            requireEmailVerification:
              typeof data.require_email_verification === "boolean"
                ? data.require_email_verification
                : Boolean(data.require_email_verification),
            maxStoragePerUser: (() => {
              const storage = parseFloat(data.max_storage_per_user);
              return !isNaN(storage) && storage > 0 ? storage : 100;
            })(),
            primaryColor: data.primary_color || "#9b87f5",
            secondaryColor: data.secondary_color || "#7E69AB",
            accentColor: data.accent_color || "#E5DEFF",
            fontFamily: data.font_family || "poppins",
            fontSize: data.font_size || "medium",
            buttonStyle: data.button_style || "rounded",
            logo: data.logo || "",
            favicon: data.favicon || "",
            siteUrl: data.site_url || "",
            // Notification settings
            sendWelcomeEmail:
              typeof data.send_welcome_email === "boolean"
                ? data.send_welcome_email
                : Boolean(data.send_welcome_email),
            sendCompletionEmail:
              typeof data.send_completion_email === "boolean"
                ? data.send_completion_email
                : Boolean(data.send_completion_email),
            sendReportEmail:
              typeof data.send_email_in_report === "boolean"
                ? data.send_email_in_report
                : Boolean(data.send_email_in_report),
            adminNotifyNewUser:
              typeof data.send_admin_notification === "boolean"
                ? data.send_admin_notification
                : Boolean(data.send_admin_notification),
            // Payment settings
            enablePayments:
              typeof data.enable_payments === "boolean"
                ? data.enable_payments
                : Boolean(data.enable_payments),
            currency: data.currency || "EUR",
            vatPercentage: (() => {
              const vat = parseFloat(data.vat_percentage);
              return !isNaN(vat) ? vat : 22;
            })(),
            stripePublicKey: data.stripe_public_key || "",
            stripeSecretKey: data.stripe_secret_key || "",
          });
          if (data.logo) setLogoUrl(data.logo);
          if (data.favicon) setFaviconUrl(data.favicon);
        }
      } catch (error) {
        console.error("Error fetching app settings:", error);
        toast({
          title: "⚠ Loading error",
          description: "Unable to load settings",
          variant: "destructive",
        });
      }
    };
    loadSettings();
  }, [form]);

  const handleLogoUpload = async (
    imageUrl: string,
    meta?: { cacheKey?: number }
  ) => {
    try {
      // Update form and local state first
      form.setValue("logo", imageUrl, { shouldDirty: true });
      setLogoUrl(imageUrl);

      // Use setTimeout to defer the save operation
      setTimeout(async () => {
        try {
          const currentValues = form.getValues();
          const result = await saveAppSettings({
            ...currentValues,
            logo: imageUrl,
          });

        if (result.success) {
            // Dispatch custom event to notify Navbar about logo update
            window.dispatchEvent(
              new CustomEvent("logoUpdated", {
                detail: { logoUrl: imageUrl, cacheKey: meta?.cacheKey },
              })
            );
            console.log("Logo updated, dispatched logoUpdated event");

            toast({
              title: "Logo updated",
              description: "The logo has been updated successfully",
            });
          } else {
            throw new Error("Failed to save logo");
          }
        } catch (error) {
          console.error("Error saving logo:", error);
          toast({
            title: "Error",
            description: "Error updating the logo",
            variant: "destructive",
          });
        }
      }, 0);
    } catch (error) {
      console.error("Error handling logo upload:", error);
    }
  };

  const handleFaviconUpload = async (
    imageUrl: string,
    meta?: { cacheKey?: number }
  ) => {
    try {
      // Update form and local state first
      form.setValue("favicon", imageUrl, { shouldDirty: true });
      setFaviconUrl(imageUrl);

      // Use setTimeout to defer the save operation
      setTimeout(async () => {
        try {
          const currentValues = form.getValues();
          const result = await saveAppSettings({
            ...currentValues,
            favicon: imageUrl,
          });

          if (result.success) {
            toast({
              title: "Favicon updated",
              description: "The favicon has been updated successfully",
            });

            window.dispatchEvent(
              new CustomEvent("faviconUpdated", {
                detail: { faviconUrl: imageUrl, cacheKey: meta?.cacheKey },
              })
            );
          } else {
            throw new Error("Failed to save favicon");
          }
        } catch (error) {
          console.error("Error saving favicon:", error);
          toast({
            title: "Error",
            description: "Error updating the favicon",
            variant: "destructive",
          });
        }
      }, 0);
    } catch (error) {
      console.error("Error handling favicon upload:", error);
    }
  };
  // Save settings
  const onSubmit = async (data: GeneralSettingsFormValues) => {
    setSaving(true);
    try {
      console.log("Saving settings:", data);
      const result = await saveAppSettings(data);
      if (!result.success) {
        throw result.error;
      }

      toast({
        title: "✓ Settings saved",
        description: "Your preferences have been updated successfully",
      });

      // Dispatch font settings update event (debounced to prevent rapid firing)
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("fontSettingsUpdated", {
            detail: {
              fontSettings: {
                font_family: data.fontFamily,
                font_size: data.fontSize,
                button_style: data.buttonStyle,
              },
            },
          })
        );
        console.log(
          "Font settings updated, dispatched fontSettingsUpdated event"
        );
      }, 100);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "⚠ Save error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again in a moment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage the platform system settings
        </p>
      </div>

      <Form {...form}>
        <Tabs
          key={currentTab}
          defaultValue="general"
          value={currentTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-1 md:grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure the basic settings of the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  id="generalForm"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="siteName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Site name" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="siteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://www.yoursite.com"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="siteDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Site description"
                              {...field}
                              className="min-h-[100px]"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contact@example.com"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>Site Logo</FormLabel>
                      <div className="mt-2">
                        {logoUrl && (
                          <div className="mb-4">
                            <img
                              src={logoUrl}
                              alt="Site logo"
                              className="h-16 object-contain"
                            />
                          </div>
                        )}
                        <LocalImageUploader
                          onImageUpload={handleLogoUpload}
                          label="Logo"
                          buttonText="Upload site logo"
                          uploadType="logo"
                        />
                      </div>
                    </div>

                    <div>
                      <FormLabel>Favicon</FormLabel>
                      <div className="mt-2">
                        {faviconUrl && (
                          <div className="mb-4">
                            <img
                              src={faviconUrl}
                              alt="Site favicon"
                              className="h-16 w-16 object-contain"
                            />
                          </div>
                        )}
                        <LocalImageUploader
                          onImageUpload={handleFaviconUpload}
                          label="Favicon"
                          buttonText="Upload favicon (PNG/JPG recommended)"
                          accept="image/png,image/jpeg,image/svg+xml"
                          uploadType="favicon"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: Use a square image for best results. PNG/JPG recommended.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="enableRegistration"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Enable Registration</FormLabel>
                              <FormDescription>
                                Allow users to register on the site
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requireEmailVerification"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Require Email Verification</FormLabel>
                              <FormDescription>
                                Require users to verify their email before logging in
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="maxStoragePerUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Storage per User (MB)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Settings"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance and Design</CardTitle>
                <CardDescription>
                  Customize the visual appearance of the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  id="appearanceForm"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Colors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <ColorPicker
                                  color={field.value}
                                  onChange={(val) => {
                                    field.onChange(val);
                                    form.setValue("primaryColor", val);
                                  }}
                                  type="primary"
                                />
                                <Input
                                  {...field}
                                  value={field.value}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    form.setValue(
                                      "primaryColor",
                                      e.target.value
                                    );
                                  }}
                                />
                              </div>
                            </FormControl>
                            <div
                              className="h-8 w-full rounded-md mt-2"
                              style={{ backgroundColor: field.value }}
                            ></div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Color</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <ColorPicker
                                  color={field.value}
                                  onChange={(val) => {
                                    field.onChange(val);
                                    form.setValue("secondaryColor", val);
                                  }}
                                  type="secondary"
                                />
                                <Input
                                  {...field}
                                  value={field.value}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    form.setValue(
                                      "secondaryColor",
                                      e.target.value
                                    );
                                  }}
                                />
                              </div>
                            </FormControl>
                            <div
                              className="h-8 w-full rounded-md mt-2"
                              style={{ backgroundColor: field.value }}
                            ></div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accentColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accent Color</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <ColorPicker
                                  color={field.value}
                                  onChange={(val) => {
                                    field.onChange(val);
                                    form.setValue("accentColor", val);
                                  }}
                                  type="accent"
                                />
                                <Input
                                  {...field}
                                  value={field.value}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    form.setValue(
                                      "accentColor",
                                      e.target.value
                                    );
                                  }}
                                />
                              </div>
                            </FormControl>
                            <div
                              className="h-8 w-full rounded-md mt-2"
                              style={{ backgroundColor: field.value }}
                            ></div>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Separator />
                    <h3 className="text-lg font-medium">Typography</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="fontFamily"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Family</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              {...({ modal: false } as any)} // Type assertion workaround
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="poppins">Poppins</SelectItem>
                                <SelectItem value="roboto">Roboto</SelectItem>
                                <SelectItem value="inter">Inter</SelectItem>
                                <SelectItem value="lato">Lato</SelectItem>
                                <SelectItem value="montserrat">
                                  Montserrat
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The main font used in the interface
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fontSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Size</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              {...({ modal: false } as any)} // Type assertion workaround
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Font size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Separator />
                    <h3 className="text-lg font-medium">UI Style</h3>
                    <FormField
                      control={form.control}
                      name="buttonStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Button Style</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            {...({ modal: false } as any)} // Type assertion workaround
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="rounded">
                                Rounded
                              </SelectItem>
                              <SelectItem value="pill">Pill</SelectItem>
                              <SelectItem value="square">Square</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The shape of buttons in the application
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          const values = form.getValues();

                          // changing the colors
                          const root = document.documentElement;

                          root.style.setProperty(
                            "--color-primary",
                            values?.primaryColor
                          );
                          root.style.setProperty(
                            "--color-secondary",
                            values?.secondaryColor
                          );
                          root.style.setProperty(
                            "--color-accent",
                            values?.accentColor
                          );

                          const result = await saveAppSettings(values);
                          if (!result.success) throw result.error;
                          toast({
                            title: "Test: Database Updated",
                            description:
                              "Le impostazioni di Aspetto sono state aggiornate tramite il Test Button.",
                          });

                          // Dispatch font settings update event (debounced)
                          setTimeout(() => {
                            window.dispatchEvent(
                              new CustomEvent("fontSettingsUpdated", {
                                detail: {
                                  fontSettings: {
                                    font_family: values.fontFamily,
                                    font_size: values.fontSize,
                                    button_style: values.buttonStyle,
                                  },
                                },
                              })
                            );
                            console.log(
                              "Font settings updated from appearance form"
                            );
                          }, 100);
                        } catch (error) {
                          toast({
                            title: "Error",
                            description:
                              "Error saving via Test Button",
                            variant: "destructive",
                          });
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Settings"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure payment and billing options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="enablePayments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Payments</FormLabel>
                        <FormDescription>
                          Activate the payment system on the site
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        {...({ modal: false } as any)} // Type assertion workaround
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                          <SelectItem value="AFN">
                            AFN - Afghan Afghani*
                          </SelectItem>
                          <SelectItem value="ALL">
                            ALL - Albanian Lek
                          </SelectItem>
                          <SelectItem value="AMD">
                            AMD - Armenian Dram
                          </SelectItem>
                          <SelectItem value="ANG">
                            ANG - Netherlands Antillean Guilder
                          </SelectItem>
                          <SelectItem value="AOA">
                            AOA - Angolan Kwanza*
                          </SelectItem>
                          <SelectItem value="ARS">
                            ARS - Argentine Peso*
                          </SelectItem>
                          <SelectItem value="AUD">
                            AUD - Australian Dollar
                          </SelectItem>
                          <SelectItem value="AWG">
                            AWG - Aruban Florin
                          </SelectItem>
                          <SelectItem value="AZN">
                            AZN - Azerbaijani Manat
                          </SelectItem>
                          <SelectItem value="BAM">
                            BAM - Bosnia & Herzegovina Convertible Mark
                          </SelectItem>
                          <SelectItem value="BBD">
                            BBD - Barbadian Dollar
                          </SelectItem>
                          <SelectItem value="BDT">
                            BDT - Bangladeshi Taka
                          </SelectItem>
                          <SelectItem value="BGN">
                            BGN - Bulgarian Lev
                          </SelectItem>
                          <SelectItem value="BIF">
                            BIF - Burundian Franc
                          </SelectItem>
                          <SelectItem value="BMD">
                            BMD - Bermudian Dollar
                          </SelectItem>
                          <SelectItem value="BND">
                            BND - Brunei Dollar
                          </SelectItem>
                          <SelectItem value="BOB">
                            BOB - Bolivian Boliviano*
                          </SelectItem>
                          <SelectItem value="BRL">
                            BRL - Brazilian Real*
                          </SelectItem>
                          <SelectItem value="BSD">
                            BSD - Bahamian Dollar
                          </SelectItem>
                          <SelectItem value="BWP">
                            BWP - Botswana Pula
                          </SelectItem>
                          <SelectItem value="BYN">
                            BYN - Belarusian Ruble
                          </SelectItem>
                          <SelectItem value="BZD">
                            BZD - Belize Dollar
                          </SelectItem>
                          <SelectItem value="CAD">
                            CAD - Canadian Dollar
                          </SelectItem>
                          <SelectItem value="CDF">
                            CDF - Congolese Franc
                          </SelectItem>
                          <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                          <SelectItem value="CLP">
                            CLP - Chilean Peso*
                          </SelectItem>
                          <SelectItem value="CNY">
                            CNY - Chinese Yuan
                          </SelectItem>
                          <SelectItem value="COP">
                            COP - Colombian Peso*
                          </SelectItem>
                          <SelectItem value="CRC">
                            CRC - Costa Rican Colón*
                          </SelectItem>
                          <SelectItem value="CVE">
                            CVE - Cape Verdean Escudo*
                          </SelectItem>
                          <SelectItem value="CZK">
                            CZK - Czech Koruna
                          </SelectItem>
                          <SelectItem value="DJF">
                            DJF - Djiboutian Franc*
                          </SelectItem>
                          <SelectItem value="DKK">
                            DKK - Danish Krone
                          </SelectItem>
                          <SelectItem value="DOP">
                            DOP - Dominican Peso
                          </SelectItem>
                          <SelectItem value="DZD">
                            DZD - Algerian Dinar
                          </SelectItem>
                          <SelectItem value="EGP">
                            EGP - Egyptian Pound
                          </SelectItem>
                          <SelectItem value="ETB">
                            ETB - Ethiopian Birr
                          </SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="FJD">
                            FJD - Fijian Dollar
                          </SelectItem>
                          <SelectItem value="FKP">
                            FKP - Falkland Islands Pound*
                          </SelectItem>
                          <SelectItem value="GBP">
                            GBP - British Pound
                          </SelectItem>
                          <SelectItem value="GEL">
                            GEL - Georgian Lari
                          </SelectItem>
                          <SelectItem value="GIP">
                            GIP - Gibraltar Pound
                          </SelectItem>
                          <SelectItem value="GMD">
                            GMD - Gambian Dalasi
                          </SelectItem>
                          <SelectItem value="GNF">
                            GNF - Guinean Franc*
                          </SelectItem>
                          <SelectItem value="GTQ">
                            GTQ - Guatemalan Quetzal*
                          </SelectItem>
                          <SelectItem value="GYD">
                            GYD - Guyanese Dollar
                          </SelectItem>
                          <SelectItem value="HKD">
                            HKD - Hong Kong Dollar
                          </SelectItem>
                          <SelectItem value="HNL">
                            HNL - Honduran Lempira*
                          </SelectItem>
                          <SelectItem value="HTG">
                            HTG - Haitian Gourde
                          </SelectItem>
                          <SelectItem value="HUF">
                            HUF - Hungarian Forint
                          </SelectItem>
                          <SelectItem value="IDR">
                            IDR - Indonesian Rupiah
                          </SelectItem>
                          <SelectItem value="ILS">
                            ILS - Israeli New Shekel
                          </SelectItem>
                          <SelectItem value="INR">
                            INR - Indian Rupee
                          </SelectItem>
                          <SelectItem value="ISK">
                            ISK - Icelandic Króna
                          </SelectItem>
                          <SelectItem value="JMD">
                            JMD - Jamaican Dollar
                          </SelectItem>
                          <SelectItem value="JPY">
                            JPY - Japanese Yen
                          </SelectItem>
                          <SelectItem value="KES">
                            KES - Kenyan Shilling
                          </SelectItem>
                          <SelectItem value="KGS">
                            KGS - Kyrgyzstani Som
                          </SelectItem>
                          <SelectItem value="KHR">
                            KHR - Cambodian Riel
                          </SelectItem>
                          <SelectItem value="KMF">
                            KMF - Comorian Franc
                          </SelectItem>
                          <SelectItem value="KRW">
                            KRW - South Korean Won
                          </SelectItem>
                          <SelectItem value="KYD">
                            KYD - Cayman Islands Dollar
                          </SelectItem>
                          <SelectItem value="KZT">
                            KZT - Kazakhstani Tenge
                          </SelectItem>
                          <SelectItem value="LAK">LAK - Lao Kip*</SelectItem>
                          <SelectItem value="LBP">
                            LBP - Lebanese Pound
                          </SelectItem>
                          <SelectItem value="LKR">
                            LKR - Sri Lankan Rupee
                          </SelectItem>
                          <SelectItem value="LRD">
                            LRD - Liberian Dollar
                          </SelectItem>
                          <SelectItem value="LSL">
                            LSL - Lesotho Loti
                          </SelectItem>
                          <SelectItem value="MAD">
                            MAD - Moroccan Dirham
                          </SelectItem>
                          <SelectItem value="MDL">
                            MDL - Moldovan Leu
                          </SelectItem>
                          <SelectItem value="MGA">
                            MGA - Malagasy Ariary
                          </SelectItem>
                          <SelectItem value="MKD">
                            MKD - Macedonian Denar
                          </SelectItem>
                          <SelectItem value="MMK">
                            MMK - Myanmar Kyat
                          </SelectItem>
                          <SelectItem value="MNT">
                            MNT - Mongolian Tögrög
                          </SelectItem>
                          <SelectItem value="MOP">
                            MOP - Macanese Pataca
                          </SelectItem>
                          <SelectItem value="MUR">
                            MUR - Mauritian Rupee*
                          </SelectItem>
                          <SelectItem value="MVR">
                            MVR - Maldivian Rufiyaa
                          </SelectItem>
                          <SelectItem value="MWK">
                            MWK - Malawian Kwacha
                          </SelectItem>
                          <SelectItem value="MXN">
                            MXN - Mexican Peso
                          </SelectItem>
                          <SelectItem value="MYR">
                            MYR - Malaysian Ringgit
                          </SelectItem>
                          <SelectItem value="MZN">
                            MZN - Mozambican Metical
                          </SelectItem>
                          <SelectItem value="NAD">
                            NAD - Namibian Dollar
                          </SelectItem>
                          <SelectItem value="NGN">
                            NGN - Nigerian Naira
                          </SelectItem>
                          <SelectItem value="NIO">
                            NIO - Nicaraguan Córdoba*
                          </SelectItem>
                          <SelectItem value="NOK">
                            NOK - Norwegian Krone
                          </SelectItem>
                          <SelectItem value="NPR">
                            NPR - Nepalese Rupee
                          </SelectItem>
                          <SelectItem value="NZD">
                            NZD - New Zealand Dollar
                          </SelectItem>
                          <SelectItem value="PAB">
                            PAB - Panamanian Balboa*
                          </SelectItem>
                          <SelectItem value="PEN">
                            PEN - Peruvian Sol*
                          </SelectItem>
                          <SelectItem value="PGK">
                            PGK - Papua New Guinean Kina
                          </SelectItem>
                          <SelectItem value="PHP">
                            PHP - Philippine Peso
                          </SelectItem>
                          <SelectItem value="PKR">
                            PKR - Pakistani Rupee
                          </SelectItem>
                          <SelectItem value="PLN">
                            PLN - Polish Złoty
                          </SelectItem>
                          <SelectItem value="PYG">
                            PYG - Paraguayan Guaraní*
                          </SelectItem>
                          <SelectItem value="QAR">
                            QAR - Qatari Riyal
                          </SelectItem>
                          <SelectItem value="RON">
                            RON - Romanian Leu
                          </SelectItem>
                          <SelectItem value="RSD">
                            RSD - Serbian Dinar
                          </SelectItem>
                          <SelectItem value="RUB">
                            RUB - Russian Ruble
                          </SelectItem>
                          <SelectItem value="RWF">
                            RWF - Rwandan Franc
                          </SelectItem>
                          <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                          <SelectItem value="SBD">
                            SBD - Solomon Islands Dollar
                          </SelectItem>
                          <SelectItem value="SCR">
                            SCR - Seychellois Rupee
                          </SelectItem>
                          <SelectItem value="SEK">
                            SEK - Swedish Krona
                          </SelectItem>
                          <SelectItem value="SGD">
                            SGD - Singapore Dollar
                          </SelectItem>
                          <SelectItem value="SHP">
                            SHP - Saint Helena Pound*
                          </SelectItem>
                          <SelectItem value="SLE">
                            SLE - Sierra Leonean Leone
                          </SelectItem>
                          <SelectItem value="SOS">
                            SOS - Somali Shilling
                          </SelectItem>
                          <SelectItem value="SRD">
                            SRD - Surinamese Dollar*
                          </SelectItem>
                          <SelectItem value="STD">
                            STD - São Tomé and Príncipe Dobra*
                          </SelectItem>
                          <SelectItem value="SZL">
                            SZL - Swazi Lilangeni
                          </SelectItem>
                          <SelectItem value="THB">THB - Thai Baht</SelectItem>
                          <SelectItem value="TJS">
                            TJS - Tajikistani Somoni
                          </SelectItem>
                          <SelectItem value="TOP">
                            TOP - Tongan Paʻanga
                          </SelectItem>
                          <SelectItem value="TRY">
                            TRY - Turkish Lira
                          </SelectItem>
                          <SelectItem value="TTD">
                            TTD - Trinidad and Tobago Dollar
                          </SelectItem>
                          <SelectItem value="TWD">
                            TWD - New Taiwan Dollar
                          </SelectItem>
                          <SelectItem value="TZS">
                            TZS - Tanzanian Shilling
                          </SelectItem>
                          <SelectItem value="UAH">
                            UAH - Ukrainian Hryvnia
                          </SelectItem>
                          <SelectItem value="UGX">
                            UGX - Ugandan Shilling
                          </SelectItem>
                          <SelectItem value="UYU">
                            UYU - Uruguayan Peso*
                          </SelectItem>
                          <SelectItem value="UZS">
                            UZS - Uzbekistani Soʻm
                          </SelectItem>
                          <SelectItem value="VND">
                            VND - Vietnamese Đồng
                          </SelectItem>
                          <SelectItem value="VUV">
                            VUV - Vanuatu Vatu
                          </SelectItem>
                          <SelectItem value="WST">WST - Samoan Tālā</SelectItem>
                          <SelectItem value="XAF">
                            XAF - Central African CFA Franc
                          </SelectItem>
                          <SelectItem value="XCD">
                            XCD - East Caribbean Dollar
                          </SelectItem>
                          <SelectItem value="XCG">
                            XCG - Gold (test currency)
                          </SelectItem>
                          <SelectItem value="XOF">
                            XOF - West African CFA franc*
                          </SelectItem>
                          <SelectItem value="XPF">XPF - CFP Franc*</SelectItem>
                          <SelectItem value="YER">YER - Yemeni Rial</SelectItem>
                          <SelectItem value="ZAR">
                            ZAR - South African Rand
                          </SelectItem>
                          <SelectItem value="ZMW">
                            ZMW - Zambian Kwacha
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The currency used for Stripe payments
                        <br />
                        <span style={{ color: "#b91c1c", fontSize: "0.95em" }}>
                          Currencies marked with * are not supported by American Express.
                        </span>
                        <br />
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vatPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        VAT percentage to show on invoices (example: 22.00)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="stripePublicKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stripe Public Key</FormLabel>
                      <FormControl>
                        <Input placeholder="pk_test_..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Stripe public key for the frontend (starts with pk_)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stripeSecretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stripe Secret Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="sk_test_..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Stripe secret key for the backend (starts with sk_). Never share this key.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Configure email notifications for users and administrators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                    name="sendWelcomeEmail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel htmlFor="welcome-email">
                            Welcome Email
                          </FormLabel>
                          <FormDescription>
                            Send a welcome email to new users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        </FormItem>
                      )}
                    />

                      <FormField
                        control={form.control}
                        name="adminNotifyNewUser"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel htmlFor="admin-notify">
                                Admin Notifications
                              </FormLabel>
                              <FormDescription>
                                Notify administrators when a new user registers
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sendCompletionEmail"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel htmlFor="completion-email">
                            Completion Email
                          </FormLabel>
                          <FormDescription>
                            Send an email when a questionnaire is completed
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sendReportEmail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel htmlFor="report-email">
                            Report Email
                          </FormLabel>
                          <FormDescription>
                            Send an email when a new report is available
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        </FormItem>
                      )}
                    />

                  <Separator />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const values = form.getValues();
                      const result = await saveAppSettings(values);
                      if (!result.success) throw result.error;
                      toast({
                        title: "Settings saved",
                        description:
                          "Notification settings have been updated successfully.",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description:
                          "Error saving notification settings",
                        variant: "destructive",
                      });
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </Form>
    </div>
  );
};

export default Settings;

