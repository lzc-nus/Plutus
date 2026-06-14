import { useContext } from "react";
import { AuthContext } from "@/lib/contexts/AuthContext";

/**
 * Returns the current authenticated user and related helpers.
 *
 * Must be used inside a component that is a descendant of AuthProvider.
 *
 * @example
 * const { user, loading } = useAuth();
 * if (loading) return <Spinner />;
 * if (!user) return null;
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}