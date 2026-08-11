"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateCommentState = {
  error?: string;
};

const MAX_COMMENT_LENGTH = 2000;

export async function createCommentAction(
  _prevState: CreateCommentState,
  formData: FormData
): Promise<CreateCommentState> {
  const postId = formData.get("postId") as string;
  const parentId = ((formData.get("parentId") as string) || "").trim() || null;
  const content = ((formData.get("content") as string) || "").trim();

  if (!postId) {
    return { error: "Missing post" };
  }
  if (!content) {
    return { error: "Comment can't be empty" };
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    return { error: `Comment must be under ${MAX_COMMENT_LENGTH} characters` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to comment" };
  }

  const { error: insertError } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    parent_id: parentId,
    content,
  });

  if (insertError) {
    return { error: "Failed to post comment. Please try again." };
  }

  revalidatePath(`/post/${postId}`);
  return {};
}
