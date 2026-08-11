export function PostDetailSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8 animate-pulse">
      <div className="border-2 border-chrome/30 rounded overflow-hidden bg-charcoal">
        <div className="w-full aspect-video bg-wood-dark" />
        <div className="p-4 flex flex-col gap-3">
          <div className="h-6 bg-wood-dark rounded w-2/3" />
          <div className="h-4 bg-wood-dark rounded w-full" />
          <div className="h-4 bg-wood-dark rounded w-1/3" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="h-5 bg-wood-dark rounded w-32" />
        <div className="h-16 bg-wood-dark rounded" />
      </div>
    </div>
  );
}
