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

// ASSETS

export async function listAssets() {
  configureApiClient();
  return portfolioAssetsList();
}

export async function createAsset(payload: AssetCreate) {
  configureApiClient();
  return portfolioAssetsCreate({ body: payload });
}

/**
 * Partially update an existing asset by ID.
 */
export async function updateAsset(assetId: string, payload: AssetUpdate) {
  configureApiClient();
  return portfolioAssetsUpdate({
    path: { asset_id: assetId },
    body: payload,
  });
}

/**
 * Delete an asset by ID.
 */
export async function deleteAsset(assetId: string) {
  configureApiClient();
  return portfolioAssetsDelete({
    path: { asset_id: assetId },
  });
}

// LIABILITIES

/**
 * Fetch all liabilities for the authenticated user.
 */
export async function listLiabilities() {
  configureApiClient();
  return portfolioLiabilitiesList();
}

export async function createLiability(payload: LiabilityCreate) {
  configureApiClient();
  return portfolioLiabilitiesCreate({ body: payload });
}

export async function updateLiability(liabilityId: string, payload: LiabilityUpdate) {
  configureApiClient();
  return portfolioLiabilitiesUpdate({
    path: { liability_id: liabilityId },
    body: payload,
  });
}

export async function deleteLiability(liabilityId: string) {
  configureApiClient();
  return portfolioLiabilitiesDelete({
    path: { liability_id: liabilityId },
  });
}