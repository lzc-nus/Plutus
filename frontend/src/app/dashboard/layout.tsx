"use client";

import { 
  useEffect, 
  useState, 
  type ReactNode 
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { getMe } from "@/lib/api/users";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import type { UserRead } from "@/lib/api/generated";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserRead | null>(null);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      const { data, error, response } = await getMe();

      if (!active) {
        return;
      }

      if (response?.status === 401 || response?.status === 403) {
        setReady(false);
        setUser(null);
        router.replace("/login");
        return;
      }

      if (error || !response?.ok || !data) {
        setReady(false);
        setUser(null);
        router.replace("/login");
        return;
      }

      setUser(data);
      setReady(true);
    }

    void checkAuth();

    window.addEventListener("pageshow", checkAuth);
    window.addEventListener("focus", checkAuth);
    window.addEventListener("storage", checkAuth);
    window.addEventListener("plutus-auth-refresh", checkAuth);

    return () => {
      active = false;

      window.removeEventListener("pageshow", checkAuth);
      window.removeEventListener("focus", checkAuth);
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("plutus-auth-refresh", checkAuth);
    };
  }, [pathname, router]);

  if (!ready || !user) {
    return null;
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="flex h-screen bg-[#f4efe6]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header currentUser={user} />
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
