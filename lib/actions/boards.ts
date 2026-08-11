"use server";

import { createClient } from "@/lib/supabase/server";

export type CreateBoardState = {
  error?: string;
  board?: { id: string; name: string };
};

export async function createBoardAction(name: string, isPublic: boolean): Promise<CreateBoardState> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { error: "Board name is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a board" };
  }

  const { data, error } = await supabase
    .from("boards")
    .insert({ user_id: user.id, name: trimmedName, is_public: isPublic })
    .select("id, name")
    .single();

  if (error || !data) {
    return { error: "Failed to create board. Please try again." };
  }

  return { board: data };
}
