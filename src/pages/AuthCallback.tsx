import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/services/ApiService";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken } = useAuth(); // ✅ Now these exist!
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        console.error("OAuth error:", error);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "An error occurred while signing in with the social provider.",
        });
        navigate("/login");
        return;
      }

      if (!token) {
        console.error("No token provided");
        navigate("/login");
        return;
      }

      try {
        console.log("🔵 Processing OAuth callback with token");

        // ✅ Set token first (this also stores in localStorage)
        setToken(token);

        // Fetch user data using the token
        const response = await getCurrentUser(token);

        console.log("🔵 User data received:", response);

        if (response.success && response.data) {
          // ✅ Set user (this also stores in localStorage)
          setUser({
            ...response.data,
            isAdmin: response.data.role === "administrator",
          });

          toast({
            title: "Logged in",
            description: `Welcome ${response.data.firstName}!`,
          });

          console.log("✅ OAuth login successful, redirecting to dashboard");

          // Small delay to ensure state is updated
          setTimeout(() => {
            navigate("/dashboard");
          }, 100);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (error) {
        console.error("❌ Error during OAuth callback:", error);
        setToken(null);
        setUser(null);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while signing in.",
        });
        navigate("/login");
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast, setUser, setToken]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--color-primary)] mx-auto"></div>
        <p className="mt-4 text-lg">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
