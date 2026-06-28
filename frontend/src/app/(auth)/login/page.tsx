"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import RenaissanceAuthShell from "@/components/auth/RenaissanceAuthShell";
import { getApiErrorMessage, loginWithEmailPassword } from "@/lib/api/auth";
import { loginSchema } from "@/lib/validations/auth";

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
      const { error } = await loginWithEmailPassword(parsed.data);

      if (error) {
        throw new Error(getApiErrorMessage(error, "Unable to sign in."));
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
          className="h-12 rounded-md bg-[#d8bd75] px-5 text-sm font-bold text-[#151811] shadow-[0_10px_24px_rgba(216,189,117,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#f0d98c] hover:shadow-[0_14px_30px_rgba(216,189,117,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d98c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151811] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#d8bd75] disabled:hover:shadow-[0_10px_24px_rgba(216,189,117,0.18)]"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </RenaissanceAuthShell>
  );
}
