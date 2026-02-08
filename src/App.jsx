import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

const TIERS = [
  { key: "ambassador", label: "Ambassador Elite", color: "#8B6914", bg: "#fdf8ee" },
  { key: "titanium", label: "Titanium Elite", color: "#5C6B7A", bg: "#eef1f5" },
  { key: "platinum", label: "Platinum Elite", color: "#7C7C7C", bg: "#f5f5f5" },
];

const PERK_CATEGORIES = [
  { key: "breakfast", icon: "🍳", label: "Breakfast" },
  { key: "lounge", icon: "🍸", label: "Lounge Access" },
  { key: "drinks", icon: "☕", label: "Drinks & Coffee" },
  { key: "upgrade", icon: "⬆️", label: "Room Upgrades" },
  { key: "gift", icon: "🎁", label: "Welcome Gift" },
  { key: "late_checkout", icon: "🕐", label: "Late Checkout" },
  { key: "spa", icon: "💆", label: "Spa & Wellness" },
  { key: "parking", icon: "🅿️", label: "Parking" },
  { key: "fnb_credit", icon: "💳", label: "F&B Credit" },
  { key: "other", icon: "✨", label: "Other" },
];

const BRANDS = [
  "W Hotels", "The Ritz-Carlton", "St. Regis", "EDITION", "The Luxury Collection",
  "JW Marriott", "Marriott Hotels", "Westin", "Sheraton", "Delta Hotels",
  "Le Méridien", "Autograph Collection", "Renaissance", "Tribute Portfolio",
  "Courtyard", "Residence Inn", "SpringHill Suites", "Fairfield", "Four Points",
  "Aloft", "Element", "AC Hotels", "Moxy"
];

/* ─── Utility ─── */
const confidenceLabel = (c) => c === "high" ? "Well established" : c === "medium" ? "Frequently reported" : "Few reports";
const confidenceColor = (c) => c === "high" ? "#2a7d4f" : c === "medium" ? "#b8860b" : "#999";
const getCat = (key) => PERK_CATEGORIES.find(c => c.key === key) || PERK_CATEGORIES[9];
const getTier = (key) => TIERS.find(t => t.key === key) || TIERS[2];

/* ─── Small Components ─── */
function ConfidenceBadge({ confidence, reports }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontFamily: "'DM Sans', sans-serif",
      color: confidenceColor(confidence),
      background: confidence === "high" ? "#e8f5e9" : confidence === "medium" ? "#fff8e1" : "#f5f5f5",
      padding: "2px 8px", borderRadius: 20, fontWeight: 500,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: confidenceColor(confidence) }} />
      {reports} report{reports !== 1 ? "s" : ""} · {confidenceLabel(confidence)}
    </span>
  );
}

