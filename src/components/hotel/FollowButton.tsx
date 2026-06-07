"use client";

import { Heart } from "lucide-react";

interface FollowButtonProps {
  isFollowing: boolean;
  isBusy: boolean;
  onClick: () => void;
}

export default function FollowButton({
  isFollowing,
  isBusy,
  onClick,
}: FollowButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={isBusy}
      aria-label={isFollowing ? "Unfollow hotel" : "Follow hotel"}
      className={[
        "inline-flex items-center justify-center rounded-full p-1.5 transition-all",
        isFollowing
          ? "text-red-500 hover:text-red-600"
          : "text-slate-300 hover:text-red-400",
        isBusy ? "animate-pulse opacity-50 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <Heart
        className="h-4 w-4"
        fill={isFollowing ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}
