import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchAllPlans, SubscriptionPlan } from "@/services/plansService";
import { completeRegistrationWithPlan, subscribeFreePlan } from "@/services/ApiService";
import { useToast } from "@/components/ui/use-toast";

interface PricingTableProps {
  googleData?: any;
  isGoogleSignup?: boolean;
  facebookData?: any;
  isFacebookSignup?: boolean;
  userSelectedPlanId?: string | null;
  isEmailPasswordUser?: boolean;
  tempUserData?: any;
}

const PricingTable = ({
  googleData,
  isGoogleSignup,
  facebookData,
  isFacebookSignup,
  userSelectedPlanId,
  isEmailPasswordUser,
  tempUserData,
}: PricingTableProps) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [navigatingPlan, setNavigatingPlan] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await fetchAllPlans();

        // Transform the data to ensure compatibility
        const transformedPlans = data.map((plan) => ({
          ...plan,
          // Ensure features is an array
          features: Array.isArray(plan.features) ? plan.features : [],
          // Ensure button_variant is correct type
          button_variant:
            plan.button_variant === "outline" ||
            plan.button_variant === "default"
              ? (plan.button_variant as "outline" | "default")
              : ("outline" as const),
          // Ensure boolean properties
          is_free: Boolean(plan.is_free),
          is_popular: Boolean(plan.is_popular),
          active: Boolean(plan.active),
        }));

        setPlans(transformedPlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanSelection = (plan: SubscriptionPlan) => {
    // If this is a Google signup, navigate to payment with Google data
    if (isGoogleSignup && googleData) {
      const googleDataParam = encodeURIComponent(JSON.stringify(googleData));
      if (plan.is_free) {
        return `/payment?plan=${plan.id}&price=0&google_signup=true&google_data=${googleDataParam}`;
      } else {
        return `/payment?plan=${plan.id}&price=${plan.price}&google_signup=true&google_data=${googleDataParam}`;
      }
    }

    // If this is a Facebook signup, navigate to payment with Facebook data
    if (isFacebookSignup && facebookData) {
      const facebookDataParam = encodeURIComponent(
        JSON.stringify(facebookData)
      );
      if (plan.is_free) {
        return `/payment?plan=${plan.id}&price=0&facebook_signup=true&facebook_data=${facebookDataParam}`;
      } else {
        return `/payment?plan=${plan.id}&price=${plan.price}&facebook_signup=true&facebook_data=${facebookDataParam}`;
      }
    }

    // If the user is logged in, navigate to dashboard for free plans or payment for paid plans
    if (user) {
      if (plan.is_free) {
        return "FREE_PLAN";
      }
      return `/payment?plan=${plan.id}&price=${plan.price}`;
    }

    // If the user is not logged in, navigate to registration with plan parameters
    return `/register?plan=${plan.id}&price=${plan.price}`;
  };

  const handlePlanNavigation = (plan: SubscriptionPlan) => {
    // Prevent multiple clicks
    if (navigatingPlan || isRegistering || processingPlan) {
      return;
    }

    setNavigatingPlan(plan.id);
    const target = handlePlanSelection(plan);

    // Logged-in free plan: activate immediately via API
    if (target === "FREE_PLAN" && user) {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Token not found. Please log in again.",
        });
        setNavigatingPlan(null);
        return;
      }

      subscribeFreePlan(plan.id, token)
        .then(() => {
          toast({
            title: "Plan activated",
            description: "The free plan has been activated on your account.",
          });
          navigate("/dashboard");
        })
        .catch((error) => {
          console.error("Error activating free plan:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description:
              error.message ||
              "Could not activate the free plan. Please try again.",
          });
        })
        .finally(() => {
          setNavigatingPlan(null);
        });
      return;
    }

    // Small delay to show loading state, then navigate
    setTimeout(() => {
      navigate(target);
    }, 100);
  };

  // Cleanup navigation state if component unmounts
  useEffect(() => {
    return () => {
      setNavigatingPlan(null);
    };
  }, []);

  const handlePlanClick = async (plan: SubscriptionPlan) => {
    // Prevent multiple clicks
    if (isRegistering || processingPlan) {
      return;
    }

    // If there's temporary user data, handle plan selection directly
    if (tempUserData) {
      try {
        setProcessingPlan(plan.id);
        setIsRegistering(true);

        if (plan.is_free) {
          // For free plans, create user immediately and redirect to login
          const response = await completeRegistrationWithPlan(
            tempUserData,
            plan.id
          );

          if (response.success) {
            localStorage.removeItem("temp_user_data"); // Clean up temp data

            toast({
              title: "Registration complete!",
              description: `Benvenuto ${tempUserData.firstName}! Controlla la tua email per confermare il tuo account e poi accedi.`,
            });

            // Redirect to login page for email confirmation
            navigate("/login");
          }
        } else {
          // For paid plans, redirect to payment page
          navigate(
            `/payment?plan=${plan.id}&price=${plan.price}&temp_user=true`
          );
        }
      } catch (error) {
        console.error("Error completing registration:", error);
        toast({
          variant: "destructive",
          title: "Registration error",
          description:
            error.message ||
            "An error occurred during registration.",
        });
      } finally {
        setProcessingPlan(null);
        setIsRegistering(false);
      }
      return;
    }

    // For all other cases, navigate using the URL
    const target = handlePlanSelection(plan);

    // Logged-in free plan: call API to activate subscription, then go to dashboard
    if (target === "FREE_PLAN" && user) {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Token not found. Please log in again.",
        });
        return;
      }
      try {
        setProcessingPlan(plan.id);
        subscribeFreePlan(plan.id, token).then(() => {
          toast({
            title: "Plan activated",
            description: "The free plan has been activated on your account.",
          });
          navigate("/dashboard");
        }).catch((error) => {
          console.error("Error activating free plan:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description:
              error.message ||
              "Could not activate the free plan. Please try again.",
          });
        }).finally(() => {
          setProcessingPlan(null);
        });
      } catch (error) {
        console.error("Error activating free plan:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error.message ||
            "Could not activate the free plan. Please try again.",
        });
      }
      return;
    }

    navigate(target);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-2 rounded-3xl animate-pulse">
            <CardHeader className="pt-6">
              <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Full-screen loading overlay when navigating */}
      {navigatingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)] mb-4" />
            <p className="text-lg font-medium text-gray-900">Loading...</p>
            <p className="text-sm text-gray-600 mt-2">
              Preparing the page
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isPreSelected =
            isEmailPasswordUser && userSelectedPlanId === plan.id;

          return (
            <Card
              key={plan.id}
              className={`border-2 rounded-3xl card-hover transition-opacity ${
                isPreSelected
                  ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)] shadow-lg"
                  : "border-[var(--color-primary-500)]"
              } ${
                (isRegistering && processingPlan !== plan.id) ||
                (navigatingPlan && navigatingPlan !== plan.id)
                  ? "opacity-50 pointer-events-none"
                  : ""
              } ${plan.is_popular || plan.is_free ? "shadow-md" : ""}`}
            >
              {isPreSelected && (
                <div className="bg-[var(--color-primary)] text-white text-center py-2 rounded-t-[1.4rem] text-sm font-medium">
                  Selected plan
                </div>
              )}
              {plan.is_popular && !isPreSelected && (
                <div className="bg-[var(--color-primary)] text-white text-center py-2 rounded-t-[1.4rem] text-sm font-medium">
                  Most popular
                </div>
              )}
              {plan.is_free && !plan.is_popular && !isPreSelected && (
                <div className="bg-[var(--color-primary)] text-white text-center py-2 rounded-t-[1.4rem] text-sm font-medium">
                  Free
                </div>
              )}
              <CardHeader
                className={
                  plan.is_popular || plan.is_free || isPreSelected
                    ? "pt-4"
                    : "pt-6"
                }
              >
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline mt-3">
                  {plan.is_free ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">
                        €{plan.price.toFixed(0)}
                      </span>
                      <span className="ml-1 text-sm text-muted-foreground">
                        /{plan.interval}
                      </span>
                    </>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="mr-2 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
                        <Check className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {tempUserData ? (
                  // For temporary user data, use direct button click handler
                  <Button
                    variant="default"
                    className="w-full rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]"
                    onClick={() => handlePlanClick(plan)}
                    disabled={
                      isRegistering ||
                      processingPlan !== null ||
                      navigatingPlan !== null
                    }
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {plan.is_free ? "Registering..." : "Processing..."}
                      </>
                    ) : (
                      plan.button_text ||
                      (plan.is_free ? "Get Started Free" : "Select Plan")
                    )}
                  </Button>
                ) : (
                  // For all other cases, use button navigation with loading
                  <Button
                    variant="default"
                    className="w-full rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]"
                    onClick={() => handlePlanNavigation(plan)}
                    disabled={
                      navigatingPlan !== null ||
                      isRegistering ||
                      processingPlan !== null
                    }
                  >
                    {navigatingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      plan.button_text ||
                      (plan.is_free ? "Get Started Free" : "Select Plan")
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PricingTable;
