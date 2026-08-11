import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { signOutAction } from "@/lib/auth/actions";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";

export async function ToolboxNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; avatar_url: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-charcoal border-b-2 border-chrome flex items-center justify-between px-6 gap-4">
      <div className="flex items-center gap-4">
        <MobileNavDrawer profile={profile} />
        <span className="font-heading text-2xl tracking-wide text-toolbox-red">
          THE TOOLBOX
        </span>
      </div>
      <nav className="hidden md:flex items-center gap-8 font-body text-sm text-off-white">
        <Link href="/feed">Feed</Link>
        {user && profile && <Link href={`/u/${profile.username}/boards`}>Boards</Link>}
        <form action="/search" className="flex items-center gap-1">
          <input
            type="text"
            name="q"
            placeholder="Search..."
            className="bg-wood-dark border border-chrome text-off-white text-sm px-2 py-1 rounded w-40"
          />
          <button type="submit" aria-label="Search" className="text-off-white">
            <Search size={16} />
          </button>
        </form>
      </nav>
      <div className="flex items-center gap-3">
        {user && profile ? (
          <>
            <Link
              href="/post/new"
              className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded"
            >
              New Post
            </Link>
            <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={32} />
            <span className="text-off-white text-sm hidden sm:inline">
              {profile.username}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="border border-chrome text-off-white text-sm px-4 py-2 rounded"
              >
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="border border-chrome text-off-white text-sm px-4 py-2 rounded"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
