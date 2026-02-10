import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
const TIERS=[{key:"ambassador",label:"Ambassador Elite",color:"#1a1a1a"},{key:"titanium",label:"Titanium Elite",color:"#6b7280"},{key:"platinum",label:"Platinum Elite",color:"#9ca3af"}];
const CATS=[{key:"breakfast",icon:"🍳",label:"Breakfast"},{key:"lounge",icon:"🍸",label:"Lounge Access"},{key:"drinks",icon:"☕",label:"Drinks & Coffee"},{key:"upgrade",icon:"⬆️",label:"Room Upgrades"},{key:"gift",icon:"🎁",label:"Welcome Gift"},{key:"late_checkout",icon:"🕐",label:"Late Checkout"},{key:"spa",icon:"💆",label:"Spa & Wellness"},{key:"parking",icon:"🅿️",label:"Parking"},{key:"fnb_credit",icon:"💳",label:"F&B Credit"},{key:"housekeeping",icon:"🧹",label:"Housekeeping"},{key:"bathroom",icon:"🚿",label:"Bathroom"},{key:"other",icon:"✨",label:"Other"}];
const BRANDS=["The Ritz-Carlton","St. Regis","W Hotels","EDITION","The Luxury Collection","JW Marriott"];
const BOOKING_TYPES=["Direct","Points","Amex FHR","Virtuoso","STARS","Corporate","Employee (MMP)","Other"];
const UPGRADE_TYPES=["Same category, better room","Higher category","Suite upgrade"];
const CATEGORY_FIELDS={
breakfast:[
{key:"cost",label:"Cost",type:"select",options:["Complimentary","Voucher/Credit","Discounted","Not included"]},
{key:"credit_amount",label:"Amount",type:"text",placeholder:"e.g. $50/person",showIf:d=>d.cost==="Voucher/Credit"||d.cost==="Discounted"},
{key:"style",label:"Style",type:"select",options:["Full breakfast","Continental","Both options"]},
{key:"format",label:"Format",type:"select",options:["Buffet","À la carte","Both"]},
{key:"quality",label:"Quality",type:"rating",max:5},
{key:"hot_food",label:"Hot food?",type:"select",options:["Yes","No"]},
{key:"location",label:"Where?",type:"text",placeholder:"e.g. Main restaurant, club lounge"}],
lounge:[
{key:"status",label:"Status",type:"select",options:["Open","Closed","Renovating","No lounge"]},
{key:"hours",label:"Hours",type:"text",placeholder:"e.g. 6am–10pm"},
{key:"food_type",label:"Food",type:"select",options:["Full meals","Snacks & appetizers","Drinks only","No food"]},
{key:"evening_apps",label:"Evening appetizers?",type:"select",options:["Yes, hot food","Yes, light bites","No"]},
{key:"alcohol",label:"Alcohol served?",type:"select",options:["Yes, full bar","Yes, beer & wine","No"]},
{key:"quality",label:"Quality",type:"rating",max:5}],
upgrade:[
{key:"stay_length",label:"Stay length",type:"select",options:["1–2 nights","3–4 nights","5+ nights"]},
{key:"how_granted",label:"How granted?",type:"select",options:["Proactive (at check-in)","Upon request","Through app/SNNA","Not granted"]},
{key:"floors_up",label:"Floors upgraded",type:"select",options:["Same floor","1–3 floors up","4+ floors up","Top floor","N/A"]},
{key:"room_offered",label:"Room type offered",type:"text",placeholder:"e.g. Ocean view suite, Club level king"}],
gift:[
{key:"gift_type",label:"Type",type:"select",options:["Food & beverage platter","Bottle of wine/champagne","Amenity (non-food)","Welcome letter + points","Resort credit","Nothing"]},
{key:"gift_detail",label:"Specific item",type:"text",placeholder:"e.g. Chocolate truffles & fruit plate"}],
late_checkout:[
{key:"time_granted",label:"Time granted",type:"select",options:["1:00 PM","2:00 PM","3:00 PM","4:00 PM","No late checkout"]},
{key:"how_lco",label:"How?",type:"select",options:["Proactive (offered at check-in)","Upon request","Via app","Denied"]}],
spa:[
{key:"spa_type",label:"What was offered?",type:"select",options:["Free treatment","Credit/discount","Free facility access only","Discount on treatments","Nothing"]},
{key:"spa_amount",label:"Amount",type:"text",placeholder:"e.g. $50 credit, 20% off",showIf:d=>d.spa_type==="Credit/discount"||d.spa_type==="Discount on treatments"},
{key:"spa_detail",label:"Details",type:"text",placeholder:"e.g. Sauna, pool, gym access included"}],
fnb_credit:[
{key:"amount",label:"Amount",type:"text",placeholder:"e.g. $50"},
{key:"frequency",label:"Per",type:"select",options:["Per night","Per stay","Per person/night","One-time"]},
{key:"where",label:"Where usable?",type:"select",options:["Any restaurant","Specific restaurant","Bar only","Room service","Any outlet"]},
{key:"fnb_detail",label:"Restaurant name",type:"text",placeholder:"e.g. The Grill, Lobby Bar"}],
parking:[
{key:"included",label:"Included free?",type:"select",options:["Yes, free","Discounted","No, full price"]},
{key:"parking_type",label:"Type",type:"select",options:["Self-park","Valet","Both available"]},
{key:"daily_rate",label:"Daily rate",type:"text",placeholder:"e.g. $45/night",showIf:d=>d.included!=="Yes, free"}],
housekeeping:[
{key:"frequency",label:"Frequency",type:"select",options:["Daily","Every other day","On request only","Not offered"]},
{key:"turndown",label:"Turndown service?",type:"select",options:["Yes, daily","Yes, on request","No"]}],
bathroom:[
{key:"door_type",label:"Door type",type:"select",options:["Solid wood/standard","Frosted glass","Clear/see-through glass","Open concept (no door)","Sliding barn door","Pocket door"]},
{key:"separate_toilet",label:"Separate toilet room?",type:"select",options:["Yes","No"]},
{key:"bath_type",label:"Bath/Shower",type:"select",options:["Tub & separate shower","Tub/shower combo","Shower only","Soaking tub & shower","Rain shower"]},
{key:"dual_vanity",label:"Dual vanity?",type:"select",options:["Yes","No"]}],
drinks:[
{key:"drink_type",label:"What's offered?",type:"select",options:["In-room coffee machine","Lobby café/bar","Lounge access","Complimentary at restaurant","Minibar credit","Welcome drinks"]},
{key:"machine_type",label:"Machine",type:"text",placeholder:"e.g. Nespresso, Illy, Keurig",showIf:d=>d.drink_type==="In-room coffee machine"},
{key:"drink_detail",label:"Details",type:"text",placeholder:"e.g. 2 free drinks at lobby bar per night"}],
other:[]
};
const MAX_DESC=500,MAX_NAME=30,MAX_TIP=300;
const gc=k=>CATS.find(c=>c.key===k)||CATS[CATS.length-1],gt=k=>TIERS.find(t=>t.key===k)||TIERS[2];
const cc=c=>c==="high"?"#1a1a1a":c==="medium"?"#6b7280":"#9ca3af",cl=c=>c==="high"?"Well established":c==="medium"?"Frequently reported":"Few reports",cv=n=>n>=8?"high":n>=4?"medium":"low";
const be=b=>b==="Snob Supreme"?"👑":b==="Elite Reporter"?"⭐":b==="Perk Scout"?"🔍":b==="Contributor"?"✍️":"🆕";
const ta=d=>{const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return"just now";if(s<3600)return Math.floor(s/60)+"m ago";if(s<86400)return Math.floor(s/3600)+"h ago";if(s<2592000)return Math.floor(s/86400)+"d ago";return Math.floor(s/2592000)+"mo ago"};
const fsd=d=>{if(!d)return null;return new Date(d+"T00:00:00").toLocaleDateString("en-US",{year:"numeric",month:"short"})};
const dname=u=>u?.user_metadata?.display_name||u?.email?.split("@")[0]||"Anonymous";
const pscore=(r,c)=>Math.min(100,r*3+c*8);
const mkSlug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const FF="'DM Sans',sans-serif";const FD="'Playfair Display',serif";
const LS={display:"block",fontSize:10,fontWeight:600,color:"#94a3b8",fontFamily:FF,marginBottom:6,textTransform:"uppercase",letterSpacing:1.2};
const IS={width:"100%",padding:"12px 14px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:14,fontFamily:FF,background:"#fff",color:"#0f172a",outline:"none",boxSizing:"border-box",transition:"border-color 0.15s"};
const BT=(bg="#0f172a",fg="#fff")=>({background:bg,color:fg,border:"none",borderRadius:6,padding:"10px 22px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FF,letterSpacing:0.2,transition:"all 0.15s"});
const TAG=(bg,fg)=>({display:"inline-flex",alignItems:"center",fontSize:9,fontWeight:700,fontFamily:FF,padding:"2px 6px",borderRadius:3,background:bg,color:fg,textTransform:"uppercase",letterSpacing:0.5});

function usePath(){const[path,setPath]=useState(window.location.pathname);useEffect(()=>{const h=()=>setPath(window.location.pathname);window.addEventListener("popstate",h);return()=>window.removeEventListener("popstate",h)},[]);const nav=p=>{window.history.pushState({},"",p);setPath(p)};return[path,nav]}
function useTitle(t){useEffect(()=>{document.title=t},[t])}

/* Toast system */
let _toastFn=null;
function showToast(msg,type="success"){if(_toastFn)_toastFn({msg,type,id:Date.now()})}
function Toaster(){const[toasts,st]=useState([]);_toastFn=t=>{st(p=>[...p,t]);setTimeout(()=>st(p=>p.filter(x=>x.id!==t.id)),3000)};
return<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8}}>{toasts.map(t=><div key={t.id} style={{background:t.type==="error"?"#dc2626":"#059669",color:"#fff",padding:"12px 20px",borderRadius:8,fontSize:13,fontWeight:600,fontFamily:FF,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",animation:"slideIn 0.2s ease",maxWidth:320}}>{t.msg}</div>)}</div>}

/* Skeleton loader */
function Skeleton({w="100%",h=16,r=6}){return<div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/>}
function CardSkeleton(){return<div style={{background:"#fff",borderRadius:10,padding:"20px 22px",border:"1px solid #e2e8f0"}}><Skeleton w="60%" h={10}/><div style={{height:8}}/><Skeleton w="85%" h={16}/><div style={{height:4}}/><Skeleton w="50%" h={12}/><div style={{height:14}}/><Skeleton w="30%" h={14}/></div>}

function ScoreBadge({score}){const c=score>=70?"#059669":score>=40?"#d97706":"#dc2626",bg=score>=70?"#ecfdf5":score>=40?"#fffbeb":"#fef2f2";return<div style={{display:"inline-flex",alignItems:"center",gap:4,background:bg,border:`1px solid ${c}22`,borderRadius:6,padding:"3px 10px"}}><span style={{fontSize:15,fontWeight:700,color:c,fontFamily:FF}}>{score}</span><span style={{fontSize:9,color:c,fontFamily:FF,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>score</span></div>}

/* Character counter */
function CharCount({val,max}){const r=max-val.length;return<span style={{fontSize:10,color:r<20?"#dc2626":"#94a3b8",fontFamily:FF,float:"right"}}>{r}</span>}

/* Star rating input */
function StarInput({value,onChange,max=5}){return<div style={{display:"flex",gap:2}}>{Array.from({length:max}).map((_,i)=><button key={i} type="button" onClick={()=>onChange(i+1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,padding:0,color:i<value?"#f59e0b":"#e2e8f0"}} aria-label={`${i+1} star${i+1>1?"s":""}`}>★</button>)}</div>}

/* Dynamic category detail form fields */
function CategoryDetailFields({category,details,onChange}){const fields=CATEGORY_FIELDS[category]||[];if(!fields.length)return null;
const set=(k,v)=>onChange({...details,[k]:v});
const visible=fields.filter(f=>!f.showIf||f.showIf(details));
return<div style={{marginBottom:16,padding:16,background:"#fff",borderRadius:8,border:"1px solid #e2e8f0"}}><div style={{fontSize:11,fontWeight:700,color:"#64748b",fontFamily:FF,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Optional details <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}> — helps others know what to expect</span></div>
<div style={{display:"flex",gap:12,flexWrap:"wrap"}}>{visible.map(f=><div key={f.key} style={{flex:f.type==="text"?"1 1 160px":"0 0 auto",minWidth:f.type==="select"?140:120}}>
<label style={{...LS,marginBottom:4}}>{f.label}</label>
{f.type==="select"?<select value={details[f.key]||""} onChange={e=>set(f.key,e.target.value)} style={{...IS,fontSize:12,padding:"8px 10px"}}><option value="">—</option>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select>
:f.type==="rating"?<StarInput value={details[f.key]||0} onChange={v=>set(f.key,v)} max={f.max||5}/>
:<input value={details[f.key]||""} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder||""} style={{...IS,fontSize:12,padding:"8px 10px"}} maxLength={50}/>}
</div>)}</div></div>}

/* Display category details as tags on perk cards */
function CategoryDetailTags({category,details}){if(!details||typeof details!=="object")return null;const fields=CATEGORY_FIELDS[category]||[];if(!fields.length)return null;
const tags=fields.map(f=>{const v=details[f.key];if(!v)return null;if(f.type==="rating")return{label:f.label,value:"★".repeat(v)+"☆".repeat((f.max||5)-v)};return{label:f.label,value:v}}).filter(Boolean);
if(!tags.length)return null;
return<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>{tags.map((t,i)=><span key={i} style={{...TAG("#f0f9ff","#0369a1"),fontSize:9,gap:3}}><span style={{opacity:0.7}}>{t.label}:</span> {t.value}</span>)}</div>}

function PerkCard({perk,user,onUp,onDown,onEdit,onDelete,showHotel}){const cat=gc(perk.category),conf=cv(perk.total_confirmations),stay=fsd(perk.latest_stay);const[sd,ssd]=useState(false);
const isOwner=user&&perk.user_id===user.id;const hasPromo=perk.promo_code||perk.booking_type==="Employee (MMP)"||perk.booking_type==="Corporate";
return<div style={{display:"flex",gap:14,padding:"14px 0",borderBottom:"1px solid #f1f5f9"}}><div style={{width:38,height:38,borderRadius:8,background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0,border:"1px solid #e2e8f0"}} role="img" aria-label={cat.label}>{cat.icon}</div>
<div style={{flex:1,minWidth:0}}>{showHotel&&<div style={{fontSize:11,fontWeight:700,color:"#0f172a",fontFamily:FF,marginBottom:3}}>{perk.hotel_name}</div>}
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}><span style={{fontSize:11,fontWeight:700,color:"#334155",fontFamily:FF,textTransform:"uppercase",letterSpacing:0.8}}>{cat.label}</span>
<span style={{...TAG("#f1f5f9",gt(perk.elite_tier).color)}}>{gt(perk.elite_tier).label}</span>
{perk.upgrade_type&&<span style={{...TAG("#eff6ff","#1d4ed8")}}>{perk.upgrade_type}</span>}
{perk.booking_type&&<span style={{...TAG("#f0fdf4","#15803d")}}>{perk.booking_type}</span>}
{hasPromo&&<span style={{...TAG("#fefce8","#a16207")}} title="Booked with a promo/corporate/employee code — perks may differ from standard bookings">⚠️ {perk.promo_code||"Promo/Corp rate"}</span>}
{stay&&<span style={{fontSize:9,color:"#94a3b8",fontFamily:FF,background:"#f8fafc",padding:"2px 6px",borderRadius:3}}>Stay: {stay}</span>}</div>
<div style={{fontSize:13,color:"#475569",lineHeight:1.6,fontFamily:FF}}>{perk.summary||perk.description}</div>
<CategoryDetailTags category={perk.category} details={perk.category_details}/>
<div style={{marginTop:6,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontFamily:FF,color:cc(conf),background:"#f8fafc",padding:"3px 8px",borderRadius:12,fontWeight:600,border:"1px solid #f1f5f9"}}><span style={{width:4,height:4,borderRadius:"50%",background:cc(conf)}}/>{perk.total_confirmations} report{perk.total_confirmations!==1?"s":""} · {cl(conf)}</span>
{user&&<><button onClick={()=>onUp(perk)} aria-label="Confirm perk" style={{background:"none",border:"1px solid #e2e8f0",borderRadius:4,padding:"2px 8px",fontSize:10,cursor:"pointer",color:"#64748b",fontFamily:FF,fontWeight:600}}>Confirm</button>
<button onClick={()=>ssd(!sd)} aria-label="Dispute perk" style={{background:"none",border:"1px solid #e2e8f0",borderRadius:4,padding:"2px 8px",fontSize:10,cursor:"pointer",color:"#94a3b8",fontFamily:FF}}>Dispute</button></>}
{isOwner&&onEdit&&<button onClick={()=>onEdit(perk)} aria-label="Edit perk" style={{background:"none",border:"1px solid #dbeafe",borderRadius:4,padding:"2px 8px",fontSize:10,cursor:"pointer",color:"#2563eb",fontFamily:FF,fontWeight:600}}>Edit</button>}
{isOwner&&onDelete&&<button onClick={()=>{if(window.confirm("Delete this perk report?"))onDelete(perk)}} aria-label="Delete perk" style={{background:"none",border:"1px solid #fecaca",borderRadius:4,padding:"2px 8px",fontSize:10,cursor:"pointer",color:"#dc2626",fontFamily:FF}}>Delete</button>}
</div>
{sd&&user&&<div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>{[{k:"outdated",l:"Outdated"},{k:"inaccurate",l:"Inaccurate"},{k:"not_my_experience",l:"Not my experience"}].map(r=><button key={r.k} onClick={()=>{onDown(perk,r.k);ssd(false)}} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:4,padding:"3px 8px",fontSize:10,cursor:"pointer",color:"#dc2626",fontFamily:FF,fontWeight:600}}>{r.l}</button>)}</div>}
</div></div>}

function TierSection({tier,perks,user,onUp,onDown,onEdit,onDelete}){const t=gt(tier);if(!perks?.length)return<div style={{padding:20,borderRadius:8,background:"#fafbfc",border:"1px solid #f1f5f9",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{width:6,height:6,borderRadius:"50%",background:t.color}}/><span style={{fontSize:12,fontWeight:700,color:t.color,fontFamily:FF}}>{t.label}</span></div><div style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>No perks reported yet. Be the first to share what you received!</div></div>;
return<div style={{padding:"16px 20px",borderRadius:8,background:"#fff",border:"1px solid #e2e8f0",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{width:6,height:6,borderRadius:"50%",background:t.color}}/><span style={{fontSize:13,fontWeight:700,color:t.color,fontFamily:FF}}>{t.label}</span><span style={{fontSize:10,color:"#94a3b8",fontFamily:FF,marginLeft:"auto"}}>{perks.length} perk{perks.length!==1?"s":""}</span></div>{perks.map((p,i)=><PerkCard key={p.id||i} perk={p} user={user} onUp={onUp} onDown={onDown} onEdit={onEdit} onDelete={onDelete}/>)}</div>}

function Footer(){return<footer style={{background:"#0f172a",borderTop:"1px solid #1e293b",padding:"40px 28px",marginTop:40}}><div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:24}}>
<div><div style={{display:"flex",alignItems:"baseline",gap:1,marginBottom:8}}><span style={{fontSize:20,fontWeight:700,color:"#fff",fontFamily:FD}}>Perk</span><span style={{fontSize:20,fontWeight:700,color:"#94a3b8",fontFamily:FD}}>Snob</span></div>
<p style={{fontSize:12,color:"#64748b",fontFamily:FF,maxWidth:280,lineHeight:1.6}}>Real Marriott Bonvoy elite benefits reported by real guests. Community-powered hotel intelligence.</p></div>
<div style={{display:"flex",gap:32}}>
<div><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Navigate</div>
{[{l:"Home",p:"/"},{l:"Map",p:"/map"},{l:"Search Perks",p:"/search"},{l:"Compare",p:"/compare"},{l:"Leaderboard",p:"/leaderboard"}].map(x=><a key={x.p} href={x.p} onClick={e=>{e.preventDefault();window.history.pushState({},"",x.p);window.dispatchEvent(new PopStateEvent("popstate"))}} style={{display:"block",fontSize:13,color:"#64748b",fontFamily:FF,textDecoration:"none",marginBottom:6,transition:"color 0.15s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="#64748b"}>{x.l}</a>)}</div>
<div><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Community</div>
<a href="https://www.reddit.com/r/marriott/" target="_blank" rel="noopener noreferrer" style={{display:"block",fontSize:13,color:"#64748b",fontFamily:FF,textDecoration:"none",marginBottom:6}}>r/marriott</a>
<a href="https://www.reddit.com/user/MarriottGuy/" target="_blank" rel="noopener noreferrer" style={{display:"block",fontSize:13,color:"#64748b",fontFamily:FF,textDecoration:"none",marginBottom:6}}>Contact (Reddit)</a></div>
</div></div>
<div style={{maxWidth:1100,margin:"20px auto 0",paddingTop:20,borderTop:"1px solid #1e293b"}}><p style={{fontSize:11,color:"#475569",fontFamily:FF}}>PerkSnob is not affiliated with Marriott International. All trademarks belong to their respective owners.</p></div></footer>}

function AuthModal({onClose,onAuth}){const[mode,sMode]=useState("signin"),[em,se]=useState(""),[pw,sp]=useState(""),[nm,sn]=useState(""),[ld,sl]=useState(false),[er,sr]=useState(""),[msg,smsg]=useState("");
const go=async()=>{sl(true);sr("");smsg("");try{if(mode==="signup"){if(!nm.trim()||nm.trim().length<2){throw new Error("Display name must be at least 2 characters")}if(nm.trim().length>MAX_NAME){throw new Error(`Display name must be ${MAX_NAME} characters or less`)}
const{data:existingName}=await supabase.from("perk_reports").select("display_name").eq("display_name",nm.trim()).limit(1);
const{data:existingCmt}=await supabase.from("comments").select("display_name").eq("display_name",nm.trim()).limit(1);
if((existingName&&existingName.length>0)||(existingCmt&&existingCmt.length>0)){throw new Error("That display name is already taken. Please choose another.")}
const{data:signUpData,error}=await supabase.auth.signUp({email:em,password:pw,options:{data:{display_name:nm.trim()}}});if(error)throw error;
const u=signUpData?.user;if(u&&(u.identities?.length===0||(u.created_at&&(Date.now()-new Date(u.created_at).getTime())>5000))){throw new Error("An account with this email already exists. Try signing in instead.")}
smsg("Check your email to confirm your account!");sMode("done")}else if(mode==="signin"){const{error}=await supabase.auth.signInWithPassword({email:em,password:pw});if(error)throw error;showToast("Signed in successfully.");onAuth();onClose()}else if(mode==="reset"){const{error}=await supabase.auth.resetPasswordForEmail(em,{redirectTo:window.location.origin});if(error)throw error;smsg("Check your email for a password reset link.")}}catch(e){sr(e.message)}sl(false)};
return<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}} onClick={onClose}><div style={{background:"#fff",borderRadius:12,padding:40,maxWidth:380,width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()} role="dialog" aria-label={mode==="signup"?"Create account":mode==="reset"?"Reset password":"Sign in"}>
<h2 style={{fontSize:28,fontFamily:FD,fontWeight:700,marginBottom:4,color:"#0f172a"}}>{mode==="signup"?"Create Account":mode==="reset"?"Reset Password":mode==="done"?"Check Your Email":"Welcome back"}</h2>
<p style={{fontSize:13,color:"#94a3b8",marginBottom:28,fontFamily:FF}}>{mode==="signup"?"Join the community":mode==="reset"?"Enter your email to reset":mode==="done"?"":"Sign in to contribute"}</p>
{er&&<div role="alert" style={{background:"#fef2f2",color:"#dc2626",padding:"10px 14px",borderRadius:6,fontSize:12,marginBottom:14,fontFamily:FF}}>{er}</div>}
{msg&&<div role="status" style={{background:"#ecfdf5",color:"#059669",padding:"10px 14px",borderRadius:6,fontSize:12,marginBottom:14,fontFamily:FF}}>{msg}</div>}
{mode==="done"?<><div style={{background:"#ecfdf5",borderRadius:8,padding:20,textAlign:"center",marginBottom:20}}><div style={{fontSize:32,marginBottom:8}}>✉️</div><p style={{fontSize:14,color:"#059669",fontFamily:FF,fontWeight:600,margin:0}}>We sent a confirmation link to your email.</p><p style={{fontSize:12,color:"#64748b",fontFamily:FF,marginTop:8,marginBottom:0}}>Click the link to activate your account, then come back and sign in.</p></div><button onClick={onClose} style={{width:"100%",...BT(),padding:"13px",fontSize:14}}>Got it</button></>:<>
{mode==="signup"&&<div style={{marginBottom:14}}><label style={LS}>Display Name <CharCount val={nm} max={MAX_NAME}/></label><input value={nm} onChange={e=>sn(e.target.value.slice(0,MAX_NAME))} placeholder="e.g. JetsetterJohn" style={IS} maxLength={MAX_NAME} autoFocus/></div>}
<div style={{marginBottom:14}}><label style={LS}>Email</label><input type="email" value={em} onChange={e=>se(e.target.value)} placeholder="you@email.com" style={IS} autoFocus={mode!=="signup"}/></div>
{mode!=="reset"&&<div style={{marginBottom:28}}><label style={LS}>Password</label><input type="password" value={pw} onChange={e=>sp(e.target.value)} placeholder="••••••••" style={IS} onKeyDown={e=>e.key==="Enter"&&go()}/></div>}
{mode==="reset"&&<div style={{marginBottom:28}}/>}
<button onClick={go} disabled={ld} style={{width:"100%",...BT(),padding:"13px",fontSize:14,opacity:ld?0.5:1}}>{ld?"...":mode==="signup"?"Create Account":mode==="reset"?"Send Reset Link":"Sign In"}</button>
<div style={{textAlign:"center",marginTop:18,display:"flex",flexDirection:"column",gap:8}}>
{mode==="signin"&&<button onClick={()=>{sMode("reset");sr("");smsg("")}} style={{background:"none",border:"none",color:"#94a3b8",fontSize:12,cursor:"pointer",fontFamily:FF}}>Forgot password?</button>}
<button onClick={()=>{sMode(mode==="signup"?"signin":mode==="reset"?"signin":"signup");sr("");smsg("")}} style={{background:"none",border:"none",color:"#0f172a",fontSize:13,cursor:"pointer",fontFamily:FF,fontWeight:600,textDecoration:"underline",textUnderlineOffset:3}}>{mode==="signup"?"Already have an account?":mode==="reset"?"Back to sign in":"New? Join and create account"}</button></div>
</>}
</div></div>}

function MapView({hotels,perkCounts,onSelect}){const mr=useRef(null),mi=useRef(null),ms=useRef([]);
useEffect(()=>{if(!window.google||!mr.current||mi.current)return;mi.current=new window.google.maps.Map(mr.current,{center:{lat:30,lng:-40},zoom:2,styles:[{elementType:"geometry",stylers:[{color:"#f8fafc"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#e2e8f0"}]},{featureType:"road",elementType:"geometry",stylers:[{color:"#fff"}]}],disableDefaultUI:true,zoomControl:true})},[]);
useEffect(()=>{if(!mi.current||!window.google)return;ms.current.forEach(m=>m.setMap(null));ms.current=[];const b=new window.google.maps.LatLngBounds();let hp=false;
hotels.forEach(h=>{if(!h.latitude||!h.longitude)return;hp=true;const p={lat:h.latitude,lng:h.longitude};b.extend(p);const c=perkCounts[h.id]||0;
const m=new window.google.maps.Marker({position:p,map:mi.current,title:h.name,icon:{path:window.google.maps.SymbolPath.CIRCLE,fillColor:c>0?"#0f172a":"#cbd5e1",fillOpacity:1,strokeColor:"#fff",strokeWeight:2,scale:Math.max(6,Math.min(14,6+c))}});
const iw=new window.google.maps.InfoWindow({content:`<div style="font-family:DM Sans,sans-serif;padding:4px"><strong>${h.name}</strong><br><span style="color:#64748b;font-size:12px">${h.brand} · ${h.location}</span><br><span style="font-weight:700">${c} reports</span></div>`});
m.addListener("click",()=>iw.open(mi.current,m));m.addListener("dblclick",()=>onSelect(h));ms.current.push(m)});if(hp)mi.current.fitBounds(b,50)},[hotels,perkCounts,onSelect]);
return<div><p style={{fontSize:12,color:"#94a3b8",fontFamily:FF,marginBottom:10}}>Click a marker for details · Double-click to open hotel</p><div ref={mr} style={{width:"100%",height:520,borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc"}} role="application" aria-label="Hotel map"/></div>}

function PerkSearch({user,onNeedAuth}){const[tier,st]=useState(""),[cat,sc]=useState(""),[res,sr]=useState([]),[ld,sl]=useState(false),[done,sd]=useState(false),[err,ser]=useState("");
const go=async()=>{sl(true);sd(true);ser("");try{let q=supabase.from("perk_reports").select("*, hotels!inner(name,brand,location)").order("created_at",{ascending:false}).limit(50);if(tier)q=q.eq("elite_tier",tier);if(cat)q=q.eq("category",cat);const{data,error}=await q;if(error)throw error;
const pm={};(data||[]).forEach(p=>{const k=`${p.hotel_id}|${p.elite_tier}|${p.category}|${p.description}`;if(!pm[k])pm[k]={...p,total_confirmations:1,summary:p.description,hotel_name:p.hotels?.name,latest_stay:p.stay_date};else{pm[k].total_confirmations+=1;if(p.stay_date>pm[k].latest_stay)pm[k].latest_stay=p.stay_date}});sr(Object.values(pm))}catch(e){ser("Failed to load results. Please try again.");console.error(e)}sl(false)};
return<div><div style={{background:"#fff",borderRadius:10,padding:28,border:"1px solid #e2e8f0",marginBottom:20}}>
<h2 style={{fontSize:22,fontFamily:FD,fontWeight:700,color:"#0f172a",marginBottom:18}}>Find Perks Across All Hotels</h2>
<div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
<div style={{flex:"1 1 180px"}}><label style={LS}>Tier</label><select value={tier} onChange={e=>st(e.target.value)} style={IS}><option value="">Any</option>{TIERS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
<div style={{flex:"1 1 180px"}}><label style={LS}>Category</label><select value={cat} onChange={e=>sc(e.target.value)} style={IS}><option value="">Any</option>{CATS.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
<button onClick={go} style={BT()}>Search</button></div></div>
{err&&<div role="alert" style={{background:"#fef2f2",color:"#dc2626",padding:"12px 16px",borderRadius:8,fontSize:13,fontFamily:FF,marginBottom:16}}>{err} <button onClick={go} style={{background:"none",border:"none",color:"#dc2626",fontWeight:700,cursor:"pointer",textDecoration:"underline",fontFamily:FF}}>Retry</button></div>}
{ld?<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Searching...</div>:done&&<>{res.length>0&&<div style={{fontSize:12,color:"#94a3b8",fontFamily:FF,marginBottom:12}}>{res.length} result{res.length!==1?"s":""}</div>}{res.map((p,i)=><PerkCard key={i} perk={p} user={user} onUp={()=>{}} onDown={()=>{}} showHotel/>)}{!res.length&&<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No perks found matching your criteria.</div>}</>}</div>}

function Comparison({hotels,onClose}){const[sel,ss]=useState(["",""]),[data,sd]=useState({}),[ld,sl]=useState(false);
const load=async(i,id)=>{const ns=[...sel];ns[i]=id;ss(ns);if(!id||data[id])return;sl(true);const{data:pd}=await supabase.from("perk_reports").select("*").eq("hotel_id",id);const pm={};(pd||[]).forEach(p=>{const k=`${p.elite_tier}|${p.category}|${p.description}`;if(!pm[k])pm[k]={...p,total_confirmations:1,summary:p.description};else pm[k].total_confirmations+=1});sd(d=>({...d,[id]:Object.values(pm)}));sl(false)};
return<div><button onClick={onClose} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button>
<div style={{background:"#0f172a",borderRadius:12,padding:36,marginBottom:28,color:"#fff"}}><p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:FF}}>Compare</p><h1 style={{fontSize:30,fontWeight:700,margin:0,fontFamily:FD}}>Side-by-Side Perks</h1></div>
<div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>{sel.map((s,i)=><div key={i} style={{flex:"1 1 200px"}}><label style={LS}>Hotel {i+1}</label><select value={s} onChange={e=>load(i,e.target.value)} style={IS}><option value="">Select...</option>{hotels.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></div>)}
{sel.length<4&&<button onClick={()=>ss([...sel,""])} style={{alignSelf:"flex-end",...BT("#f1f5f9","#334155"),fontSize:12}}>+ Add</button>}</div>
{ld&&<div style={{textAlign:"center",padding:20,color:"#94a3b8"}}>Loading...</div>}
{TIERS.map(tier=>{const active=sel.filter(s=>s);if(!active.length)return null;return<div key={tier.key} style={{marginBottom:20}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{width:6,height:6,borderRadius:"50%",background:tier.color}}/><span style={{fontSize:13,fontWeight:700,color:tier.color,fontFamily:FF}}>{tier.label}</span></div>
<div style={{display:"grid",gridTemplateColumns:`repeat(${active.length},1fr)`,gap:10}}>{active.map(hid=>{const h=hotels.find(x=>x.id===hid);const perks=(data[hid]||[]).filter(p=>p.elite_tier===tier.key);return<div key={hid} style={{background:"#fff",borderRadius:8,padding:16,border:"1px solid #e2e8f0",minWidth:0}}>
<div style={{fontSize:12,fontWeight:700,color:"#0f172a",fontFamily:FF,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h?.name||"Select"}</div>
{perks.length?perks.map((p,i)=><div key={i} style={{display:"flex",gap:6,padding:"5px 0",borderBottom:"1px solid #f8fafc",fontSize:13,fontFamily:FF,color:"#475569"}}><span>{gc(p.category).icon}</span><span>{p.summary}</span></div>):<div style={{color:"#cbd5e1",fontSize:12,fontFamily:FF}}>No perks</div>}</div>})}</div></div>})}</div>}

function UserProfile({userId,onClose}){const[p,sp]=useState(null),[r,sr]=useState([]),[ld,sl]=useState(true),[err,ser]=useState("");
useEffect(()=>{(async()=>{try{const{data:pd,error:e1}=await supabase.from("user_profiles").select("*").eq("user_id",userId).single();if(e1)throw e1;sp(pd);const{data:rd}=await supabase.from("perk_reports").select("*,hotels(name,brand)").eq("user_id",userId).order("created_at",{ascending:false}).limit(20);sr(rd||[])}catch(e){ser("Failed to load profile.")}sl(false)})()},[userId]);
if(ld)return<div style={{textAlign:"center",padding:60,color:"#94a3b8"}}><Skeleton w={200} h={20}/></div>;
if(err)return<div style={{textAlign:"center",padding:60}}><p style={{color:"#dc2626",fontFamily:FF}}>{err}</p><button onClick={onClose} style={{...BT(),marginTop:12}}>← Back</button></div>;
if(!p)return<div style={{textAlign:"center",padding:60,color:"#94a3b8"}}>Profile not found.</div>;
return<div><button onClick={onClose} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button>
<div style={{background:"#0f172a",borderRadius:12,padding:36,marginBottom:28,color:"#fff",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
<div style={{width:60,height:60,borderRadius:"50%",background:"#1e293b",color:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,fontFamily:FD}}>{p.display_name?.charAt(0).toUpperCase()}</div>
<div><h1 style={{fontSize:26,fontWeight:700,margin:"0 0 4px",fontFamily:FD}}>{p.display_name}</h1><p style={{fontSize:13,color:"#94a3b8",margin:0,fontFamily:FF}}>{be(p.badge)} {p.badge} · Since {new Date(p.member_since).toLocaleDateString("en-US",{year:"numeric",month:"short"})}</p></div></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>{[{n:p.total_reports,l:"Reports"},{n:p.hotels_covered,l:"Hotels"},{n:p.categories_reported,l:"Categories"}].map(x=><div key={x.l} style={{background:"#fff",borderRadius:8,padding:18,border:"1px solid #e2e8f0",textAlign:"center"}}><div style={{fontSize:28,fontWeight:700,color:"#0f172a",fontFamily:FD}}>{x.n}</div><div style={{fontSize:10,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:0.8}}>{x.l}</div></div>)}</div>
<h3 style={{fontSize:15,fontWeight:700,color:"#0f172a",fontFamily:FF,marginBottom:12}}>Recent Reports</h3>
{r.map((x,i)=><div key={i} style={{display:"flex",gap:10,padding:"12px 0",borderBottom:"1px solid #f1f5f9"}}><span style={{fontSize:16}}>{gc(x.category).icon}</span><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#0f172a",fontFamily:FF}}>{x.hotels?.name}</div><div style={{fontSize:13,color:"#475569",fontFamily:FF}}>{x.description}</div><div style={{fontSize:11,color:"#94a3b8",fontFamily:FF,marginTop:3}}>{gt(x.elite_tier).label} · {ta(x.created_at)}</div></div></div>)}
{!r.length&&<div style={{padding:20,color:"#94a3b8",fontSize:13,fontFamily:FF}}>No reports yet.</div>}</div>}

function Leaderboard({onClose,onProfile}){const[ls,sl]=useState([]),[ld,sld]=useState(true);useEffect(()=>{(async()=>{const{data}=await supabase.from("leaderboard").select("*").limit(25);sl(data||[]);sld(false)})()},[]);
return<div><button onClick={onClose} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button>
<div style={{background:"#0f172a",borderRadius:12,padding:36,marginBottom:28,color:"#fff"}}><p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:FF}}>Community</p><h1 style={{fontSize:34,fontWeight:700,margin:0,fontFamily:FD}}>Leaderboard</h1><p style={{fontSize:14,color:"#94a3b8",fontFamily:FF,marginTop:8}}>Top contributors making hotel intel better.</p></div>
<div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>{[{b:"Snob Supreme",n:"50+"},{b:"Elite Reporter",n:"25+"},{b:"Perk Scout",n:"10+"},{b:"Contributor",n:"5+"},{b:"Newcomer",n:"< 5"}].map(x=><div key={x.b} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:6,padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}><span>{be(x.b)}</span><div><div style={{fontSize:11,fontWeight:700,color:"#0f172a",fontFamily:FF}}>{x.b}</div><div style={{fontSize:10,color:"#94a3b8",fontFamily:FF}}>{x.n}</div></div></div>)}</div>
{ld?<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading...</div>:<div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",overflow:"hidden"}}>
<div style={{display:"grid",gridTemplateColumns:"50px 1fr 70px 70px",padding:"12px 20px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:10,fontWeight:700,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:1}}><span>#</span><span>Contributor</span><span style={{textAlign:"center"}}>Reports</span><span style={{textAlign:"center"}}>Hotels</span></div>
{ls.map((l,i)=><div key={l.user_id||i} onClick={()=>l.user_id&&onProfile(l.user_id)} tabIndex={l.user_id?0:undefined} role={l.user_id?"button":undefined} onKeyDown={e=>e.key==="Enter"&&l.user_id&&onProfile(l.user_id)} style={{display:"grid",gridTemplateColumns:"50px 1fr 70px 70px",padding:"12px 20px",borderBottom:"1px solid #f1f5f9",alignItems:"center",cursor:l.user_id?"pointer":"default",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
<span style={{fontSize:16,fontWeight:700,color:i<3?"#0f172a":"#cbd5e1",fontFamily:FF}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</span>
<div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:30,height:30,borderRadius:"50%",background:i<3?"#0f172a":"#e2e8f0",color:i<3?"#fff":"#64748b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,fontFamily:FF}}>{l.display_name?.charAt(0).toUpperCase()||"?"}</div><div><div style={{fontSize:13,fontWeight:600,color:"#0f172a",fontFamily:FF}}>{l.display_name}</div><div style={{fontSize:10,color:"#94a3b8",fontFamily:FF}}>{be(l.badge)} {l.badge}</div></div></div>
<div style={{textAlign:"center",fontSize:16,fontWeight:700,color:"#0f172a",fontFamily:FF}}>{l.total_reports}</div><div style={{textAlign:"center",fontSize:13,color:"#64748b",fontFamily:FF}}>{l.hotels_covered}</div></div>)}
{!ls.length&&<div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>No contributions yet. Be the first!</div>}</div>}</div>}

function HotelDetail({hotel,user,onBack,onNeedAuth}){const[sf,ssf]=useState(false),[perks,sp]=useState([]),[cmts,sc]=useState([]),[ld,sl]=useState(true),[err,ser]=useState("");
const[sT,ssT]=useState(""),[sDate,ssDate]=useState(""),[sub,sSub]=useState(false);
const[sBT,ssBT]=useState(""),[sPC,ssPC]=useState("");
const emptyEntry=()=>({category:"",description:"",upgrade_type:"",category_details:{}});
const[entries,setEntries]=useState([emptyEntry()]);
const updateEntry=(i,field,val)=>{const ne=[...entries];ne[i]={...ne[i],[field]:val};setEntries(ne)};
const addEntry=()=>setEntries([...entries,emptyEntry()]);
const removeEntry=i=>{if(entries.length<=1)return;setEntries(entries.filter((_,j)=>j!==i))};
const[cT,scT]=useState(""),[cX,scX]=useState("");
const[editId,setEditId]=useState(null);const lastSub=useRef(0);
useTitle(`${hotel.name} — Elite Perk Benefits | PerkSnob`);
const load=useCallback(async()=>{sl(true);ser("");try{const{data:pd,error:e1}=await supabase.from("perk_reports").select("*").eq("hotel_id",hotel.id).order("created_at",{ascending:false});if(e1)throw e1;
const pm={};(pd||[]).forEach(p=>{const k=`${p.elite_tier}|${p.category}|${p.description}`;if(!pm[k])pm[k]={...p,total_confirmations:1,summary:p.description,latest_stay:p.stay_date};else{pm[k].total_confirmations+=1;if(p.stay_date&&(!pm[k].latest_stay||p.stay_date>pm[k].latest_stay))pm[k].latest_stay=p.stay_date}});sp(Object.values(pm));
const{data:cd}=await supabase.from("comments").select("*").eq("hotel_id",hotel.id).order("created_at",{ascending:false});sc(cd||[])}catch(e){ser("Failed to load hotel data. Please try again.");console.error(e)}sl(false)},[hotel.id]);useEffect(()=>{load()},[load]);
const resetForm=()=>{ssT("");ssDate("");ssBT("");ssPC("");setEntries([emptyEntry()]);setEditId(null);ssf(false)};
const subPerk=async()=>{if(!user){onNeedAuth();return}
const valid=entries.filter(e=>e.category&&e.description.trim());
if(!sT){showToast("Please select your tier","error");return}
if(!valid.length){showToast("Please add at least one category with a description","error");return}
for(const e of valid){if(e.description.trim().length>MAX_DESC){showToast(`Description must be ${MAX_DESC} characters or less`,"error");return}}
const now=Date.now();if(!editId&&now-lastSub.current<10000){showToast("Please wait a few seconds between submissions","error");return}
sSub(true);
if(editId){const e=valid[0];const row={hotel_id:hotel.id,user_id:user.id,display_name:dname(user),elite_tier:sT,category:e.category,description:e.description.trim()};if(sDate)row.stay_date=sDate+"-01";if(sBT)row.booking_type=sBT;if(sPC.trim())row.promo_code=sPC.trim();if(e.category==="upgrade"&&e.upgrade_type)row.upgrade_type=e.upgrade_type;
const cd=Object.fromEntries(Object.entries(e.category_details||{}).filter(([_,v])=>v!==undefined&&v!==""&&v!==0));if(Object.keys(cd).length)row.category_details=cd;
const{error}=await supabase.from("perk_reports").update(row).eq("id",editId);if(error){showToast("Error: "+error.message,"error");sSub(false);return}showToast("Perk updated!")}
else{const rows=valid.map(e=>{const row={hotel_id:hotel.id,user_id:user.id,display_name:dname(user),elite_tier:sT,category:e.category,description:e.description.trim()};if(sDate)row.stay_date=sDate+"-01";if(sBT)row.booking_type=sBT;if(sPC.trim())row.promo_code=sPC.trim();if(e.category==="upgrade"&&e.upgrade_type)row.upgrade_type=e.upgrade_type;
const cd=Object.fromEntries(Object.entries(e.category_details||{}).filter(([_,v])=>v!==undefined&&v!==""&&v!==0));if(Object.keys(cd).length)row.category_details=cd;return row});
const{error}=await supabase.from("perk_reports").insert(rows);if(error){showToast("Error: "+error.message,"error");sSub(false);return}lastSub.current=now;showToast(`${rows.length} perk${rows.length>1?"s":""} submitted! Thanks for contributing.`)}
resetForm();sSub(false);load()};
const startEdit=p=>{setEditId(p.id);ssT(p.elite_tier);setEntries([{category:p.category,description:p.description,upgrade_type:p.upgrade_type||"",category_details:p.category_details||{}}]);ssDate(p.stay_date?p.stay_date.slice(0,7):"");ssBT(p.booking_type||"");ssPC(p.promo_code||"");ssf(true);window.scrollTo({top:0,behavior:"smooth"})};
const deletePerk=async p=>{const{error}=await supabase.from("perk_reports").delete().eq("id",p.id);if(error){showToast("Error deleting: "+error.message,"error");return}showToast("Perk deleted.");load()};
const subCmt=async()=>{if(!user){onNeedAuth();return}if(!cT||!cX.trim())return;if(cX.trim().length>MAX_TIP){showToast(`Tip must be ${MAX_TIP} characters or less`,"error");return}const{error}=await supabase.from("comments").insert({hotel_id:hotel.id,user_id:user.id,display_name:dname(user),elite_tier:cT,text:cX.trim()});if(error){showToast("Error: "+error.message,"error");return}scT("");scX("");showToast("Tip posted!");load()};
const up=async p=>{if(!user){onNeedAuth();return}await supabase.from("perk_reports").insert({hotel_id:hotel.id,user_id:user.id,display_name:dname(user),elite_tier:p.elite_tier,category:p.category,description:p.description,booking_type:p.booking_type,promo_code:p.promo_code,upgrade_type:p.upgrade_type,category_details:p.category_details});showToast("Confirmation added!");load()};
const down=async(p,reason)=>{if(!user){onNeedAuth();return}await supabase.from("downvotes").insert({perk_report_id:p.id,user_id:user.id,reason}).catch(()=>{});showToast("Dispute recorded.");load()};
const byTier={};const tierUp={ambassador:["ambassador","titanium","platinum"],titanium:["titanium","platinum"],platinum:["platinum"]};TIERS.forEach(t=>{const show=tierUp[t.key]||[t.key];byTier[t.key]=perks.filter(p=>show.includes(p.elite_tier))});const tr=perks.reduce((a,p)=>a+p.total_confirmations,0),catC=new Set(perks.map(p=>p.category)).size,score=pscore(tr,catC);
if(err)return<div style={{textAlign:"center",padding:60}}><p style={{color:"#dc2626",fontFamily:FF,marginBottom:12}}>{err}</p><button onClick={load} style={BT()}>Retry</button><button onClick={onBack} style={{...BT("#e2e8f0","#64748b"),marginLeft:8}}>← Back</button></div>;
return<div><button onClick={onBack} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button>
<div style={{background:"#0f172a",borderRadius:12,padding:"36px 32px",marginBottom:28,color:"#fff"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
<div><p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:FF,margin:"0 0 8px"}}>{hotel.brand}</p><h1 style={{fontSize:30,fontWeight:700,margin:"0 0 6px",fontFamily:FD,lineHeight:1.2}}>{hotel.name}</h1><p style={{fontSize:14,color:"#94a3b8",fontFamily:FF,margin:0}}>{hotel.location}</p></div>
{tr>0&&<ScoreBadge score={score}/>}</div>
<div style={{display:"flex",gap:14,marginTop:24,flexWrap:"wrap"}}>{TIERS.map(t=><div key={t.key} style={{background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"12px 18px",border:"1px solid rgba(255,255,255,0.08)"}}><div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontFamily:FF}}>{t.label}</div><div style={{fontSize:22,fontWeight:700,color:"#fff",fontFamily:FD}}>{byTier[t.key]?.length||0} <span style={{fontSize:11,fontWeight:400,color:"#94a3b8",fontFamily:FF}}>perks</span></div></div>)}</div></div>
<div style={{display:"flex",gap:8,marginBottom:24,alignItems:"center",flexWrap:"wrap"}}>
<span style={{fontSize:15,fontWeight:700,color:"#0f172a",fontFamily:FF}}>Perks Overview</span>
<button onClick={()=>{if(!user){onNeedAuth();return}if(sf){resetForm()}else{ssf(true)}}} style={{marginLeft:"auto",background:"#fff",color:"#0f172a",border:"2px solid #0f172a",borderRadius:6,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FF}}>+ Add Perk</button></div>
{sf&&<div style={{background:"#f8fafc",borderRadius:10,padding:28,border:"1px solid #e2e8f0",marginBottom:24}}>
<h3 style={{fontSize:20,fontWeight:700,color:"#0f172a",fontFamily:FD,marginBottom:20}}>{editId?"Edit Perk":"Report Your Stay"}</h3>
<div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}><div style={{flex:"1 1 160px"}}><label style={LS}>Your Tier</label><select value={sT} onChange={e=>ssT(e.target.value)} style={IS}><option value="">Select...</option>{TIERS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
<div style={{flex:"1 1 140px"}}><label style={LS}>When did you stay?</label><input type="month" value={sDate} onChange={e=>ssDate(e.target.value)} style={IS}/></div>
<div style={{flex:"1 1 180px"}}><label style={LS}>Booking Type <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label><select value={sBT} onChange={e=>ssBT(e.target.value)} style={IS}><option value="">Select...</option>{BOOKING_TYPES.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
<div style={{flex:"1 1 180px"}}><label style={LS}>Promo/Corp Code <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label><input value={sPC} onChange={e=>ssPC(e.target.value.slice(0,30))} placeholder="e.g. MMP" style={IS} maxLength={30}/></div></div>
{(sBT==="Employee (MMP)"||sBT==="Corporate"||sPC.trim())&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,padding:"8px 12px",background:"#fefce8",borderRadius:6,border:"1px solid #fef08a"}}><span style={{fontSize:13}}>⚠️</span><span style={{fontSize:11,color:"#854d0e",fontFamily:FF}}>Perks received with promo/corporate/employee rates may differ from standard elite benefits.</span></div>}
{entries.map((entry,i)=><div key={i} style={{background:"#fff",borderRadius:8,padding:20,border:"1px solid #e2e8f0",marginBottom:12,position:"relative"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
<span style={{fontSize:13,fontWeight:700,color:"#0f172a",fontFamily:FF}}>Perk {entries.length>1?`#${i+1}`:""}</span>
{entries.length>1&&<button onClick={()=>removeEntry(i)} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:18,fontFamily:FF,padding:0,lineHeight:1}} aria-label="Remove this perk">×</button>}</div>
<div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:12}}>
<div style={{flex:"1 1 180px"}}><label style={LS}>Category</label><select value={entry.category} onChange={e=>{updateEntry(i,"category",e.target.value);updateEntry(i,"category_details",{})}} style={IS}><option value="">Select...</option>{CATS.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div></div>
{entry.category==="upgrade"&&<div style={{marginBottom:12}}><label style={LS}>Upgrade Type</label><select value={entry.upgrade_type||""} onChange={e=>updateEntry(i,"upgrade_type",e.target.value)} style={IS}><option value="">Select type...</option>{UPGRADE_TYPES.map(u=><option key={u} value={u}>{u}</option>)}</select></div>}
{entry.category&&<CategoryDetailFields category={entry.category} details={entry.category_details||{}} onChange={cd=>updateEntry(i,"category_details",cd)}/>}
<div><label style={LS}>Describe the perk <CharCount val={entry.description} max={MAX_DESC}/></label><textarea value={entry.description} onChange={e=>updateEntry(i,"description",e.target.value.slice(0,MAX_DESC))} placeholder="e.g., Full hot buffet at the main restaurant, free for all Platinum+" style={{...IS,minHeight:70,resize:"vertical"}} maxLength={MAX_DESC}/></div>
</div>)}
{!editId&&<button onClick={addEntry} style={{background:"#fff",color:"#0f172a",border:"2px dashed #e2e8f0",borderRadius:8,padding:"12px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FF,width:"100%",marginBottom:16,transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#0f172a"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>+ Add another category</button>}
<div style={{display:"flex",gap:8}}><button onClick={subPerk} disabled={sub} style={{...BT(),opacity:sub?0.5:1}}>{editId?"Save Changes":`Submit ${entries.filter(e=>e.category&&e.description.trim()).length||""} Perk${entries.filter(e=>e.category&&e.description.trim()).length!==1?"s":""}`}</button><button onClick={resetForm} style={BT("#e2e8f0","#64748b")}>{editId?"Cancel Edit":"Cancel"}</button></div></div>}
{ld?<div style={{padding:20}}><Skeleton h={200} r={8}/><div style={{height:12}}/><Skeleton h={150} r={8}/><div style={{height:12}}/><Skeleton h={150} r={8}/></div>:
<div className="ps-detail-layout" style={{display:"flex",gap:24,alignItems:"flex-start"}}>
<div style={{flex:"1 1 0",minWidth:0}}>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,padding:"10px 14px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}><span style={{fontSize:14,flexShrink:0}}>ℹ️</span><span style={{fontSize:12,color:"#64748b",fontFamily:FF,lineHeight:1.5}}>Perks cascade upward by tier. For example, Platinum perks also appear under Titanium and Ambassador, since higher tiers receive all lower-tier benefits.</span></div>
{TIERS.map(t=><TierSection key={t.key} tier={t.key} perks={byTier[t.key]} user={user} onUp={up} onDown={down} onEdit={startEdit} onDelete={deletePerk}/>)}
</div>
<div className="ps-tips-sidebar" style={{flex:"0 0 300px",position:"sticky",top:20}}>
<div style={{background:"#fff",borderRadius:10,padding:"0 20px 20px",border:"1px solid #e2e8f0"}}>
<div style={{fontSize:14,fontWeight:700,color:"#0f172a",fontFamily:FF,padding:"18px 0 10px",borderBottom:"1px solid #f1f5f9",marginBottom:4}}>Guest Tips {cmts.length>0&&<span style={{fontSize:11,fontWeight:400,color:"#94a3b8"}}>({cmts.length})</span>}</div>
{cmts.map((c,i)=>{const t=gt(c.elite_tier),date=new Date(c.created_at).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});return<div key={c.id||i} style={{padding:"12px 0",borderBottom:"1px solid #f1f5f9"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}><div style={{width:22,height:22,borderRadius:"50%",background:t.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,fontFamily:FF}}>{c.display_name.charAt(0).toUpperCase()}</div><span style={{fontSize:12,fontWeight:600,color:"#0f172a",fontFamily:FF}}>{c.display_name}</span><span style={{fontSize:8,color:t.color,fontWeight:700,fontFamily:FF,background:"#f1f5f9",padding:"1px 5px",borderRadius:3,textTransform:"uppercase"}}>{t.label}</span><span style={{fontSize:10,color:"#94a3b8",fontFamily:FF,marginLeft:"auto"}}>{date}</span></div><div style={{fontSize:12,color:"#475569",lineHeight:1.5,fontFamily:FF}}>{c.text}</div></div>})}
{!cmts.length&&<div style={{padding:20,textAlign:"center",color:"#94a3b8",fontSize:12}}>No tips yet. Share your experience!</div>}
<div style={{marginTop:14,padding:14,background:"#f8fafc",borderRadius:8,border:"1px solid #f1f5f9"}}><p style={{fontSize:12,fontWeight:600,color:"#334155",fontFamily:FF,marginBottom:10,marginTop:0}}>Share a tip <CharCount val={cX} max={MAX_TIP}/></p>
<select value={cT} onChange={e=>scT(e.target.value)} style={{...IS,fontSize:12,padding:"8px 10px",marginBottom:8}}><option value="">Your tier...</option>{TIERS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select>
<textarea value={cX} onChange={e=>scX(e.target.value.slice(0,MAX_TIP))} placeholder="Share a tip..." style={{...IS,fontSize:12,padding:"8px 10px",minHeight:50,resize:"vertical",marginBottom:8}} maxLength={MAX_TIP}/>
<button onClick={subCmt} style={{...BT(),padding:"7px 16px",fontSize:12}}>Post Tip</button></div>
</div></div></div>}</div>}

function HotelCard({hotel,perkCounts,score,onClick}){const c=perkCounts[hotel.id]||0;return<div onClick={onClick} tabIndex={0} role="button" aria-label={`${hotel.name} — ${c} perk reports`} onKeyDown={e=>e.key==="Enter"&&onClick()} style={{background:"#fff",borderRadius:10,padding:"20px 22px",border:"1px solid #e2e8f0",cursor:"pointer",transition:"all 0.15s",display:"flex",flexDirection:"column",justifyContent:"space-between"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#0f172a";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(15,23,42,0.08)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}>
<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}><span style={{fontSize:9,fontWeight:700,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:1.5}}>{hotel.brand}</span>{score>0&&<span style={{fontSize:13,fontWeight:700,color:score>=70?"#059669":score>=40?"#d97706":"#dc2626",fontFamily:FF}}>{score}</span>}</div>
<div style={{fontSize:15,fontWeight:700,color:"#0f172a",fontFamily:FF,marginBottom:3,lineHeight:1.3}}>{hotel.name}</div><div style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>{hotel.location}</div></div>
<div style={{fontSize:12,color:"#64748b",fontFamily:FF,display:"flex",alignItems:"center",gap:4,marginTop:14,paddingTop:12,borderTop:"1px solid #f1f5f9"}}><span style={{color:"#0f172a",fontWeight:700,fontSize:15}}>{c}</span> perk reports</div></div>}

function AddHotelModal({onClose,user,onNeedAuth,onAdded,existingHotels}){const[name,sn]=useState(""),[brand,sb]=useState(""),[loc,sloc]=useState(""),[sub,ss2]=useState(false),[sim,ssim]=useState([]);
const ck=v=>{sn(v);if(v.trim().length<3){ssim([]);return}const w=v.toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/).filter(x=>x.length>2);if(!w.length){ssim([]);return}ssim(existingHotels.filter(h=>{const n=h.name.toLowerCase().replace(/[^a-z0-9\s]/g,"");return w.some(x=>n.includes(x))}).slice(0,5))};
const go=async()=>{if(!user){onNeedAuth();onClose();return}if(!name.trim()||!brand||!loc.trim())return;ss2(true);const slug=mkSlug(name);const{error}=await supabase.from("hotels").insert({name:name.trim(),brand,location:loc.trim(),slug,status:"pending",submitted_by:user.id});ss2(false);if(error){showToast("Error: "+error.message,"error");return}showToast("Hotel submitted for review!");onAdded();onClose()};
return<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}} onClick={onClose}><div style={{background:"#fff",borderRadius:12,padding:40,maxWidth:450,width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()} role="dialog" aria-label="Add a hotel">
<h2 style={{fontSize:24,fontFamily:FD,fontWeight:700,marginBottom:4,color:"#0f172a"}}>Add a Hotel</h2><p style={{fontSize:13,color:"#94a3b8",marginBottom:24,fontFamily:FF}}>Can't find your property? Submit it for review.</p>
<div style={{marginBottom:14}}><label style={LS}>Hotel Name</label><input value={name} onChange={e=>ck(e.target.value)} placeholder="The Westin Kierland Resort & Spa" style={IS} autoFocus/>
{sim.length>0&&<div style={{marginTop:10,border:"2px solid #0f172a",borderRadius:8,padding:14}}><p style={{fontSize:12,fontWeight:700,marginBottom:10,fontFamily:FF,margin:"0 0 10px"}}>Similar hotels exist:</p>{sim.map(h=><div key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f1f5f9"}}><div><div style={{fontSize:13,fontWeight:600,fontFamily:FF}}>{h.name}</div><div style={{fontSize:11,color:"#94a3b8",fontFamily:FF}}>{h.brand} · {h.location}</div></div><button onClick={onClose} style={{...BT(),padding:"4px 12px",fontSize:11}}>View</button></div>)}<p style={{fontSize:11,color:"#94a3b8",marginTop:10,fontFamily:FF,marginBottom:0}}>If none match, continue below.</p></div>}</div>
<div style={{marginBottom:14}}><label style={LS}>Brand</label><select value={brand} onChange={e=>sb(e.target.value)} style={IS}><option value="">Select...</option>{BRANDS.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
<div style={{marginBottom:28}}><label style={LS}>Location</label><input value={loc} onChange={e=>sloc(e.target.value)} placeholder="Scottsdale, AZ" style={IS}/></div>
<div style={{display:"flex",gap:8}}><button onClick={go} disabled={sub} style={{...BT(),padding:"12px 28px",opacity:sub?0.5:1}}>Add Hotel</button><button onClick={onClose} style={BT("#f1f5f9","#64748b")}>Cancel</button></div></div></div>}

export default function App(){const[path,nav]=usePath();const[user,su]=useState(null),[hotels,sh]=useState([]),[pc,spc]=useState({}),[scores,ssc]=useState({}),[search,ss]=useState(""),[bf,sbf]=useState(""),[showAuth,ssa]=useState(false),[showAdd,ssad]=useState(false),[profId,spid]=useState(null),[ld,sld]=useState(true),[ml,sml]=useState(!!window.google),[showAll,setSA]=useState(false);

const hotelSlug=path.startsWith("/hotel/")?path.split("/hotel/")[1]:null;
const sel=hotelSlug?hotels.find(h=>(h.slug||mkSlug(h.name))===hotelSlug):null;
const page=path==="/leaderboard"?"leaderboard":path==="/map"?"map":path==="/search"?"search":path==="/compare"?"compare":path.startsWith("/profile/")?"profile":hotelSlug?"hotel":"home";

const pageTitle=page==="hotel"&&sel?`${sel.name} — Elite Perk Benefits | PerkSnob`:page==="leaderboard"?"Leaderboard | PerkSnob":page==="map"?"Map View | PerkSnob":page==="search"?"Search Perks | PerkSnob":page==="compare"?"Compare Hotels | PerkSnob":"PerkSnob — Marriott Elite Benefits, Crowdsourced";
useTitle(pageTitle);

const loadH=async()=>{sld(true);try{const{data,error}=await supabase.from("hotels").select("*").order("name");if(error)throw error;sh(data||[]);const{data:rp}=await supabase.from("perk_reports").select("hotel_id,category");const c={},cats={};(rp||[]).forEach(r=>{c[r.hotel_id]=(c[r.hotel_id]||0)+1;if(!cats[r.hotel_id])cats[r.hotel_id]=new Set();cats[r.hotel_id].add(r.category)});spc(c);const sc={};Object.keys(c).forEach(id=>{sc[id]=pscore(c[id],cats[id]?.size||0)});ssc(sc)}catch(e){console.error("Failed to load hotels:",e)}sld(false)};
useEffect(()=>{if(window.google){sml(true);return}const s=document.createElement("script");s.src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD2TOWNd9KNVyavscRXX1xsKV0LM6Xf8NQ&libraries=places";s.async=true;s.onload=()=>sml(true);document.head.appendChild(s)},[]);
useEffect(()=>{supabase.auth.getUser().then(({data})=>{if(data?.user)su(data.user)});supabase.auth.onAuthStateChange((_,s)=>{su(s?.user||null)});loadH()},[]);
useEffect(()=>{if(path.startsWith("/profile/")){spid(path.split("/profile/")[1])}},[path]);
const goHome=()=>{nav("/")};const viewProf=id=>{nav("/profile/"+id)};
const openHotel=h=>{const slug=h.slug||mkSlug(h.name);nav("/hotel/"+slug)};
const filt=hotels.filter(h=>{if(!search&&!bf)return!bf||h.brand===bf;const words=search.toLowerCase().split(/\s+/).filter(w=>w.length>0);const hay=[h.name,h.location,h.region||"",h.brand].join(" ").toLowerCase();const ms=!search||words.every(w=>hay.includes(w));const mb=!bf||h.brand===bf;return ms&&mb});
const sortedFilt=[...filt].sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)||(pc[b.id]||0)-(pc[a.id]||0)||a.name.localeCompare(b.name));
const ub=[...new Set(hotels.map(h=>h.brand))].sort();
const navBtn=(l,p)=><button onClick={()=>{nav(p)}} style={{background:page===p.slice(1)?"rgba(255,255,255,0.12)":"transparent",color:page===p.slice(1)?"#fff":"#94a3b8",border:"none",padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FF,borderRadius:6,transition:"all 0.15s"}}>{l}</button>;
const isHome=page==="home";
return<div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:FF,display:"flex",flexDirection:"column"}}>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>{`::selection{background:#0f172a;color:#fff}input::placeholder,textarea::placeholder{color:#94a3b8}body{margin:0}
*:focus-visible{outline:2px solid #2563eb;outline-offset:2px;border-radius:4px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:768px){.ps-header{flex-direction:column!important;align-items:flex-start!important}.ps-nav{order:1;width:100%;justify-content:flex-start!important;margin-left:-16px}.ps-auth{order:2;width:100%;margin-top:2px;margin-left:-2px}.ps-detail-layout{flex-direction:column!important}.ps-tips-sidebar{flex:1 1 auto!important;position:static!important;width:100%!important;max-width:100%!important}}`}</style>
<Toaster/>
{showAuth&&<AuthModal onClose={()=>ssa(false)} onAuth={()=>supabase.auth.getUser().then(({data})=>su(data?.user))}/>}
{showAdd&&<AddHotelModal onClose={()=>ssad(false)} user={user} onNeedAuth={()=>ssa(true)} onAdded={loadH} existingHotels={hotels}/>}
<div style={{background:"#0f172a",padding:isHome?"0 0 56px":"0 0 20px"}}><div style={{maxWidth:1100,margin:"0 auto",padding:"16px 28px 0"}}>
<div className="ps-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
<div onClick={goHome} style={{cursor:"pointer",display:"flex",alignItems:"baseline",gap:1}} role="link" aria-label="PerkSnob home"><span style={{fontSize:36,fontWeight:700,color:"#fff",fontFamily:FD}}>Perk</span><span style={{fontSize:36,fontWeight:700,color:"#94a3b8",fontFamily:FD}}>Snob</span></div>
<nav className="ps-nav" style={{display:"flex",alignItems:"center",gap:2}} aria-label="Main navigation">{navBtn("Map","/map")}{navBtn("Search","/search")}{navBtn("Compare","/compare")}{navBtn("Leaderboard","/leaderboard")}</nav>
<div className="ps-auth" style={{display:"flex",gap:8,alignItems:"center"}}>
{user?<><span style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>{dname(user)}</span><button onClick={async()=>{await supabase.auth.signOut();su(null);showToast("Signed out.")}} style={{background:"transparent",color:"#94a3b8",border:"1px solid #475569",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FF}}>Logout</button></>:<button onClick={()=>ssa(true)} style={{background:"transparent",color:"#94a3b8",border:"1px solid #475569",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FF}}>Sign In</button>}
<button onClick={()=>user?ssad(true):ssa(true)} style={{background:"#fff",color:"#0f172a",border:"none",borderRadius:6,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FF}}>+ Add Hotel</button></div></div>
{isHome&&<div style={{paddingTop:24,paddingBottom:8}}><h1 style={{fontSize:52,fontWeight:700,color:"#fff",margin:"0 0 14px",lineHeight:1.02,maxWidth:520,fontFamily:FD}}>Titanium, Platinum, Ambassador Elite Perks &amp; Benefits</h1>
<p style={{fontSize:16,color:"#94a3b8",margin:"0 0 36px",maxWidth:460,lineHeight:1.6,fontFamily:FF}}>Real Marriott Bonvoy elite benefits reported by real guests. Know what you're getting before you book.</p>
<div style={{display:"flex",gap:10,flexWrap:"wrap"}}><div style={{flex:"1 1 320px",position:"relative"}}><input type="text" value={search} onChange={e=>ss(e.target.value)} placeholder="Search hotels or destinations..." aria-label="Search hotels" style={{width:"100%",padding:"14px 40px 14px 18px",borderRadius:8,border:"1px solid #1e293b",background:"#1e293b",color:"#e2e8f0",fontSize:14,fontFamily:FF,outline:"none",boxSizing:"border-box"}}/>
{search&&<button onClick={()=>ss("")} aria-label="Clear search" style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#94a3b8",fontSize:18,cursor:"pointer",padding:0,lineHeight:1,fontFamily:FF}}>×</button>}</div>
<select value={bf} onChange={e=>sbf(e.target.value)} aria-label="Filter by brand" style={{padding:"14px 42px 14px 18px",borderRadius:8,border:"1px solid #1e293b",background:"#1e293b",color:"#e2e8f0",fontSize:13,fontFamily:FF,outline:"none",cursor:"pointer",minWidth:120,maxWidth:200,WebkitAppearance:"none",MozAppearance:"none",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 18px center"}}><option value="" style={{background:"#fff",color:"#0f172a"}}>All Brands</option>{ub.map(b=><option key={b} value={b} style={{background:"#fff",color:"#0f172a"}}>{b}</option>)}</select></div></div>}</div></div>
<div style={{flex:1,maxWidth:1100,margin:isHome?"-28px auto 0":"16px auto 0",padding:"0 28px 60px",position:"relative",width:"100%"}}>
{page==="leaderboard"?<Leaderboard onClose={goHome} onProfile={viewProf}/>:page==="map"?<>{!ml?<div style={{textAlign:"center",padding:60,color:"#94a3b8"}}>Loading map...</div>:<MapView hotels={filt} perkCounts={pc} onSelect={openHotel}/>}</>:page==="search"?<><button onClick={goHome} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button><PerkSearch user={user} onNeedAuth={()=>ssa(true)}/></>:page==="compare"?<Comparison hotels={hotels} onClose={goHome}/>:page==="profile"&&profId?<UserProfile userId={profId} onClose={goHome}/>:page==="hotel"&&sel?<HotelDetail hotel={sel} user={user} onBack={goHome} onNeedAuth={()=>ssa(true)}/>:page==="hotel"&&hotelSlug&&!ld&&!sel?<div style={{textAlign:"center",padding:60}}><div style={{fontSize:40,marginBottom:12}}>🏨</div><h3 style={{fontSize:20,fontWeight:700,color:"#0f172a",fontFamily:FD,marginBottom:6}}>Hotel not found</h3><p style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>This property may not exist yet.</p><button onClick={goHome} style={BT()}>← Back to all hotels</button></div>:ld?<div style={{padding:"60px 0"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>{Array.from({length:12}).map((_,i)=><CardSkeleton key={i}/>)}</div></div>:<>{(()=>{const isSearching=!!search||!!bf;const scored=sortedFilt.filter(h=>(scores[h.id]||0)>0);const unscored=sortedFilt.filter(h=>!scores[h.id]);const showUnscored=isSearching||showAll;
return<><div style={{marginBottom:14,marginTop:42}}><span style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>{isSearching?`${sortedFilt.length} propert${sortedFilt.length!==1?"ies":"y"}`:`${scored.length} featured propert${scored.length!==1?"ies":"y"}`}</span></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>{(isSearching?sortedFilt:scored).map(h=><HotelCard key={h.id} hotel={h} perkCounts={pc} score={scores[h.id]||0} onClick={()=>openHotel(h)}/>)}</div>
{!isSearching&&unscored.length>0&&!showUnscored&&<div style={{textAlign:"center",marginTop:32}}><div style={{height:1,background:"linear-gradient(to right,transparent,#e2e8f0,transparent)",marginBottom:24}}/>
<p style={{fontSize:13,color:"#94a3b8",fontFamily:FF,marginBottom:12}}>{unscored.length} more propert{unscored.length!==1?"ies":"y"} waiting for reports</p>
<button onClick={()=>setSA(true)} style={{background:"#fff",color:"#0f172a",border:"2px solid #e2e8f0",borderRadius:8,padding:"10px 28px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FF,transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#0f172a"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0"}}>View all properties</button></div>}
{!isSearching&&showUnscored&&unscored.length>0&&<><div style={{height:1,background:"linear-gradient(to right,transparent,#e2e8f0,transparent)",margin:"32px 0 20px"}}/>
<div style={{marginBottom:14}}><span style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>No reports yet — be the first to contribute</span></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>{unscored.map(h=><HotelCard key={h.id} hotel={h} perkCounts={pc} score={0} onClick={()=>openHotel(h)}/>)}</div></>}
{!sortedFilt.length&&<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:40,marginBottom:12}}>🏨</div><h3 style={{fontSize:20,fontWeight:700,color:"#0f172a",fontFamily:FD,marginBottom:6}}>No hotels found</h3><p style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Try a different search or add a new property.</p><button onClick={()=>user?ssad(true):ssa(true)} style={BT()}>+ Add a Hotel</button></div>}</>})()}</>}</div>
<Footer/></div>}
