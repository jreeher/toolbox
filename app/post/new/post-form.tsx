"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { PostCard } from "@/components/PostCard";
import { createPostAction, type CreatePostState } from "./actions";
import { CATEGORIES } from "@/lib/categories";

const initialState: CreatePostState = {};

interface PostFormProps {
  author: {
    username: string;
    avatarUrl: string | null;
  };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded disabled:opacity-60"
    >
      {pending ? "Posting..." : "Post It"}
    </button>
  );
}

export function PostForm({ author }: PostFormProps) {
  const [state, formAction] = useFormState(createPostAction, initialState);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setFileError("Please choose an image file");
      e.target.value = "";
      setPreviewUrl(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Image must be under 5MB");
      e.target.value = "";
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 p-8">
      <form action={formAction} className="flex flex-col gap-4">
        <input
          type="text"
          name="title"
          placeholder="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={4}
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <select
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="subcategory"
          placeholder="Subcategory (optional)"
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="text-off-white text-sm"
        />
        {fileError && <p className="text-toolbox-red text-sm">{fileError}</p>}
        {state.error && <p className="text-toolbox-red text-sm">{state.error}</p>}
        <SubmitButton />
      </form>

      <div>
        <p className="font-body text-off-white text-sm mb-2">Preview</p>
        {previewUrl ? (
          <PostCard
            post={{
              id: "preview",
              title: title || "Your title here",
              imageUrl: previewUrl,
              category: category || "projects",
              nailCount: 0,
              upvoteCount: 0,
              commentCount: 0,
            }}
            author={author}
          />
        ) : (
          <div className="border-2 border-chrome rounded aspect-[4/3] flex items-center justify-center text-dark-chrome text-sm">
            Upload an image to see a preview
          </div>
        )}
      </div>
    </div>
  );
}
