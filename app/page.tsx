import { createClient } from "@/lib/supabase/server";
import { ToolboxHero } from "@/components/ToolboxHero";
import { RecentPostsStrip } from "@/components/RecentPostsStrip";
import type { Post } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Failed to fetch recent posts:", error);
  }

  return (
    <div>
      <ToolboxHero />
      <RecentPostsStrip posts={(posts as Post[]) ?? []} />
    </div>
  );
}
