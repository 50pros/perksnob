"use client";

import { CATEGORY_FIELDS } from "@/lib/constants";
import type { PerkCategory } from "@/lib/types";
import StarInput from "@/components/ui/StarInput";

interface CategoryDetailFieldsProps {
  category: PerkCategory;
  details: Record<string, any>;
  onChange: (details: Record<string, any>) => void;
}

export default function CategoryDetailFields({
  category,
  details,
  onChange,
}: CategoryDetailFieldsProps) {
  const fields = CATEGORY_FIELDS[category] || [];
  if (!fields.length) return null;

  const set = (key: string, value: any) => {
    onChange({ ...details, [key]: value });
  };

  const visible = fields.filter((f) => !f.showIf || f.showIf(details));

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
        Optional details{" "}
        <span className="font-normal normal-case tracking-normal">
          -- helps others know what to expect
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {visible.map((f) => (
          <div
            key={f.key}
            className={
              f.type === "text"
                ? "min-w-[120px] flex-[1_1_160px]"
                : "min-w-[140px] flex-none"
            }
          >
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {f.label}
            </label>

            {f.type === "select" ? (
              <select
                value={(details[f.key] as string) || ""}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none transition-colors focus:border-slate-900"
              >
                <option value="">--</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "rating" ? (
              <StarInput
                value={(details[f.key] as number) || 0}
                onChange={(v) => set(f.key, v)}
                max={f.max || 5}
              />
            ) : (
              <input
                value={(details[f.key] as string) || ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder || ""}
                maxLength={50}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none transition-colors focus:border-slate-900"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
