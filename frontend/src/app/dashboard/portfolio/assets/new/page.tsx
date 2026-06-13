export default function NewAssetPage() {
  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_20px_70px_rgba(43,34,24,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a6332]">
          Portfolio asset
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#1d211c]">Add asset</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f675b]">
          Record your investments, savings, and other assets separately from liabilities so Plutus can calculate net worth cleanly.
        </p>
      </div>
    </section>
  );
}