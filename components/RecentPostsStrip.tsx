import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types";

interface RecentPostsStripProps {
  posts: Post[];
}

export function RecentPostsStrip({ posts }: RecentPostsStripProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="font-body text-off-white text-sm">
          Nothing nailed yet — be the first to share a project.
        </p>
        <Link
          href="/post/new"
          className="inline-block mt-4 bg-toolbox-red text-off-white text-sm px-4 py-2 rounded"
        >
          Share a Project
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <h2 className="font-heading text-3xl text-toolbox-red mb-4 text-center">
        HOT OFF THE WORKBENCH
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {posts.map((post) => (
          <Link key={post.id} href={`/post/${post.id}`} className="flex-shrink-0 w-40">
            <div className="relative w-40 h-40 rounded overflow-hidden border border-chrome">
              <Image src={post.image_url} alt={post.title} fill className="object-cover" />
            </div>
            <p className="font-body text-off-white text-sm mt-2 truncate">{post.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
