export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <div className="p-8 font-heading text-3xl">@{username} — coming in Phase 7</div>;
}
