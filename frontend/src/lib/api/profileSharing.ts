import {
  profileShareCreate,
  profileShareRead,
  profileShareRevoke,
  profileShareStatus,
} from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

/** Return whether the current user has an active financial-profile share link. */
export async function getProfileShareStatus() {
  configureApiClient();
  return profileShareStatus();
}

/** Create or rotate the current user's financial-profile share link. */
export async function createProfileShare() {
  configureApiClient();
  return profileShareCreate();
}

/** Revoke the current user's financial-profile share link. */
export async function revokeProfileShare() {
  configureApiClient();
  return profileShareRevoke();
}

/** Read the aggregate public profile associated with an opaque share token. */
export async function getSharedFinancialProfile(token: string) {
  configureApiClient();
  return profileShareRead({ path: { token } });
}
