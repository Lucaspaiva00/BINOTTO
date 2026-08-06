import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { tokenStorage } from "@/services/api/tokenStorage";
import { SESSION_EXPIRED_EVENT } from "@/services/api/client";
import type { AuthUser } from "@/types/auth";

const USER_KEY = "@binotto:user";

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // resgata token armazenado
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    const token = tokenStorage.get();

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // monitora a expiração da sessão e realiza o logout automaticamente.
  useEffect(() => {
    function handleSessionExpired() {
      logout();
      toast.error("Sessão expirada. Faça login novamente.");
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  async function login(email: string, senha: string) {
    const { access_token, user: loggedUser } = await authService.login({ email, senha });

    tokenStorage.set(access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
  }

  function logout() {
    tokenStorage.remove();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  function updateUser(updatedUser: AuthUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateUser, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
