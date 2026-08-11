import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Hammer, ThumbsUp, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Avatar } from "@/components/Avatar";
import { MasonryGrid } from "@/components/MasonryGrid";
import { PostCard } from "@/components/PostCard";
import { CommentThread } from "@/components/CommentThread";
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
              <span className="flex items-center gap-1">
                <Hammer size={14} /> {post.nail_count}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp size={14} /> {post.upvote_count}
              </span>
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
              />
            ))}
          </MasonryGrid>
        </div>
      )}
    </div>
  );
}
