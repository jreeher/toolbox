"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  error?: string;
};

export async function completeOnboardingAction(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const username = (formData.get("username") as string)?.trim();
  const bio = ((formData.get("bio") as string) || "").trim() || null;

  if (!username) {
    return { error: "Username is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth");
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username,
    bio,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is taken — try another" };
    }
    return { error: error.message };
  }

  redirect("/feed");
}
