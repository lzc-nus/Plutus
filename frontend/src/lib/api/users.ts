import {
  usersMe,
  usersMeUpdate,
  usersGetById,
} from "@/lib/api/generated";
import type { UserProfileUpdate } from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

/**
 * Fetches the authenticated user's full profile.
 * Used on app load to hydrate the current user's identity.
 */
export async function getMe() {
  configureApiClient();
  return usersMe();
}

/**
 * Updates the authenticated user's profile fields (display name, bio, avatar).
 */
export async function updateMe(payload: UserProfileUpdate) {
  configureApiClient();
  return usersMeUpdate({ body: payload });
}

/**
 * Fetches any user's public profile by ID.
 * Used by UserAvatar, UserProfileHeader, and the profile page.
 */
export async function getUserById(userId: string) {
  configureApiClient();
  return usersGetById({ path: { user_id: userId } });
}