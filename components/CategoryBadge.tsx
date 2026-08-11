import { getCategoryLabel } from "@/lib/categories";

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="inline-block bg-toolbox-red text-off-white text-xs font-body px-2 py-1 rounded whitespace-nowrap">
      {getCategoryLabel(category)}
    </span>
  );
}
