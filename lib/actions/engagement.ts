"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EngagementState = {
  error?: string;
};

export async function toggleUpvoteAction(
  postId: string,
  path: string
): Promise<EngagementState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to upvote" };
  }

  const { data: existing } = await supabase
    .from("upvotes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("upvotes").delete().eq("user_id", user.id).eq("post_id", postId)
    : await supabase.from("upvotes").insert({ user_id: user.id, post_id: postId });

  if (error) {
    return { error: "Failed to update upvote. Please try again." };
  }

  revalidatePath(path);
  return {};
}

export async function toggleNailAction(
  postId: string,
  boardId: string | null,
  path: string
): Promise<EngagementState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to nail a post" };
  }

  const { data: existing } = await supabase
    .from("nails")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("nails").delete().eq("user_id", user.id).eq("post_id", postId)
    : await supabase.from("nails").insert({ user_id: user.id, post_id: postId, board_id: boardId });

  if (error) {
    return { error: "Failed to update nail. Please try again." };
  }

  revalidatePath(path);
  return {};
}
