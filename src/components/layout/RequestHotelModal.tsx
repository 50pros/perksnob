"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { BRANDS, MAX_HOTEL_REQUEST_NOTES } from "@/lib/constants";
import { sanitize, hasProfanity } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

interface RequestHotelModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  initialName?: string;
}

export default function RequestHotelModal({
  open,
  onClose,
  user,
  initialName = "",
}: RequestHotelModalProps) {
  const [hotelName, setHotelName] = useState(initialName);
  const [brand, setBrand] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [marriottCode, setMarriottCode] = useState("");
  const [marriottUrl, setMarriottUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) {
      showToast("Please sign in first", "error");
      return;
    }

    const cleanName = sanitize(hotelName || "")
      .slice(0, 120)
      .trim();
    const cleanBrand = sanitize(brand || "")
      .slice(0, 80)
      .trim();
    const cleanCity = sanitize(city || "")
      .slice(0, 80)
      .trim();
    const cleanState = sanitize(state || "")
      .slice(0, 80)
      .trim();
    const cleanCountry = sanitize(country || "")
      .slice(0, 80)
      .trim();
    const cleanCode = sanitize(marriottCode || "")
      .slice(0, 20)
      .trim()
      .toUpperCase();
    const cleanNotes = sanitize(notes || "")
      .slice(0, MAX_HOTEL_REQUEST_NOTES)
      .trim();
    const cleanUrl = (marriottUrl || "").trim();

    if (!cleanName) {
      showToast("Hotel name is required", "error");
      return;
    }

    if (hasProfanity(cleanName) || hasProfanity(cleanNotes)) {
      showToast("Please remove inappropriate language", "error");
      return;
    }

    if (!cleanCity && !cleanCountry && !cleanCode && !cleanUrl) {
      showToast("Add city/country, Marriott code, or Marriott URL", "error");
      return;
    }

    if (cleanUrl && !/^https?:\/\/\S+$/i.test(cleanUrl)) {
      showToast("Enter a valid Marriott URL (https://...)", "error");
      return;
    }

    setSubmitting(true);

    const row: Record<string, string> = { user_id: user.id, hotel_name: cleanName };
    if (cleanBrand) row.brand = cleanBrand;
    if (cleanCity) row.city = cleanCity;
    if (cleanState) row.state = cleanState;
    if (cleanCountry) row.country = cleanCountry;
    if (cleanCode) row.marriott_code = cleanCode;
    if (cleanUrl) row.marriott_url = cleanUrl;
    if (cleanNotes) row.notes = cleanNotes;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("hotel_requests")
      .insert(row)
      .select("id")
      .single();

    setSubmitting(false);

    if (error?.code === "23505") {
      showToast("You already requested this hotel.", "error");
      return;
    }

    if (error) {
      showToast("Error submitting request: " + error.message, "error");
      return;
    }

    // Trigger alert edge function
    if (data?.id) {
      supabase.functions
        .invoke("hotel-request-alert", {
          body: { requestId: data.id },
        })
        .then(({ error: alertErr }) => {
          if (alertErr) {
            console.error("Hotel request alert email failed:", alertErr);
          }
        })
        .catch((e) => {
          console.error("Hotel request alert email failed:", e);
        });
    }

    showToast("Hotel request submitted. We'll review and add it soon.");
    onClose();
  };

  if (!user) {
    return (
      <Modal open={open} onClose={onClose} title="Request a Missing Hotel">
        <p className="mb-5 text-sm text-slate-500">
          Sign in to submit a hotel request.
        </p>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </Modal>
    );
  }

  const brandOptions = [...BRANDS.map((b) => b), "Other"];

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="mb-1 font-serif text-2xl font-bold text-slate-900">
        Request a Missing Hotel
      </h2>
      <p className="mb-5 text-[13px] leading-relaxed text-slate-400">
        Couldn&apos;t find your property? Submit it here and we&apos;ll review
        it for import.
      </p>

      <div className="flex flex-wrap gap-3">
        {/* Hotel Name */}
        <div className="min-w-[240px] flex-1">
          <Input
            label="Hotel Name"
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value.slice(0, 120))}
            placeholder="e.g. Marriott Marquis Chicago"
            maxLength={120}
            autoFocus
          />
        </div>

        {/* Brand */}
        <div className="min-w-[200px] flex-1">
          <Select
            label="Brand (optional)"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            options={brandOptions}
            placeholder="Select..."
          />
        </div>

        {/* City */}
        <div className="min-w-[170px] flex-1">
          <Input
            label="City (optional)"
            value={city}
            onChange={(e) => setCity(e.target.value.slice(0, 80))}
            placeholder="City"
            maxLength={80}
          />
        </div>

        {/* State / Region */}
        <div className="min-w-[120px] flex-1">
          <Input
            label="State/Region (optional)"
            value={state}
            onChange={(e) => setState(e.target.value.slice(0, 80))}
            placeholder="State"
            maxLength={80}
          />
        </div>

        {/* Country */}
        <div className="min-w-[170px] flex-1">
          <Input
            label="Country (optional)"
            value={country}
            onChange={(e) => setCountry(e.target.value.slice(0, 80))}
            placeholder="Country"
            maxLength={80}
          />
        </div>

        {/* Marriott Code */}
        <div className="min-w-[160px] flex-1">
          <Input
            label="Marriott Code (optional)"
            value={marriottCode}
            onChange={(e) =>
              setMarriottCode(e.target.value.slice(0, 20).toUpperCase())
            }
            placeholder="e.g. NYCMQ"
            maxLength={20}
          />
        </div>

        {/* Marriott URL */}
        <div className="w-full">
          <Input
            label="Marriott URL (optional)"
            value={marriottUrl}
            onChange={(e) => setMarriottUrl(e.target.value.slice(0, 220))}
            placeholder="https://www.marriott.com/..."
            maxLength={220}
          />
        </div>

        {/* Notes */}
        <div className="w-full">
          <Textarea
            label="Notes (optional)"
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value.slice(0, MAX_HOTEL_REQUEST_NOTES))
            }
            placeholder="Anything that helps identify this property..."
            maxLength={MAX_HOTEL_REQUEST_NOTES}
            className="min-h-[72px]"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-2">
        <Button onClick={submit} loading={submitting}>
          {submitting ? "Submitting..." : "Submit Request"}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
