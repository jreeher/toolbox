import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Avatar } from "@/components/Avatar";
import { MasonryGrid } from "@/components/MasonryGrid";
import { PostCard } from "@/components/PostCard";
import { NailButton } from "@/components/NailButton";
import { UpvoteButton } from "@/components/UpvoteButton";
import { CommentThread } from "@/components/CommentThread";
import { getViewerEngagement, getViewerBoards } from "@/lib/engagement-queries";
import type { CommentWithAuthor } from "@/lib/types";
import type { FeedPost } from "@/app/feed/types";

const RELATED_LIMIT = 4;

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url)")
    .eq("id", id)
    .maybeSingle<FeedPost>();

  if (!post || !post.profiles) {
    notFound();
  }

  const [{ data: rawComments }, { data: relatedPosts }] = await Promise.all([
    supabase
      .from("comments")
      .select("*, profiles(username, avatar_url)")
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(username, avatar_url)")
      .eq("category", post.category)
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(RELATED_LIMIT),
  ]);

  const allPostIds = [post.id, ...((relatedPosts as FeedPost[] | null) ?? []).map((p) => p.id)];
  const [engagement, viewerBoards] = await Promise.all([
    getViewerEngagement(supabase, user?.id ?? null, allPostIds),
    getViewerBoards(supabase, user?.id ?? null),
  ]);
  const viewer = {
    isLoggedIn: !!user,
    isUpvoted: engagement.upvoted.includes(post.id),
    isNailed: post.id in engagement.nailed,
    viewerBoards,
  };

  const comments: CommentWithAuthor[] = (rawComments ?? [])
    .filter((c) => c.profiles)
    .map((c) => ({
      id: c.id,
      post_id: c.post_id,
      user_id: c.user_id,
      parent_id: c.parent_id,
      content: c.content,
      created_at: c.created_at,
      author: {
        username: c.profiles.username,
        avatar_url: c.profiles.avatar_url,
      },
    }));

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <div className="border-2 border-toolbox-red rounded overflow-hidden bg-charcoal">
        <div className="relative w-full aspect-video bg-wood-dark">
          <Image src={post.image_url} alt={post.title} fill className="object-cover" />
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-heading text-2xl text-off-white">{post.title}</h1>
            <CategoryBadge category={post.category} />
          </div>
          {post.description && (
            <p className="text-off-white text-sm whitespace-pre-wrap">{post.description}</p>
          )}
          <div className="flex items-center justify-between">
            <Link href={`/u/${post.profiles.username}`} className="flex items-center gap-2">
              <Avatar username={post.profiles.username} avatarUrl={post.profiles.avatar_url} size={28} />
              <span className="text-off-white text-sm">{post.profiles.username}</span>
            </Link>
            <div className="flex items-center gap-3 text-off-white text-sm">
              <NailButton
                postId={post.id}
                path={`/post/${post.id}`}
                initialNailed={viewer.isNailed}
                initialCount={post.nail_count}
                viewerBoards={viewer.viewerBoards}
                isLoggedIn={viewer.isLoggedIn}
              />
              <UpvoteButton
                postId={post.id}
                path={`/post/${post.id}`}
                initialUpvoted={viewer.isUpvoted}
                initialCount={post.upvote_count}
                isLoggedIn={viewer.isLoggedIn}
              />
              <span className="flex items-center gap-1">
                <MessageCircle size={14} /> {comments.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CommentThread postId={post.id} comments={comments} currentUser={user ? { id: user.id } : null} />

      {relatedPosts && relatedPosts.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-xl text-off-white">Related posts</h2>
          <MasonryGrid>
            {(relatedPosts as FeedPost[]).map((related) => (
              <PostCard
                key={related.id}
                post={{
                  id: related.id,
                  title: related.title,
                  imageUrl: related.image_url,
                  category: related.category,
                  nailCount: related.nail_count,
                  upvoteCount: related.upvote_count,
                  commentCount: 0,
                }}
                author={{
                  username: related.profiles?.username ?? "unknown",
                  avatarUrl: related.profiles?.avatar_url ?? null,
                }}
                path={`/post/${post.id}`}
                viewer={{
                  isLoggedIn: viewer.isLoggedIn,
                  isNailed: related.id in engagement.nailed,
                  isUpvoted: engagement.upvoted.includes(related.id),
                  viewerBoards,
                }}
              />
            ))}
          </MasonryGrid>
        </div>
      )}
    </div>
  );
}