function PerkCard({ perk, user, onUpvote }) {
  const cat = getCat(perk.category);
  const confidence = perk.total_confirmations >= 8 ? "high" : perk.total_confirmations >= 4 ? "medium" : "low";
  return (
    <div style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid #f0ede8" }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: "#faf7f2",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
      }}>{cat.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
          {cat.label}
        </div>
        <div style={{ fontSize: 13.5, color: "#3a3a3a", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
          {perk.summary}
        </div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <ConfidenceBadge confidence={confidence} reports={perk.total_confirmations} />
          {user && (
            <button onClick={() => onUpvote(perk.id)} style={{
              background: "none", border: "1px solid #e0dbd3", borderRadius: 8,
              padding: "2px 8px", fontSize: 11, cursor: "pointer", color: "#888",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              👍 Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TierSection({ tier, perks, user, onUpvote }) {
  const t = getTier(tier);
  if (!perks || perks.length === 0) return (
    <div style={{ padding: 20, borderRadius: 14, background: "#faf9f7", border: "1px solid #eee8df", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.color }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: t.color, fontFamily: "'Playfair Display', serif", letterSpacing: 0.5 }}>{t.label}</span>
      </div>
      <div style={{ fontSize: 13, color: "#999", fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>
        No perks reported yet. Be the first to contribute!
      </div>
    </div>
  );

  return (
    <div style={{
      padding: "18px 20px", borderRadius: 14, background: "#fff",
      border: `1.5px solid ${t.color}22`, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, boxShadow: `0 0 0 3px ${t.color}22` }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: t.color, fontFamily: "'Playfair Display', serif", letterSpacing: 0.5 }}>{t.label}</span>
        <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'DM Sans', sans-serif", marginLeft: "auto" }}>
          {perks.length} perk{perks.length !== 1 ? "s" : ""} reported
        </span>
      </div>
      {perks.map((p, i) => <PerkCard key={p.id || i} perk={p} user={user} onUpvote={onUpvote} />)}
    </div>
  );
}

function Comment({ comment }) {
  const t = getTier(comment.elite_tier);
  const date = new Date(comment.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #f5f2ed" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: t.color,
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
        }}>{comment.display_name.charAt(0).toUpperCase()}</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif" }}>{comment.display_name}</span>
        <span style={{
          fontSize: 11, color: t.color, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
          background: `${t.color}15`, padding: "1px 8px", borderRadius: 10,
        }}>{t.label}</span>
        <span style={{ fontSize: 11, color: "#bbb", fontFamily: "'DM Sans', sans-serif", marginLeft: "auto" }}>{date}</span>
      </div>
      <div style={{ fontSize: 13.5, color: "#444", lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif", paddingLeft: 36 }}>
        {comment.text}
      </div>
    </div>
  );
}

/* ─── Auth Modal ─── */
function AuthModal({ onClose, onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: displayName || email.split("@")[0] } }
        });
        if (error) throw error;
        onAuth();
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth();
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 32, maxWidth: 400, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
          {isSignUp ? "Create Account" : "Sign In"}
        </h2>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
          {isSignUp ? "Join the community and share your elite experiences" : "Welcome back, fellow traveler"}
        </p>
        {error && <div style={{ background: "#fee", color: "#c00", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>{error}</div>}
        {isSignUp && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="TravelPro_AZ" style={inputStyle} />
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
        </div>
        <button onClick={handleSubmit} disabled={loading} style={{
          width: "100%", background: "#1a1510", color: "#fff", border: "none", borderRadius: 12,
          padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
        </button>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button onClick={() => setIsSignUp(!isSignUp)} style={{
            background: "none", border: "none", color: "#8B6914", fontSize: 13,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
          }}>
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Hotel Detail ─── */
function HotelDetail({ hotel, user, onBack, onNeedAuth }) {
  const [activeTab, setActiveTab] = useState("perks");
  const [showSubmit, setShowSubmit] = useState(false);
  const [perks, setPerks] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit form state
  const [submitTier, setSubmitTier] = useState("");
  const [submitCat, setSubmitCat] = useState("");
  const [submitDesc, setSubmitDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Comment form state
  const [commentTier, setCommentTier] = useState("");
  const [commentText, setCommentText] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    // Load aggregated perks
    const { data: perkData } = await supabase
      .from("perk_reports")
      .select("*")
      .eq("hotel_id", hotel.id)
      .order("created_at", { ascending: false });

    // Aggregate perks client-side for simplicity
    const perkMap = {};
    (perkData || []).forEach(p => {
      const key = `${p.elite_tier}|${p.category}|${p.description}`;
      if (!perkMap[key]) {
        perkMap[key] = { ...p, total_confirmations: 1, summary: p.description };
      } else {
        perkMap[key].total_confirmations += 1;
      }
    });
    setPerks(Object.values(perkMap));

    // Load comments
    const { data: commentData } = await supabase
      .from("comments")
      .select("*")
      .eq("hotel_id", hotel.id)
      .order("created_at", { ascending: false });
    setComments(commentData || []);
    setLoading(false);
  }, [hotel.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmitPerk = async () => {
    if (!user) { onNeedAuth(); return; }
    if (!submitTier || !submitCat || !submitDesc.trim()) return;
    setSubmitting(true);
    const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Anonymous";
    await supabase.from("perk_reports").insert({
      hotel_id: hotel.id, user_id: user.id, display_name: displayName,
      elite_tier: submitTier, category: submitCat, description: submitDesc.trim(),
    });
    setSubmitTier(""); setSubmitCat(""); setSubmitDesc(""); setShowSubmit(false); setSubmitting(false);
    loadData();
  };

  const handleSubmitComment = async () => {
    if (!user) { onNeedAuth(); return; }
    if (!commentTier || !commentText.trim()) return;
    const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Anonymous";
    await supabase.from("comments").insert({
      hotel_id: hotel.id, user_id: user.id, display_name: displayName,
      elite_tier: commentTier, text: commentText.trim(),
    });
    setCommentTier(""); setCommentText("");
    loadData();
  };

  const handleUpvote = async (perkId) => {
    if (!user) { onNeedAuth(); return; }
    // For simplicity, add a duplicate report as confirmation
    const perk = perks.find(p => p.id === perkId);
    if (!perk) return;
    const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Anonymous";
    await supabase.from("perk_reports").insert({
      hotel_id: hotel.id, user_id: user.id, display_name: displayName,
      elite_tier: perk.elite_tier, category: perk.category, description: perk.description,
    });
    loadData();
  };

  const perksByTier = {};
  TIERS.forEach(t => { perksByTier[t.key] = perks.filter(p => p.elite_tier === t.key); });

  return (
    <div>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#8B6914", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", padding: 0, marginBottom: 20,
      }}>← Back to all hotels</button>

      {/* Hotel header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1510 0%, #2d2418 100%)",
        borderRadius: 20, padding: "32px 28px", marginBottom: 24, color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(139,105,20,0.12)" }} />
        <div style={{ fontSize: 11, fontWeight: 600, color: "#d4a844", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{hotel.brand}</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px", fontFamily: "'Playfair Display', serif", lineHeight: 1.25 }}>{hotel.name}</h1>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", fontFamily: "'DM Sans', sans-serif" }}>📍 {hotel.location}</div>
        <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
          {TIERS.map(t => (
            <div key={t.key} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#d4a844", fontFamily: "'DM Sans', sans-serif" }}>
                {perksByTier[t.key]?.length || 0} <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>perks</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
        {[
          { key: "perks", label: "Elite Perks Overview" },
          { key: "comments", label: `Guest Tips (${comments.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            background: activeTab === tab.key ? "#1a1510" : "transparent",
            color: activeTab === tab.key ? "#fff" : "#666",
            border: activeTab === tab.key ? "none" : "1px solid #e0dbd3",
            borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>{tab.label}</button>
        ))}
        <button onClick={() => { if (!user) { onNeedAuth(); return; } setShowSubmit(!showSubmit); }} style={{
          marginLeft: "auto", background: "#8B6914", color: "#fff", border: "none", borderRadius: 10,
          padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>+ Report a Perk</button>
      </div>

      {/* Submit perk form */}
      {showSubmit && (
        <div style={{ background: "#fdf8ee", borderRadius: 16, padding: 24, border: "1.5px solid #e8d5a8", marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Playfair Display', serif", marginBottom: 16 }}>Report a Perk</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={labelStyle}>Your Elite Tier</label>
              <select value={submitTier} onChange={e => setSubmitTier(e.target.value)} style={inputStyle}>
                <option value="">Select tier...</option>
                {TIERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={labelStyle}>Perk Category</label>
              <select value={submitCat} onChange={e => setSubmitCat(e.target.value)} style={inputStyle}>
                <option value="">Select category...</option>
                {PERK_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Describe the perk</label>
            <textarea value={submitDesc} onChange={e => setSubmitDesc(e.target.value)}
              placeholder="e.g., Free lattes and espresso drinks at the lobby café — just show your room key"
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSubmitPerk} disabled={submitting} style={{
              background: "#1a1510", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: submitting ? 0.6 : 1,
            }}>Submit Report</button>
            <button onClick={() => setShowSubmit(false)} style={{
              background: "transparent", color: "#888", border: "1px solid #ddd", borderRadius: 10, padding: "10px 24px",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>Cancel</button>
          </div>
          <div style={{ fontSize: 11, color: "#aaa", fontFamily: "'DM Sans', sans-serif", marginTop: 12, lineHeight: 1.5 }}>
            ℹ️ Your report will be combined with others to build the perk overview. The more specific, the better!
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>Loading perks...</div>
      ) : activeTab === "perks" ? (
        <div>
          {TIERS.map(t => <TierSection key={t.key} tier={t.key} perks={perksByTier[t.key]} user={user} onUpvote={handleUpvote} />)}
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 16, padding: "8px 20px 20px", border: "1px solid #ece7df" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Playfair Display', serif", padding: "16px 0 8px", borderBottom: "1px solid #f0ede8", marginBottom: 4 }}>
            Guest Tips & Details
          </div>
          {comments.map((c, i) => <Comment key={c.id || i} comment={c} />)}
          {comments.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "#999", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
              No tips yet. Be the first!
            </div>
          )}
          {/* Add comment form */}
          <div style={{ marginTop: 16, padding: 16, background: "#faf7f2", borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#555", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
              Share a tip
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <select value={commentTier} onChange={e => setCommentTier(e.target.value)} style={{ ...inputStyle, flex: "0 0 180px" }}>
                <option value="">Your tier...</option>
                {TIERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Share a tip, detail, or experience..."
              style={{ ...inputStyle, minHeight: 60, resize: "vertical", marginBottom: 10 }} />
            <button onClick={handleSubmitComment} style={{
              background: "#1a1510", color: "#fff", border: "none", borderRadius: 10, padding: "8px 20px",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>Post Tip</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Hotel Card ─── */
function HotelCard({ hotel, perkCounts, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #ece7df", cursor: "pointer",
      transition: "all 0.2s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "#8B6914", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>{hotel.brand}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Playfair Display', serif", marginBottom: 4, lineHeight: 1.3 }}>{hotel.name}</div>
      <div style={{ fontSize: 13, color: "#888", fontFamily: "'DM Sans', sans-serif", marginBottom: 14 }}>📍 {hotel.location}</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: "#666", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#2a7d4f", fontWeight: 700, fontSize: 16 }}>{perkCounts[hotel.id] || 0}</span> perk reports
        </div>
      </div>
    </div>
  );
}

/* ─── Suggest Hotel Modal ─── */
function SuggestHotelModal({ onClose, user, onNeedAuth, onAdded, existingHotels }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [similarHotels, setSimilarHotels] = useState([]);

  // Check for similar hotels as user types
  const checkDuplicates = (searchName) => {
    setName(searchName);
    if (searchName.trim().length < 3) { setSimilarHotels([]); return; }
    const words = searchName.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) { setSimilarHotels([]); return; }
    const matches = existingHotels.filter(h => {
      const hotelLower = h.name.toLowerCase().replace(/[^a-z0-9\s]/g, "");
      return words.some(word => hotelLower.includes(word));
    }).slice(0, 5);
    setSimilarHotels(matches);
  };

  const handleSubmit = async () => {
    if (!user) { onNeedAuth(); onClose(); return; }
    if (!name.trim() || !brand || !location.trim()) return;
    setSubmitting(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    // Check for exact slug match to prevent true duplicates
    const { data: existing } = await supabase.from("hotels").select("id").eq("slug", slug);
    if (existing && existing.length > 0) {
      alert("This hotel already exists in the database!");
      setSubmitting(false);
      return;
    }
    await supabase.from("hotels").insert({ name: name.trim(), brand, location: location.trim(), slug });
    setSubmitting(false);
    onAdded();
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 32, maxWidth: 450, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Add a Hotel</h2>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>Can't find your property? Add it to the database.</p>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Hotel Name</label>
          <input value={name} onChange={e => checkDuplicates(e.target.value)} placeholder="The Westin Kierland Resort & Spa" style={inputStyle} />
          {similarHotels.length > 0 && (
            <div style={{
              marginTop: 8, background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#b8860b", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                ⚠️ Did you mean one of these existing hotels?
              </div>
              {similarHotels.map(h => (
                <div key={h.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 0", borderBottom: "1px solid #fff3cd",
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#333", fontFamily: "'DM Sans', sans-serif" }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>{h.brand} · {h.location}</div>
                  </div>
                  <button onClick={() => { onClose(); }} style={{
                    background: "#8B6914", color: "#fff", border: "none", borderRadius: 6,
                    padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: "nowrap",
                  }}>View it</button>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "#999", marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
                If none of these match, continue filling out the form below.
              </div>
            </div>
          )}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Brand</label>
          <select value={brand} onChange={e => setBrand(e.target.value)} style={inputStyle}>
            <option value="">Select brand...</option>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Location</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Scottsdale, AZ" style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSubmit} disabled={submitting} style={{
            background: "#1a1510", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: submitting ? 0.6 : 1,
          }}>Add Hotel</button>
          <button onClick={onClose} style={{
            background: "transparent", color: "#888", border: "1px solid #ddd", borderRadius: 12, padding: "12px 24px",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Styles ─── */
const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#555", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd",
  fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#333", outline: "none", boxSizing: "border-box",
};

/* ─── Main App ─── */
export default function App() {
  const [user, setUser] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [perkCounts, setPerkCounts] = useState({});
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHotels = async () => {
    setLoading(true);
    const { data } = await supabase.from("hotels").select("*").order("name");
    setHotels(data || []);

    // Get perk counts per hotel
    const { data: reports } = await supabase.from("perk_reports").select("hotel_id");
    const counts = {};
    (reports || []).forEach(r => { counts[r.hotel_id] = (counts[r.hotel_id] || 0) + 1; });
    setPerkCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    // Check auth
    supabase.auth.getUser().then(({ data }) => { if (data?.user) setUser(data.user); });
    supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); });
    loadHotels();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const filteredHotels = hotels.filter(h => {
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase());
    const matchBrand = !brandFilter || h.brand === brandFilter;
    return matchSearch && matchBrand;
  });

  const usedBrands = [...new Set(hotels.map(h => h.brand))].sort();

  return (
    <div style={{ minHeight: "100vh", background: "#f8f5f0", fontFamily: "'DM Sans', sans-serif" }}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={() => supabase.auth.getUser().then(({ data }) => setUser(data?.user))} />}
      {showSuggest && <SuggestHotelModal onClose={() => setShowSuggest(false)} user={user} onNeedAuth={() => setShowAuth(true)} onAdded={loadHotels} existingHotels={hotels} />}

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1510 0%, #2d2418 50%, #1a1510 100%)",
        padding: "0 0 48px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 70% 20%, rgba(139,105,20,0.15) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 0", position: "relative" }}>
          {/* Nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 10 }}>
            <div onClick={() => setSelectedHotel(null)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #d4a844, #8B6914)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: "#1a1510", fontFamily: "'Playfair Display', serif",
              }}>E</div>
              <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif", letterSpacing: 0.5 }}>ElitePerks</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {user ? (
                <>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif" }}>
                    {user.user_metadata?.display_name || user.email?.split("@")[0]}
                  </span>
                  <button onClick={handleSignOut} style={{
                    background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
                    padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>Sign Out</button>
                </>
              ) : (
                <button onClick={() => setShowAuth(true)} style={{
                  background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
                  padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>Sign In</button>
              )}
              <button onClick={() => showSuggest ? setShowSuggest(false) : (user ? setShowSuggest(true) : setShowAuth(true))} style={{
                background: "#8B6914", color: "#fff", border: "none", borderRadius: 10,
                padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>+ Add Hotel</button>
            </div>
          </div>

          {/* Hero + Search (only on home) */}
          {!selectedHotel && (
            <>
              <h1 style={{
                fontSize: 38, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif",
                margin: "0 0 10px", lineHeight: 1.15, maxWidth: 600,
              }}>
                Real elite perks,{" "}<span style={{ color: "#d4a844" }}>reported by real guests</span>
              </h1>
              <p style={{
                fontSize: 15, color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif",
                margin: "0 0 28px", maxWidth: 520, lineHeight: 1.6,
              }}>
                Know what you're getting before you book. Crowd-sourced Marriott elite benefits for Platinum, Titanium, and Ambassador members.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 300px", position: "relative" }}>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search hotels or destinations..."
                    style={{
                      width: "100%", padding: "14px 18px 14px 44px", borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
                      color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
                    }} />
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.4 }}>🔍</span>
                </div>
                <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={{
                  padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer", minWidth: 160,
                }}>
                  <option value="" style={{ color: "#333" }}>All Brands</option>
                  {usedBrands.map(b => <option key={b} value={b} style={{ color: "#333" }}>{b}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "-24px auto 0", padding: "0 20px 60px", position: "relative" }}>
        {selectedHotel ? (
          <HotelDetail hotel={selectedHotel} user={user} onBack={() => setSelectedHotel(null)} onNeedAuth={() => setShowAuth(true)} />
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>Loading hotels...</div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>
                {filteredHotels.length} propert{filteredHotels.length !== 1 ? "ies" : "y"} in database
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {filteredHotels.map(hotel => (
                <HotelCard key={hotel.id} hotel={hotel} perkCounts={perkCounts} onClick={() => setSelectedHotel(hotel)} />
              ))}
            </div>
            {filteredHotels.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏨</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#555", fontFamily: "'Playfair Display', serif", marginBottom: 6 }}>No hotels found</div>
                <div style={{ fontSize: 13, color: "#999", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>Try a different search or clear your filters</div>
                <button onClick={() => user ? setShowSuggest(true) : setShowAuth(true)} style={{
                  background: "#8B6914", color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>+ Add a Hotel</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
