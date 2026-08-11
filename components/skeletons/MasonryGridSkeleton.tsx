const HEIGHTS = [220, 280, 180, 260, 200, 240, 300, 190, 250, 210, 230, 270];

export function MasonryGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse border-2 border-chrome/30 rounded overflow-hidden bg-charcoal"
        >
          <div
            className="bg-wood-dark w-full"
            style={{ height: HEIGHTS[i % HEIGHTS.length] }}
          />
          <div className="p-3 flex flex-col gap-2">
            <div className="h-4 bg-wood-dark rounded w-3/4" />
            <div className="h-3 bg-wood-dark rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
