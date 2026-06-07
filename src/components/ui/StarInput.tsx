"use client";

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export default function StarInput({
  value,
  onChange,
  max = 5,
}: StarInputProps) {
  return (
    <div className="inline-flex gap-0.5" role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={starValue === value}
            aria-label={`Rate ${starValue} out of ${max}`}
            onClick={() => onChange(starValue)}
            className={[
              "text-xl transition-colors",
              filled ? "text-amber-400" : "text-slate-300",
              "hover:text-amber-400",
            ].join(" ")}
          >
            &#9733;
          </button>
        );
      })}
    </div>
  );
}
