import {
  usersMe,
  usersMeDelete,
  usersMePasswordUpdate,
  usersMeSettingsUpdate,
  usersMeUpdate,
  usersGetById,
} from "@/lib/api/generated";
import type {
  UserPasswordUpdate,
  UserProfileUpdate,
  UserSettingsUpdate,
} from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

/**
 * Fetch the authenticated user's full profile.
 */
export async function getMe() {
  configureApiClient();
  return usersMe();
}

/**
 * Update user's profile fields (display name, bio, avatar).
 */
export async function updateMe(payload: UserProfileUpdate) {
  configureApiClient();
  return usersMeUpdate({ body: payload });
}

/**
 * Update account settings and profile fields.
 */
export async function updateSettings(payload: UserSettingsUpdate) {
  configureApiClient();
  return usersMeSettingsUpdate({ body: payload });
}

/**
 * Change the password after current-password validation.
 */
export async function changePassword(payload: UserPasswordUpdate) {
  configureApiClient();
  return usersMePasswordUpdate({ body: payload });
}

/**
 * Fetches any user's public profile by ID.
 * Used by UserAvatar, UserProfileHeader, and the profile page.
 */
export async function getUserById(userId: string) {
  configureApiClient();
  return usersGetById({ path: { user_id: userId } });
}

/**
 * Permanently delete the user's account after password confirmation.
 * Posts and comments are assigned to the system placeholder user.
 */
export async function deleteAccount(password: string) {
  configureApiClient();
  return usersMeDelete({ body: { password } });
}