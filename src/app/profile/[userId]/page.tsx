import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import type { UserProfile, PerkReport } from "@/lib/types";
import ProfileClient from "./ProfileClient";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export const revalidate = 0; // dynamic, no cache for profiles

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const supabase = await createServerSupabase();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single<UserProfile>();

  const displayName = profile?.display_name || "User";

  return {
    title: `${displayName}'s Profile | PerkSnob`,
    robots: "noindex",
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const supabase = await createServerSupabase();

  const [{ data: profile }, { data: perks }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single<UserProfile>(),
    supabase
      .from("perk_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  // Compute stats
  const perkList = (perks || []) as PerkReport[];
  let upvoteCount = 0;

  if (perkList.length > 0) {
    const perkIds = perkList.map((p) => p.id);
    const { count } = await supabase
      .from("perk_votes")
      .select("*", { count: "exact", head: true })
      .in("perk_id", perkIds)
      .eq("vote", 1);
    upvoteCount = count || 0;
  }

  // Comment count
  const { count: commentCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return (
    <ProfileClient
      userId={userId}
      profile={profile as UserProfile | null}
      perks={perkList}
      upvoteCount={upvoteCount}
      commentCount={commentCount || 0}
    />
  );
}
