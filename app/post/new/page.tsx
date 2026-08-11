import { requireAuth } from "@/lib/auth/require-auth";

export default async function NewPostPage() {
  await requireAuth();
  return <div className="p-8 font-heading text-3xl">New Post — coming in Phase 4</div>;
}
