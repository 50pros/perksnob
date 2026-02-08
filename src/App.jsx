import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

const TIERS = [
  { key: "ambassador", label: "Ambassador Elite", color: "#000" },
  { key: "titanium", label: "Titanium Elite", color: "#555" },
  { key: "platinum", label: "Platinum Elite", color: "#999" },
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

const BRANDS = ["W Hotels","The Ritz-Carlton","St. Regis","EDITION","The Luxury Collection","JW Marriott","Marriott Hotels","Westin","Sheraton","Delta Hotels","Le Méridien","Autograph Collection","Renaissance","Tribute Portfolio","Courtyard","Residence Inn","SpringHill Suites","Fairfield","Four Points","Aloft","Element","AC Hotels","Moxy"];

const getCat = (k) => PERK_CATEGORIES.find(c => c.key === k) || PERK_CATEGORIES[9];
const getTier = (k) => TIERS.find(t => t.key === k) || TIERS[2];
const confColor = (c) => c === "high" ? "#1a1a1a" : c === "medium" ? "#666" : "#aaa";
const confLabel = (c) => c === "high" ? "Well established" : c === "medium" ? "Frequently reported" : "Few reports";
const confLevel = (n) => n >= 8 ? "high" : n >= 4 ? "medium" : "low";

const LS = { display: "block", fontSize: 11, fontWeight: 600, color: "#999", fontFamily: "'Inter',sans-serif", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 };
const IS = { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 14, fontFamily: "'Inter',sans-serif", background: "#fff", color: "#000", outline: "none", boxSizing: "border-box" };

function Badge({ confidence, reports }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "'Inter',sans-serif", color: confColor(confidence), background: confidence === "high" ? "#f0f0f0" : "#f5f5f5", padding: "3px 10px", borderRadius: 20, fontWeight: 500, border: "1px solid #eee" }}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: confColor(confidence) }}/>{reports} report{reports!==1?"s":""} · {confLabel(confidence)}
  </span>;
}

function PerkCard({ perk, user, onUpvote }) {
  const cat = getCat(perk.category), conf = confLevel(perk.total_confirmations);
  return <div style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: "1px solid #eee" }}>{cat.icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter',sans-serif", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{cat.label}</div>
      <div style={{ fontSize: 14, color: "#333", lineHeight: 1.6, fontFamily: "'Inter',sans-serif" }}>{perk.summary}</div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <Badge confidence={conf} reports={perk.total_confirmations}/>
        {user && <button onClick={() => onUpvote(perk.id)} style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer", color: "#666", fontFamily: "'Inter',sans-serif" }}>✓ Confirm</button>}
      </div>
    </div>
  </div>;
}

function TierSection({ tier, perks, user, onUpvote }) {
  const t = getTier(tier);
  if (!perks || !perks.length) return <div style={{ padding: 24, borderRadius: 12, background: "#fafafa", border: "1px solid #eee", marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }}/><span style={{ fontSize: 13, fontWeight: 700, color: t.color, fontFamily: "'Inter',sans-serif" }}>{t.label}</span>
    </div>
    <div style={{ fontSize: 13, color: "#aaa", fontFamily: "'Inter',sans-serif" }}>No perks reported yet. Be the first!</div>
  </div>;
  return <div style={{ padding: "20px 24px", borderRadius: 12, background: "#fff", border: "1px solid #e8e8e8", marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }}/><span style={{ fontSize: 14, fontWeight: 700, color: t.color, fontFamily: "'Inter',sans-serif" }}>{t.label}</span>
      <span style={{ fontSize: 11, color: "#bbb", fontFamily: "'Inter',sans-serif", marginLeft: "auto" }}>{perks.length} perk{perks.length!==1?"s":""}</span>
    </div>
    {perks.map((p,i) => <PerkCard key={p.id||i} perk={p} user={user} onUpvote={onUpvote}/>)}
  </div>;
}

function Comment({ comment }) {
  const t = getTier(comment.elite_tier);
  const date = new Date(comment.created_at).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});
  return <div style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>{comment.display_name.charAt(0).toUpperCase()}</div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter',sans-serif" }}>{comment.display_name}</span>
      <span style={{ fontSize: 10, color: t.color, fontWeight: 600, fontFamily: "'Inter',sans-serif", background: "#f0f0f0", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.label}</span>
      <span style={{ fontSize: 11, color: "#ccc", fontFamily: "'Inter',sans-serif", marginLeft: "auto" }}>{date}</span>
    </div>
    <div style={{ fontSize: 14, color: "#444", lineHeight: 1.6, fontFamily: "'Inter',sans-serif", paddingLeft: 36 }}>{comment.text}</div>
  </div>;
}

