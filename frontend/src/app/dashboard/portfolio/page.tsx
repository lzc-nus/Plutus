import {
  AllocationBar,
  AssetCard,
  LiabilityCard,
  PdfExportButton,
  SectionHeader,
  WealthEquation,
} from "@/components/WealthComponents";
import { assets, financialSnapshot, liabilities } from "@/data/wealthData";

export default function PortfolioPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <SectionHeader
          description="Net worth is counted as all marked assets less all outstanding liabilities, with liquidity and risk kept visible."
          eyebrow="Portfolio"
          title="Complete balance sheet"
        />
        <PdfExportButton />
      </div>

      <WealthEquation
        assets={financialSnapshot.totalAssets}
        liabilities={financialSnapshot.totalLiabilities}
        netWorth={financialSnapshot.netWorth}
      />

      <section className="grid gap-5">
        <SectionHeader
          description="Each asset category is marked with current value, portfolio share, recent change, liquidity, and risk label."
          eyebrow="Assets dashboard"
          title="What you own"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard asset={asset} key={asset.id} />
          ))}
        </div>
      </section>

      <section className="grid gap-5">
        <SectionHeader
          description="Liabilities are tracked by balance, monthly payment, rate, maturity, and risk characteristics."
          eyebrow="Liabilities dashboard"
          title="What you owe"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {liabilities.map((liability) => (
            <LiabilityCard liability={liability} key={liability.id} />
          ))}
        </div>
      </section>

      <section className="grid gap-5">
        <SectionHeader
          description="A restrained allocation view for understanding exposure without visual noise."
          eyebrow="Allocation view"
          title="Capital distribution"
        />
        <AllocationBar assets={assets} />
      </section>
    </div>
  );
}
