import { usersMe } from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

export async function getCurrentUser() {
  configureApiClient();
  return usersMe();
}
