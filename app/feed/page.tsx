import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";
import { FeedList } from "./feed-list";
import type { FeedPost } from "./types";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "nailed", label: "Most Nailed" },
  { value: "top", label: "Top Rated" },
];

function sortToColumn(sort: string): { column: string; ascending: boolean } {
  if (sort === "nailed") return { column: "nail_count", ascending: false };
  if (sort === "top") return { column: "upvote_count", ascending: false };
  return { column: "created_at", ascending: false };
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort = "newest" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, profiles(username, avatar_url)")
    .range(0, PAGE_SIZE - 1);

  if (category) {
    query = query.eq("category", category);
  }

  const { column, ascending } = sortToColumn(sort);
  query = query.order(column, { ascending });

  const { data: posts, error } = await query;

  if (error) {
    console.error("Failed to fetch feed posts:", error);
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/feed"
            className={`text-sm px-3 py-1 rounded border text-off-white ${
              !category ? "bg-toolbox-red border-toolbox-red" : "border-chrome"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/feed?category=${c.slug}${sort !== "newest" ? `&sort=${sort}` : ""}`}
              className={`text-sm px-3 py-1 rounded border text-off-white ${
                category === c.slug ? "bg-toolbox-red border-toolbox-red" : "border-chrome"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          {SORT_OPTIONS.map((s) => (
            <Link
              key={s.value}
              href={`/feed?sort=${s.value}${category ? `&category=${category}` : ""}`}
              className={`text-sm px-3 py-1 rounded border text-off-white ${
                sort === s.value ? "bg-toolbox-red border-toolbox-red" : "border-chrome"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <FeedList
        initialPosts={(posts as FeedPost[]) ?? []}
        category={category ?? null}
        sort={sort}
      />
    </div>
  );
}
