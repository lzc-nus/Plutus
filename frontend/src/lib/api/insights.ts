import { insightsGenerate } from "@/lib/api/generated/sdk.gen";
import type {
  InsightRequest,
  InsightResponse,
  InsightSection,
} from "@/lib/api/generated/types.gen";
import { configureApiClient } from "./configureClient";

export type { InsightRequest, InsightResponse, InsightSection };

export type InsightTimeHorizon = NonNullable<InsightRequest["time_horizon"]>;
export type InsightFocus = NonNullable<InsightRequest["focus"]>;
export type InsightSeverity = InsightSection["severity"];

export type InsightApiResult =
  | { data: InsightResponse; error: null; status: number }
  | { data: null; error: string; status: number };

export async function generateInsight(
  payload: InsightRequest,
): Promise<InsightApiResult> {
  try {
    configureApiClient();
    const { data, error, response } = await insightsGenerate({ body: payload });
    const status = response?.status ?? 0;

    if (error || !response?.ok || !data) {
      return {
        data: null,
        error: getErrorDetail(error),
        status,
      };
    }

    return { data, error: null, status };
  } catch {
    return {
      data: null,
      error: "Unable to reach the insight service.",
      status: 0,
    };
  }
}

function getErrorDetail(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "detail" in error &&
    typeof error.detail === "string"
  ) {
    return error.detail;
  }

  return "Unable to generate insight right now.";
}
