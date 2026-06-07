import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Hotels | PerkSnob",
  description:
    "Compare elite perk likelihood between two Marriott Bonvoy hotels side by side.",
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