function AuthModal({ onClose, onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const handle = async () => {
    setLoading(true); setError("");
    try {
      if (isSignUp) { const{error}=await supabase.auth.signUp({email,password,options:{data:{display_name:displayName||email.split("@")[0]}}}); if(error)throw error; }
      else { const{error}=await supabase.auth.signInWithPassword({email,password}); if(error)throw error; }
      onAuth(); onClose();
    } catch(e){ setError(e.message); }
    setLoading(false);
  };
  return <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)" }} onClick={onClose}>
    <div style={{ background:"#fff",borderRadius:16,padding:36,maxWidth:380,width:"100%",boxShadow:"0 24px 48px rgba(0,0,0,0.12)" }} onClick={e=>e.stopPropagation()}>
      <h2 style={{ fontSize:24,fontFamily:"'Inter',sans-serif",fontWeight:800,marginBottom:4,letterSpacing:-0.5 }}>{isSignUp?"Create Account":"Welcome back"}</h2>
      <p style={{ fontSize:13,color:"#888",marginBottom:24,fontFamily:"'Inter',sans-serif" }}>{isSignUp?"Join the community":"Sign in to contribute"}</p>
      {error && <div style={{ background:"#fff0f0",color:"#c00",padding:"10px 14px",borderRadius:8,fontSize:12,marginBottom:14,fontFamily:"'Inter',sans-serif",border:"1px solid #ffe0e0" }}>{error}</div>}
      {isSignUp && <div style={{marginBottom:14}}><label style={LS}>Display Name</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="TravelPro" style={IS}/></div>}
      <div style={{marginBottom:14}}><label style={LS}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" style={IS}/></div>
      <div style={{marginBottom:24}}><label style={LS}>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={IS}/></div>
      <button onClick={handle} disabled={loading} style={{ width:"100%",background:"#000",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",opacity:loading?0.5:1 }}>{loading?"...":isSignUp?"Create Account":"Sign In"}</button>
      <div style={{textAlign:"center",marginTop:16}}><button onClick={()=>setIsSignUp(!isSignUp)} style={{ background:"none",border:"none",color:"#000",fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600,textDecoration:"underline",textUnderlineOffset:3 }}>{isSignUp?"Already have an account? Sign in":"Need an account? Sign up"}</button></div>
    </div>
  </div>;
}

function HotelDetail({ hotel, user, onBack, onNeedAuth }) {
  const [tab, setTab] = useState("perks");
  const [showForm, setShowForm] = useState(false);
  const [perks, setPerks] = useState([]); const [comments, setComments] = useState([]); const [loading, setLoading] = useState(true);
  const [sTier, setSTier] = useState(""); const [sCat, setSCat] = useState(""); const [sDesc, setSDesc] = useState(""); const [submitting, setSubmitting] = useState(false);
  const [cTier, setCTier] = useState(""); const [cText, setCText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: pd } = await supabase.from("perk_reports").select("*").eq("hotel_id", hotel.id).order("created_at", { ascending: false });
    const pm = {};
    (pd||[]).forEach(p => { const k=`${p.elite_tier}|${p.category}|${p.description}`; if(!pm[k])pm[k]={...p,total_confirmations:1,summary:p.description}; else pm[k].total_confirmations+=1; });
    setPerks(Object.values(pm));
    const { data: cd } = await supabase.from("comments").select("*").eq("hotel_id", hotel.id).order("created_at", { ascending: false });
    setComments(cd||[]); setLoading(false);
  }, [hotel.id]);
  useEffect(() => { load(); }, [load]);

  const dn = () => user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Anonymous";

  const submitPerk = async () => {
    if(!user){onNeedAuth();return;} if(!sTier||!sCat||!sDesc.trim())return;
    setSubmitting(true);
    await supabase.from("perk_reports").insert({ hotel_id:hotel.id, user_id:user.id, display_name:dn(), elite_tier:sTier, category:sCat, description:sDesc.trim() });
    setSTier(""); setSCat(""); setSDesc(""); setShowForm(false); setSubmitting(false); load();
  };
  const submitComment = async () => {
    if(!user){onNeedAuth();return;} if(!cTier||!cText.trim())return;
    await supabase.from("comments").insert({ hotel_id:hotel.id, user_id:user.id, display_name:dn(), elite_tier:cTier, text:cText.trim() });
    setCTier(""); setCText(""); load();
  };
  const upvote = async (id) => {
    if(!user){onNeedAuth();return;} const p=perks.find(x=>x.id===id); if(!p)return;
    await supabase.from("perk_reports").insert({ hotel_id:hotel.id, user_id:user.id, display_name:dn(), elite_tier:p.elite_tier, category:p.category, description:p.description });
    load();
  };

  const byTier = {}; TIERS.forEach(t => { byTier[t.key] = perks.filter(p => p.elite_tier === t.key); });

  return <div>
    <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#000",fontWeight:600,fontFamily:"'Inter',sans-serif",padding:0,marginBottom:24,textDecoration:"underline",textUnderlineOffset:3 }}>← Back</button>
    <div style={{ background:"#000",borderRadius:16,padding:"36px 32px",marginBottom:28,color:"#fff",position:"relative",overflow:"hidden" }}>
      <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",fontFamily:"'Inter',sans-serif",textTransform:"uppercase",letterSpacing:2,marginBottom:10 }}>{hotel.brand}</div>
      <h1 style={{ fontSize:28,fontWeight:800,margin:"0 0 6px",fontFamily:"'Inter',sans-serif",lineHeight:1.2,letterSpacing:-0.5 }}>{hotel.name}</h1>
      <div style={{ fontSize:14,color:"rgba(255,255,255,0.5)",fontFamily:"'Inter',sans-serif" }}>{hotel.location}</div>
      <div style={{ display:"flex",gap:16,marginTop:24,flexWrap:"wrap" }}>
        {TIERS.map(t=><div key={t.key} style={{ background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 18px",border:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)",fontFamily:"'Inter',sans-serif",textTransform:"uppercase",letterSpacing:1,marginBottom:4 }}>{t.label}</div>
          <div style={{ fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Inter',sans-serif" }}>{byTier[t.key]?.length||0} <span style={{ fontSize:11,fontWeight:400,color:"rgba(255,255,255,0.35)" }}>perks</span></div>
        </div>)}
      </div>
    </div>
    <div style={{ display:"flex",gap:8,marginBottom:24,alignItems:"center",flexWrap:"wrap" }}>
      {[{k:"perks",l:"Perks Overview"},{k:"comments",l:`Tips (${comments.length})`}].map(x=>
        <button key={x.k} onClick={()=>setTab(x.k)} style={{ background:tab===x.k?"#000":"transparent",color:tab===x.k?"#fff":"#999",border:tab===x.k?"none":"1px solid #e0e0e0",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif" }}>{x.l}</button>
      )}
      <button onClick={()=>{if(!user){onNeedAuth();return;}setShowForm(!showForm);}} style={{ marginLeft:"auto",background:"#fff",color:"#000",border:"2px solid #000",borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif" }}>+ Report a Perk</button>
    </div>
    {showForm && <div style={{ background:"#fafafa",borderRadius:12,padding:28,border:"1px solid #e8e8e8",marginBottom:24 }}>
      <div style={{ fontSize:18,fontWeight:800,color:"#000",fontFamily:"'Inter',sans-serif",marginBottom:20,letterSpacing:-0.3 }}>Report a Perk</div>
      <div style={{ display:"flex",gap:14,flexWrap:"wrap",marginBottom:16 }}>
        <div style={{flex:"1 1 200px"}}><label style={LS}>Your Elite Tier</label><select value={sTier} onChange={e=>setSTier(e.target.value)} style={IS}><option value="">Select...</option>{TIERS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
        <div style={{flex:"1 1 200px"}}><label style={LS}>Category</label><select value={sCat} onChange={e=>setSCat(e.target.value)} style={IS}><option value="">Select...</option>{PERK_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
      </div>
      <div style={{marginBottom:16}}><label style={LS}>Describe the perk</label><textarea value={sDesc} onChange={e=>setSDesc(e.target.value)} placeholder="e.g., Free lattes at the lobby café" style={{...IS,minHeight:80,resize:"vertical"}}/></div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={submitPerk} disabled={submitting} style={{ background:"#000",color:"#fff",border:"none",borderRadius:8,padding:"11px 28px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",opacity:submitting?0.5:1 }}>Submit</button>
        <button onClick={()=>setShowForm(false)} style={{ background:"transparent",color:"#999",border:"1px solid #ddd",borderRadius:8,padding:"11px 28px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif" }}>Cancel</button>
      </div>
    </div>}
    {loading ? <div style={{textAlign:"center",padding:40,color:"#ccc",fontFamily:"'Inter',sans-serif"}}>Loading...</div>
    : tab==="perks" ? <div>{TIERS.map(t=><TierSection key={t.key} tier={t.key} perks={byTier[t.key]} user={user} onUpvote={upvote}/>)}</div>
    : <div style={{ background:"#fff",borderRadius:12,padding:"8px 24px 24px",border:"1px solid #e8e8e8" }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#000",fontFamily:"'Inter',sans-serif",padding:"18px 0 10px",borderBottom:"1px solid #f0f0f0",marginBottom:4 }}>Guest Tips</div>
        {comments.map((c,i)=><Comment key={c.id||i} comment={c}/>)}
        {!comments.length && <div style={{padding:24,textAlign:"center",color:"#ccc",fontFamily:"'Inter',sans-serif",fontSize:13}}>No tips yet.</div>}
        <div style={{marginTop:20,padding:20,background:"#fafafa",borderRadius:10,border:"1px solid #eee"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#333",fontFamily:"'Inter',sans-serif",marginBottom:12}}>Share a tip</div>
          <select value={cTier} onChange={e=>setCTier(e.target.value)} style={{...IS,maxWidth:200,marginBottom:10}}><option value="">Your tier...</option>{TIERS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select>
          <textarea value={cText} onChange={e=>setCText(e.target.value)} placeholder="Share a tip..." style={{...IS,minHeight:60,resize:"vertical",marginBottom:10}}/>
          <button onClick={submitComment} style={{ background:"#000",color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif" }}>Post Tip</button>
        </div>
      </div>}
  </div>;
}

function HotelCard({ hotel, perkCounts, onClick }) {
  return <div onClick={onClick} style={{ background:"#fff",borderRadius:12,padding:24,border:"1px solid #e8e8e8",cursor:"pointer",transition:"all 0.2s" }}
    onMouseEnter={e=>{e.currentTarget.style.borderColor="#000";e.currentTarget.style.transform="translateY(-1px)";}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e8e8";e.currentTarget.style.transform="translateY(0)";}}>
    <div style={{ fontSize:10,fontWeight:700,color:"#999",fontFamily:"'Inter',sans-serif",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8 }}>{hotel.brand}</div>
    <div style={{ fontSize:17,fontWeight:700,color:"#000",fontFamily:"'Inter',sans-serif",marginBottom:4,lineHeight:1.3,letterSpacing:-0.2 }}>{hotel.name}</div>
    <div style={{ fontSize:13,color:"#aaa",fontFamily:"'Inter',sans-serif",marginBottom:16 }}>{hotel.location}</div>
    <div style={{ fontSize:12,color:"#888",fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:5 }}>
      <span style={{ color:"#000",fontWeight:800,fontSize:16 }}>{perkCounts[hotel.id]||0}</span> perk reports
    </div>
  </div>;
}

function AddHotelModal({ onClose, user, onNeedAuth, onAdded, existingHotels }) {
  const [name, setName] = useState(""); const [brand, setBrand] = useState(""); const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false); const [similar, setSimilar] = useState([]);
  const check = (v) => { setName(v); if(v.trim().length<3){setSimilar([]);return;} const w=v.toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/).filter(x=>x.length>2); if(!w.length){setSimilar([]);return;} setSimilar(existingHotels.filter(h=>{const n=h.name.toLowerCase().replace(/[^a-z0-9\s]/g,"");return w.some(x=>n.includes(x));}).slice(0,5)); };
  const submit = async () => {
    if(!user){onNeedAuth();onClose();return;} if(!name.trim()||!brand||!location.trim())return;
    setSubmitting(true); const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
    const{data:ex}=await supabase.from("hotels").select("id").eq("slug",slug);
    if(ex&&ex.length){alert("This hotel already exists!");setSubmitting(false);return;}
    await supabase.from("hotels").insert({name:name.trim(),brand,location:location.trim(),slug});
    setSubmitting(false); onAdded(); onClose();
  };
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:16,padding:36,maxWidth:450,width:"100%",boxShadow:"0 24px 48px rgba(0,0,0,0.12)"}} onClick={e=>e.stopPropagation()}>
      <h2 style={{fontSize:22,fontFamily:"'Inter',sans-serif",fontWeight:800,marginBottom:4,letterSpacing:-0.5}}>Add a Hotel</h2>
      <p style={{fontSize:13,color:"#999",marginBottom:24,fontFamily:"'Inter',sans-serif"}}>Can't find your property? Add it.</p>
      <div style={{marginBottom:14}}>
        <label style={LS}>Hotel Name</label>
        <input value={name} onChange={e=>check(e.target.value)} placeholder="The Westin Kierland Resort & Spa" style={IS}/>
        {similar.length>0 && <div style={{marginTop:10,background:"#fff",border:"2px solid #000",borderRadius:10,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#000",marginBottom:10,fontFamily:"'Inter',sans-serif"}}>⚠ Similar hotels exist:</div>
          {similar.map(h=><div key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}>
            <div><div style={{fontSize:13,fontWeight:600,color:"#000",fontFamily:"'Inter',sans-serif"}}>{h.name}</div><div style={{fontSize:11,color:"#999",fontFamily:"'Inter',sans-serif"}}>{h.brand} · {h.location}</div></div>
            <button onClick={onClose} style={{background:"#000",color:"#fff",border:"none",borderRadius:6,padding:"5px 12px",fontSize:11,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>View</button>
          </div>)}
          <div style={{fontSize:11,color:"#bbb",marginTop:10,fontFamily:"'Inter',sans-serif"}}>If none match, continue below.</div>
        </div>}
      </div>
      <div style={{marginBottom:14}}><label style={LS}>Brand</label><select value={brand} onChange={e=>setBrand(e.target.value)} style={IS}><option value="">Select brand...</option>{BRANDS.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
      <div style={{marginBottom:24}}><label style={LS}>Location</label><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Scottsdale, AZ" style={IS}/></div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={submit} disabled={submitting} style={{background:"#000",color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",opacity:submitting?0.5:1}}>Add Hotel</button>
        <button onClick={onClose} style={{background:"transparent",color:"#999",border:"1px solid #ddd",borderRadius:10,padding:"12px 28px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Cancel</button>
      </div>
    </div>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [hotels, setHotels] = useState([]); const [perkCounts, setPerkCounts] = useState({});
  const [search, setSearch] = useState(""); const [brandFilter, setBrandFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [showAuth, setShowAuth] = useState(false); const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHotels = async () => {
    setLoading(true);
    const{data}=await supabase.from("hotels").select("*").order("name");
    setHotels(data||[]);
    const{data:rp}=await supabase.from("perk_reports").select("hotel_id");
    const c={}; (rp||[]).forEach(r=>{c[r.hotel_id]=(c[r.hotel_id]||0)+1;}); setPerkCounts(c);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({data})=>{if(data?.user)setUser(data.user);});
    supabase.auth.onAuthStateChange((_,s)=>{setUser(s?.user||null);});
    loadHotels();
  }, []);

  const filtered = hotels.filter(h => {
    const ms = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase());
    const mb = !brandFilter || h.brand === brandFilter;
    return ms && mb;
  });
  const usedBrands = [...new Set(hotels.map(h=>h.brand))].sort();

  return <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "'Inter',sans-serif" }}>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
    {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onAuth={()=>supabase.auth.getUser().then(({data})=>setUser(data?.user))}/>}
    {showAdd && <AddHotelModal onClose={()=>setShowAdd(false)} user={user} onNeedAuth={()=>setShowAuth(true)} onAdded={loadHotels} existingHotels={hotels}/>}

    <div style={{ background:"#000", padding:"0 0 56px", position:"relative" }}>
      <div style={{ maxWidth:920, margin:"0 auto", padding:"20px 24px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:48, flexWrap:"wrap", gap:10 }}>
          <div onClick={()=>setSelected(null)} style={{ cursor:"pointer", display:"flex", alignItems:"baseline", gap:0 }}>
            <span style={{ fontSize:22, fontWeight:900, color:"#fff", fontFamily:"'Inter',sans-serif", letterSpacing:-0.5 }}>Perk</span>
            <span style={{ fontSize:22, fontWeight:900, color:"#555", fontFamily:"'Inter',sans-serif", letterSpacing:-0.5 }}>Snob</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {user ? <>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.4)",fontFamily:"'Inter',sans-serif"}}>{user.user_metadata?.display_name||user.email?.split("@")[0]}</span>
              <button onClick={async()=>{await supabase.auth.signOut();setUser(null);}} style={{background:"transparent",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Sign Out</button>
            </> : <button onClick={()=>setShowAuth(true)} style={{background:"transparent",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Sign In</button>}
            <button onClick={()=>user?setShowAdd(true):setShowAuth(true)} style={{background:"#fff",color:"#000",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>+ Add Hotel</button>
          </div>
        </div>
        {!selected && <>
          <h1 style={{ fontSize:46, fontWeight:900, color:"#fff", fontFamily:"'Inter',sans-serif", margin:"0 0 12px", lineHeight:1.05, maxWidth:500, letterSpacing:-2 }}>
            Elite hotel perks,<br/>crowdsourced.
          </h1>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.35)", fontFamily:"'Inter',sans-serif", margin:"0 0 32px", maxWidth:440, lineHeight:1.6 }}>
            Real Marriott Bonvoy elite benefits reported by real guests. Know what you're getting before you book.
          </p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search hotels or destinations..." style={{ flex:"1 1 300px",padding:"14px 18px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:14,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box" }}/>
            <select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)} style={{ padding:"14px 18px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none",cursor:"pointer",minWidth:160 }}>
              <option value="" style={{color:"#000"}}>All Brands</option>
              {usedBrands.map(b=><option key={b} value={b} style={{color:"#000"}}>{b}</option>)}
            </select>
          </div>
        </>}
      </div>
    </div>

    <div style={{ maxWidth:920, margin:"-28px auto 0", padding:"0 24px 60px", position:"relative" }}>
      {selected ? <HotelDetail hotel={selected} user={user} onBack={()=>setSelected(null)} onNeedAuth={()=>setShowAuth(true)}/> :
      loading ? <div style={{textAlign:"center",padding:60,color:"#ccc",fontFamily:"'Inter',sans-serif"}}>Loading...</div> : <>
        <div style={{marginBottom:16}}><span style={{fontSize:12,color:"#bbb",fontFamily:"'Inter',sans-serif"}}>{filtered.length} propert{filtered.length!==1?"ies":"y"}</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:12 }}>
          {filtered.map(h=><HotelCard key={h.id} hotel={h} perkCounts={perkCounts} onClick={()=>setSelected(h)}/>)}
        </div>
        {!filtered.length && <div style={{textAlign:"center",padding:"60px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>🏨</div>
          <div style={{fontSize:18,fontWeight:800,color:"#000",fontFamily:"'Inter',sans-serif",marginBottom:6}}>No hotels found</div>
          <div style={{fontSize:13,color:"#bbb",fontFamily:"'Inter',sans-serif",marginBottom:20}}>Try a different search</div>
          <button onClick={()=>user?setShowAdd(true):setShowAuth(true)} style={{background:"#000",color:"#fff",border:"none",borderRadius:8,padding:"11px 24px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>+ Add a Hotel</button>
        </div>}
      </>}
    </div>
  </div>;
}
