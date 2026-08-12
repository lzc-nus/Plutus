import {
  strategyGoalsCreate,
  strategyGoalsDelete,
  strategyGoalsList,
  strategyGoalsUpdate,
  strategyMemoGenerate,
} from "@/lib/api/generated/sdk.gen";
import type {
  StrategyGoalCreate,
  StrategyGoalRead,
  StrategyGoalUpdate,
  StrategyMemoRequest,
  StrategyMemoResponse,
} from "@/lib/api/generated/types.gen";
import { configureApiClient } from "./configureClient";

export type {
  StrategyGoalCreate,
  StrategyGoalRead,
  StrategyGoalUpdate,
  StrategyMemoRequest,
  StrategyMemoResponse,
};

export type StrategyApiResult<T> =
  | { data: T; error: null; status: number }
  | { data: null; error: string; status: number };

export async function listStrategyGoals(): Promise<
  StrategyApiResult<StrategyGoalRead[]>
> {
  try {
    configureApiClient();
    const { data, error, response } = await strategyGoalsList();
    const status = response?.status ?? 0;

    if (error || !response?.ok || !data) {
      return { data: null, error: getErrorDetail(error), status };
    }

    return { data, error: null, status };
  } catch {
    return {
      data: null,
      error: "Unable to load strategy goals.",
      status: 0,
    };
  }
}

export async function createStrategyGoal(
  payload: StrategyGoalCreate,
): Promise<StrategyApiResult<StrategyGoalRead>> {
  try {
    configureApiClient();
    const { data, error, response } = await strategyGoalsCreate({ body: payload });
    const status = response?.status ?? 0;

    if (error || !response?.ok || !data) {
      return { data: null, error: getErrorDetail(error), status };
    }

    return { data, error: null, status };
  } catch {
    return {
      data: null,
      error: "Unable to create strategy goal.",
      status: 0,
    };
  }
}

export async function updateStrategyGoal(
  goalId: string,
  payload: StrategyGoalUpdate,
): Promise<StrategyApiResult<StrategyGoalRead>> {
  try {
    configureApiClient();

    const { data, error, response } = await strategyGoalsUpdate({
      path: { goal_id: goalId },
      body: payload,
    });

    const status = response?.status ?? 0;

    if (error || !response?.ok || !data) {
      return { data: null, error: getErrorDetail(error), status };
    }

    return { data, error: null, status };
  } catch {
    return {
      data: null,
      error: "Unable to update strategy goal.",
      status: 0,
    };
  }
}

export async function deleteStrategyGoal(
  goalId: string,
): Promise<StrategyApiResult<true>> {
  try {
    configureApiClient();

    const { error, response } = await strategyGoalsDelete({
      path: { goal_id: goalId },
    });
    
    const status = response?.status ?? 0;

    if (error || !response?.ok) {
      return { data: null, error: getErrorDetail(error), status };
    }

    return { data: true, error: null, status };
  } catch {
    return {
      data: null,
      error: "Unable to delete strategy goal.",
      status: 0,
    };
  }
}

export async function generateStrategyMemo(
  payload: StrategyMemoRequest,
): Promise<StrategyApiResult<StrategyMemoResponse>> {
  try {
    configureApiClient();
    const { data, error, response } = await strategyMemoGenerate({ body: payload });
    const status = response?.status ?? 0;

    if (error || !response?.ok || !data) {
      return { data: null, error: getErrorDetail(error), status };
    }

    return { data, error: null, status };
  } catch {
    return {
      data: null,
      error: "Unable to generate strategy memo right now.",
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

  return "Unable to complete the strategy request.";
}
