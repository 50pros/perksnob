"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { RESERVED_NAMES, MAX_NAME } from "@/lib/constants";
import { sanitize, hasProfanity } from "@/lib/utils";

export interface UseAuthReturn {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    eliteTier: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (
    email: string,
  ) => Promise<{ error?: string; message?: string }>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------------------ */
  /*  Auth state listener                                                */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const supabase = createClient();

    // Seed with current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Admin check                                                        */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!user?.id) {
        if (mounted) setIsAdmin(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error && error.code !== "PGRST116") {
        console.error("Admin check failed:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  /* ------------------------------------------------------------------ */
  /*  signUp                                                             */
  /* ------------------------------------------------------------------ */

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      eliteTier: string,
    ): Promise<{ error?: string }> => {
      const name = displayName.trim();

      // Validate display name length
      if (!name || name.length < 2) {
        return { error: "Display name must be at least 2 characters" };
      }
      if (name.length > MAX_NAME) {
        return { error: `Display name must be ${MAX_NAME} characters or less` };
      }

      // Validate reserved names
      if (RESERVED_NAMES.includes(name.toLowerCase())) {
        return {
          error: "That display name is reserved. Please choose another.",
        };
      }

      // Profanity check
      if (hasProfanity(name)) {
        return {
          error:
            "Display name contains inappropriate language. Please choose another.",
        };
      }

      // Password validation
      if (password.length < 8) {
        return { error: "Password must be at least 8 characters" };
      }

      const supabase = createClient();

      // Case-insensitive uniqueness check against user_profiles
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .ilike("display_name", name)
        .limit(1);

      if (existingProfile && existingProfile.length > 0) {
        return {
          error: "That display name is already taken. Please choose another.",
        };
      }

      // Create the account
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: sanitize(name),
              elite_tier: eliteTier,
            },
          },
        });

      if (signUpError) {
        return { error: signUpError.message };
      }

      // Detect already-existing email (ghost user pattern)
      const u = signUpData?.user;
      if (
        u &&
        (u.identities?.length === 0 ||
          (u.created_at &&
            Date.now() - new Date(u.created_at).getTime() > 5000))
      ) {
        return {
          error:
            "Unable to create account. Please try a different email or sign in.",
        };
      }

      return {};
    },
    [],
  );

  /* ------------------------------------------------------------------ */
  /*  signIn                                                             */
  /* ------------------------------------------------------------------ */

  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error?: string }> => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    },
    [],
  );

  /* ------------------------------------------------------------------ */
  /*  signOut                                                            */
  /* ------------------------------------------------------------------ */

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  /* ------------------------------------------------------------------ */
  /*  resetPassword                                                      */
  /* ------------------------------------------------------------------ */

  const resetPassword = useCallback(
    async (
      email: string,
    ): Promise<{ error?: string; message?: string }> => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { error: error.message };
      }

      return {
        message:
          "If an account exists with this email, you'll receive a reset link.",
      };
    },
    [],
  );

  return {
    user,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
