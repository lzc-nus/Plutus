"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { UserRead } from "@/lib/api/generated";
import { getMe } from "@/lib/api/users";

interface AuthContextValue {
  /** The authenticated user. Null if not yet loaded or unauthenticated. */
  user: UserRead | null;
  /** True while the initial /users/me fetch is in flight. */
  loading: boolean;
  /** Call this after a profile update to sync the context without a refetch. */
  setUser: (user: UserRead) => void;
  /** Clears the user — call on logout. */
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((res) => {
        setUser(res.data ?? null);
      })
      .catch(() => {
        // Token missing, expired, or invalid — leave user as null.
        // The app's existing auth guard will handle the redirect to login.
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function clearUser() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };