"use client";

import { useEffect, useState } from "react";
import type { UserRead } from "@/lib/api/generated";
import { getMe } from "@/lib/api/users";

export function useOptionalViewer() {
  const [viewer, setViewer] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchViewer() {
      try {
        const res = await getMe();
        if (mounted) {
          setViewer(res.data ?? null);
        }
      } catch {
        if (mounted) {
          setViewer(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchViewer();

    window.addEventListener("plutus-auth-refresh", fetchViewer);
    
    return () => {
      mounted = false;
      window.removeEventListener("plutus-auth-refresh", fetchViewer);
    };
  }, []);
  
  return { viewer, loading };
}
