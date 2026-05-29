import { usersMe } from "@/lib/api/generated";
import { configureApiClient } from "./configure-client";

export async function getCurrentUser() {
  configureApiClient();
  return usersMe();
}
