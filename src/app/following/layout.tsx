import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Following | PerkSnob",
  robots: "noindex",
};

export default function FollowingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
