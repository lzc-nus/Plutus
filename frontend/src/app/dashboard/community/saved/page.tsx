import { SavedPostsGrid } from "@/components/dashboard/community/SavedPostsGrid";

export default function SavedPage() {
  return (
    <div className="mx-auto min-h-screen max-w-xl border-x border-zinc-800 bg-zinc-950">

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-semibold text-white">Saved</h1>
      </div>

      <SavedPostsGrid />
    </div>
  );
}