import Link from "next/link";
import { CommentItem } from "@/components/CommentItem";
import { CommentComposer } from "@/components/CommentComposer";
import type { CommentWithAuthor } from "@/lib/types";

interface CommentThreadProps {
  postId: string;
  comments: CommentWithAuthor[];
  currentUser: { id: string } | null;
}

export function CommentThread({ postId, comments, currentUser }: CommentThreadProps) {
  const topLevel = comments
    .filter((c) => !c.parent_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const repliesByParent = new Map<string, CommentWithAuthor[]>();
  for (const c of comments) {
    if (c.parent_id) {
      const list = repliesByParent.get(c.parent_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_id, list);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl text-off-white">Comments ({comments.length})</h2>

      {currentUser ? (
        <CommentComposer postId={postId} />
      ) : (
        <p className="text-off-white/70 text-sm">
          <Link href="/login" className="text-toolbox-red underline">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {topLevel.length === 0 && (
          <p className="text-off-white/50 text-sm">No comments yet — be the first.</p>
        )}
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={repliesByParent.get(comment.id) ?? []}
            postId={postId}
            canReply={!!currentUser}
          />
        ))}
      </div>
    </div>
  );
}
