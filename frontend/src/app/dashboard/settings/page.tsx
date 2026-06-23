"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/lib/api/auth";
import { changePassword, updateSettings } from "@/lib/api/users";
import type { UserRead, UserSettingsUpdate } from "@/lib/api/generated";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  passwordChangeSchema,
  settingsFormSchema,
  type PasswordChangeInput,
  type SettingsFormInput,
} from "@/lib/validations/settings";

const currencyOptions = [
  { code: "SGD", label: "Singapore dollar" },
  { code: "USD", label: "US dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British pound" },
  { code: "AUD", label: "Australian dollar" },
  { code: "CAD", label: "Canadian dollar" },
  { code: "JPY", label: "Japanese yen" },
  { code: "CNY", label: "Chinese yuan" },
  { code: "HKD", label: "Hong Kong dollar" },
  { code: "MYR", label: "Malaysian ringgit" },
] as const;

type SubmitState = "idle" | "saving" | "success" | "error";

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function settingsDefaults(user: UserRead | null): SettingsFormInput {
  return {
    username: user?.username ?? "",
    email: user?.email ?? "",
    base_currency: user?.base_currency ?? "SGD",
    display_name: user?.display_name ?? "",
    bio: user?.bio ?? "",
    avatar_url: user?.avatar_url ?? "",
  };
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildSettingsPayload(values: SettingsFormInput): UserSettingsUpdate {
  return {
    username: values.username.trim(),
    email: values.email.trim().toLowerCase(),
    base_currency: values.base_currency.trim().toUpperCase(),
    display_name: toNullableString(values.display_name),
    bio: toNullableString(values.bio),
    avatar_url: toNullableString(values.avatar_url),
  };
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-[#d9d0c1] bg-[#fbf7ef]/88 shadow-[0_18px_45px_rgba(43,34,24,0.05)]">
      <div className="border-b border-[#e3d8c8] px-5 py-4">
        <h2 className="text-base font-bold text-[#1d211c]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-[#756c61]">{description}</p>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-semibold text-[#a83f33]">{message}</p>;
}

function FormStatus({
  state,
  success,
  error,
}: {
  state: SubmitState;
  success: string;
  error: string;
}) {
  if (state === "success") {
    return (
      <p className="rounded-md border border-[#b8d9be] bg-[#eef8ef] px-3 py-2 text-sm font-semibold text-[#276237]">
        {success}
      </p>
    );
  }

  if (state === "error") {
    return (
      <p className="rounded-md border border-[#e2b8ae] bg-[#fff1ee] px-3 py-2 text-sm font-semibold text-[#8d3329]">
        {error}
      </p>
    );
  }

  return null;
}

function ButtonIcon({ name }: { name: "save" | "key" }) {
  const paths = {
    save: (
      <>
        <path d="M5 4h11l3 3v13H5z" />
        <path d="M8 4v6h8" />
        <path d="M8 20v-6h8v6" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="15" r="3" />
        <path d="M10.5 12.5 19 4" />
        <path d="m15 8 2 2" />
        <path d="m13 10 2 2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
    >
      {paths[name]}
    </svg>
  );
}

export default function SettingsPage() {
  const { user, loading, setUser } = useAuth();
  const [settingsState, setSettingsState] = useState<SubmitState>("idle");
  const [passwordState, setPasswordState] = useState<SubmitState>("idle");
  const [settingsError, setSettingsError] = useState("Unable to save settings.");
  const [passwordError, setPasswordError] = useState("Unable to change password.");

  const settingsForm = useForm<SettingsFormInput>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: settingsDefaults(user),
  });

  const passwordForm = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    settingsForm.reset(settingsDefaults(user));
  }, [settingsForm, user]);

  const accountRows = useMemo(
    () => [
      { label: "User ID", value: user?.id ?? "Unavailable" },
      { label: "Active", value: user?.is_active ? "Yes" : "No" },
      { label: "Verified", value: user?.is_verified ? "Yes" : "No" },
      { label: "Created", value: formatDateTime(user?.created_at) },
      { label: "Updated", value: formatDateTime(user?.updated_at) },
    ],
    [user],
  );

  async function handleSettingsSubmit(values: SettingsFormInput) {
    setSettingsState("saving");
    setSettingsError("Unable to save settings.");

    try {
      const result = await updateSettings(buildSettingsPayload(values));

      if (result.error || !result.data) {
        setSettingsError(getApiErrorMessage(result.error, "Unable to save settings."));
        setSettingsState("error");
        return;
      }

      setUser(result.data);
      settingsForm.reset(settingsDefaults(result.data));
      window.dispatchEvent(new Event("plutus-auth-refresh"));
      setSettingsState("success");
    } catch {
      setSettingsState("error");
    }
  }

  async function handlePasswordSubmit(values: PasswordChangeInput) {
    setPasswordState("saving");
    setPasswordError("Unable to change password.");

    try {
      const result = await changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });

      if (result.error || !result.data) {
        setPasswordError(getApiErrorMessage(result.error, "Unable to change password."));
        setPasswordState("error");
        return;
      }

      passwordForm.reset({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setPasswordState("success");
    } catch {
      setPasswordState("error");
    }
  }

  if (loading || !user) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6">
        <div className="h-40 animate-pulse rounded-md border border-[#d9d0c1] bg-[#fbf7ef]/70" />
        <div className="h-80 animate-pulse rounded-md border border-[#d9d0c1] bg-[#fbf7ef]/70" />
      </div>
    );
  }

  const settingsErrors = settingsForm.formState.errors;
  const passwordErrors = passwordForm.formState.errors;

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel title="Account Details">
          <form
            onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)}
            className="grid gap-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-[#50483f]">Username</span>
                <input
                  {...settingsForm.register("username")}
                  aria-invalid={Boolean(settingsErrors.username)}
                  autoComplete="username"
                  className="h-11 rounded-md border border-[#d2c5b4] bg-white px-3 text-sm font-semibold text-[#1d211c] outline-none transition focus:border-[#8d7038] focus:ring-4 focus:ring-[#d8bd75]/24"
                />
                <FieldError message={settingsErrors.username?.message} />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-[#50483f]">Email</span>
                <input
                  {...settingsForm.register("email")}
                  aria-invalid={Boolean(settingsErrors.email)}
                  autoComplete="email"
                  type="email"
                  className="h-11 rounded-md border border-[#d2c5b4] bg-white px-3 text-sm font-semibold text-[#1d211c] outline-none transition focus:border-[#8d7038] focus:ring-4 focus:ring-[#d8bd75]/24"
                />
                <FieldError message={settingsErrors.email?.message} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr]">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-[#50483f]">Base Currency</span>
                <select
                  {...settingsForm.register("base_currency")}
                  aria-invalid={Boolean(settingsErrors.base_currency)}
                  className="h-11 rounded-md border border-[#d2c5b4] bg-white px-3 text-sm font-semibold text-[#1d211c] outline-none transition focus:border-[#8d7038] focus:ring-4 focus:ring-[#d8bd75]/24"
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.label}
                    </option>
                  ))}
                </select>
                <FieldError message={settingsErrors.base_currency?.message} />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-[#50483f]">Avatar URL</span>
                <input
                  {...settingsForm.register("avatar_url")}
                  aria-invalid={Boolean(settingsErrors.avatar_url)}
                  autoComplete="url"
                  placeholder="https://example.com/avatar.png"
                  className="h-11 rounded-md border border-[#d2c5b4] bg-white px-3 text-sm font-semibold text-[#1d211c] outline-none transition placeholder:text-[#aaa197] focus:border-[#8d7038] focus:ring-4 focus:ring-[#d8bd75]/24"
                />
                <FieldError message={settingsErrors.avatar_url?.message} />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#50483f]">Display Name</span>
              <input
                {...settingsForm.register("display_name")}
                aria-invalid={Boolean(settingsErrors.display_name)}
                autoComplete="name"
                className="h-11 rounded-md border border-[#d2c5b4] bg-white px-3 text-sm font-semibold text-[#1d211c] outline-none transition focus:border-[#8d7038] focus:ring-4 focus:ring-[#d8bd75]/24"
              />
              <FieldError message={settingsErrors.display_name?.message} />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#50483f]">Bio</span>
              <textarea
                {...settingsForm.register("bio")}
                aria-invalid={Boolean(settingsErrors.bio)}
                rows={4}
                className="min-h-28 resize-y rounded-md border border-[#d2c5b4] bg-white px-3 py-3 text-sm font-medium leading-6 text-[#1d211c] outline-none transition focus:border-[#8d7038] focus:ring-4 focus:ring-[#d8bd75]/24"
              />
              <FieldError message={settingsErrors.bio?.message} />
            </label>

            <FormStatus
              state={settingsState}
              success="Settings saved."
              error={settingsError}
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={settingsState === "saving"}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1d211c] px-4 text-sm font-bold text-[#fbf7ef] transition hover:bg-[#2b332a] disabled:cursor-not-allowed disabled:bg-[#9b948b]"
              >
                <ButtonIcon name="save" />
                {settingsState === "saving" ? "Saving" : "Save Changes"}
              </button>
            </div>
          </form>
        </Panel>

        <Panel title="Account State">
          <div className="grid gap-3">
            {accountRows.map((row) => (
              <div
                key={row.label}
                className="grid gap-1 rounded-md border border-[#e3d8c8] bg-white/72 px-3 py-3"
              >
                <span className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#897a69]">
                  {row.label}
                </span>
                <span className="break-words text-sm font-bold text-[#1d211c]">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Security">
        <form
          onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
          className="grid gap-5 lg:grid-cols-3"
        >
          <label className="grid gap-2">
            <span className="text-sm font-bold text-[#50483f]">Current Password</span>
            <input
              {...passwordForm.register("current_password")}
              aria-invalid={Boolean(passwordErrors.current_password)}
              autoComplete="current-password"
              type="password"
              className="h-11 rounded-md border border-[#d2c5b4] bg-white px-3 text-sm font-semibold text-[#1d211c] outline-none transition focus:border-[#8d7038] focus:ring-4 focus:ring-[#d8bd75]/24"
            />
            <FieldError message={passwordErrors.current_password?.message} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-[#50483f]">New Password</span>
            <input
              {...passwordForm.register("new_password")}
              aria-invalid={Boolean(passwordErrors.new_password)}
              autoComplete="new-password"
              type="password"
              className="h-11 rounded-md border border-[#d2c5b4] bg-white px-3 text-sm font-semibold text-[#1d211c] outline-none transition focus:border-[#8d7038] focus:ring-4 focus:ring-[#d8bd75]/24"
            />
            <FieldError message={passwordErrors.new_password?.message} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-[#50483f]">Confirm Password</span>
            <input
              {...passwordForm.register("confirm_password")}
              aria-invalid={Boolean(passwordErrors.confirm_password)}
              autoComplete="new-password"
              type="password"
              className="h-11 rounded-md border border-[#d2c5b4] bg-white px-3 text-sm font-semibold text-[#1d211c] outline-none transition focus:border-[#8d7038] focus:ring-4 focus:ring-[#d8bd75]/24"
            />
            <FieldError message={passwordErrors.confirm_password?.message} />
          </label>

          <div className="lg:col-span-3">
            <FormStatus
              state={passwordState}
              success="Password changed."
              error={passwordError}
            />
          </div>

          <div className="lg:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={passwordState === "saving"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#6b3028] px-4 text-sm font-bold text-white transition hover:bg-[#7d3a30] disabled:cursor-not-allowed disabled:bg-[#b19b95]"
            >
              <ButtonIcon name="key" />
              {passwordState === "saving" ? "Updating" : "Change Password"}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
