import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL } from "@/config/api";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Extract token and uid from URL
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const userId = params.get("uid");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values) => {
    if (!token || !userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid or missing link",
      });
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token, newPassword: values.password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        toast({
          title: "Password updated",
          description: "You can now log in with your new password.",
        });
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Could not update the password.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4 pt-24">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">Reset Password</CardTitle>
            <CardDescription>
              Enter the new password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-green-600 text-center font-semibold py-4">
                Password updated successfully! Redirecting to login...
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="New password"
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
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm password"
                            className="h-11 rounded-lg border-slate-300 focus-visible:ring-cyan-600"
                            {...field}
                          />
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
                        Updating...
                      </>
                    ) : (
                      <>Update password</>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Back to{" "}
              <a
                href="/login"
                className="text-cyan-700 hover:text-cyan-800"
              >
                login
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
