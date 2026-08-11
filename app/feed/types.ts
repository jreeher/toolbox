import type { Post } from "@/lib/types";

export interface FeedPost extends Post {
  profiles: { username: string; avatar_url: string | null } | null;
}
