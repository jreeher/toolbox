"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";

interface MobileNavDrawerProps {
  profile: { username: string } | null;
}

export function MobileNavDrawer({ profile }: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden text-off-white"
      >
        <Menu size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-0 left-0 h-full w-64 bg-charcoal border-r-2 border-chrome flex flex-col gap-4 p-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="self-end text-off-white"
            >
              <X size={24} />
            </button>
            <Link href="/feed" onClick={() => setOpen(false)} className="text-off-white font-body text-lg">
              Feed
            </Link>
            {profile && (
              <Link
                href={`/u/${profile.username}/boards`}
                onClick={() => setOpen(false)}
                className="text-off-white font-body text-lg"
              >
                Boards
              </Link>
            )}
            <form action="/search" className="flex items-center gap-1 mt-2">
              <input
                type="text"
                name="q"
                placeholder="Search..."
                className="flex-1 bg-wood-dark border border-chrome text-off-white text-sm px-2 py-1.5 rounded"
              />
              <button type="submit" aria-label="Search" className="text-off-white">
                <Search size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
