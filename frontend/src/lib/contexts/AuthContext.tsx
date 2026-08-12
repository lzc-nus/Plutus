"use client";

import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { UserRead } from "@/lib/api/generated";
import { getMe } from "@/lib/api/users";

interface AuthContextValue {
  // The authenticated user. Null if not yet unauthenticated.
  user: UserRead | null;
  // True while the initial /users/me fetch is in flight.
  loading: boolean;
  // Call this after a profile update to sync the context without refetching.
  setUser: (user: UserRead) => void;
  // Clear the user on logout.
  clearUser: () => void;
}

type AuthProviderProps = {
  children: ReactNode;
  initialUser?: UserRead | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<UserRead | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    if (initialUser) {
      return;
    }

    getMe()
      .then((res) => {
        setUser(res.data ?? null);
      })
      .catch(() => {
        // If token missing, expired, or invalid, leave user as null.
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialUser]);

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
