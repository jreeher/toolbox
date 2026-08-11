"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toggleFollowAction } from "@/lib/actions/engagement";

interface FollowButtonProps {
  targetUserId: string;
  path: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}

export function FollowButton({
  targetUserId,
  path,
  initialFollowing,
  isLoggedIn,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (isPending) return;

    if (!isLoggedIn) {
      router.push("/login?reason=auth");
      return;
    }

    const nextFollowing = !following;
    setFollowing(nextFollowing);

    startTransition(async () => {
      const result = await toggleFollowAction(targetUserId, path);
      if (result.error) {
        setFollowing(!nextFollowing);
        toast(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`text-sm px-4 py-2 rounded disabled:opacity-50 ${
        following
          ? "border border-chrome text-off-white"
          : "bg-toolbox-red text-off-white"
      }`}
    >
      {following ? "Unfollow" : "Follow"}
    </button>
  );
}
