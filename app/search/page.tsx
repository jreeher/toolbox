import { createClient } from "@/lib/supabase/server";
import { MasonryGrid } from "@/components/MasonryGrid";
import { PostCard } from "@/components/PostCard";
import { getViewerEngagement, getViewerBoards } from "@/lib/engagement-queries";
import type { FeedPost } from "@/app/feed/types";

const RESULT_LIMIT = 40;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let results: FeedPost[] = [];
  if (query) {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(username, avatar_url)")
      .textSearch("search_vector", query, { type: "websearch" })
      .limit(RESULT_LIMIT);

    if (error) {
      console.error("Search failed:", error);
    } else {
      results = (data as FeedPost[]) ?? [];
    }
  }

  const [engagement, viewerBoards] = await Promise.all([
    getViewerEngagement(
      supabase,
      user?.id ?? null,
      results.map((p) => p.id)
    ),
    getViewerBoards(supabase, user?.id ?? null),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <form action="/search" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search posts..."
          className="flex-1 bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <button type="submit" className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded">
          Search
        </button>
      </form>

      {!query ? (
        <p className="text-off-white/50 text-sm">Search for posts by title or description.</p>
      ) : results.length === 0 ? (
        <p className="text-off-white/50 text-sm">No results for &ldquo;{query}&rdquo;.</p>
      ) : (
        <MasonryGrid>
          {results.map((post) => (
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
              path={`/search?q=${encodeURIComponent(query)}`}
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
