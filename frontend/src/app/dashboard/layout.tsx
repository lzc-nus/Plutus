"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { getMe } from "@/lib/api/users";
import { AuthProvider } from "@/lib/contexts/AuthContext"
import type { UserRead } from "@/lib/api/generated";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [canRenderDashboard, setCanRenderDashboard] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserRead | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      const token = localStorage.getItem("plutus_access_token");

      if (!token) {
        if (isMounted) {
          setCanRenderDashboard(false);
          setCurrentUser(null);
        }
        router.replace("/login");
        return;
      }

      const { data, error, response } = await getMe();

      if (!isMounted) {
        return;
      }

      if (response?.status === 401 || response?.status === 403) {
        localStorage.removeItem("plutus_access_token");
        setCanRenderDashboard(false);
        setCurrentUser(null);
        router.replace("/login");
        return;
      }

      if (error || !response?.ok || !data) {
        setCanRenderDashboard(false);
        setCurrentUser(null);
        router.replace("/login");
        return;
      }

      setCurrentUser(data);
      setCanRenderDashboard(true);
    }

    function handleAuthCheck() {
      void verifyAuth();
    }

    handleAuthCheck();
    window.addEventListener("pageshow", handleAuthCheck);
    window.addEventListener("focus", handleAuthCheck);
    window.addEventListener("storage", handleAuthCheck);

    return () => {
      isMounted = false;
      window.removeEventListener("pageshow", handleAuthCheck);
      window.removeEventListener("focus", handleAuthCheck);
      window.removeEventListener("storage", handleAuthCheck);
    };
  }, [pathname, router]);

  if (!canRenderDashboard || !currentUser) {
    return null;
  }

  return (
    <AuthProvider>
      <div className="flex h-screen bg-[#f4efe6]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header currentUser={currentUser} />
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
