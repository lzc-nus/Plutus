"use client";

import { useEffect, useState } from "react";
import type { UserRead } from "@/lib/api/generated";
import { getMe } from "@/lib/api/users";

export function useOptionalViewer() {
  const [viewer, setViewer] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getMe()
      .then((res) => {
        if (mounted) {
          setViewer(res.data ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setViewer(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { viewer, loading };
}
