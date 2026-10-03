"use client";

import { useEffect, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/auth";
import {
  createProfileShare,
  getProfileShareStatus,
  revokeProfileShare,
} from "@/lib/api/profileSharing";

type ActionState = "idle" | "creating" | "revoking";

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
    >
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.15 1.15" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.15-1.15" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
    >
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function FinancialProfileSharePanel() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [action, setAction] = useState<ActionState>("idle");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getProfileShareStatus()
      .then((result) => {
        if (!active) {
          return;
        }
        if (result.error || !result.data) {
          setError(
            getApiErrorMessage(result.error, "Unable to load sharing settings."),
          );
          return;
        }
        setEnabled(result.data.enabled);
        setCreatedAt(result.data.created_at ?? null);
      })
      .catch(() => {
        if (active) {
          setError("Unable to load sharing settings.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function generateLink() {
    setAction("creating");
    setError(null);
    setCopied(false);

    try {
      const result = await createProfileShare();
      if (result.error || !result.data) {
        setError(
          getApiErrorMessage(result.error, "Unable to create a share link."),
        );
        return;
      }
      setEnabled(true);
      setCreatedAt(result.data.created_at);
      setShareUrl(result.data.share_url);
    } catch {
      setError("Unable to create a share link.");
    } finally {
      setAction("idle");
    }
  }

  async function copyLink() {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setError("Copy failed. Select the link and copy it manually.");
    }
  }

  async function revokeLink() {
    setAction("revoking");
    setError(null);

    try {
      const result = await revokeProfileShare();
      if (result.error) {
        setError(
          getApiErrorMessage(result.error, "Unable to turn off sharing."),
        );
        return;
      }
      setEnabled(false);
      setCreatedAt(null);
      setShareUrl(null);
      setCopied(false);
    } catch {
      setError("Unable to turn off sharing.");
    } finally {
      setAction("idle");
    }
  }

  const isBusy = action !== "idle";

  return (
    <section className="rounded-md border border-[#d9d0c1] bg-[#fbf7ef]/88 shadow-[0_18px_45px_rgba(43,34,24,0.05)]">
      <div className="flex flex-col gap-3 border-b border-[#e3d8c8] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1d211c]">
              Share Financial Profile
            </h2>
            {enabled ? (
              <span className="rounded-full bg-[#e6f0df] px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#355f31]">
                Link active
              </span>
            ) : null}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#756c61]">
            Create a private link to your live net worth and category-level
            allocation. Anyone with the link can view it.
          </p>
        </div>

        {enabled && createdAt ? (
          <p className="shrink-0 text-xs font-semibold text-[#897a69]">
            Active since {formatDate(createdAt)}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
        <div>
          {loading ? (
            <div className="grid gap-3" aria-label="Loading sharing settings">
              <div className="h-11 animate-pulse rounded-md bg-[#e9e1d3]" />
              <div className="h-10 w-40 animate-pulse rounded-md bg-[#e9e1d3]" />
            </div>
          ) : (
            <div className="grid gap-4">
              {shareUrl ? (
                <div className="grid gap-2">
                  <label
                    htmlFor="financial-profile-share-link"
                    className="text-sm font-bold text-[#50483f]"
                  >
                    Share link
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="financial-profile-share-link"
                      readOnly
                      value={shareUrl}
                      onFocus={(event) => event.currentTarget.select()}
                      className="h-11 min-w-0 flex-1 rounded-md border border-[#d2c5b4] bg-white px-3 text-sm font-semibold text-[#1d211c] outline-none focus:border-[#8d7038] focus:ring-4 focus:ring-[#d8bd75]/24"
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1d211c] px-4 text-sm font-bold text-[#fbf7ef] transition hover:bg-[#343b32] focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:bg-[#9b948b]"
                    >
                      <CopyIcon />
                      {copied ? "Copied" : "Copy link"}
                    </button>
                  </div>
                  <p className="text-xs leading-5 text-[#756c61]">
                    Save this link now. Plutus stores only a protected version
                    of it and cannot show the same link again.
                  </p>
                </div>
              ) : enabled ? (
                <p className="rounded-md bg-[#f1eadc] px-4 py-3 text-sm leading-6 text-[#5e5549]">
                  Your existing link is active. Create a replacement if you no
                  longer have it; the previous link will stop working.
                </p>
              ) : (
                <p className="text-sm leading-6 text-[#5e5549]">
                  Sharing is off. Create a link when you want to share a concise
                  view of your finances.
                </p>
              )}

              {error ? (
                <p role="alert" className="text-sm font-semibold text-[#8d3329]">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={generateLink}
                  disabled={isBusy}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1d211c] px-4 text-sm font-bold text-[#fbf7ef] transition hover:bg-[#343b32] disabled:cursor-not-allowed disabled:bg-[#9b948b]"
                >
                  <LinkIcon />
                  {action === "creating"
                    ? "Creating…"
                    : enabled
                      ? "Replace link"
                      : "Create private link"}
                </button>

                {enabled ? (
                  <button
                    type="button"
                    onClick={revokeLink}
                    disabled={isBusy}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#bbaea0] px-4 text-sm font-bold text-[#5e5549] transition hover:border-[#8f7761] hover:bg-[#f1eadc] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {action === "revoking" ? "Turning off…" : "Turn off sharing"}
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#e3d8c8] pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <h3 className="text-sm font-bold text-[#1d211c]">What people can see</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-5 text-[#5e5549]">
            <li>Net worth, total assets, and total liabilities</li>
            <li>Category totals and allocation percentages</li>
            <li>Your public name, username, and bio</li>
          </ul>
          <p className="mt-4 border-t border-[#e3d8c8] pt-4 text-xs font-semibold leading-5 text-[#756c61]">
            Transactions, account and holding names, notes, cost basis, payment
            details, and goals stay private.
          </p>
        </div>
      </div>
    </section>
  );
}
