import { authLogin, authRegister } from "@/lib/api/generated";
import type { LoginRequest, RegisterRequest } from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

export async function loginWithEmailPassword(body: LoginRequest) {
  configureApiClient();
  return authLogin({ body });
}

export async function registerAccount(body: RegisterRequest) {
  configureApiClient();
  return authRegister({ body });
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const detail = "detail" in error ? error.detail : undefined;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const firstError = detail[0];

    if (firstError && typeof firstError === "object" && "msg" in firstError) {
      return String(firstError.msg);
    }
  }

  return fallback;
}
