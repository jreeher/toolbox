"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MasonryGrid } from "@/components/MasonryGrid";
import { PostCard } from "@/components/PostCard";
import type { ViewerEngagement } from "@/lib/engagement-queries";
import type { FeedPost } from "./types";

const PAGE_SIZE = 20;

interface FeedListProps {
  initialPosts: FeedPost[];
  category: string | null;
  sort: string;
  isLoggedIn: boolean;
  viewerId: string | null;
  viewerBoards: { id: string; name: string }[];
  initialEngagement: ViewerEngagement;
}

function sortToColumn(sort: string): { column: string; ascending: boolean } {
  if (sort === "nailed") return { column: "nail_count", ascending: false };
  if (sort === "top") return { column: "upvote_count", ascending: false };
  return { column: "created_at", ascending: false };
}

export function FeedList({
  initialPosts,
  category,
  sort,
  isLoggedIn,
  viewerId,
  viewerBoards,
  initialEngagement,
}: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [engagement, setEngagement] = useState(initialEngagement);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setEngagement(initialEngagement);
    setHasMore(initialPosts.length === PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosts]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, posts.length]);

  async function loadMore() {
    setLoading(true);
    const supabase = createClient();
    const { column, ascending } = sortToColumn(sort);

    let query = supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(username, avatar_url)")
      .range(posts.length, posts.length + PAGE_SIZE - 1)
      .order(column, { ascending });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to load more posts:", error);
      setLoading(false);
      return;
    }

    const newPosts = (data as FeedPost[]) ?? [];

    if (viewerId && newPosts.length > 0) {
      const newIds = newPosts.map((p) => p.id);
      const [{ data: nails }, { data: upvotes }] = await Promise.all([
        supabase.from("nails").select("post_id, board_id").eq("user_id", viewerId).in("post_id", newIds),
        supabase.from("upvotes").select("post_id").eq("user_id", viewerId).in("post_id", newIds),
      ]);
      setEngagement((prev) => {
        const nailed = { ...prev.nailed };
        for (const nail of nails ?? []) nailed[nail.post_id] = nail.board_id;
        return {
          nailed,
          upvoted: [...prev.upvoted, ...(upvotes ?? []).map((u) => u.post_id)],
        };
      });
    }

    setPosts((prev) => [...prev, ...newPosts]);
    setHasMore(newPosts.length === PAGE_SIZE);
    setLoading(false);
  }

  return (
    <>
      <MasonryGrid>
        {posts.map((post) => (
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
            path={`/feed${category ? `?category=${category}` : ""}`}
            viewer={{
              isLoggedIn,
              isNailed: post.id in engagement.nailed,
              isUpvoted: engagement.upvoted.includes(post.id),
              viewerBoards,
            }}
          />
        ))}
      </MasonryGrid>
      {hasMore && <div ref={sentinelRef} className="h-4" />}
    </>
  );
}
