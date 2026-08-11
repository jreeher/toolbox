import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MasonryGrid } from "@/components/MasonryGrid";
import { PostCard } from "@/components/PostCard";
import { getViewerEngagement, getViewerBoards } from "@/lib/engagement-queries";
import type { FeedPost } from "@/app/feed/types";

interface BoardRow {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: board } = await supabase
    .from("boards")
    .select("*, profiles!boards_user_id_fkey(username, avatar_url)")
    .eq("id", id)
    .maybeSingle<BoardRow>();

  if (!board || !board.profiles) {
    notFound();
  }

  const { data: nailRows } = await supabase
    .from("nails")
    .select("post_id, created_at, posts(*, profiles!posts_user_id_fkey(username, avatar_url))")
    .eq("board_id", id)
    .order("created_at", { ascending: false });

  const nailedPosts = (nailRows ?? [])
    .map((row) => row.posts)
    .filter(Boolean) as unknown as FeedPost[];

  const [engagement, viewerBoards] = await Promise.all([
    getViewerEngagement(
      supabase,
      user?.id ?? null,
      nailedPosts.map((p) => p.id)
    ),
    getViewerBoards(supabase, user?.id ?? null),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl text-off-white">{board.name}</h1>
          {board.description && (
            <p className="text-off-white/70 text-sm mt-1">{board.description}</p>
          )}
        </div>
        <Link href={`/u/${board.profiles.username}`} className="flex items-center gap-2">
          <Avatar username={board.profiles.username} avatarUrl={board.profiles.avatar_url} size={28} />
          <span className="text-off-white text-sm">{board.profiles.username}</span>
        </Link>
      </div>

      {nailedPosts.length === 0 ? (
        <p className="text-off-white/50 text-sm">No posts nailed to this board yet.</p>
      ) : (
        <MasonryGrid>
          {nailedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                title: post.title,
                imageUrl: post.image_url,
                category: post.category,
                nailCount: post.nail_count,
                upvoteCount: post.upvote_count,
                commentCount: 0,
              }}
              author={{
                username: post.profiles?.username ?? "unknown",
                avatarUrl: post.profiles?.avatar_url ?? null,
              }}
              path={`/boards/${id}`}
              viewer={{
                isLoggedIn: !!user,
                isNailed: post.id in engagement.nailed,
                isUpvoted: engagement.upvoted.includes(post.id),
                viewerBoards,
              }}
            />
          ))}
        </MasonryGrid>
      )}
    </div>
  );
}
