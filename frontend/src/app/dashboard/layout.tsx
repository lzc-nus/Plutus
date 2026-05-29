"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { getCurrentUser } from "@/lib/api/users";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [canRenderDashboard, setCanRenderDashboard] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      const token = localStorage.getItem("plutus_access_token");

      if (!token) {
        if (isMounted) {
          setCanRenderDashboard(false);
        }
        router.replace("/login");
        return;
      }

      const { error, response } = await getCurrentUser();

      if (!isMounted) {
        return;
      }

      if (response?.status === 401 || response?.status === 403) {
        localStorage.removeItem("plutus_access_token");
        setCanRenderDashboard(false);
        router.replace("/login");
        return;
      }

      if (error || !response?.ok) {
        setCanRenderDashboard(false);
        router.replace("/login");
        return;
      }

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

  if (!canRenderDashboard) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#f4efe6]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
