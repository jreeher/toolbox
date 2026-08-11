"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createCommentAction, type CreateCommentState } from "@/app/post/[id]/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-end bg-toolbox-red text-off-white text-sm font-body px-4 py-1.5 rounded disabled:opacity-50"
    >
      {pending ? "Posting..." : label}
    </button>
  );
}

interface CommentComposerProps {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onPosted?: () => void;
}

export function CommentComposer({
  postId,
  parentId,
  placeholder = "Add a comment...",
  onPosted,
}: CommentComposerProps) {
  const initialState: CreateCommentState = {};
  const [state, formAction] = useFormState(createCommentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (prevStateRef.current !== state) {
      if (!state.error) {
        formRef.current?.reset();
        onPosted?.();
      }
      prevStateRef.current = state;
    }
  }, [state, onPosted]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea
        name="content"
        required
        rows={parentId ? 2 : 3}
        placeholder={placeholder}
        className="w-full bg-charcoal border border-chrome rounded p-2 text-off-white text-sm resize-none"
      />
      {state.error && <p className="text-toolbox-red text-xs">{state.error}</p>}
      <SubmitButton label={parentId ? "Reply" : "Comment"} />
    </form>
  );
}
