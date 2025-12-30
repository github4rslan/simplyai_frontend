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
  isAdmin?: boolean;
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
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
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
    console.log("📝 setUser called:", newUser ? newUser.email : "null");
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      console.log("💾 User saved to localStorage");
    } else {
      localStorage.removeItem("user");
      console.log("🗑️ User removed from localStorage");
    }
  };

  const setToken = (newToken: string | null) => {
    console.log("🔑 setToken called:", newToken ? "token exists" : "null");
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("auth_token", newToken);
      console.log("💾 Token saved to localStorage");
    } else {
      localStorage.removeItem("auth_token");
      console.log("🗑️ Token removed from localStorage");
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("🚀 Starting auth initialization...");

      try {
        const savedToken = localStorage.getItem("auth_token");
        const savedUser = localStorage.getItem("user");

        console.log("📦 LocalStorage check:", {
          hasToken: !!savedToken,
          tokenLength: savedToken?.length,
          hasUser: !!savedUser,
          userLength: savedUser?.length,
        });

        if (!savedToken) {
          console.log("⚠️ No token found in localStorage");
          setLoading(false);
          return;
        }

        // Set token immediately
        setTokenState(savedToken);
        console.log("✅ Token set in state");

        // Parse and set user immediately
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log("📄 Parsed user from localStorage:", parsedUser.email);

            const userWithRole = {
              ...parsedUser,
              isAdmin: parsedUser.role === "administrator",
            };

            setUserState(userWithRole);
            console.log("✅ User set in state:", {
              email: userWithRole.email,
              role: userWithRole.role,
              isAdmin: userWithRole.isAdmin,
            });
          } catch (e) {
            console.error("❌ Error parsing saved user:", e);
            localStorage.removeItem("user");
          }
        } else {
          console.warn("⚠️ No user found in localStorage despite having token");
        }

        // Verify token in background (don't clear on failure)
        try {
          console.log("🔄 Verifying token with backend...");
          const response = await getCurrentUser(savedToken);

          console.log("📡 Backend response:", {
            success: response.success,
            hasData: !!response.data,
          });

          if (response.success && response.data) {
            const userWithRole = {
              ...response.data,
              isAdmin: response.data.role === "administrator",
            };
            setUserState(userWithRole);
            localStorage.setItem("user", JSON.stringify(userWithRole));
            console.log(
              "✅ Token verified, user refreshed:",
              userWithRole.email
            );
          } else {
            console.error("❌ Token verification failed:", response.message);
            // Only clear if explicitly unauthorized
            if (
              response.message?.includes("unauthorized") ||
              response.message?.includes("invalid")
            ) {
              console.log("🗑️ Clearing invalid token");
              localStorage.removeItem("auth_token");
              localStorage.removeItem("user");
              setTokenState(null);
              setUserState(null);
            }
          }
        } catch (error: any) {
          console.error("❌ Error verifying token:", error.message);
          console.log("ℹ️ Keeping cached user data (might be network issue)");
          // Don't clear user data on network errors
        }
      } catch (error) {
        console.error("❌ Fatal error initializing auth:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        setTokenState(null);
        setUserState(null);
      } finally {
        setLoading(false);
        console.log("✅ Auth initialization complete", {
          hasUser: !!user,
          hasToken: !!token,
        });
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - run once on mount

  const login = async (email: string, password: string) => {
    try {
      console.log("🔐 Attempting login for:", email);
      const response = await loginUser({ email, password });

      if (response.success) {
        const { user: userData, token: userToken } = response.data;

        const userWithRole = {
          ...userData,
          isAdmin: userData.role === "administrator",
        };

        setUser(userWithRole);
        setToken(userToken);
        console.log("✅ Login successful:", userWithRole.email);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
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
      console.log("📝 Attempting registration for:", userData.email);
      const response = await registerUser(userData);

      if (response.success) {
        if (response.data?.requiresPayment) {
          console.log("💳 Payment required");
          return response;
        } else {
          const { user: userInfo, token: userToken } = response.data;
          const userWithRole = {
            ...userInfo,
            isAdmin: userInfo.role === "administrator",
          };
          setUser(userWithRole);
          setToken(userToken);
          console.log("✅ Registration successful:", userWithRole.email);
        }
      } else {
        throw new Error(response.message);
      }

      return response;
    } catch (error) {
      console.error("❌ Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      console.log("✅ Logout complete");
      console.log("🚪 Logging out...");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  // Log state changes
  useEffect(() => {
    console.log("🔄 Auth state changed:", {
      hasUser: !!user,
      hasToken: !!token,
      loading,
      isAuthenticated: !!user && !!token,
      userEmail: user?.email,
    });
  }, [user, token, loading]);

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
    setUser,
    setToken,
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
