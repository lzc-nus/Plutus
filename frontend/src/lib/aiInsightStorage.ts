import { useMemo, useSyncExternalStore } from "react";
import type { AiInsightResponse } from "@/lib/api/ai";

const AI_INSIGHT_STORAGE_KEY = "plutus.latestAiInsight";
const AI_INSIGHT_UPDATED_EVENT = "plutus-ai-insight-updated";
const STORAGE_VERSION = 1;

type StoredAiInsight = {
  version: typeof STORAGE_VERSION;
  saved_at: string;
  insight: AiInsightResponse;
};

export function saveLatestAiInsight(insight: AiInsightResponse) {
  if (typeof window === "undefined") {
    return;
  }

  const record: StoredAiInsight = {
    version: STORAGE_VERSION,
    saved_at: new Date().toISOString(),
    insight,
  };

  window.localStorage.setItem(AI_INSIGHT_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new Event(AI_INSIGHT_UPDATED_EVENT));
}

export function loadLatestAiInsight(): StoredAiInsight | null {
  return parseStoredAiInsight(getLatestAiInsightSnapshot());
}

export function useLatestAiInsight() {
  const snapshot = useSyncExternalStore(
    subscribeToLatestAiInsight,
    getLatestAiInsightSnapshot,
    getLatestAiInsightServerSnapshot,
  );

  return useMemo(() => parseStoredAiInsight(snapshot), [snapshot]);
}

function subscribeToLatestAiInsight(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(AI_INSIGHT_UPDATED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(AI_INSIGHT_UPDATED_EVENT, onStoreChange);
  };
}

function getLatestAiInsightSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(AI_INSIGHT_STORAGE_KEY) ?? "";
}

function getLatestAiInsightServerSnapshot() {
  return "";
}

function parseStoredAiInsight(raw: string): StoredAiInsight | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (isStoredAiInsight(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through and clear malformed local storage below.
  }

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AI_INSIGHT_STORAGE_KEY);
  }

  return null;
}

function isStoredAiInsight(value: unknown): value is StoredAiInsight {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredAiInsight>;
  const insight = candidate.insight as Partial<AiInsightResponse> | undefined;

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
