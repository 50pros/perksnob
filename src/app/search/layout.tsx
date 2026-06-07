import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Perks | PerkSnob",
  description:
    "Search and filter crowdsourced Marriott elite perk reports by tier and category.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
