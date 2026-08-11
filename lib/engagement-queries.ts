import type { SupabaseClient } from "@supabase/supabase-js";

export interface ViewerEngagement {
  nailed: Record<string, string | null>;
  upvoted: string[];
}

export async function getViewerEngagement(
  supabase: SupabaseClient,
  userId: string | null,
  postIds: string[]
): Promise<ViewerEngagement> {
  if (!userId || postIds.length === 0) {
    return { nailed: {}, upvoted: [] };
  }

  const [{ data: nails }, { data: upvotes }] = await Promise.all([
    supabase
      .from("nails")
      .select("post_id, board_id")
      .eq("user_id", userId)
      .in("post_id", postIds),
    supabase.from("upvotes").select("post_id").eq("user_id", userId).in("post_id", postIds),
  ]);

  const nailed: Record<string, string | null> = {};
  for (const nail of nails ?? []) {
    nailed[nail.post_id] = nail.board_id;
  }

  return {
    nailed,
    upvoted: (upvotes ?? []).map((u) => u.post_id),
  };
}

export async function getViewerBoards(
  supabase: SupabaseClient,
  userId: string | null
): Promise<{ id: string; name: string }[]> {
  if (!userId) return [];

  const { data } = await supabase
    .from("boards")
    .select("id, name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
