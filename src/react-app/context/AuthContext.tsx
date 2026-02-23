import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/react-app/types";
import { signup as authSignup, login as authLogin, logout as authLogout } from "@/services/authService";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: {
    name: string;
    email: string;
    password: string;
    locality: string;
    phone: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const storedUser = localStorage.getItem("swachhpath_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        console.warn("Failed to parse stored user");
        localStorage.removeItem("swachhpath_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await authLogin(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      return true;
    }
    return false;
  };

  const signup = async (userData: {
    name: string;
    email: string;
    password: string;
    locality: string;
    phone: string;
  }): Promise<{ success: boolean; message: string }> => {
    const result = await authSignup(userData);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return {
      success: result.success,
      message: result.message,
    };
  };

  const logout = () => {
    setUser(null);
    authLogout();
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

