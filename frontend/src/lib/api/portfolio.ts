import {
  portfolioAssetsCreate,
  portfolioAssetsDelete,
  portfolioAssetsList,
  portfolioAssetsUpdate,
  portfolioLiabilitiesCreate,
  portfolioLiabilitiesDelete,
  portfolioLiabilitiesList,
  portfolioLiabilitiesUpdate,
} from "@/lib/api/generated";
import type { AssetCreate, AssetUpdate, LiabilityCreate, LiabilityUpdate } from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

// ── Assets ────────────────────────────────────────────────────────────────────

/**
 * Fetches all assets for the authenticated user.
 */
export async function listAssets() {
  configureApiClient();
  return portfolioAssetsList();
}

/**
 * Creates a new asset entry in the portfolio.
 */
export async function createAsset(payload: AssetCreate) {
  configureApiClient();
  return portfolioAssetsCreate({ body: payload });
}

/**
 * Partially updates an existing asset by ID.
 */
export async function updateAsset(assetId: string, payload: AssetUpdate) {
  configureApiClient();
  return portfolioAssetsUpdate({
    path: { asset_id: assetId },
    body: payload,
  });
}

/**
 * Deletes an asset by ID.
 */
export async function deleteAsset(assetId: string) {
  configureApiClient();
  return portfolioAssetsDelete({
    path: { asset_id: assetId },
  });
}

// ── Liabilities ───────────────────────────────────────────────────────────────

/**
 * Fetches all liabilities for the authenticated user.
 */
export async function listLiabilities() {
  configureApiClient();
  return portfolioLiabilitiesList();
}

/**
 * Creates a new liability entry in the portfolio.
 */
export async function createLiability(payload: LiabilityCreate) {
  configureApiClient();
  return portfolioLiabilitiesCreate({ body: payload });
}

/**
 * Partially updates an existing liability by ID.
 */
export async function updateLiability(liabilityId: string, payload: LiabilityUpdate) {
  configureApiClient();
  return portfolioLiabilitiesUpdate({
    path: { liability_id: liabilityId },
    body: payload,
  });
}

/**
 * Deletes a liability by ID.
 */
export async function deleteLiability(liabilityId: string) {
  configureApiClient();
  return portfolioLiabilitiesDelete({
    path: { liability_id: liabilityId },
  });
}