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
  isLoading: boolean;
  session: any;
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
  signOut: () => void;
  setUser: (user: User | null) => void; // ✅ Add this
  setToken: (token: string | null) => void; // ✅ Add this
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  };
  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("auth_token", newToken);
    } else {
      localStorage.removeItem("auth_token");
    }
  };
  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem("auth_token");
        const savedUser = localStorage.getItem("user");

        if (savedToken) {
          setTokenState(savedToken);

          // If we have saved user data, use it immediately
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setUserState({
                ...parsedUser,
                isAdmin: parsedUser.role === "administrator",
              });
            } catch (e) {
              console.error("Error parsing saved user:", e);
            }
          }

          // Verify token and get fresh user data
          try {
            const response = await getCurrentUser(savedToken);
            if (response.success && response.data) {
              const userWithRole = {
                ...response.data,
                isAdmin: response.data.role === "administrator",
              };
              setUserState(userWithRole);
              localStorage.setItem("user", JSON.stringify(userWithRole));
            } else {
              // Token is invalid, remove it
              localStorage.removeItem("auth_token");
              localStorage.removeItem("user");
              setTokenState(null);
              setUserState(null);
            }
          } catch (error) {
            console.error("Error verifying token:", error);
            // Keep the saved user data even if verification fails
            // (offline support)
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        setTokenState(null);
        setUserState(null);
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

        const userWithRole = {
          ...userData,
          isAdmin: userData.role === "administrator",
        };

        setUser(userWithRole);
        setToken(userToken);
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
        if (response.data?.requiresPayment) {
          return response;
        } else {
          const { user: userInfo, token: userToken } = response.data;
          const userWithRole = {
            ...userInfo,
            isAdmin: userInfo.role === "administrator",
          };
          setUser(userWithRole);
          setToken(userToken);
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
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isLoading: loading,
    session: user ? { user } : null,
    login,
    register,
    logout,
    signOut: logout,
    setUser, // ✅ Expose setUser
    setToken, // ✅ Expose setToken
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
