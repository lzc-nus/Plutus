"use client";

import Link from "next/link";

interface AuthRequiredDialogProps {
  action: string;
  onClose: () => void;
}

export function AuthRequiredDialog({ action, onClose }: AuthRequiredDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in required"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#121417]/70 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-lg border border-[#d7c6a3]/40 bg-[#fbf7ef] p-5 shadow-[0_24px_80px_rgba(28,32,24,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1c2018]">Sign in to {action}</p>
            <p className="mt-1 text-sm leading-6 text-[#6b6252]">
              Sign in or create an account to continue.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-[#a99b82] transition-colors hover:bg-[#ede5d4] hover:text-[#1c2018]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <Link
            href="/login"
            className="flex-1 rounded-md bg-[#1c2018] px-4 py-2 text-center text-sm font-semibold text-[#fbf7ef] transition-colors hover:bg-[#343a2e]"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="flex-1 rounded-md border border-[#d7c6a3] px-4 py-2 text-center text-sm font-semibold text-[#1c2018] transition-colors hover:border-[#b8a05d] hover:bg-white"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
