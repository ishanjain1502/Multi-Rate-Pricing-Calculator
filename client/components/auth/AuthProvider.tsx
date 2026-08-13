// client/components/auth/AuthProvider.tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api";
import type { User } from "@/lib/types";

const TOKEN_KEY = "crossval_token";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        api.setAuthToken(token);
        try {
          setUser(await api.fetchMe());
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          api.setAuthToken(null);
        }
      }
      setLoading(false);
    }
    void restore();
  }, []);

  const handleAuth = useCallback(async (fn: () => Promise<{ user: User; token: string }>) => {
    const { user, token } = await fn();
    localStorage.setItem(TOKEN_KEY, token);
    api.setAuthToken(token);
    setUser(user);
  }, []);

  const login = useCallback(
    (email: string, password: string) => handleAuth(() => api.login(email, password)),
    [handleAuth],
  );

  const signup = useCallback(
    (email: string, password: string) => handleAuth(() => api.signup(email, password)),
    [handleAuth],
  );

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
    api.setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
