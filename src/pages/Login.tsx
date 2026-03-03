import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL } from "@/config/api";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff, LogIn, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const Login = () => {
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthError, setOauthError] = useState<{
    message: string;
    provider: string;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setOauthError(null);
      await login(values.email, values.password);

      toast({
        title: "Logged in",
        description: "Welcome back.",
      });
      navigate("/dashboard");
    } catch (error: unknown) {
      const maybeError = error as {
        response?: { data?: { provider?: string; message?: string } };
      };

      if (maybeError.response?.data?.provider) {
        setOauthError({
          message:
            maybeError.response?.data?.message ||
            "This account uses social login.",
          provider: maybeError.response.data.provider,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description:
            maybeError.response?.data?.message ||
            "Invalid credentials. Please try again.",
        });
      }
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

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] pt-24 px-4 pb-10">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <section className="hidden lg:flex rounded-2xl border border-slate-200 bg-slate-900 text-white p-8 flex-col justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Welcome Back
              </h1>
              <p className="mt-3 text-slate-200 leading-relaxed">
                Access questionnaires, reports, and subscription insights from one
                dashboard.
              </p>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <p>• Faster form workflows</p>
              <p>• AI-powered report generation</p>
              <p>• Secure access across devices</p>
            </div>
          </section>

          <Card className="w-full border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">
                Sign in to your account
              </CardTitle>
              <CardDescription>Use your email or social login.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {oauthError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{oauthError.message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleGoogleLogin}
                  type="button"
                >
                  Continue with Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleFacebookLogin}
                  type="button"
                >
                  Continue with Facebook
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or</span>
                </div>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
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
                              placeholder="Enter your password"
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

                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-cyan-700 hover:text-cyan-800"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? "Logging in..." : "Log In"}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex justify-center">
              <p className="text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="text-cyan-700 hover:text-cyan-800">
                  Register
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
