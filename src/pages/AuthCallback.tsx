import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/ApiService';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Errore di autenticazione',
          description: 'Si è verificato un errore durante l\'accesso con il provider sociale.',
        });
        navigate('/login');
        return;
      }

      if (token) {
        try {
          // Store token and fetch user data
          localStorage.setItem('auth_token', token);

          // Fetch user data using the token
          const userData = await getCurrentUser(token);
          
          toast({
            title: 'Accesso effettuato',
            description: 'Benvenuto nella piattaforma',
          });
          
          navigate('/dashboard');
        } catch (error) {
          console.error('Error during OAuth callback:', error);
          toast({
            variant: 'destructive',
            title: 'Errore',
            description: 'Si è verificato un errore durante l\'accesso.',
          });
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--color-primary)] mx-auto"></div>
        <p className="mt-4 text-lg">Completamento accesso...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
