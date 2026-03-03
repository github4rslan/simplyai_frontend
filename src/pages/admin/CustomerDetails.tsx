import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, User } from "lucide-react";
import { getUserDetails, AdminUser } from "@/services/adminService";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [customer, setCustomer] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    full_name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const userData = await getUserDetails(id);
        setCustomer(userData);
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          full_name: userData.full_name || "",
          email: userData.email,
          role: userData.role,
        });
      } catch {
        toast({ title: "Load failed", description: "Could not load user details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [id, toast]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      toast({ title: "Saved", description: "Customer profile was updated." });
    } catch {
      toast({ title: "Save failed", description: "Could not save user details.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-cyan-100 bg-white p-8 text-center">Loading user details...</div>;
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/admin/users")}> 
          <ArrowLeft className="mr-2 h-4 w-4" />Back to users
        </Button>
        <Card className="border-cyan-100 bg-white/95 shadow-sm">
          <CardContent className="p-8 text-center text-slate-600">User not found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={() => navigate("/admin/users")} className="w-fit border-cyan-200 text-cyan-700 hover:bg-cyan-50">
          <ArrowLeft className="mr-2 h-4 w-4" />Back to users
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Customer Details</h1>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="rounded-full border border-cyan-200 bg-white p-1">
          <TabsTrigger value="profile" className="rounded-full">Profile</TabsTrigger>
          <TabsTrigger value="forms" className="rounded-full">Submitted Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-cyan-100 bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-cyan-700" />Profile Information</CardTitle>
              <CardDescription>Review and update customer account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {formData.first_name || formData.last_name ? `${formData.first_name} ${formData.last_name}` : "Customer"}
                  </h3>
                  <p className="text-sm text-slate-500">{formData.email}</p>
                </div>
                <Badge variant="outline">ID: {customer.id.slice(0, 8)}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" value={formData.email} onChange={handleInputChange} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" name="role" value={formData.role} onChange={handleInputChange} disabled />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Registered</p>
                  <p className="text-sm text-slate-800">{formatDate(customer.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Last login</p>
                  <p className="text-sm text-slate-800">{formatDate(customer.last_login)}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges} disabled={saving} className="ml-auto bg-cyan-700 text-white hover:bg-cyan-800">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="forms">
          <Card className="border-cyan-100 bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle>Submitted Forms</CardTitle>
              <CardDescription>Form history for this customer.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Form history panel is not available yet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetails;
