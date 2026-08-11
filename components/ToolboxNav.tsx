export function ToolboxNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-charcoal border-b-2 border-chrome flex items-center justify-between px-6">
      <span className="font-heading text-2xl tracking-wide text-toolbox-red">
        THE TOOLBOX
      </span>
      <nav className="hidden md:flex gap-8 font-body text-sm text-off-white">
        <span>Feed</span>
        <span>Categories</span>
        <span>Boards</span>
      </nav>
      <div className="flex gap-3">
        <button className="border border-chrome text-off-white text-sm px-4 py-2 rounded">
          Sign In
        </button>
        <button className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded">
          Sign Up
        </button>
      </div>
    </header>
  );
}
