import { CATEGORY_FIELDS } from "@/lib/constants";
import type { PerkCategory } from "@/lib/types";
import Badge from "@/components/ui/Badge";

interface CategoryDetailTagsProps {
  category: PerkCategory;
  details: Record<string, any>;
}

export default function CategoryDetailTags({
  category,
  details,
}: CategoryDetailTagsProps) {
  if (!details || typeof details !== "object") return null;

  const fields = CATEGORY_FIELDS[category] || [];
  if (!fields.length) return null;

  const tags = fields
    .map((f) => {
      const v = details[f.key];
      if (!v) return null;
      if (f.type === "rating") {
        return {
          label: f.label,
          value:
            "\u2605".repeat(v as number) +
            "\u2606".repeat((f.max || 5) - (v as number)),
        };
      }
      return { label: f.label, value: String(v) };
    })
    .filter(Boolean) as { label: string; value: string }[];

  if (!tags.length) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {tags.map((t, i) => (
        <Badge key={i} variant="info" className="gap-1 text-[9px]">
          <span className="opacity-70">{t.label}:</span> {t.value}
        </Badge>
      ))}
    </div>
  );
}
