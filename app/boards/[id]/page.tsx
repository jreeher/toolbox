export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div className="p-8 font-heading text-3xl">Board {id} — coming in Phase 6</div>;
}
