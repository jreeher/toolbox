import { createClient } from "@/lib/supabase/server";
import { ToolboxHero } from "@/components/ToolboxHero";
import { RecentPostsStrip } from "@/components/RecentPostsStrip";
import type { Post } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div>
      <ToolboxHero />
      <RecentPostsStrip posts={(posts as Post[]) ?? []} />
    </div>
  );
}
