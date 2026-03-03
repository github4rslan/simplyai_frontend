
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Credenziali predefinite (usate solo per pre-riempire il campo email)
const DEFAULT_ADMIN_EMAIL = 'admin@simpolyai.com';

// Form schema con validazione
const formSchema = z.object({
  email: z.string()
    .email({
      message: "Please enter a valid email address.",
    }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters long.",
  }),
});

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  useEffect(() => {
    // Se già loggato e admin, reindirizza alla dashboard admin
    if (user && user.isAdmin) {
      navigate('/admin');
    }
  }, [user, navigate]);

  // Clear error message on component mount/refresh
  useEffect(() => {
    setError('');
    setHasAttemptedLogin(false);
  }, []);

  // Inizializza il form con l'email predefinita per facilitare il login
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: DEFAULT_ADMIN_EMAIL,
      password: '',
    },
  });

  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError('');
      setHasAttemptedLogin(true); // Mark that user has attempted login
      
      // Rimuovi spazi bianchi dai valori di input
      const trimmedEmail = values.email.trim();
      const trimmedPassword = values.password.trim();
      
      console.log('Tentativo di accesso admin con:', trimmedEmail);
      
      // Usa il login del contesto auth con MySQL
      await login(trimmedEmail, trimmedPassword);
      
      // Verifica che l'utente sia un admin dopo il login
      // Il controllo viene fatto in useEffect quando user cambia
      
    } catch (error) {
      console.error('Errore di login admin:', error);
      
      // Gestione personalizzata degli errori
      if (error.message?.includes('Invalid credentials') || error.message?.includes('Credenziali non valide')) {
        setError('Invalid credentials. Please contact the system administrator.');
      } else if (error.message?.includes('User not found')) {
        setError('User not found. Please contact the system administrator.');
      } else {
        setError(`Login error: ${error.message || 'Unknown error'}`);
      }

      toast({
        title: 'Access error',
        description: 'Please check your administrator credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Controlla se l'utente è admin dopo il login
  useEffect(() => {
    if (user && !loading && hasAttemptedLogin) {
      if (user.role === 'administrator') {
        toast({
          title: 'Login successful',
          description: 'Welcome to the administration panel',
        });
        navigate('/admin');
      } else {
        setError('Access denied. The user does not have administrator privileges.');
        toast({
          title: 'Access denied',
          description: 'You do not have the necessary privileges to access the administration panel',
          variant: 'destructive',
        });
        
        // Logout dell'utente non-admin
        logout();
        setHasAttemptedLogin(false); // Reset the flag
      }
    }
  }, [user, loading, hasAttemptedLogin, navigate, toast, logout]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">SimplyAI Admin</CardTitle>
          <CardDescription>
            Log in to the administration panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Administrator email"
                        {...field}
                      />
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
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Administrator password"
                          {...field} 
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-600">
          <p>
            Use the administrator credentials provided by the system.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
