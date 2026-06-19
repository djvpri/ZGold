"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: number;
  email: string;
  nama: string;
  role: string;
}

interface AuthTenant {
  id: number;
  nama_toko: string;
  slug: string;
  plan: string;
  settings?: any;
}

interface AuthContextType {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenant: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<AuthTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchMe() {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        setUser(null);
        setTenant(null);
        return;
      }
      const data = await res.json();
      setUser(data.data.user);
      setTenant(data.data.tenant);
    } catch {
      setUser(null);
      setTenant(null);
    }
  }

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setTenant(null);
    router.push("/login");
  }

  async function refresh() {
    await fetchMe();
  }

  return (
    <AuthContext.Provider value={{ user, tenant, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);