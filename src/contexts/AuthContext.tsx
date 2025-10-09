import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from "@/services/ApiService";

interface User {
  password: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "user" | "premium_user" | "administrator";
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  isAdmin?: boolean; // Computed property for backward compatibility
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isLoading: boolean; // Alias for loading for backward compatibility
  session: any; // For backward compatibility with Supabase
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    subscription_plan?: string;
  }) => Promise<void>;
  logout: () => void;
  signOut: () => void; // Alias for backward compatibility
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem("auth_token");

        if (savedToken) {
          setToken(savedToken);

          // Verify token and get user data
          const response = await getCurrentUser(savedToken);
          if (response.success) {
            // Ensure isAdmin is computed from role for backward compatibility
            const userWithRole = {
              ...response.data.user,
              isAdmin: response.data.user.role === "administrator",
            };
            setUser(userWithRole);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem("auth_token");
            setToken(null);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("auth_token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await loginUser({ email, password });

      if (response.success) {
        const { user: userData, token: userToken } = response.data;

        // Ensure isAdmin is computed from role for backward compatibility
        const userWithRole = {
          ...userData,
          isAdmin: userData.role === "administrator",
        };

        setUser(userWithRole);
        setToken(userToken);
        localStorage.setItem("auth_token", userToken);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    subscription_plan?: string;
  }) => {
    try {
      const response = await registerUser(userData);

      if (response.success) {
        // Check if this requires payment (temporary registration)
        if (response.data?.requiresPayment) {
          // Don't set auth token yet - user needs to complete payment
          return response;
        } else {
          // Free plan or direct registration - set auth immediately
          const { user: userInfo, token: userToken } = response.data;

          setUser(userInfo);
          setToken(userToken);
          localStorage.setItem("auth_token", userToken);
        }
      } else {
        throw new Error(response.message);
      }

      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutUser(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("auth_token");
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isLoading: loading, // Alias for backward compatibility
    session: user ? { user } : null, // Mock session for backward compatibility
    login,
    register,
    logout,
    signOut: logout, // Alias for backward compatibility
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
