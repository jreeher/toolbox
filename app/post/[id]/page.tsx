export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div className="p-8 font-heading text-3xl">Post {id} — coming in Phase 5</div>;
}
