import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function UserBoardsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = user?.id === profile.id;

  let query = supabase
    .from("boards")
    .select("id, name, description, is_public")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (!isOwnProfile) {
    query = query.eq("is_public", true);
  }

  const { data: boards } = await query;

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <h1 className="font-heading text-3xl text-off-white">@{profile.username}&apos;s Boards</h1>

      {!boards || boards.length === 0 ? (
        <p className="text-off-white/50 text-sm">No boards yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="border-2 border-chrome rounded p-4 flex flex-col gap-1 hover:border-toolbox-red"
            >
              <span className="font-heading text-lg text-off-white truncate">{board.name}</span>
              {board.description && (
                <span className="text-off-white/60 text-xs truncate">{board.description}</span>
              )}
              {!board.is_public && <span className="text-off-white/40 text-xs">Private</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
