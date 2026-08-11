"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PostCategory } from "@/lib/types";

export type CreatePostState = {
  error?: string;
};

const VALID_CATEGORIES: PostCategory[] = [
  "projects",
  "tips-techniques",
  "tool-talk",
  "plans-blueprints",
];

export async function createPostAction(
  _prevState: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const title = (formData.get("title") as string)?.trim();
  const description = ((formData.get("description") as string) || "").trim() || null;
  const category = formData.get("category") as string;
  const subcategory = ((formData.get("subcategory") as string) || "").trim() || null;
  const image = formData.get("image") as File | null;

  if (!title) {
    return { error: "Title is required" };
  }
  if (!category || !VALID_CATEGORIES.includes(category as PostCategory)) {
    return { error: "Please select a valid category" };
  }
  if (!image || image.size === 0) {
    return { error: "An image is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth");
  }

  const filePath = `${user.id}/${Date.now()}-${image.name}`;

  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, image);

  if (uploadError) {
    return { error: "Failed to upload image. Please try again." };
  }

  const { data: publicUrlData } = supabase.storage
    .from("post-images")
    .getPublicUrl(filePath);

  const { data: newPost, error: insertError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      title,
      description,
      category,
      subcategory,
      image_url: publicUrlData.publicUrl,
    })
    .select("id")
    .single();

  if (insertError || !newPost) {
    return { error: "Failed to create post. Please try again." };
  }

  redirect(`/post/${newPost.id}`);
}
