import { MasonryGridSkeleton } from "@/components/skeletons/MasonryGridSkeleton";

export default function FeedLoading() {
  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-pulse">
        <div className="h-8 bg-wood-dark rounded w-64" />
        <div className="h-8 bg-wood-dark rounded w-48" />
      </div>
      <MasonryGridSkeleton />
    </div>
  );
}
