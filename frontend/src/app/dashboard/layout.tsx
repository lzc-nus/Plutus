"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [canRenderDashboard, setCanRenderDashboard] = useState(false);

  useEffect(() => {
    function verifyAuth() {
      const token = localStorage.getItem("plutus_access_token");

      if (!token) {
        setCanRenderDashboard(false);
        router.replace("/");
        return;
      }

      setCanRenderDashboard(true);
    }

    verifyAuth();
    window.addEventListener("pageshow", verifyAuth);
    window.addEventListener("focus", verifyAuth);
    window.addEventListener("storage", verifyAuth);

    return () => {
      window.removeEventListener("pageshow", verifyAuth);
      window.removeEventListener("focus", verifyAuth);
      window.removeEventListener("storage", verifyAuth);
    };
  }, [pathname, router]);

  if (!canRenderDashboard) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
