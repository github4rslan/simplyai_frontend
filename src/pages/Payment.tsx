import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Check,
  Clock,
  CreditCard,
  Lock,
  Loader2,
  Calendar,
  User,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  registerUserWithGoogle,
  registerUserWithFacebook,
  processPayment,
  processOAuthPayment,
  completeRegistrationWithPlan,
  fetchPlan,
} from "../services/ApiService";
import { useAuth } from "@/contexts/AuthContext";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripeCheckoutForm from "@/components/StripeCheckoutForm";
import {
  fetchPaymentSettings,
  formatCurrency,
  getCurrencySymbol,
  type PaymentSettings,
} from "@/services/paymentService";

// We'll initialize Stripe with a default key and update it when settings are loaded
let stripePromise: Promise<any> | null = null;

const initializeStripe = (publicKey: string) => {
  if (publicKey && publicKey.trim()) {
    stripePromise = loadStripe(publicKey);
  } else {
    // Fallback to environment variable
    stripePromise = loadStripe(
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
    );
  }
  return stripePromise;
};

const Payment = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Get authentication state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isPlanFree, setIsPlanFree] = useState(false);
  const [planName, setPlanName] = useState("");
  const [googleData, setGoogleData] = useState(null);
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [facebookData, setFacebookData] = useState(null);
  const [isFacebookSignup, setIsFacebookSignup] = useState(false);
  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);
  const [currentStripePromise, setCurrentStripePromise] =
    useState<Promise<any> | null>(null);

  // User details for regular payment flow (only for non-authenticated users)
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // Temporary user data for completing registration after payment
  const [tempUserData, setTempUserData] = useState({
    tempUserId: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
  });

  const searchParams = new URLSearchParams(location.search);
  const selectedPlanId = searchParams.get("plan") || "";
  const selectedPlanPrice = parseInt(searchParams.get("price") || "0");

  // Debug URL parameters
  console.log("🔍 Payment Page URL Debug:");
  console.log("- Full URL:", window.location.href);
  console.log("- Search string:", location.search);
  console.log("- Extracted Plan ID:", selectedPlanId);
  console.log("- Extracted Plan Price:", selectedPlanPrice);
  console.log("- Plan ID empty?", selectedPlanId === "");
  console.log("- Plan ID length:", selectedPlanId.length);
  console.log("User Information", user);

  useEffect(() => {
    // Load payment settings first
    const loadPaymentSettings = async () => {
      try {
        const settings = await fetchPaymentSettings();
        if (settings) {
          setPaymentSettings(settings);
          // Initialize Stripe with the fetched public key
          const stripe = initializeStripe(settings.stripe_public_key);
          setCurrentStripePromise(stripe);
          console.log("💳 Payment settings loaded:", {
            currency: settings.currency,
            vatPercentage: settings.vat_percentage,
            paymentsEnabled: settings.enable_payments,
          });
        } else {
          console.warn("⚠️ Could not load payment settings, using defaults");
          // Fallback to environment variable
          const stripe = initializeStripe("");
          setCurrentStripePromise(stripe);
        }
      } catch (error) {
        console.error("❌ Error loading payment settings:", error);
        // Fallback to environment variable
        const stripe = initializeStripe("");
        setCurrentStripePromise(stripe);
      }
    };

    loadPaymentSettings();

    // Check for Google signup parameters
    const googleSignup = searchParams.get("google_signup");
    const googleDataParam = searchParams.get("google_data");

    if (googleSignup === "true" && googleDataParam) {
      try {
        const parsedGoogleData = JSON.parse(
          decodeURIComponent(googleDataParam)
        );
        setGoogleData(parsedGoogleData);
        setIsGoogleSignup(true);
      } catch (error) {
        console.error("Error parsing Google data:", error);
      }
    }

    // Check for Facebook signup parameters
    const facebookSignup = searchParams.get("facebook_signup");
    const facebookDataParam = searchParams.get("facebook_data");

    console.log("🔍 Facebook Parsing Debug:", {
      facebookSignup,
      facebookDataParam,
      condition: facebookSignup === "true" && facebookDataParam,
    });

    if (facebookSignup === "true" && facebookDataParam) {
      try {
        console.log("🔄 Attempting to parse Facebook data...");
        const parsedFacebookData = JSON.parse(
          decodeURIComponent(facebookDataParam)
        );
        console.log(
          "✅ Facebook data parsed successfully:",
          parsedFacebookData
        );
        setFacebookData(parsedFacebookData);
        setIsFacebookSignup(true);
        console.log("✅ Facebook states set successfully");
      } catch (error) {
        console.error("❌ Error parsing Facebook data:", error);
        console.error("Raw facebookDataParam:", facebookDataParam);
        console.error(
          "Decoded facebookDataParam:",
          decodeURIComponent(facebookDataParam)
        );
      }
    } else {
      console.log("❌ Facebook signup condition not met:", {
        facebookSignupIsTrue: facebookSignup === "true",
        facebookDataParamExists: !!facebookDataParam,
      });
    }

    // Check for temporary user data from email/password registration
    const tempUserId = localStorage.getItem("temp_user_id");
    const tempEmail = localStorage.getItem("temp_user_email");
    const tempFirstName = localStorage.getItem("temp_user_firstName");
    const tempLastName = localStorage.getItem("temp_user_lastName");
    const tempPhone = localStorage.getItem("temp_user_phone");
    const tempPassword = localStorage.getItem("temp_user_password");

    // Check for new temp_user parameter (from plan selection)
    const isTempUser = searchParams.get("temp_user") === "true";
    const tempUserDataStr = localStorage.getItem("temp_user_data");

    if (isTempUser && tempUserDataStr) {
      try {
        const parsedTempData = JSON.parse(tempUserDataStr);
        setTempUserData({
          tempUserId: "", // Not from temp_registrations table
          email: parsedTempData.email,
          firstName: parsedTempData.firstName,
          lastName: parsedTempData.lastName,
          phone: parsedTempData.phone || "",
          password: parsedTempData.password,
        });

        // Auto-fill user details for payment form
        setUserDetails({
          firstName: parsedTempData.firstName,
          lastName: parsedTempData.lastName,
          email: parsedTempData.email,
          password: parsedTempData.password,
        });

        console.log(
          "📋 New temp user data loaded for payment:",
          parsedTempData.email
        );
      } catch (error) {
        console.error("Error parsing temp user data:", error);
      }
    } else if (tempUserId && tempEmail) {
      // Legacy temp user data handling
      setTempUserData({
        tempUserId,
        email: tempEmail,
        firstName: tempFirstName || "",
        lastName: tempLastName || "",
        phone: tempPhone || "",
        password: tempPassword || "",
      });

      // Auto-fill user details for payment form if not authenticated
      if (!isAuthenticated) {
        setUserDetails({
          firstName: tempFirstName || "",
          lastName: tempLastName || "",
          email: tempEmail,
          password: tempPassword || "",
        });
      }

      console.log("📋 Temporary user data loaded for payment completion:", {
        tempUserId,
        email: tempEmail,
        firstName: tempFirstName,
        lastName: tempLastName,
      });
    }

    // === COMPREHENSIVE PAYMENT PAGE INFORMATION LOGGING ===
    console.log("==================================================");
    console.log("🔥 PAYMENT PAGE LOADED - ALL INFORMATION DUMP 🔥");
    console.log("==================================================");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("🌐 Current URL:", window.location.href);
    console.log("📍 Page Location:", location.pathname + location.search);

    // URL Parameters
    console.log("\n📋 URL PARAMETERS:");
    const allParams = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });
    console.log("Raw URL Params:", allParams);
    console.log("Selected Plan ID:", selectedPlanId);
    console.log("Selected Plan Price:", selectedPlanPrice);

    // Google OAuth Data
    console.log("\n🔍 GOOGLE OAUTH DATA:");
    console.log("Google Signup Flag:", googleSignup);
    console.log("Is Google Signup:", isGoogleSignup);
    if (googleDataParam) {
      console.log("Raw Google Data Param:", googleDataParam);
      console.log(
        "Decoded Google Data Param:",
        decodeURIComponent(googleDataParam)
      );
    }
    if (googleData) {
      console.log("Parsed Google Data:", JSON.stringify(googleData, null, 2));
    } else {
      console.log("Parsed Google Data: null");
    }

    // Facebook OAuth Data
    console.log("\n📘 FACEBOOK OAUTH DATA:");
    console.log("Facebook Signup Flag:", facebookSignup);
    console.log("Is Facebook Signup:", isFacebookSignup);
    console.log("Facebook Data State:", facebookData);
    if (facebookDataParam) {
      console.log("Raw Facebook Data Param:", facebookDataParam);
      console.log(
        "Decoded Facebook Data Param:",
        decodeURIComponent(facebookDataParam)
      );
    }
    if (facebookData) {
      console.log(
        "Parsed Facebook Data:",
        JSON.stringify(facebookData, null, 2)
      );
    } else {
      console.log("Parsed Facebook Data: null");
    }

    // Browser & Session Info
    console.log("\n🌐 BROWSER & SESSION INFO:");
    console.log("User Agent:", navigator.userAgent);
    console.log("Language:", navigator.language);
    console.log("Platform:", navigator.platform);
    console.log("Referrer:", document.referrer);
    console.log(
      "Local Storage Auth Token:",
      localStorage.getItem("authToken") ? "Present" : "Not Found"
    );
    console.log(
      "Local Storage User:",
      localStorage.getItem("user") ? "Present" : "Not Found"
    );

    // Form States
    console.log("\n💳 PAYMENT FORM STATES:");
    console.log("Is Processing:", isProcessing);
    console.log("Payment Method:", paymentMethod);
    console.log("Is Plan Free:", isPlanFree);
    console.log("Plan Name:", planName);

    console.log("==================================================");
    console.log("🔚 END OF PAYMENT PAGE INFORMATION DUMP");
    console.log("==================================================\n");

    const checkPlanType = async () => {
      if (selectedPlanId) {
        try {
          const response = await fetchPlan(selectedPlanId);

          if (!response.success) {
            console.error("Error fetching plan details:", response.error);
            return;
          }

          if (response.data) {
            setPlanName(response.data.name);

            if (response.data.is_free === true) {
              setIsPlanFree(true);

              // OAuth registration is now handled in a separate useEffect
              // This ensures the states are properly set before attempting registration

              toast({
                title: "Free Plan Detected!",
                description: `We are activating your free plan ${response.data.name}...`,
              });
            }
          }
        } catch (error) {
          console.error("Error checking plan type:", error);
        }
      }
    };

    checkPlanType();
  }, [selectedPlanId, navigate, toast]);

  // Separate effect to handle OAuth registration when states are ready
  useEffect(() => {
    const handleOAuthRegistrationForFreePlan = async () => {
      if (isPlanFree && planName) {
        // If this is a Google signup for a free plan, complete registration immediately
        if (isGoogleSignup && googleData) {
          try {
            // Clear any existing auth data to ensure fresh registration
            localStorage.removeItem("authToken");
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");

            console.log(
              "🚀 Starting Google registration for free plan (from separate effect):",
              {
                planId: selectedPlanId,
                planName: planName,
                googleData: googleData,
              }
            );

            const registrationResponse = await registerUserWithGoogle(
              googleData,
              planName
            );

            if (registrationResponse.success) {
              // Store the token and user data using the correct keys that AuthContext expects
              localStorage.setItem(
                "auth_token",
                registrationResponse.data.token
              );
              localStorage.setItem(
                "user",
                JSON.stringify(registrationResponse.data.user)
              );

              console.log(
                "✅ Google registration successful (from separate effect):",
                {
                  userId: registrationResponse.data.user.id,
                  email: registrationResponse.data.user.email,
                  token: registrationResponse.data.token
                    ? "Present"
                    : "Missing",
                }
              );

              toast({
                title: "Registration Completed!",
                description: `Welcome ${googleData.firstName}! Your free plan has been activated.`,
              });

              setTimeout(() => {
                window.location.href = "/dashboard";
              }, 1500);
              return;
            } else {
              console.error(
                "❌ Google registration failed (from separate effect):",
                registrationResponse
              );
              throw new Error(
                registrationResponse.message || "Registration failed"
              );
            }
          } catch (error) {
            console.error(
              "Error completing Google registration (from separate effect):",
              error
            );
            toast({
              variant: "destructive",
              title: "Registration Error",
              description:
                "There was an error completing your registration. Please try again.",
            });
          }
        }

        // If this is a Facebook signup for a free plan, complete registration immediately
        if (isFacebookSignup && facebookData) {
          try {
            // Clear any existing auth data to ensure fresh registration
            localStorage.removeItem("authToken");
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");

            console.log(
              "🚀 Starting Facebook registration for free plan (from separate effect):",
              {
                planId: selectedPlanId,
                planName: planName,
                facebookData: facebookData,
              }
            );

            const registrationResponse = await registerUserWithFacebook(
              facebookData,
              planName
            );

            if (registrationResponse.success) {
              // Store the token and user data using the correct keys that AuthContext expects
              localStorage.setItem(
                "auth_token",
                registrationResponse.data.token
              );
              localStorage.setItem(
                "user",
                JSON.stringify(registrationResponse.data.user)
              );

              console.log(
                "✅ Facebook registration successful (from separate effect):",
                {
                  userId: registrationResponse.data.user.id,
                  email: registrationResponse.data.user.email,
                  token: registrationResponse.data.token
                    ? "Present"
                    : "Missing",
                }
              );

              toast({
                title: "Registration Completed!",
                description: `Welcome ${facebookData.firstName}! Your free plan has been activated.`,
              });

              setTimeout(() => {
                window.location.href = "/dashboard";
              }, 1500);
              return;
            } else {
              console.error(
                "❌ Facebook registration failed (from separate effect):",
                registrationResponse
              );
              throw new Error(
                registrationResponse.message || "Registration failed"
              );
            }
          } catch (error) {
            console.error(
              "Error completing Facebook registration (from separate effect):",
              error
            );
            toast({
              variant: "destructive",
              title: "Registration Error",
              description:
                "There was an error completing your registration. Please try again.",
            });
          }
        }
      }
    };

    handleOAuthRegistrationForFreePlan();
  }, [
    isPlanFree,
    planName,
    isGoogleSignup,
    googleData,
    isFacebookSignup,
    facebookData,
    selectedPlanId,
    toast,
  ]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // PRIORITY CHECK: Handle temp user data first (from new registration flow)
      const isTempUser = searchParams.get("temp_user") === "true";
      if (isTempUser && tempUserData.email && tempUserData.password) {
        console.log(
          "🔥 PRIORITY: Processing temp user registration with plan selection..."
        );
        console.log("📝 Temp user data:", {
          email: tempUserData.email,
          firstName: tempUserData.firstName,
        });

        const response = await completeRegistrationWithPlan(
          tempUserData,
          selectedPlanId
        );

        if (response.success) {
          // Store auth token and clean up temp data
          localStorage.setItem("auth_token", response.data.token);
          localStorage.removeItem("temp_user_data");

          toast({
            title: "Registrazione e pagamento completati!",
            description: `Benvenuto ${tempUserData.firstName}! Il tuo account è stato creato con successo.`,
          });

          console.log(
            "✅ Temp user registration with plan completed successfully"
          );

          // Redirect to dashboard
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
          return;
        } else {
          throw new Error(response.error || "Errore durante la registrazione");
        }
      }

      // Check if user is already authenticated (including email/password registered users)
      if (isAuthenticated && user) {
        // User is already logged in - process OAuth payment (works for both OAuth and email/password users)
        console.log("🔐 Processing payment for authenticated user:", user);
        console.log("🔍 User object structure:", JSON.stringify(user, null, 2));
        console.log("🔍 IsAuthenticated:", isAuthenticated);

        // Prepare payment information for authenticated user
        const paymentInfo = {
          method: paymentMethod === "card" ? "Credit Card" : "PayPal",
          amount: selectedPlanPrice,
        };

        // Prepare plan information
        let planInfo = {
          id: selectedPlanId,
          name: planName,
          price: selectedPlanPrice,
          type: "Monthly",
        };

        // If plan ID is missing from URL, try to get it from localStorage (recent registration)
        if (!planInfo.id) {
          console.log("🔍 Plan ID missing from URL, checking localStorage...");
          const recentPlanId =
            localStorage.getItem("recent_plan_id") ||
            localStorage.getItem("user_selected_plan_id");
          const recentPlanPrice =
            localStorage.getItem("recent_plan_price") ||
            localStorage.getItem("user_selected_plan_price");
          const recentPlanName =
            localStorage.getItem("recent_plan_name") ||
            localStorage.getItem("user_selected_plan_name");

          if (recentPlanId) {
            console.log("✅ Found recent plan data in localStorage");
            planInfo = {
              id: recentPlanId,
              name: recentPlanName || "Selected plan",
              price: parseInt(recentPlanPrice || "0"),
              type: "Mensile",
            };
            console.log("📋 Using recent plan data:", planInfo);
          }
        }

        const userInfo = {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };

        console.log("🚀 Processing authenticated user payment...");
        console.log("📊 All data being sent:");
        console.log("- User ID:", user.id);
        console.log("- User Info:", JSON.stringify(userInfo, null, 2));
        console.log("- Payment Info:", JSON.stringify(paymentInfo, null, 2));
        console.log("- Plan Info:", JSON.stringify(planInfo, null, 2));

        // Validate required fields before sending
        if (!user.id) {
          console.error("❌ Missing user.id");
          toast({
            variant: "destructive",
            title: "Authentication error",
            description:
              "User ID missing. Please try logging in again.",
          });
          return;
        }

        if (!userInfo.email) {
          console.error("❌ Missing userInfo.email");
          toast({
            variant: "destructive",
            title: "User data error",
            description:
              "User email missing. Please try logging in again.",
          });
          return;
        }

        if (!paymentInfo.method) {
          console.error("❌ Missing paymentInfo.method");
          toast({
            variant: "destructive",
            title: "Payment method error",
            description: "Payment method missing.",
          });
          return;
        }

        if (!planInfo.id) {
          console.error("❌ Missing planInfo.id");
          console.error("🔍 selectedPlanId:", selectedPlanId);
          console.error("🔍 URL search params:", location.search);
          console.error("🔍 Current URL:", window.location.href);
          toast({
            variant: "destructive",
            title: "Plan error",
            description:
              "Plan ID missing. Please try selecting a plan from the main page.",
          });
          // Redirect to pricing page to select a plan
          setTimeout(() => {
            navigate("/pricing");
          }, 2000);
          return;
        }

        console.log(
          "✅ All required fields validated, proceeding with payment..."
        );

        // Process payment for authenticated user and send notification email
        const response = await processOAuthPayment(
          user.id,
          userInfo,
          paymentInfo,
          planInfo
        );

        if (response.success) {
          // Clear recent plan data from localStorage (all variants)
          localStorage.removeItem("recent_plan_id");
          localStorage.removeItem("recent_plan_price");
          localStorage.removeItem("recent_plan_name");
          localStorage.removeItem("user_selected_plan_id");
          localStorage.removeItem("user_selected_plan_price");
          localStorage.removeItem("user_selected_plan_name");

          toast({
            title: "Payment completed!",
            description: `Thank you ${userInfo.firstName}! Your payment has been processed and a confirmation email has been sent.`,
          });

          console.log("✅ Authenticated user payment processed successfully");
          console.log("📧 Email notification sent:", response.data.emailSent);
          console.log("🔑 Transaction ID:", response.data.transactionId);

          // Redirect to dashboard
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
          return;
        }
      }
      // Legacy check for old localStorage format (OAuth users)
      const authToken = localStorage.getItem("authToken");
      const userData = localStorage.getItem("user");

      if (authToken && userData) {
        // User is already logged in via old format - process OAuth payment
        const currentUser = JSON.parse(userData);
        console.log(
          "🔐 Processing payment for legacy OAuth user:",
          currentUser
        );

        // Prepare payment information for existing user
        const paymentInfo = {
          method: paymentMethod === "card" ? "Credit Card" : "PayPal",
          amount: selectedPlanPrice,
        };

        // Prepare plan information
        const planInfo = {
          id: selectedPlanId,
          name: planName,
          price: selectedPlanPrice,
          type: "Monthly",
        };

        const userInfo = {
          email: currentUser.email,
          firstName: currentUser.firstName || currentUser.first_name,
          lastName: currentUser.lastName || currentUser.last_name,
        };

        console.log("🚀 Processing legacy OAuth payment...");
        console.log("User Info:", userInfo);
        console.log("Payment Info:", paymentInfo);
        console.log("Plan Info:", planInfo);

        // Process OAuth payment and send notification email
        const response = await processOAuthPayment(
          currentUser.id,
          userInfo,
          paymentInfo,
          planInfo
        );

        if (response.success) {
          toast({
            title: "Payment completed!",
            description: `Thank you ${userInfo.firstName}! Your payment has been processed and a confirmation email has been sent.`,
          });

          console.log("✅ Legacy OAuth payment processed successfully");
          console.log("📧 Email notification sent:", response.data.emailSent);
          console.log("🔑 Transaction ID:", response.data.transactionId);

          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2000);
          return;
        }
      }
      // If this is a Google signup, complete the registration
      if (isGoogleSignup && googleData) {
        // Clear any existing auth data to ensure fresh registration
        localStorage.removeItem("authToken");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");

        console.log("🚀 Starting Google registration for paid plan:", {
          planId: selectedPlanId,
          planName: planName,
          googleData: googleData,
        });

        const response = await registerUserWithGoogle(googleData, planName);

        if (response.success) {
          // Store the token and user data using the correct keys that AuthContext expects
          localStorage.setItem("auth_token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));

          toast({
            title: "Registration Completed!",
            description: `Welcome ${googleData.firstName}! Your account has been created successfully.`,
          });

          // Reload the page to update auth context
          window.location.href = "/dashboard";
          return;
        }
      }
      // If this is a Facebook signup, complete the registration
      else if (isFacebookSignup && facebookData) {
        // Clear any existing auth data to ensure fresh registration
        localStorage.removeItem("authToken");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");

        console.log("🚀 Starting Facebook registration for paid plan:", {
          planId: selectedPlanId,
          planName: planName,
          facebookData: facebookData,
        });

        const response = await registerUserWithFacebook(facebookData, planName);

        if (response.success) {
          // Store the token and user data using the correct keys that AuthContext expects
          localStorage.setItem("auth_token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));

          toast({
            title: "Registration Completed!",
            description: `Welcome ${facebookData.firstName}! Your account has been created successfully.`,
          });

          // Reload the page to update auth context
          window.location.href = "/dashboard";
          return;
        }
      } else {
        // Regular payment flow - collect form data and process payment
        const formData = new FormData(e.target as HTMLFormElement);

        // Validate user details
        if (
          !userDetails.firstName ||
          !userDetails.lastName ||
          !userDetails.email
        ) {
          toast({
            variant: "destructive",
            title: "Missing data",
            description: "Please fill in all required fields.",
          });
          return;
        }

        // Prepare user information - use temporary data if available
        const userInfo = tempUserData.tempUserId
          ? {
              email: tempUserData.email,
              firstName: tempUserData.firstName,
              lastName: tempUserData.lastName,
              phone: tempUserData.phone,
              password: tempUserData.password,
            }
          : {
              firstName: userDetails.firstName,
              lastName: userDetails.lastName,
              email: userDetails.email,
              password: userDetails.password || undefined,
            };

        // Prepare payment information
        const paymentInfo = {
          method: paymentMethod === "card" ? "Credit Card" : "PayPal",
          amount: selectedPlanPrice,
          cardName: formData.get("cardName") || undefined,
          cardNumber: formData.get("cardNumber")
            ? `****-****-****-${String(formData.get("cardNumber")).slice(-4)}`
            : undefined,
        };

        // Prepare plan information
        const planInfo = {
          id: selectedPlanId,
          name: planName,
          price: selectedPlanPrice,
          type: "Monthly",
        };

        console.log("🚀 Processing regular payment...");
        console.log("User Info:", userInfo);
        console.log("Payment Info:", paymentInfo);
        console.log("Plan Info:", planInfo);
        console.log("Temp User ID:", tempUserData.tempUserId || "None");

        // Check if this is a new temp user (from plan selection) vs legacy temp user (from temp_registrations table)
        if (
          !tempUserData.tempUserId &&
          tempUserData.email &&
          tempUserData.password
        ) {
          // New temp user flow - use completeRegistrationWithPlan
          console.log("🆕 Processing new temp user with plan selection...");
          const response = await completeRegistrationWithPlan(
            tempUserData,
            selectedPlanId
          );

          if (response.success) {
            // Store the token and user data
            localStorage.setItem("auth_token", response.data.token);
            localStorage.removeItem("temp_user_data"); // Clean up new temp data

            toast({
              title: "Registration and payment completed!",
              description: `Welcome ${tempUserData.firstName}! Your account has been created successfully.`,
            });

            console.log("✅ New temp user registration completed successfully");

            // Redirect to dashboard
            setTimeout(() => {
              navigate("/dashboard");
            }, 2000);
            return;
          }
        } else {
          // Legacy temp user flow OR regular payment flow
          const response = await processPayment(
            userInfo,
            paymentInfo,
            planInfo,
            tempUserData.tempUserId
          );

          if (response.success) {
            // Store the token and user data using the correct key that AuthContext expects
            localStorage.setItem("auth_token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            // Clean up temporary user data
            if (tempUserData.tempUserId) {
              localStorage.removeItem("temp_user_id");
              localStorage.removeItem("temp_user_email");
              localStorage.removeItem("temp_user_firstName");
              localStorage.removeItem("temp_user_lastName");
              localStorage.removeItem("temp_user_phone");
              localStorage.removeItem("temp_user_password");
              console.log(
                "🧹 Cleaned up temporary user data after successful payment"
              );
            }

            toast({
              title: "Payment completed!",
              description: `Welcome ${userInfo.firstName}! Your account has been created and a confirmation email has been sent.`,
            });

            console.log("✅ Payment processed successfully");
            console.log("📧 Email notification sent:", response.data.emailSent);
            console.log("🔑 Transaction ID:", response.data.transactionId);

            // Redirect to dashboard
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 2000);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error during payment/registration:", error);
      toast({
        variant: "destructive",
        title:
          isGoogleSignup || isFacebookSignup
            ? "Registration Error"
            : "Payment error",
        description:
          isGoogleSignup || isFacebookSignup
            ? "There was an error completing your registration. Please try again."
            : "An error occurred during payment. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isPlanFree) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-12 px-4 bg-gradient-to-b from-white to-purple-50">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <CardTitle>Free Plan Activated</CardTitle>
              <CardDescription>
                Your free plan {planName} has been activated successfully.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center my-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
              <p className="text-gray-600">
                You are being redirected to your personal dashboard...
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-grow py-12 px-4 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Complete your purchase
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              {/* User Details Section - Only show for non-authenticated users and non-OAuth users */}
              {/* {!isAuthenticated && !isGoogleSignup && !isFacebookSignup && ( */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User size={20} />
                    {tempUserData.tempUserId
                      ? "Account Information (from registration)"
                      : "Account Information"}
                  </CardTitle>
                  <CardDescription>
                    {tempUserData.tempUserId
                      ? "Pre-filled data from your previous registration"
                      : "Create your account to complete the purchase"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <div className="relative">
                        <Input
                          id="firstName"
                          placeholder="John"
                          required
                          value={userDetails.firstName}
                          onChange={(e) =>
                            setUserDetails((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          disabled={!!tempUserData.tempUserId}
                          className={
                            tempUserData.tempUserId ? "bg-gray-50" : ""
                          }
                        />
                        <User
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <div className="relative">
                        <Input
                          id="lastName"
                          placeholder="Smith"
                          required
                          value={userDetails.lastName}
                          onChange={(e) =>
                            setUserDetails((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                        />
                        <User
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.smith@email.com"
                        required
                        value={userDetails.email}
                        onChange={(e) =>
                          setUserDetails((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                      <Mail
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (optional)</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="Leave blank to auto-generate"
                        value={userDetails.password}
                        onChange={(e) =>
                          setUserDetails((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                      />
                      <Lock
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      If you don't enter a password, we will generate one
                      automatically and send it to you by email.
                    </p>
                  </div>
                </CardContent>
              </Card>
              {/* )} */}

              <Card>
                <CardHeader>
                  <CardTitle>Payment method</CardTitle>
                  <CardDescription>Choose how you want to pay</CardDescription>
                </CardHeader>

                <CardContent>
                  <Tabs
                    defaultValue="card"
                    onValueChange={setPaymentMethod}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="card">Credit card</TabsTrigger>
                      <TabsTrigger value="paypal">PayPal</TabsTrigger>
                    </TabsList>

                    <TabsContent value="card">
                      {currentStripePromise ? (
                        <Elements stripe={currentStripePromise}>
                          <StripeCheckoutForm
                            amount={(() => {
                              // List of zero-decimal currencies supported by Stripe
                              const zeroDecimalCurrencies = [
                                "BIF",
                                "CLP",
                                "DJF",
                                "GNF",
                                "JPY",
                                "KMF",
                                "KRW",
                                "MGA",
                                "PYG",
                                "RWF",
                                "UGX",
                                "VND",
                                "VUV",
                                "XAF",
                                "XOF",
                                "XPF",
                              ];
                              const currency =
                                paymentSettings?.currency || "EUR";
                              return zeroDecimalCurrencies.includes(
                                currency.toUpperCase()
                              )
                                ? selectedPlanPrice
                                : selectedPlanPrice * 100;
                            })()}
                            currency={paymentSettings?.currency || "EUR"}
                            userInfo={
                              isGoogleSignup && googleData
                                ? {
                                    firstName:
                                      googleData.firstName ||
                                      googleData.given_name ||
                                      "",
                                    lastName:
                                      googleData.lastName ||
                                      googleData.family_name ||
                                      "",
                                    email: googleData.email || "",
                                  }
                                : isFacebookSignup && facebookData
                                ? {
                                    firstName:
                                      facebookData.firstName ||
                                      facebookData.given_name ||
                                      "",
                                    lastName:
                                      facebookData.lastName ||
                                      facebookData.family_name ||
                                      "",
                                    email: facebookData.email || "",
                                  }
                                : isAuthenticated && user
                                ? {
                                    firstName: user.firstName || "",
                                    lastName: user.lastName || "",
                                    email: user.email || "",
                                  }
                                : userDetails
                            }
                            planInfo={{
                              id: selectedPlanId,
                              name: planName,
                              price: selectedPlanPrice,
                              type: "Monthly",
                            }}
                            onSuccess={() => {
                              toast({
                                title: "Payment completed!",
                                description:
                                  "The card payment was successful.",
                              });
                              setTimeout(() => {
                                navigate("/dashboard");
                              }, 2000);
                            }}
                          />
                        </Elements>
                      ) : (
                        <div className="flex justify-center items-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">
                            Loading payment configuration...
                          </span>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="paypal">
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-xl mb-4">
                          Pay<span className="text-blue-300">Pal</span>
                        </div>
                        <p className="text-center text-gray-600 mb-6">
                          You will be redirected to the PayPal site to complete the
                          payment securely.
                        </p>
                        <Button
                          onClick={handlePayment}
                          className="w-full max-w-md bg-blue-600 hover:bg-blue-700"
                          disabled={isProcessing}
                        >
                          {isProcessing
                            ? "Processing..."
                            : `Continue with PayPal`}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>

                <CardFooter>
                  <div className="w-full flex items-center justify-center text-sm text-gray-500">
                    <Lock className="h-4 w-4 mr-1" /> Your payment data
                    is protected and encrypted
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order summary</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Plan</span>
                      <span>{planName || "Selected plan"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium">Price</span>
                      <span className="font-bold">
                        {paymentSettings
                          ? formatCurrency(
                              selectedPlanPrice * 100,
                              paymentSettings.currency
                            )
                          : `€${selectedPlanPrice.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium">
                        IVA ({paymentSettings?.vat_percentage || 22}%)
                      </span>
                      <span>Included</span>
                    </div>

                    <div className="border-t pt-4 flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold">
                        {paymentSettings
                          ? formatCurrency(
                              selectedPlanPrice * 100,
                              paymentSettings.currency
                            )
                          : `€${selectedPlanPrice.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                      <span>Digital invoice sent by email</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                      <span>
                        14-day money-back guarantee
                      </span>
                    </li>
                  </ul>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
