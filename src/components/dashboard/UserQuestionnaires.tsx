import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckSquare, Clock, FileText, Loader2, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchUserQuestionnairesWithAccess } from "@/services/ApiService";

interface Questionnaire {
  id: string;
  title: string;
  status: string;
  description?: string;
  sequence_order?: number;
  canAccess: boolean;
  reason: string;
  nextAvailableDate?: string;
  completionCount: number;
}

export const UserQuestionnaires = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);

  useEffect(() => {
    const loadQuestionnaires = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await fetchUserQuestionnairesWithAccess(user.id);

        if (result.success && result.data) {
          setQuestionnaires(result.data);
        } else {
          setQuestionnaires([]);
        }
      } catch (error) {
        setQuestionnaires([]);
        toast({
          variant: "destructive",
          title: "Load failed",
          description: "Could not load questionnaires.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionnaires();
  }, [user, toast]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In progress";
      case "available":
        return "Available";
      case "waiting":
        return "Waiting";
      case "locked":
        return "Locked";
      default:
        return "Not started";
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "in_progress":
        return "bg-amber-100 text-amber-700";
      case "available":
        return "bg-cyan-100 text-cyan-700";
      case "waiting":
        return "bg-violet-100 text-violet-700";
      case "locked":
        return "bg-slate-200 text-slate-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getButtonText = (item: Questionnaire) => {
    if (!item.canAccess) {
      return item.status === "waiting" ? "Not yet available" : "Unavailable";
    }

    if (item.status === "completed") {
      return item.completionCount > 0 ? `Completed (${item.completionCount})` : "Completed";
    }

    return item.completionCount > 0 ? "Repeat" : "Start";
  };

  const getButtonIcon = (item: Questionnaire) => {
    if (!item.canAccess) {
      return item.status === "waiting" ? (
        <Clock className="mr-2 h-4 w-4" />
      ) : (
        <Lock className="mr-2 h-4 w-4" />
      );
    }

    return item.status === "completed" ? (
      <FileText className="mr-2 h-4 w-4" />
    ) : (
      <CheckSquare className="mr-2 h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <Card className="border-cyan-100 bg-white/90 shadow-sm">
        <CardContent className="py-12">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!questionnaires.length) {
    return (
      <Card className="border-cyan-100 bg-white/90 shadow-sm">
        <CardContent className="py-12 text-center">
          <CheckSquare className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-700">No questionnaires available yet</p>
          <p className="mt-1 text-sm text-slate-500">Please check back later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cyan-100 bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle>Questionnaires</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questionnaires.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-200"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                  {item.sequence_order ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      Step {item.sequence_order}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                {item.description ? (
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                ) : null}
                {!item.canAccess && item.reason ? (
                  <p className="mt-2 text-sm text-amber-700">{item.reason}</p>
                ) : null}
              </div>

              <Button
                disabled={!item.canAccess}
                onClick={() => navigate(`/questionnaire/${item.id}`)}
                className={
                  item.canAccess
                    ? "bg-cyan-600 text-white hover:bg-cyan-700"
                    : "bg-slate-200 text-slate-500 hover:bg-slate-200"
                }
              >
                {getButtonIcon(item)}
                {getButtonText(item)}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
