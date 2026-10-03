import {
  profileShareCreate,
  profileShareRead,
  profileShareRevoke,
  profileShareStatus,
} from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

export async function getProfileShareStatus() {
  configureApiClient();
  return profileShareStatus();
}

export async function createProfileShare() {
  configureApiClient();
  return profileShareCreate();
}

export async function revokeProfileShare() {
  configureApiClient();
  return profileShareRevoke();
}

export async function getSharedFinancialProfile(token: string) {
  configureApiClient();
  return profileShareRead({ path: { token } });
}
