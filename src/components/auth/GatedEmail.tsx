"use client";

import { Mail } from "lucide-react";
import { EMAIL_GATE_DAYS } from "@/lib/constants";
import { getAccountAgeDays, isEmailVerified } from "@/lib/utils";
import type { Hotel } from "@/lib/types";

interface GatedEmailProps {
  hotel: Hotel;
  user: any;
  onNeedAuth: () => void;
}

export default function GatedEmail({
  hotel,
  user,
  onNeedAuth,
}: GatedEmailProps) {
  const email = hotel.email;
  if (!email) return null;

  // Not signed in
  if (!user) {
    return (
      <div
        onClick={onNeedAuth}
        className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
      >
        <Mail className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-400">
          Hotel email available
        </span>
        <span className="ml-1.5 text-[11px] text-slate-500">
          -- Sign in to unlock
        </span>
      </div>
    );
  }

  // Not email verified
  const verified = isEmailVerified(user);
  if (!verified) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
        <Mail className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-400">
          Hotel email available
        </span>
        <span className="ml-1.5 text-[11px] text-slate-500">
          -- Verify your email to unlock
        </span>
      </div>
    );
  }

  // Account too new
  const ageDays = getAccountAgeDays(user);
  const daysLeft = EMAIL_GATE_DAYS - ageDays;

  if (daysLeft > 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
        <Mail className="h-3.5 w-3.5 text-slate-400" />
        <div>
          <span className="text-xs font-semibold text-slate-400">
            Hotel email unlocks in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
          </span>
          <div className="mt-1 h-1 w-[120px] overflow-hidden rounded bg-white/10">
            <div
              className="h-full rounded bg-sky-400 transition-[width] duration-300"
              style={{
                width: `${(ageDays / EMAIL_GATE_DAYS) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Full access -- show email
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <Mail className="h-3.5 w-3.5 text-sky-400" />
      <a
        href={`mailto:${email}`}
        className="text-[13px] font-semibold text-sky-400 no-underline transition-colors hover:text-sky-300"
      >
        {email}
      </a>
    </div>
  );
}
