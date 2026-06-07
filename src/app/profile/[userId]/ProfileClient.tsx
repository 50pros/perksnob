"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TIERS } from "@/lib/constants";
import type { UserProfile, PerkReport, EliteTier } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { getTier, badgeEmoji, getCategory, timeAgo } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface ProfileClientProps {
  userId: string;
  profile: UserProfile | null;
  perks: PerkReport[];
  upvoteCount: number;
  commentCount: number;
}

export default function ProfileClient({
  userId,
  profile,
  perks,
  upvoteCount,
  commentCount,
}: ProfileClientProps) {
  const { user } = useAuth();
  const isOwner = user?.id === userId;

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  const [eliteTier, setEliteTier] = useState(profile?.elite_tier || "");
  const [eliteSince, setEliteSince] = useState(profile?.elite_since || "");
  const [redditUsername, setRedditUsername] = useState(
    profile?.reddit_username || ""
  );
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    "Anonymous";

  const firstLetter = (displayName || "A").charAt(0).toUpperCase();

  const tier = profile?.elite_tier ? getTier(profile.elite_tier) : null;

  // Compute badge
  const perkCount = perks.length;
  const badge =
    perkCount >= 50
      ? "Snob Supreme"
      : perkCount >= 20
        ? "Elite Reporter"
        : perkCount >= 5
          ? "Perk Scout"
          : perkCount >= 1
            ? "Contributor"
            : "New";

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2009 }, (_, i) =>
    String(currentYear - i)
  );

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Upsert profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert(
          {
            id: userId,
            display_name: profile?.display_name || displayName,
            bio: bio.slice(0, 200),
            elite_tier: eliteTier || null,
            elite_since: eliteSince || null,
            reddit_username: redditUsername || null,
          },
          { onConflict: "id" }
        );

      if (profileError) throw profileError;

      // Upsert notification prefs
      const { error: prefError } = await supabase
        .from("user_notification_prefs")
        .upsert(
          {
            user_id: userId,
            monthly_digest: digestEnabled,
          },
          { onConflict: "user_id" }
        );

      if (prefError) {
        console.error("Notification prefs update failed:", prefError);
      }

      showToast("Profile saved");
      setEditing(false);
    } catch {
      showToast("Failed to save profile", "error");
    }

    setSaving(false);
  }, [user, userId, bio, eliteTier, eliteSince, redditUsername, digestEnabled, profile, displayName]);

  if (!profile && !user) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
          >
            &larr; Back to home
          </a>
          <h1 className="text-2xl font-bold text-slate-900">
            Profile not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This user profile does not exist.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          &larr; Back to home
        </a>

        {/* Profile header */}
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white">
            {firstLetter}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-slate-900 sm:text-3xl">
                {displayName}
              </h1>
              {isOwner && (
                <button
                  onClick={() => setEditing(!editing)}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-slate-400 transition-colors"
                >
                  {editing ? "Cancel" : "Edit"}
                </button>
              )}
            </div>

            {/* Badge */}
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs">
                <span>{badgeEmoji(badge)}</span>
                <span className="font-medium text-slate-700">{badge}</span>
              </span>
              {tier && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: tier.color }}
                >
                  {tier.label}
                </span>
              )}
            </div>

            {/* Elite since */}
            {profile?.elite_since && (
              <p className="mt-1 text-xs text-slate-500">
                Elite since {profile.elite_since}
              </p>
            )}

            {/* Bio */}
            {profile?.bio && !editing && (
              <p className="mt-2 text-sm text-slate-600">{profile.bio}</p>
            )}

            {/* Reddit */}
            {profile?.reddit_username && !editing && (
              <a
                href={`https://reddit.com/u/${profile.reddit_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-blue-600 hover:underline"
              >
                u/{profile.reddit_username}
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{perkCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Perks
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{upvoteCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Upvotes
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{commentCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Comments
            </p>
          </div>
        </div>

        {/* Edit mode */}
        {editing && isOwner && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Edit Profile
            </h3>

            <div className="space-y-4">
              {/* Bio */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Bio ({bio.length}/200)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  maxLength={200}
                  rows={3}
                  placeholder="Tell the community about yourself..."
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none"
                />
              </div>

              {/* Elite tier */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Elite Tier
                </label>
                <select
                  value={eliteTier}
                  onChange={(e) => setEliteTier(e.target.value as EliteTier)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Select tier...</option>
                  {TIERS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Elite since */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Elite Since
                </label>
                <select
                  value={eliteSince}
                  onChange={(e) => setEliteSince(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Select year...</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reddit username */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Reddit Username
                </label>
                <input
                  type="text"
                  value={redditUsername}
                  onChange={(e) => setRedditUsername(e.target.value)}
                  placeholder="e.g. PerkSnobFan"
                  className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Monthly digest */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="digest"
                  checked={digestEnabled}
                  onChange={(e) => setDigestEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label
                  htmlFor="digest"
                  className="text-sm text-slate-700"
                >
                  Monthly digest email
                </label>
              </div>

              <Button
                onClick={handleSave}
                loading={saving}
                className="w-full py-3"
              >
                Save Profile
              </Button>
            </div>
          </div>
        )}

        {/* Recent perks */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Recent Perk Reports
          </h2>

          {perks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-sm text-slate-500">
                No perk reports yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {perks.map((perk) => {
                const cat = getCategory(perk.category);
                return (
                  <div
                    key={perk.id}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-900">
                        {cat.label}
                      </span>
                      <Badge>
                        {getTier(perk.elite_tier).label}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {timeAgo(perk.created_at)}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-600 line-clamp-2">
                      {perk.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
