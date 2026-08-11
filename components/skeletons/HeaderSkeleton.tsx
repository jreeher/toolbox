export function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-4 animate-pulse">
      <div className="w-16 h-16 rounded bg-wood-dark" />
      <div className="flex flex-col gap-2">
        <div className="h-6 bg-wood-dark rounded w-48" />
        <div className="h-3 bg-wood-dark rounded w-32" />
      </div>
    </div>
  );
}
