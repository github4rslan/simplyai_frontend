import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckSquare,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserSubscription } from "@/services/ApiService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Subscription {
  id: string;
  plan_name: string;
  plan_type: string;
  started_at: string;
  expires_at: string;
  status: "active" | "expired" | "canceled";
  is_free: boolean;
  features: string[];
  next_questionnaire_date?: string;
  questionnaires: {
    id: string;
    name: string;
    status: "completed" | "pending" | "available";
    available_at?: string;
    sequence?: number;
  }[];
}

export const UserSubscriptions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user || !token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await fetchUserSubscription(token);

        if (result.success && result.data) {
          const { plan, subscription_id, started_at, expires_at, is_active, questionnaires } = result.data;

          const mapped: Subscription = {
            id: subscription_id,
            plan_name: plan?.name || "",
            plan_type: plan?.plan_type || "single",
            started_at,
            expires_at,
            status: is_active ? "active" : "expired",
            is_free: !!plan?.is_free,
            features: Array.isArray(plan?.features) ? plan.features : [],
            questionnaires: Array.isArray(questionnaires)
              ? questionnaires.map((q: any) => ({
                  id: q.id,
                  name: q.name,
                  status:
                    q.status === "completed" || q.status === "pending" || q.status === "available"
                      ? q.status
                      : "available",
                  available_at: q.available_at,
                  sequence: q.sequence,
                }))
              : [],
          };

          setSubscriptions([mapped]);
        } else {
          setSubscriptions([]);
        }
      } catch (error: any) {
        setSubscriptions([]);
        const message = error?.message || "Could not load subscription data.";

        toast({
          variant: "destructive",
          title: "Subscription error",
          description: message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, [user, token, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Expired</Badge>;
      case "canceled":
        return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">Canceled</Badge>;
      case "completed":
        return <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
      default:
        return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">Unknown</Badge>;
    }
  };

  const getPlanTypeIcon = (planType: string) => {
    switch (planType) {
      case "verification":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "periodic":
        return <RotateCcw className="h-5 w-5 text-cyan-600" />;
      case "multiple":
        return <FileText className="h-5 w-5 text-emerald-600" />;
      default:
        return <CheckSquare className="h-5 w-5 text-slate-600" />;
    }
  };

  const getPlanTypeName = (planType: string) => {
    switch (planType) {
      case "single":
        return "Single questionnaire";
      case "verification":
        return "Verification cycle";
      case "periodic":
        return "Periodic questionnaires";
      case "multiple":
        return "Multiple questionnaires";
      case "progress":
        return "Learning progression";
      default:
        return "Standard plan";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-cyan-100 bg-white/90 shadow-sm">
        <CardContent className="py-10">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptions.length) {
    return (
      <Card className="border-cyan-100 bg-white/90 shadow-sm">
        <CardContent className="py-10 text-center">
          <CreditCard className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-700">No active subscriptions</p>
          <Button onClick={() => navigate("/pricing")} className="mt-4 bg-cyan-600 text-white hover:bg-cyan-700">
            View plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cyan-100 bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <CardDescription>Review your active plan and included questionnaires.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptions.map((subscription) => (
          <div key={subscription.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {getPlanTypeIcon(subscription.plan_type)}
                  <h3 className="text-lg font-semibold text-slate-900">{subscription.plan_name}</h3>
                </div>
                <p className="mt-1 text-sm text-slate-600">{getPlanTypeName(subscription.plan_type)}</p>
              </div>
              {getStatusBadge(subscription.status)}
            </div>

            {subscription.next_questionnaire_date ? (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                Next scheduled questionnaire: {new Date(subscription.next_questionnaire_date).toLocaleDateString("en-US")}
              </div>
            ) : null}

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Start date</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{new Date(subscription.started_at).toLocaleDateString("en-US")}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Expiry date</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{new Date(subscription.expires_at).toLocaleDateString("en-US")}</p>
              </div>
            </div>

            {subscription.features.length > 0 ? (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-slate-800">Plan features</p>
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {subscription.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 rounded-lg bg-cyan-50 p-2 text-sm text-slate-700">
                      <CheckSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-medium text-slate-800">Included questionnaires</p>
              {subscription.questionnaires.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                  No questionnaires assigned to this plan.
                </p>
              ) : (
                <div className="space-y-2">
                  {subscription.questionnaires.map((q) => (
                    <div key={q.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{q.name}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          {getStatusBadge(q.status)}
                          {q.available_at ? (
                            <span>Available: {new Date(q.available_at).toLocaleDateString("en-US")}</span>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={q.status === "pending"}
                        onClick={() => navigate(`/questionnaire/${q.id}`)}
                        className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                      >
                        {q.status === "pending" ? "Pending" : q.status === "completed" ? "View" : "Open"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
