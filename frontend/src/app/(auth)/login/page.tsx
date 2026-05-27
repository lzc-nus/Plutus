"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import RenaissanceAuthShell from "@/components/auth/RenaissanceAuthShell";
import { loginSchema } from "@/lib/validations/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const AUTH_PATH = "/api/v1/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}${AUTH_PATH}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail ?? "Unable to sign in.");
      }

      const token = data.access_token ?? data.accessToken;
      if (token) {
        localStorage.setItem("plutus_access_token", token);
      }

      router.push("/dashboard/overview");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RenaissanceAuthShell
      eyebrow="Secure access"
      title="Welcome back"
      subtitle="Sign in to continue to your private wealth command center."
      switchText="New to Plutus?"
      switchHref="/register"
      switchLabel="Create an account"
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[#e9dfcf]">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            className="h-12 rounded-md border border-[#d8bd75]/20 bg-[#151811]/70 px-4 text-[#fbf7ef] outline-none transition placeholder:text-[#8a8173] focus:border-[#d8bd75]"
            placeholder="you@example.com"
          />
          {fieldErrors.email ? <span className="text-sm text-[#f2a69b]">{fieldErrors.email[0]}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[#e9dfcf]">Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            className="h-12 rounded-md border border-[#d8bd75]/20 bg-[#151811]/70 px-4 text-[#fbf7ef] outline-none transition placeholder:text-[#8a8173] focus:border-[#d8bd75]"
            placeholder="Your password"
          />
          {fieldErrors.password ? <span className="text-sm text-[#f2a69b]">{fieldErrors.password[0]}</span> : null}
        </label>

        {formError ? <p className="text-sm text-[#f2a69b]">{formError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 rounded-md bg-[#d8bd75] px-5 text-sm font-bold text-[#151811] transition hover:bg-[#f0d98c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </RenaissanceAuthShell>
  );
}