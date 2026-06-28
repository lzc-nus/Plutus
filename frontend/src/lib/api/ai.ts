import {
  aiInsightsGenerate,
  type AiInsightRequest,
  type AiInsightResponse,
  type AiInsightSection,
} from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

export type { AiInsightRequest, AiInsightResponse, AiInsightSection };

export type AiInsightTimeHorizon = NonNullable<AiInsightRequest["time_horizon"]>;
export type AiInsightFocus = NonNullable<AiInsightRequest["focus"]>;
export type AiInsightSeverity = AiInsightSection["severity"];

export type AiInsightApiResult =
  | { data: AiInsightResponse; error: null; status: number }
  | { data: null; error: string; status: number };

export async function generateAiInsight(
  payload: AiInsightRequest,
): Promise<AiInsightApiResult> {
  try {
    configureApiClient();
    const { data, error, response } = await aiInsightsGenerate({ body: payload });
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
      error: "Unable to reach the AI insight service.",
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

  return "Unable to generate AI insight right now.";
}
