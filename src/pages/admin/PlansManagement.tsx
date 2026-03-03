import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAllPlansForAdmin, deletePlan, updatePlanStatus } from "@/services/ApiService";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[] | any;
  is_popular: boolean | null;
  is_free: boolean | null;
  active: boolean | null;
}

const PlansManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const plansData = await fetchAllPlansForAdmin();
      if (plansData) {
        setPlans(
          plansData.map((plan: any) => ({
            ...plan,
            features: Array.isArray(plan.features)
              ? plan.features
              : typeof plan.features === "string"
              ? JSON.parse(plan.features || "[]")
              : plan.features || [],
            is_free: Boolean(plan.is_free),
          }))
        );
      }
    } catch (error) {
      toast({
        title: "Load failed",
        description: "Could not load subscription plans.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await deletePlan(planToDelete.id);
      toast({ title: "Plan deleted", description: "The plan was removed." });
      loadPlans();
    } catch {
      toast({
        title: "Delete failed",
        description: "Could not delete the selected plan.",
        variant: "destructive",
      });
    } finally {
      setPlanToDelete(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean | null) => {
    try {
      await updatePlanStatus(id, !isActive);
      toast({
        title: isActive ? "Plan deactivated" : "Plan activated",
        description: "Status updated successfully.",
      });
      loadPlans();
    } catch {
      toast({
        title: "Update failed",
        description: "Could not update plan status.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const renderPlanType = (plan: Plan) => {
    if (plan.is_free) {
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Free</Badge>;
    }
    if (plan.is_popular) {
      return <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">Popular</Badge>;
    }
    return <Badge variant="outline">Standard</Badge>;
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-cyan-100 bg-white/95 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Plan Management</h1>
          <p className="mt-1 text-sm text-slate-600">Create and maintain subscription plans.</p>
        </div>
        <Button onClick={() => navigate("/admin/plans/create")} className="bg-cyan-700 text-white hover:bg-cyan-800">
          <Plus className="mr-2 h-4 w-4" />
          New Plan
        </Button>
      </section>

      <Card className="border-cyan-100 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>{plans.length} plan(s) configured.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading plans...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                      No plans found.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{renderPlanType(plan)}</TableCell>
                      <TableCell>{plan.is_free ? "Free" : formatPrice(plan.price)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={plan.active === true}
                          onCheckedChange={() => handleToggleActive(plan.id, plan.active)}
                          aria-label={`${plan.active ? "Disable" : "Enable"} ${plan.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/plans/edit/${plan.id}`)}>
                            <Edit className="mr-1 h-4 w-4" />Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setPlanToDelete(plan)}>
                            <Trash2 className="mr-1 h-4 w-4" />Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!planToDelete} onOpenChange={() => setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and will remove the plan "{planToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlansManagement;
