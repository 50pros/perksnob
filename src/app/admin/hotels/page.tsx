"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { BRANDS } from "@/lib/constants";
import type { Hotel } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { showToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

interface EditableHotel {
  name: string;
  brand: string;
  location: string;
  slug: string;
  region: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  marriott_code: string;
  room_count: string;
  latitude: string;
  longitude: string;
}

function hotelToEditable(h: Hotel): EditableHotel {
  return {
    name: h.name || "",
    brand: h.brand || "",
    location: h.location || "",
    slug: h.slug || "",
    region: h.region || "",
    country: h.country || "",
    address: h.address || "",
    phone: h.phone || "",
    email: h.email || "",
    website: h.website || "",
    marriott_code: h.marriott_code || "",
    room_count: h.room_count?.toString() || "",
    latitude: h.latitude?.toString() || "",
    longitude: h.longitude?.toString() || "",
  };
}

export default function AdminHotelsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditableHotel | null>(null);
  const [saving, setSaving] = useState(false);

  // Load hotels
  useEffect(() => {
    if (!isAdmin) return;

    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .order("name")
        .limit(300);

      if (error) {
        console.error("Failed to load hotels:", error);
      }
      setHotels((data || []) as Hotel[]);
      setLoading(false);
    })();
  }, [isAdmin]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!debouncedSearch) return hotels;
    const q = debouncedSearch.toLowerCase();
    return hotels.filter((h) => h.name.toLowerCase().includes(q));
  }, [hotels, debouncedSearch]);

  // Expand hotel
  const handleExpand = useCallback(
    (hotel: Hotel) => {
      if (expandedId === hotel.id) {
        setExpandedId(null);
        setEditData(null);
      } else {
        setExpandedId(hotel.id);
        setEditData(hotelToEditable(hotel));
      }
    },
    [expandedId]
  );

  // Update edit field
  const updateField = useCallback(
    (field: keyof EditableHotel, value: string) => {
      setEditData((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    []
  );

  // Save hotel
  const handleSave = useCallback(async () => {
    if (!editData || !expandedId) return;
    setSaving(true);

    try {
      const supabase = createClient();

      const updatePayload: Record<string, unknown> = {
        name: editData.name,
        brand: editData.brand,
        location: editData.location,
        slug: editData.slug,
        region: editData.region || null,
        country: editData.country || null,
        address: editData.address || null,
        phone: editData.phone || null,
        email: editData.email || null,
        website: editData.website || null,
        marriott_code: editData.marriott_code || null,
        room_count: editData.room_count
          ? parseInt(editData.room_count, 10) || null
          : null,
        latitude: editData.latitude
          ? parseFloat(editData.latitude) || null
          : null,
        longitude: editData.longitude
          ? parseFloat(editData.longitude) || null
          : null,
      };

      const { error } = await supabase
        .from("hotels")
        .update(updatePayload)
        .eq("id", expandedId);

      if (error) throw error;

      // Update local state
      setHotels((prev) =>
        prev.map((h) =>
          h.id === expandedId
            ? {
                ...h,
                ...updatePayload,
                room_count:
                  updatePayload.room_count as number | null,
                latitude:
                  updatePayload.latitude as number | null,
                longitude:
                  updatePayload.longitude as number | null,
              } as Hotel
            : h
        )
      );

      showToast("Hotel saved");
    } catch {
      showToast("Failed to save hotel", "error");
    }

    setSaving(false);
  }, [editData, expandedId]);

  if (authLoading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="text-sm text-slate-500">Loading...</div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to view this page.
          </p>
          <a
            href="/"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Go home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          &larr; Back to home
        </a>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight text-slate-900">
          Manage Hotels
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Search and edit hotel properties.
        </p>

        {/* Search */}
        <div className="mt-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hotels by name..."
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 text-center text-sm text-slate-500">
            Loading hotels...
          </div>
        )}

        {/* Hotel list */}
        {!loading && (
          <div className="mt-6 space-y-2">
            <p className="text-xs text-slate-400">
              {filtered.length} hotel{filtered.length !== 1 ? "s" : ""} found
            </p>

            {filtered.map((hotel) => {
              const isExpanded = expandedId === hotel.id;

              return (
                <div
                  key={hotel.id}
                  className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                >
                  {/* Header row */}
                  <button
                    onClick={() => handleExpand(hotel)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900">
                        {hotel.name}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        {hotel.brand}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        {hotel.location}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {isExpanded ? "\u25B2" : "\u25BC"}
                    </span>
                  </button>

                  {/* Edit panel */}
                  {isExpanded && editData && (
                    <div className="border-t border-slate-100 p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Name */}
                        <FieldInput
                          label="Name"
                          value={editData.name}
                          onChange={(v) => updateField("name", v)}
                        />

                        {/* Brand */}
                        <div>
                          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Brand
                          </label>
                          <select
                            value={editData.brand}
                            onChange={(e) =>
                              updateField("brand", e.target.value)
                            }
                            className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                          >
                            <option value="">Select brand...</option>
                            {BRANDS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Location */}
                        <FieldInput
                          label="Location"
                          value={editData.location}
                          onChange={(v) => updateField("location", v)}
                        />

                        {/* Slug */}
                        <FieldInput
                          label="Slug"
                          value={editData.slug}
                          onChange={(v) => updateField("slug", v)}
                        />

                        {/* Region */}
                        <FieldInput
                          label="Region"
                          value={editData.region}
                          onChange={(v) => updateField("region", v)}
                        />

                        {/* Country */}
                        <FieldInput
                          label="Country"
                          value={editData.country}
                          onChange={(v) => updateField("country", v)}
                        />

                        {/* Address */}
                        <FieldInput
                          label="Address"
                          value={editData.address}
                          onChange={(v) => updateField("address", v)}
                        />

                        {/* Phone */}
                        <FieldInput
                          label="Phone"
                          value={editData.phone}
                          onChange={(v) => updateField("phone", v)}
                        />

                        {/* Email */}
                        <FieldInput
                          label="Email"
                          value={editData.email}
                          onChange={(v) => updateField("email", v)}
                        />

                        {/* Website */}
                        <FieldInput
                          label="Website"
                          value={editData.website}
                          onChange={(v) => updateField("website", v)}
                        />

                        {/* Marriott code */}
                        <FieldInput
                          label="Marriott Code"
                          value={editData.marriott_code}
                          onChange={(v) => updateField("marriott_code", v)}
                        />

                        {/* Room count */}
                        <FieldInput
                          label="Room Count"
                          value={editData.room_count}
                          onChange={(v) => updateField("room_count", v)}
                          type="number"
                        />

                        {/* Latitude */}
                        <FieldInput
                          label="Latitude"
                          value={editData.latitude}
                          onChange={(v) => updateField("latitude", v)}
                          type="number"
                        />

                        {/* Longitude */}
                        <FieldInput
                          label="Longitude"
                          value={editData.longitude}
                          onChange={(v) => updateField("longitude", v)}
                          type="number"
                        />
                      </div>

                      <div className="mt-4">
                        <Button
                          onClick={handleSave}
                          loading={saving}
                          disabled={saving}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline field input component                                       */
/* ------------------------------------------------------------------ */

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
      />
    </div>
  );
}
