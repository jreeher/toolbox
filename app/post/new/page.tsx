import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "./post-form";

export default async function NewPostPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-heading text-4xl text-toolbox-red p-8 pb-0">New Post</h1>
      <PostForm
        author={{
          username: profile?.username ?? "you",
          avatarUrl: profile?.avatar_url ?? null,
        }}
      />
    </div>
  );
}
