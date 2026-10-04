"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import RenaissanceAuthShell from "@/components/auth/RenaissanceAuthShell";
import {
  getApiErrorMessage,
  resendVerificationCode,
  verifyEmail,
} from "@/lib/api/auth";
import { emailVerificationSchema } from "@/lib/validations/auth";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    const registeredEmail = window.sessionStorage.getItem("plutus-verification-email");
    if (registeredEmail) {
      setEmail(registeredEmail);
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
    }
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCountdown]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setStatusMessage("");

    const parsed = emailVerificationSchema.safeParse({ email, code });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setFieldErrors({});
    setIsVerifying(true);

    try {
      const { error } = await verifyEmail(parsed.data);
      if (error) {
        setFormError(
          getApiErrorMessage(
            error,
            "Unable to verify this code. Request a new one and try again.",
          ),
        );
        return;
      }

      window.sessionStorage.removeItem("plutus-verification-email");
      window.dispatchEvent(new Event("plutus-auth-refresh"));
      router.replace("/dashboard/overview");
    } catch {
      setFormError("The verification service is unavailable. Try again shortly.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    const normalizedEmail = email.trim().toLowerCase();
    const emailResult = emailVerificationSchema.shape.email.safeParse(normalizedEmail);
    if (!emailResult.success) {
      setFieldErrors({ email: [emailResult.error.issues[0]?.message ?? "Enter a valid email."] });
      return;
    }

    setFormError("");
    setStatusMessage("");
    setFieldErrors({});
    setIsResending(true);

    try {
      const { error } = await resendVerificationCode({ email: normalizedEmail });
      if (error) {
        setFormError(
          getApiErrorMessage(error, "Unable to request a new code. Try again shortly."),
        );
        return;
      }

      window.sessionStorage.setItem("plutus-verification-email", normalizedEmail);
      setStatusMessage("If this account is awaiting verification, a new code is on its way.");
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      setCode("");
    } catch {
      setFormError("Unable to request a new code. Check your connection and try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <RenaissanceAuthShell
      eyebrow="Email verification"
      title="Check your inbox"
      subtitle="Enter the six-digit code from Plutus. It expires 10 minutes after it is sent."
      switchText="Already verified?"
      switchHref="/login"
      switchLabel="Sign in"
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[#e9dfcf]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(fieldErrors.email)}
            className="h-12 rounded-md border border-[#d8bd75]/20 bg-[#151811]/70 px-4 text-base text-[#fbf7ef] outline-none transition placeholder:text-[#8a8173] focus:border-[#d8bd75] focus:ring-4 focus:ring-[#d8bd75]/15"
          />
          {fieldErrors.email ? (
            <span className="text-sm text-[#f2a69b]">{fieldErrors.email[0]}</span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[#e9dfcf]">Verification code</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            aria-invalid={Boolean(fieldErrors.code)}
            className="h-14 rounded-md border border-[#d8bd75]/25 bg-[#151811]/70 px-4 text-center text-2xl font-bold tracking-[0.28em] text-[#fbf7ef] caret-[#f0d98c] outline-none transition placeholder:text-[#665f54] focus:border-[#d8bd75] focus:ring-4 focus:ring-[#d8bd75]/15"
          />
          {fieldErrors.code ? (
            <span className="text-sm text-[#f2a69b]">{fieldErrors.code[0]}</span>
          ) : null}
        </label>

        <div aria-live="polite" className="min-h-5">
          {formError ? (
            <p role="alert" className="text-sm leading-5 text-[#f2a69b]">
              {formError}
            </p>
          ) : null}
          {statusMessage ? (
            <p className="text-sm leading-5 text-[#b8d9be]">{statusMessage}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isVerifying || code.length !== 6}
          className="h-12 rounded-md bg-[#d8bd75] px-5 text-sm font-bold text-[#151811] shadow-[0_10px_24px_rgba(216,189,117,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#f0d98c] hover:shadow-[0_14px_30px_rgba(216,189,117,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d98c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151811] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isVerifying ? "Verifying…" : "Verify and continue"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || resendCountdown > 0}
          className="min-h-11 px-3 text-sm font-semibold text-[#d8bd75] underline decoration-[#d8bd75]/35 underline-offset-4 transition hover:text-[#f0d98c] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d98c] disabled:cursor-not-allowed disabled:text-[#8a8173] disabled:no-underline"
        >
          {isResending
            ? "Sending…"
            : resendCountdown > 0
              ? `Send another code in ${resendCountdown}s`
              : "Send another code"}
        </button>
      </form>
    </RenaissanceAuthShell>
  );
}
