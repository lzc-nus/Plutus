import { create } from "zustand";
import type { AssetCategory, LiabilityCategory } from "@/data/portfolioTypes";

interface AssetModalParams {
  defaultCategory?: AssetCategory;
  defaultCustomCategory?: string;
  lockCustomCategory?: boolean;
}

interface LiabilityModalParams {
  defaultCategory?: LiabilityCategory;
  defaultCustomCategory?: string;
  lockCustomCategory?: boolean;
}

interface PortfolioModalState {
  // Asset add modal
  assetModalOpen: boolean;
  assetModalParams: AssetModalParams;
  openAssetModal: (params?: AssetModalParams) => void;
  closeAssetModal: () => void;

  // Liability add modal
  liabilityModalOpen: boolean;
  liabilityModalParams: LiabilityModalParams;
  openLiabilityModal: (params?: LiabilityModalParams) => void;
  closeLiabilityModal: () => void;
}

export const usePortfolioModalStore = create<PortfolioModalState>((set) => ({
  // Asset modal
  assetModalOpen: false,
  assetModalParams: {},
  openAssetModal: (params = {}) =>
    set({ assetModalOpen: true, assetModalParams: params }),
  closeAssetModal: () =>
    set({ assetModalOpen: false, assetModalParams: {} }),

  // Liability modal
  liabilityModalOpen: false,
  liabilityModalParams: {},
  openLiabilityModal: (params = {}) =>
    set({ liabilityModalOpen: true, liabilityModalParams: params }),
  closeLiabilityModal: () =>
    set({ liabilityModalOpen: false, liabilityModalParams: {} }),
}));