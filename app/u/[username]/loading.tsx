import { HeaderSkeleton } from "@/components/skeletons/HeaderSkeleton";
import { MasonryGridSkeleton } from "@/components/skeletons/MasonryGridSkeleton";

export default function ProfileLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <HeaderSkeleton />
      <MasonryGridSkeleton />
    </div>
  );
}
