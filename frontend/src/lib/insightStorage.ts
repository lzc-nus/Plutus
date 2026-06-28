import { useMemo, useSyncExternalStore } from "react";
import type { InsightResponse } from "@/lib/api/insights";

const INSIGHT_STORAGE_KEY = "plutus.latestInsight";
const INSIGHT_UPDATED_EVENT = "plutus-insight-updated";
const STORAGE_VERSION = 1;

type StoredInsight = {
  version: typeof STORAGE_VERSION;
  saved_at: string;
  insight: InsightResponse;
};

export function saveLatestInsight(insight: InsightResponse) {
  if (typeof window === "undefined") {
    return;
  }

  const record: StoredInsight = {
    version: STORAGE_VERSION,
    saved_at: new Date().toISOString(),
    insight,
  };

  window.localStorage.setItem(INSIGHT_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new Event(INSIGHT_UPDATED_EVENT));
}

export function loadLatestInsight(): StoredInsight | null {
  return parseStoredInsight(getLatestInsightSnapshot());
}

export function useLatestInsight() {
  const snapshot = useSyncExternalStore(
    subscribeToLatestInsight,
    getLatestInsightSnapshot,
    getLatestInsightServerSnapshot,
  );

  return useMemo(() => parseStoredInsight(snapshot), [snapshot]);
}

function subscribeToLatestInsight(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(INSIGHT_UPDATED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(INSIGHT_UPDATED_EVENT, onStoreChange);
  };
}

function getLatestInsightSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(INSIGHT_STORAGE_KEY) ?? "";
}

function getLatestInsightServerSnapshot() {
  return "";
}

function parseStoredInsight(raw: string): StoredInsight | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (isStoredInsight(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through and clear malformed local storage below.
  }

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(INSIGHT_STORAGE_KEY);
  }

  return null;
}

function isStoredInsight(value: unknown): value is StoredInsight {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredInsight>;
  const insight = candidate.insight as Partial<InsightResponse> | undefined;

  return (
    candidate.version === STORAGE_VERSION &&
    typeof candidate.saved_at === "string" &&
    !!insight &&
    typeof insight.generated_at === "string" &&
    typeof insight.model === "string" &&
    typeof insight.score === "number" &&
    typeof insight.label === "string" &&
    typeof insight.executive_summary === "string" &&
    Array.isArray(insight.sections)
  );
}
