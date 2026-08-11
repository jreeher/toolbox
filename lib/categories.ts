import type { PostCategory } from "@/lib/types";

export const CATEGORIES: { slug: PostCategory; label: string }[] = [
  { slug: "projects", label: "Projects" },
  { slug: "tips-techniques", label: "Tips & Techniques" },
  { slug: "tool-talk", label: "Tool Talk" },
  { slug: "plans-blueprints", label: "Plans & Blueprints" },
];

export function getCategoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
