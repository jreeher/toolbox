"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Avatar } from "@/components/Avatar";
import { NailButton } from "@/components/NailButton";
import { UpvoteButton } from "@/components/UpvoteButton";

interface ViewerState {
  isLoggedIn: boolean;
  isNailed: boolean;
  isUpvoted: boolean;
  viewerBoards: { id: string; name: string }[];
}

const LOGGED_OUT_VIEWER: ViewerState = {
  isLoggedIn: false,
  isNailed: false,
  isUpvoted: false,
  viewerBoards: [],
};

interface PostCardProps {
  post: {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    nailCount: number;
    upvoteCount: number;
    commentCount: number;
  };
  author: {
    username: string;
    avatarUrl: string | null;
  };
  path?: string;
  viewer?: ViewerState;
  interactive?: boolean;
}

export function PostCard({
  post,
  author,
  path = "/feed",
  viewer = LOGGED_OUT_VIEWER,
  interactive = true,
}: PostCardProps) {
  const isBlobUrl = post.imageUrl.startsWith("blob:");

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    await navigator.clipboard.writeText(url);
    toast("Link copied to clipboard");
  }

  return (
    <div className="border-2 border-toolbox-red rounded overflow-hidden bg-charcoal transition-transform hover:scale-[1.02] hover:shadow-xl">
      <Link href={`/post/${post.id}`}>
        <div className="relative w-full aspect-[4/3] bg-wood-dark">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            unoptimized={isBlobUrl}
            className="object-cover"
          />
        </div>
      </Link>
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/post/${post.id}`}
            className="font-heading text-lg text-off-white truncate"
          >
            {post.title}
          </Link>
          <CategoryBadge category={post.category} />
        </div>
        <div className="flex items-center justify-between text-off-white text-sm">
          <div className="flex items-center gap-3">
            <NailButton
              postId={post.id}
              path={path}
              initialNailed={viewer.isNailed}
              initialCount={post.nailCount}
              viewerBoards={viewer.viewerBoards}
              isLoggedIn={viewer.isLoggedIn}
              interactive={interactive}
            />
            <UpvoteButton
              postId={post.id}
              path={path}
              initialUpvoted={viewer.isUpvoted}
              initialCount={post.upvoteCount}
              isLoggedIn={viewer.isLoggedIn}
              interactive={interactive}
            />
            <Link href={`/post/${post.id}`} className="flex items-center gap-1">
              <MessageCircle size={14} /> {post.commentCount}
            </Link>
          </div>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Copy link to this post"
            className="flex items-center gap-1"
          >
            <Share2 size={14} />
          </button>
        </div>
        <Link href={`/u/${author.username}`} className="flex items-center gap-2 mt-1">
          <Avatar username={author.username} avatarUrl={author.avatarUrl} size={20} />
          <span className="text-off-white text-xs">{author.username}</span>
        </Link>
      </div>
    </div>
  );
}
