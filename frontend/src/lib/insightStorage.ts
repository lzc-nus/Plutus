import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import type { InsightResponse } from "@/lib/api/insights";

const INSIGHT_STORAGE_KEY_PREFIX = "plutus.latestInsight";
const LEGACY_INSIGHT_STORAGE_KEY = INSIGHT_STORAGE_KEY_PREFIX;
const INSIGHT_UPDATED_EVENT = "plutus-insight-updated";
const STORAGE_VERSION = 1;

type StoredInsight = {
  version: typeof STORAGE_VERSION;
  saved_at: string;
  insight: InsightResponse;
};

function getInsightStorageKey(userId: string) {
  return `${INSIGHT_STORAGE_KEY_PREFIX}.${userId}`;
}

export function saveLatestInsight(userId: string, insight: InsightResponse) {
  if (typeof window === "undefined") {
    return;
  }

  const record: StoredInsight = {
    version: STORAGE_VERSION,
    saved_at: new Date().toISOString(),
    insight,
  };

  window.localStorage.removeItem(LEGACY_INSIGHT_STORAGE_KEY);
  window.localStorage.setItem(getInsightStorageKey(userId), JSON.stringify(record));
  window.dispatchEvent(new Event(INSIGHT_UPDATED_EVENT));
}

export function clearLatestInsight(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getInsightStorageKey(userId));
  window.localStorage.removeItem(LEGACY_INSIGHT_STORAGE_KEY);
  window.dispatchEvent(new Event(INSIGHT_UPDATED_EVENT));
}

export function loadLatestInsight(userId: string): StoredInsight | null {
  const storageKey = getInsightStorageKey(userId);
  return parseStoredInsight(getLatestInsightSnapshot(storageKey), storageKey);
}

export function useLatestInsight(userId: string) {
  const storageKey = getInsightStorageKey(userId);
  useEffect(() => {
    window.localStorage.removeItem(LEGACY_INSIGHT_STORAGE_KEY);
  }, []);
  const getSnapshot = useCallback(
    () => getLatestInsightSnapshot(storageKey),
    [storageKey],
  );
  const snapshot = useSyncExternalStore(
    subscribeToLatestInsight,
    getSnapshot,
    getLatestInsightServerSnapshot,
  );

  return useMemo(
    () => parseStoredInsight(snapshot, storageKey),
    [snapshot, storageKey],
  );
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

function getLatestInsightSnapshot(storageKey: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(storageKey) ?? "";
}

function getLatestInsightServerSnapshot() {
  return "";
}

function parseStoredInsight(raw: string, storageKey: string): StoredInsight | null {
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
    window.localStorage.removeItem(storageKey);
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
