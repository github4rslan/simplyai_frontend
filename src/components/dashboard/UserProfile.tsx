import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, KeyRound } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(2, "Il nome deve contenere almeno 2 caratteri"),
  lastName: z.string().min(2, "Il cognome deve contenere almeno 2 caratteri"),
  email: z.string().email("Inserisci un indirizzo email valido").optional(),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(6, "La password deve contenere almeno 6 caratteri"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

export const UserProfile = () => {
  const { toast } = useToast();
  const { user } = useAuth(); // Make sure token is available from auth context
  const token = localStorage.getItem("auth_token");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!token) return;

      try {
        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Errore nel caricamento del profilo");
        }

        const data = await response.json();

        if (data.success) {
          form.setValue("firstName", data.data.firstName || "");
          form.setValue("lastName", data.data.lastName || "");
          form.setValue("email", data.data.email || "");
        }
      } catch (error) {
        console.error("Errore nel caricamento del profilo:", error);
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Non è stato possibile caricare i dati del profilo",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [token, form, toast]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
        }),
      });

      if (!response.ok) {
        throw new Error("Errore nell'aggiornamento del profilo");
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Profilo aggiornato",
          description:
            "Le informazioni del profilo sono state aggiornate con successo",
        });
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento del profilo:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Non è stato possibile aggiornare il profilo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    try {
      setIsPasswordLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: values.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Errore nell'aggiornamento della password");
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Password aggiornata",
          description: "La tua password è stata aggiornata con successo",
        });

        passwordForm.reset();
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento della password:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Non è stato possibile aggiornare la password",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profilo Utente</CardTitle>
          <CardDescription>
            Gestisci le informazioni del tuo profilo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Inserisci il tuo nome"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Inserisci il tuo cognome"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" disabled {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    "Salva Modifiche"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Cambio Password
          </CardTitle>
          <CardDescription>Modifica la tua password di accesso</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nuova Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Inserisci la nuova password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conferma Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Conferma la nuova password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isPasswordLoading}
                className="w-full"
              >
                {isPasswordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aggiornamento Password...
                  </>
                ) : (
                  "Aggiorna Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
