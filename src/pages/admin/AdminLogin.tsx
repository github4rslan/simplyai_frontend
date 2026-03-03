import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_ADMIN_EMAIL = "admin@simpolyai.com";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, login, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: DEFAULT_ADMIN_EMAIL,
      password: "",
    },
  });

  useEffect(() => {
    if (user?.isAdmin) {
      navigate("/admin");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && attempted && !loading) {
      if (user.role === "administrator") {
        toast({
          title: "Login successful",
          description: "Welcome back to the admin console.",
        });
        navigate("/admin");
      } else {
        setError("Access denied. This account does not have admin privileges.");
        logout();
      }
    }
  }, [user, attempted, loading, navigate, logout, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError("");
      setAttempted(true);

      await login(values.email.trim(), values.password.trim());
    } catch (err: any) {
      const message = err?.message || "Invalid credentials.";
      setError(message.includes("Invalid") ? "Invalid credentials." : `Login failed: ${message}`);
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cyan-50 to-slate-100 p-4">
      <Card className="w-full max-w-md border-cyan-100 bg-white/95 shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Sign in to access the control panel.</CardDescription>
        </CardHeader>

        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@company.com" {...field} />
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
                        <Input type={showPassword ? "text" : "password"} className="pr-10" {...field} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full bg-cyan-700 text-white hover:bg-cyan-800">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="text-center text-xs text-slate-500">
          Administrator credentials are required.
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
