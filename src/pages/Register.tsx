import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { checkEmailExists } from "@/services/ApiService";
import { API_BASE_URL } from "@/config/api";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "Il nome deve contenere almeno 2 caratteri" }),
    lastName: z
      .string()
      .min(2, { message: "Il cognome deve contenere almeno 2 caratteri" }),
    email: z.string().email({ message: "Inserisci un indirizzo email valido" }),
    phone: z.string().optional(),
    password: z
      .string()
      .min(6, { message: "La password deve contenere almeno 6 caratteri" }),
    confirmPassword: z
      .string()
      .min(6, { message: "La password deve contenere almeno 6 caratteri" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non corrispondono",
    path: ["confirmPassword"],
  });

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setEmailError("");

      // Check if email exists
      try {
        const emailCheck = await checkEmailExists(values.email);
        if (emailCheck.exists) {
          setEmailError(
            "Questa email è già registrata. Prova ad accedere o usa un'altra email."
          );
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("❌ Error checking email:", error);
      }

      // Prepare user data for registration
      const tempUserData = {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
      };

      // ✅ Fetch all plans and find the first free plan
      console.log("🔄 Fetching free plan...");
      const allPlans = await fetch(`${API_BASE_URL}/plans`).then((res) =>
        res.json()
      );
      let freePlan = null;

      if (allPlans.success && Array.isArray(allPlans.data)) {
        freePlan = allPlans.data.find(
          (plan) =>
            plan.is_free ||
            plan.price === 0 ||
            (plan.name && plan.name.toLowerCase().includes("free")) ||
            (plan.name && plan.name.toLowerCase().includes("gratuito"))
        );
      }

      if (!freePlan) {
        console.warn(
          "⚠️ Nessun piano gratuito trovato. Verrà utilizzato il piano predefinito dal backend."
        );
      } else {
        console.log("✅ Free plan found:", freePlan);
      }

      const registrationPayload: Record<string, any> = {
        ...tempUserData,
      };

      if (freePlan?.id) {
        registrationPayload.planId = freePlan.id;
      }

      // ✅ Register user with free plan immediately (or fallback on backend default)
      const registerRes = await fetch(
        `${API_BASE_URL}/auth/register-with-plan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registrationPayload),
        }
      ).then((res) => res.json());

      if (!registerRes.success) {
        toast({
          variant: "destructive",
          title: "Errore di registrazione",
          description:
            registerRes.message || "Errore durante la registrazione. Riprova.",
        });
        setIsLoading(false);
        return;
      }

      console.log("✅ User registered successfully:", registerRes);

      // Save user info
      localStorage.setItem("registered_user", JSON.stringify(registerRes.user));
      const storedPlan =
        freePlan ||
        ({
          id: null,
          name: "Piano Gratuito",
          price: 0,
          is_free: true,
        } as const);
      localStorage.setItem("registered_plan", JSON.stringify(storedPlan));

      toast({
        title: "Registrazione completata!",
        description:
          "Il tuo account gratuito è stato creato. Ora puoi selezionare un piano premium.",
      });

      // ✅ Auto-login the user
      try {
        await login(values.email, values.password);

        // ✅ Redirect to dashboard so they can start using the app
        navigate("/dashboard");
      } catch (loginError) {
        console.error("❌ Auto-login failed:", loginError);

        toast({
          title: "Account creato!",
          description: "Accedi con le tue credenziali per continuare.",
        });

        navigate("/login");
      }
    } catch (error) {
      console.error("Errore durante la registrazione:", error);
      toast({
        variant: "destructive",
        title: "Errore di registrazione",
        description:
          error.message ||
          "Si è verificato un errore durante la registrazione. Riprova.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Social login handler - redirects to OAuth
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/facebook`;
  };
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-grow flex items-center justify-center p-4 bg-[#7c6cc4]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Crea il tuo account</CardTitle>
            <CardDescription>
              Crea il tuo account gratuito. Potrai scegliere un piano premium in
              seguito.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Social Login Buttons */}
            <div className="space-y-2 mb-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                type="button"
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continua con Google
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleFacebookLogin}
                type="button"
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
                Continua con Facebook
              </Button>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  O continua con
                </span>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Mario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome</FormLabel>
                        <FormControl>
                          <Input placeholder="Rossi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="nome@esempio.it"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {emailError && (
                        <p className="text-sm text-red-600 mt-1">
                          {emailError}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Telefono{" "}
                        <span className="text-xs text-gray-500">
                          (opzionale)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+39 123 456 7890"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Utile per notifiche SMS o WhatsApp se previste dal tuo
                        piano.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conferma password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 h-full px-3"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrazione in corso...
                    </>
                  ) : (
                    <span>Crea account gratuito</span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 items-center">
            <p className="text-sm text-gray-500">
              Hai già un account?{" "}
              <a
                href="/login"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-700)]"
              >
                Accedi
              </a>
            </p>
            <p className="text-xs text-gray-400 text-center">
              Registrandoti accetti i nostri{" "}
              <a
                href="/terms-of-service"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-700)]"
              >
                Termini di Servizio
              </a>{" "}
              e la{" "}
              <a
                href="/privacy-policy"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-700)]"
              >
                Privacy Policy
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
