import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
      .min(2, { message: "First name must be at least 2 characters" }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone: z.string().optional(),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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

      const emailCheck = await checkEmailExists(values.email);
      if (emailCheck.exists) {
        setEmailError(
          "This email is already registered. Log in or use a different email."
        );
        setIsLoading(false);
        return;
      }

      const allPlans = await fetch(`${API_BASE_URL}/plans`).then((res) =>
        res.json()
      );
      const freePlan =
        allPlans.success && Array.isArray(allPlans.data)
          ? allPlans.data.find(
              (plan: { is_free?: boolean; price?: number; name?: string }) =>
                plan.is_free ||
                plan.price === 0 ||
                (plan.name && plan.name.toLowerCase().includes("free")) ||
                (plan.name && plan.name.toLowerCase().includes("gratuito"))
            )
          : null;

      const registrationPayload: Record<string, unknown> = {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
      };

      if (freePlan?.id) {
        registrationPayload.planId = freePlan.id;
      }

      const registerRes = await fetch(`${API_BASE_URL}/auth/register-with-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationPayload),
      }).then((res) => res.json());

      if (!registerRes.success) {
        toast({
          variant: "destructive",
          title: "Registration error",
          description:
            registerRes.message ||
            "An error occurred during registration. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      localStorage.setItem("registered_user", JSON.stringify(registerRes.user));
      localStorage.setItem(
        "registered_plan",
        JSON.stringify(
          freePlan || {
            id: null,
            name: "Free Plan",
            price: 0,
            is_free: true,
          }
        )
      );

      toast({
        title: "Registration complete",
        description: "Your free account was created successfully.",
      });

      try {
        await login(values.email, values.password);
        navigate("/dashboard");
      } catch {
        navigate("/login");
      }
    } catch (error: unknown) {
      const maybeError = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Registration error",
        description:
          maybeError.message ||
          "An error occurred during registration. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/facebook`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] pt-24 px-4 pb-10">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="hidden lg:flex rounded-2xl border border-slate-200 bg-cyan-900 text-white p-8 flex-col justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Create Your Account
              </h1>
              <p className="mt-3 text-cyan-100 leading-relaxed">
                Start with a free plan now and upgrade when you are ready.
              </p>
            </div>
            <div className="space-y-2 text-sm text-cyan-100">
              <p>• Setup in less than 2 minutes</p>
              <p>• Access all onboarding questionnaires</p>
              <p>• Generate professional AI reports</p>
            </div>
          </section>

          <Card className="w-full border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">
                Create your account
              </CardTitle>
              <CardDescription>
                Start with the free plan and upgrade anytime.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleGoogleLogin}
                  type="button"
                  disabled={isLoading}
                >
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleFacebookLogin}
                  type="button"
                  disabled={isLoading}
                >
                  Continue with Facebook
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              className="h-11 rounded-lg border-slate-300 focus-visible:ring-cyan-600"
                              {...field}
                            />
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Smith"
                              className="h-11 rounded-lg border-slate-300 focus-visible:ring-cyan-600"
                              {...field}
                            />
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
                            placeholder="name@example.com"
                            className="h-11 rounded-lg border-slate-300 focus-visible:ring-cyan-600"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        {emailError ? (
                          <p className="text-sm text-rose-600">{emailError}</p>
                        ) : null}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 123 456 7890"
                            className="h-11 rounded-lg border-slate-300 focus-visible:ring-cyan-600"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Used for optional SMS notifications if your plan includes it.
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
                              placeholder="Create password"
                              className="h-11 rounded-lg border-slate-300 pr-10 focus-visible:ring-cyan-600"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 px-0"
                              onClick={() => setShowPassword((prev) => !prev)}
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
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Repeat password"
                              className="h-11 rounded-lg border-slate-300 pr-10 focus-visible:ring-cyan-600"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 px-0"
                              onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
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
                    className="w-full h-11 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create free account"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 items-center">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <a href="/login" className="text-cyan-700 hover:text-cyan-800">
                  Log in
                </a>
              </p>
              <p className="text-xs text-slate-500 text-center">
                By registering you accept our{" "}
                <a
                  href="/terms-of-service"
                  className="text-cyan-700 hover:text-cyan-800"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy-policy"
                  className="text-cyan-700 hover:text-cyan-800"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Register;
