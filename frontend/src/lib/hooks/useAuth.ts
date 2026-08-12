import { useContext } from "react";
import { AuthContext } from "@/lib/contexts/AuthContext";

/**
 * Return the current authenticated user and related helpers.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}