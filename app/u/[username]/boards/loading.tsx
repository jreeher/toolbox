export default function UserBoardsLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 animate-pulse">
      <div className="h-8 bg-wood-dark rounded w-64" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-2 border-chrome/30 rounded p-4 h-20 bg-charcoal" />
        ))}
      </div>
    </div>
  );
}
