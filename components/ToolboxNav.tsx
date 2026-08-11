import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { signOutAction } from "@/lib/auth/actions";

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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-charcoal border-b-2 border-chrome flex items-center justify-between px-6">
      <span className="font-heading text-2xl tracking-wide text-toolbox-red">
        THE TOOLBOX
      </span>
      <nav className="hidden md:flex gap-8 font-body text-sm text-off-white">
        <span>Feed</span>
        <span>Categories</span>
        <span>Boards</span>
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
