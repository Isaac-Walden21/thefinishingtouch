"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AppUser, Company } from "@/lib/types";

interface AuthContextValue {
  user: AppUser | null;
  company: Company | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  company: null,
  loading: true,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setCompany(data.company);
      })
      .catch(() => {
        setUser(null);
        setCompany(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, company, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
