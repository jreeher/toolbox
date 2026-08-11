import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    redirect("/feed");
  }

  return (
    <div className="max-w-sm mx-auto p-8">
      <h1 className="font-heading text-4xl text-toolbox-red mb-6">
        Set Up Your Profile
      </h1>
      <OnboardingForm />
    </div>
  );
}
