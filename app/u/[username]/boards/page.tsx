export default async function UserBoardsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <div className="p-8 font-heading text-3xl">@{username}&apos;s Boards — coming in Phase 6</div>;
}
