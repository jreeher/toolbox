export type PostCategory =
  | "projects"
  | "tips-techniques"
  | "tool-talk"
  | "plans-blueprints";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: PostCategory;
  subcategory: string | null;
  image_url: string;
  upvote_count: number;
  nail_count: number;
  created_at: string;
}

export interface Nail {
  id: string;
  user_id: string;
  post_id: string;
  board_id: string | null;
  created_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
}

export interface Upvote {
  user_id: string;
  post_id: string;
}

export interface CommentWithAuthor {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: {
    username: string;
    avatar_url: string | null;
  };
}
