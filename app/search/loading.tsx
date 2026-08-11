import { MasonryGridSkeleton } from "@/components/skeletons/MasonryGridSkeleton";

export default function SearchLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="h-10 bg-wood-dark rounded animate-pulse" />
      <MasonryGridSkeleton />
    </div>
  );
}
