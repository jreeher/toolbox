"use client";

import { useState, useTransition } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toggleUpvoteAction } from "@/lib/actions/engagement";

interface UpvoteButtonProps {
  postId: string;
  path: string;
  initialUpvoted: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  interactive?: boolean;
}

export function UpvoteButton({
  postId,
  path,
  initialUpvoted,
  initialCount,
  isLoggedIn,
  interactive = true,
}: UpvoteButtonProps) {
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!interactive || isPending) return;

    if (!isLoggedIn) {
      router.push("/login?reason=auth");
      return;
    }

    const nextUpvoted = !upvoted;
    setUpvoted(nextUpvoted);
    setCount((c) => c + (nextUpvoted ? 1 : -1));

    startTransition(async () => {
      const result = await toggleUpvoteAction(postId, path);
      if (result.error) {
        setUpvoted(!nextUpvoted);
        setCount((c) => c + (nextUpvoted ? -1 : 1));
        if (result.error.includes("signed in")) {
          router.push("/login?reason=auth");
        } else {
          toast(result.error);
        }
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={upvoted}
      aria-label={upvoted ? "Remove upvote" : "Upvote this post"}
      className={`flex items-center gap-1 ${upvoted ? "text-toolbox-red" : "text-off-white"}`}
    >
      <ThumbsUp size={14} fill={upvoted ? "currentColor" : "none"} /> {count}
    </button>
  );
}
