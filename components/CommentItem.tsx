"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { CommentComposer } from "@/components/CommentComposer";
import type { CommentWithAuthor } from "@/lib/types";

function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
    [Infinity, "y"],
  ];
  let value = seconds;
  for (const [amount, unit] of units) {
    if (value < amount) return `${Math.max(1, Math.floor(value))}${unit} ago`;
    value = value / amount;
  }
  return isoDate;
}

interface CommentItemProps {
  comment: CommentWithAuthor;
  replies?: CommentWithAuthor[];
  postId: string;
  canReply: boolean;
}

export function CommentItem({ comment, replies = [], postId, canReply }: CommentItemProps) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Avatar username={comment.author.username} avatarUrl={comment.author.avatar_url} size={28} />
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link href={`/u/${comment.author.username}`} className="text-off-white text-sm font-semibold">
              {comment.author.username}
            </Link>
            <span className="text-off-white/50 text-xs">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-off-white text-sm whitespace-pre-wrap">{comment.content}</p>
          {canReply && (
            <button
              type="button"
              onClick={() => setReplying((r) => !r)}
              className="text-off-white/60 text-xs self-start hover:text-off-white"
            >
              {replying ? "Cancel" : "Reply"}
            </button>
          )}
          {replying && (
            <div className="mt-1">
              <CommentComposer
                postId={postId}
                parentId={comment.id}
                placeholder={`Reply to ${comment.author.username}...`}
                onPosted={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>
      {replies.length > 0 && (
        <div className="ml-9 flex flex-col gap-3 border-l border-chrome/30 pl-4">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <Avatar username={reply.author.username} avatarUrl={reply.author.avatar_url} size={24} />
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Link href={`/u/${reply.author.username}`} className="text-off-white text-sm font-semibold">
                    {reply.author.username}
                  </Link>
                  <span className="text-off-white/50 text-xs">{timeAgo(reply.created_at)}</span>
                </div>
                <p className="text-off-white text-sm whitespace-pre-wrap">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
