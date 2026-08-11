import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { MasonryGrid } from "@/components/MasonryGrid";
import { PostCard } from "@/components/PostCard";
import { getViewerEngagement, getViewerBoards } from "@/lib/engagement-queries";
import type { Post } from "@/lib/types";

export default async function ProfilePage({
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
    .select("id, username, avatar_url, bio")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = user?.id === profile.id;

  const [
    { count: followerCount },
    { count: followingCount },
    { data: isFollowingRow },
    { data: posts },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    user && !isOwnProfile
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("posts").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
  ]);

  const userPosts = (posts as Post[]) ?? [];
  const [engagement, viewerBoards] = await Promise.all([
    getViewerEngagement(
      supabase,
      user?.id ?? null,
      userPosts.map((p) => p.id)
    ),
    getViewerBoards(supabase, user?.id ?? null),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={64} />
          <div>
            <h1 className="font-heading text-3xl text-off-white">@{profile.username}</h1>
            {profile.bio && <p className="text-off-white/70 text-sm mt-1">{profile.bio}</p>}
            <div className="flex gap-4 mt-2 text-off-white/70 text-sm">
              <span>{followerCount ?? 0} followers</span>
              <span>{followingCount ?? 0} following</span>
              <Link href={`/u/${profile.username}/boards`} className="text-toolbox-red underline">
                Boards
              </Link>
            </div>
          </div>
        </div>
        {!isOwnProfile && (
          <FollowButton
            targetUserId={profile.id}
            path={`/u/${profile.username}`}
            initialFollowing={!!isFollowingRow}
            isLoggedIn={!!user}
          />
        )}
      </div>

      {userPosts.length === 0 ? (
        <p className="text-off-white/50 text-sm">No posts yet.</p>
      ) : (
        <MasonryGrid>
          {userPosts.map((post) => (
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
                username: profile.username,
                avatarUrl: profile.avatar_url,
              }}
              path={`/u/${profile.username}`}
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
