import { SavedPostsGrid } from "@/components/dashboard/community/SavedPostsGrid";
import { RightPanel } from "@/components/dashboard/community/RightPanel";

export default function SavedPage() {
  return (
    <div className="flex min-h-screen w-full bg-[#fbf7ef]">
      <div className="flex min-w-0 flex-1 flex-col border-r border-[#d7c6a3]/30">
        <div className="sticky top-0 z-10 border-b border-[#d7c6a3]/30 bg-[#fbf7ef]/95 px-6 py-4 backdrop-blur">
          <h1 className="text-xl font-semibold text-[#1c2018]">Saved</h1>
        </div>
        <SavedPostsGrid />
      </div>
      <RightPanel />
    </div>
  );
}