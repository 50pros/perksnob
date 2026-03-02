import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "./supabaseClient";
const TIERS=[{key:"ambassador",label:"Ambassador Elite",color:"#1a1a1a"},{key:"titanium",label:"Titanium Elite",color:"#6b7280"},{key:"platinum",label:"Platinum Elite",color:"#9ca3af"},{key:"gold",label:"Gold Elite",color:"#d97706"},{key:"silver",label:"Silver Elite",color:"#a3a3a3"}];
const CATS=[{key:"breakfast",icon:"🍳",label:"Breakfast"},{key:"lounge",icon:"🍸",label:"Lounge Access"},{key:"drinks",icon:"☕",label:"Drinks & Coffee"},{key:"upgrade",icon:"⬆️",label:"Room Upgrades"},{key:"gift",icon:"🎁",label:"Welcome Gift"},{key:"late_checkout",icon:"🕐",label:"Late Checkout"},{key:"spa",icon:"💆",label:"Spa & Wellness"},{key:"parking",icon:"🅿️",label:"Parking"},{key:"fnb_credit",icon:"💳",label:"F&B Credit"},{key:"housekeeping",icon:"🧹",label:"Housekeeping"},{key:"bathroom",icon:"🚿",label:"Bathroom"},{key:"wifi",icon:"📶",label:"WiFi & Internet"},{key:"shower",icon:"🚰",label:"Shower & Water Pressure"},{key:"security",icon:"🔒",label:"Room Security"},{key:"pool",icon:"🏊",label:"Pool & Fitness"},{key:"staff_service",icon:"🤝",label:"Staff & Service Quality"},{key:"restaurant",icon:"🍽️",label:"Restaurant & Bar Hours"},{key:"other",icon:"✨",label:"Other"}];
const BRANDS=["The Ritz-Carlton","St. Regis","W Hotels","EDITION","The Luxury Collection","JW Marriott","Westin","Sheraton","Marriott","Autograph Collection","Tribute Portfolio","Design Hotels"];
const BOOKING_TYPES=["Direct (Marriott Bonvoy)","Points","Amex FHR","Virtuoso","STARS","Corporate","Employee (MMF, MMP, etc.)","Credit Card (e.g. AmEx Travel)","3rd Party (e.g. Priceline)","Other"];
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
wifi:[
{key:"speed",label:"Speed quality",type:"select",options:["Excellent (50+ Mbps)","Good (20–50 Mbps)","Acceptable (10–20 Mbps)","Slow (under 10 Mbps)","Unusable"]},
{key:"elite_faster",label:"Elite faster internet?",type:"select",options:["Yes, noticeably faster","Same as regular","Didn't notice a difference"]},
{key:"coverage",label:"Coverage in room",type:"select",options:["Strong throughout","Weak in some spots","Dropped frequently"]},
{key:"ports_blocked",label:"Gaming/VPN ports blocked?",type:"select",options:["No, all open","Yes, some blocked","Didn't test"]}],
shower:[
{key:"pressure",label:"Water pressure",type:"select",options:["Excellent","Good","Weak","Very weak"]},
{key:"shower_type",label:"Shower type",type:"select",options:["Fixed rainfall","Handheld","Both fixed & handheld","Tub/shower combo"]},
{key:"hot_water",label:"Hot water",type:"select",options:["Consistent","Takes a while","Inconsistent","Not hot enough"]}],
security:[
{key:"deadbolt",label:"Deadbolt on door?",type:"select",options:["Yes","No"]},
{key:"chain_latch",label:"Chain/latch lock?",type:"select",options:["Yes","No"]},
{key:"peephole",label:"Peephole?",type:"select",options:["Yes","No"]},
{key:"safe",label:"In-room safe?",type:"select",options:["Yes, electronic","Yes, key","No"]},
{key:"security_detail",label:"Other notes",type:"text",placeholder:"e.g. Well-lit hallways, security camera in lobby"}],
pool:[
{key:"pool_open",label:"Pool open?",type:"select",options:["Yes","No, closed","Seasonal","Under renovation"]},
{key:"pool_type",label:"Type",type:"select",options:["Indoor","Outdoor","Both","Rooftop"]},
{key:"pool_quality",label:"Quality",type:"rating",max:5},
{key:"gym_quality",label:"Gym/fitness quality",type:"rating",max:5},
{key:"gym_hours",label:"Gym hours",type:"text",placeholder:"e.g. 24/7, 6am–10pm"}],
staff_service:[
{key:"honors_status",label:"Did staff honor your elite status?",type:"select",options:["Yes, proactively recognized","Yes, when mentioned","No, seemed unaware","Indifferent"]},
{key:"checkin_experience",label:"Check-in experience",type:"select",options:["Excellent","Good","Average","Poor"]},
{key:"app_requests",label:"Did they honor app messages/requests?",type:"select",options:["Yes, promptly","Partially","Ignored","Didn't submit any"]},
{key:"housekeeping_dnd",label:"Respected DND sign?",type:"select",options:["Yes","No, knocked anyway","No, entered room"]},
{key:"overall_service",label:"Overall service quality",type:"rating",max:5}],
restaurant:[
{key:"hours_accurate",label:"Are posted hours accurate?",type:"select",options:["Yes","No, closes early sometimes","No, random closures","Reduced from advertised"]},
{key:"days_closed",label:"Closed any days?",type:"text",placeholder:"e.g. Closed Sundays & Mondays"},
{key:"room_service",label:"Room service available?",type:"select",options:["Yes, full menu","Yes, limited menu","No room service"]},
{key:"room_service_quality",label:"Room service quality",type:"rating",max:5,showIf:d=>d.room_service?.startsWith("Yes")},
{key:"restaurant_detail",label:"Notes",type:"text",placeholder:"e.g. Bar closes at 10pm despite advertising midnight"}],
other:[]
};
const MAX_DESC=500,MAX_NAME=30,MAX_TIP=300,MAX_HOTEL_REQUEST_NOTES=300;
const gc=k=>CATS.find(c=>c.key===k)||CATS[CATS.length-1],gt=k=>TIERS.find(t=>t.key===k)||TIERS[TIERS.length-1];
const cc=c=>c==="high"?"#1a1a1a":c==="medium"?"#6b7280":"#9ca3af",cl=c=>c==="high"?"Well established":c==="medium"?"Frequently reported":"Few reports",cv=n=>n>=8?"high":n>=4?"medium":"low";
const be=b=>b==="Snob Supreme"?"👑":b==="Elite Reporter"?"⭐":b==="Perk Scout"?"🔍":b==="Contributor"?"✍️":"🆕";
const ta=d=>{const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return"just now";if(s<3600)return Math.floor(s/60)+"m ago";if(s<86400)return Math.floor(s/3600)+"h ago";if(s<2592000)return Math.floor(s/86400)+"d ago";return Math.floor(s/2592000)+"mo ago"};
const fsd=d=>{if(!d)return null;return new Date(d+"T00:00:00").toLocaleDateString("en-US",{year:"numeric",month:"short"})};
const ts=v=>{if(!v)return 0;const t=new Date(v).getTime();return Number.isNaN(t)?0:t};
const sortPerksByStayDate=rows=>[...(rows||[])].sort((a,b)=>{const as=ts(a.stay_date||a.latest_stay),bs=ts(b.stay_date||b.latest_stay);if(bs!==as)return bs-as;return ts(b.created_at)-ts(a.created_at)});
const dname=u=>u?.user_metadata?.display_name||u?.email?.split("@")[0]||"Anonymous";
const pscore=(r,c)=>Math.min(100,r*3+c*8);
const mkSlug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const FF="'DM Sans',sans-serif";const FD="'Playfair Display',serif";
const sanitize=s=>{if(!s)return s;return s.replace(/<[^>]*>/g,"").replace(/javascript:/gi,"").replace(/data:/gi,"").replace(/on\w+\s*=/gi,"").replace(/https?:\/\/\S+/gi,"[link removed]").replace(/www\.\S+/gi,"[link removed]").replace(/\.com\/\S*/gi,"[link removed]").replace(/\.exe|\.zip|\.bat|\.cmd|\.msi|\.scr|\.ps1/gi,"[blocked]").trim()};
const PROFANITY=["fuck","shit","ass","bitch","damn","crap","dick","cock","pussy","slut","whore","nigger","nigga","faggot","retard","cunt"];
const hasProfanity=s=>{if(!s)return false;const w=s.toLowerCase();return PROFANITY.some(p=>w.includes(p))};
const RESERVED_NAMES=["admin","administrator","marriott","marriottofficial","marriottglobal","marriottbonvoy","bonvoy","hilton","hyatt","ihg","perksnob","perksnobofficial","moderator","mod","staff","official","support","helpdesk","system","bot","ritzcarlton","stregis","westinhotels","sheratonhotels","jwmarriott","whotels","editionhotels"];
const LS={display:"block",fontSize:10,fontWeight:600,color:"#94a3b8",fontFamily:FF,marginBottom:6,textTransform:"uppercase",letterSpacing:1.2};
const IS={width:"100%",padding:"12px 14px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:14,fontFamily:FF,background:"#fff",color:"#0f172a",outline:"none",boxSizing:"border-box",transition:"border-color 0.15s"};
const BT=(bg="#0f172a",fg="#fff")=>({background:bg,color:fg,border:"none",borderRadius:6,padding:"10px 22px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FF,letterSpacing:0.2,transition:"all 0.15s"});
const TAG=(bg,fg)=>({display:"inline-flex",alignItems:"center",fontSize:9,fontWeight:700,fontFamily:FF,padding:"2px 6px",borderRadius:3,background:bg,color:fg,textTransform:"uppercase",letterSpacing:0.5});
const PAGE_SIZE=50;
const haversine=(lat1,lon1,lat2,lon2)=>{const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))};
const getAccountAgeDays=u=>{if(!u?.created_at)return 0;return Math.floor((Date.now()-new Date(u.created_at).getTime())/86400000)};
const isEmailVerified=u=>!!u?.email_confirmed_at;
const EMAIL_GATE_DAYS=7;

function usePath(){const[path,setPath]=useState(window.location.pathname);useEffect(()=>{const h=()=>{setPath(window.location.pathname);window.scrollTo(0,0)};window.addEventListener("popstate",h);return()=>window.removeEventListener("popstate",h)},[]);const nav=p=>{window.history.pushState({},"",p);setPath(p);window.scrollTo(0,0)};return[path,nav]}
function useTitle(t){useEffect(()=>{document.title=t},[t])}
const upsertMeta=(selector,create,content)=>{if(!content)return;let el=document.head.querySelector(selector);if(!el){el=document.createElement("meta");Object.entries(create).forEach(([k,v])=>el.setAttribute(k,v));document.head.appendChild(el)}el.setAttribute("content",content)};
const upsertCanonical=href=>{if(!href)return;let link=document.head.querySelector("link[rel='canonical']");if(!link){link=document.createElement("link");link.setAttribute("rel","canonical");document.head.appendChild(link)}link.setAttribute("href",href)};
const upsertJsonLd=(id,payload)=>{let script=document.getElementById(id);if(!payload){if(script)script.remove();return}if(!script){script=document.createElement("script");script.id=id;script.setAttribute("type","application/ld+json");document.head.appendChild(script)}script.textContent=JSON.stringify(payload)};
function useSeo({title,description,url,image,robots,jsonLd}){useEffect(()=>{if(title)document.title=title;if(description){upsertMeta('meta[name="description"]',{name:"description"},description);upsertMeta('meta[property="og:description"]',{property:"og:description"},description);upsertMeta('meta[name="twitter:description"]',{name:"twitter:description"},description)}if(title){upsertMeta('meta[property="og:title"]',{property:"og:title"},title);upsertMeta('meta[name="twitter:title"]',{name:"twitter:title"},title)}if(url){upsertMeta('meta[property="og:url"]',{property:"og:url"},url);upsertCanonical(url)}if(image){upsertMeta('meta[property="og:image"]',{property:"og:image"},image);upsertMeta('meta[name="twitter:image"]',{name:"twitter:image"},image)}if(robots)upsertMeta('meta[name="robots"]',{name:"robots"},robots);if(jsonLd!==undefined)upsertJsonLd("ps-jsonld",jsonLd)},[title,description,url,image,robots,jsonLd])}

/* Toast system */
let _toastFn=null;
function showToast(msg,type="success"){if(_toastFn)_toastFn({msg,type,id:Date.now()})}
function Toaster(){const[toasts,st]=useState([]);_toastFn=t=>{st(p=>[...p,t]);setTimeout(()=>st(p=>p.filter(x=>x.id!==t.id)),3000)};
return<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8}}>{toasts.map(t=><div key={t.id} style={{background:t.type==="error"?"#dc2626":"#059669",color:"#fff",padding:"12px 20px",borderRadius:8,fontSize:13,fontWeight:600,fontFamily:FF,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",animation:"slideIn 0.2s ease",maxWidth:320}}>{t.msg}</div>)}</div>}

/* Skeleton loader */
function Skeleton({w="100%",h=16,r=6}){return<div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/>}
function CardSkeleton(){return<div style={{background:"#fff",borderRadius:10,padding:"20px 22px",border:"1px solid #e2e8f0"}}><Skeleton w="60%" h={10}/><div style={{height:8}}/><Skeleton w="85%" h={16}/><div style={{height:4}}/><Skeleton w="50%" h={12}/><div style={{height:14}}/><Skeleton w="30%" h={14}/></div>}

function ScoreBadge({score}){const c=score>=70?"#059669":score>=40?"#d97706":"#dc2626",bg=score>=70?"#ecfdf5":score>=40?"#fffbeb":"#fef2f2";return<div style={{display:"inline-flex",alignItems:"center",gap:4,background:bg,border:`1px solid ${c}22`,borderRadius:6,padding:"3px 10px"}}><span style={{fontSize:15,fontWeight:700,color:c,fontFamily:FF}}>{score}</span><span style={{fontSize:9,color:c,fontFamily:FF,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>score</span></div>}

/* Gated email display — styled for dark background */
function GatedEmail({hotel,user,onNeedAuth}){
const email=hotel.email;if(!email)return null;
if(!user)return<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(255,255,255,0.06)",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer"}} onClick={onNeedAuth}><span style={{fontSize:13}}>📧</span><span style={{fontSize:12,fontWeight:600,color:"#94a3b8",fontFamily:FF}}>Hotel email available</span><span style={{fontSize:11,color:"#64748b",fontFamily:FF,marginLeft:6}}>— Sign in to unlock</span></div>;
const verified=isEmailVerified(user);
if(!verified)return<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(255,255,255,0.06)",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)"}}><span style={{fontSize:13}}>📧</span><span style={{fontSize:12,fontWeight:600,color:"#94a3b8",fontFamily:FF}}>Hotel email available</span><span style={{fontSize:11,color:"#64748b",fontFamily:FF,marginLeft:6}}>— Verify your email to unlock</span></div>;
const ageDays=getAccountAgeDays(user);const daysLeft=EMAIL_GATE_DAYS-ageDays;
if(daysLeft>0)return<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(255,255,255,0.06)",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)"}}><span style={{fontSize:13}}>📧</span><div><span style={{fontSize:12,fontWeight:600,color:"#94a3b8",fontFamily:FF}}>Hotel email unlocks in {daysLeft} day{daysLeft!==1?"s":""}</span><div style={{marginTop:4,background:"rgba(255,255,255,0.1)",borderRadius:4,height:4,width:120}}><div style={{background:"#38bdf8",borderRadius:4,height:4,width:`${(ageDays/EMAIL_GATE_DAYS)*100}%`,transition:"width 0.3s"}}/></div></div></div>;
return<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(255,255,255,0.06)",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)"}}><span style={{fontSize:13}}>📧</span><a href={`mailto:${email}`} style={{fontSize:13,fontWeight:600,color:"#38bdf8",fontFamily:FF,textDecoration:"none"}}>{email}</a></div>}

/* Hotel info bar — styled for dark header */
function HotelInfoBar({hotel,user,onNeedAuth}){
const items=[];
if(hotel.address)items.push({icon:"📍",text:hotel.address});
if(hotel.phone)items.push({icon:"📞",text:hotel.phone,href:`tel:${hotel.phone}`});
if(hotel.room_count)items.push({icon:"🏨",text:`${hotel.room_count} rooms`});
if(hotel.country)items.push({icon:"🌍",text:`${hotel.country}${hotel.region?` · ${hotel.region}`:""}`});
if(!items.length&&!hotel.email&&!hotel.marriott_code&&!hotel.website)return null;
return<div style={{marginTop:20,paddingTop:20,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
{items.length>0&&<div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:14}}>
{items.map((it,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#94a3b8",fontFamily:FF}}>
<span style={{fontSize:13,flexShrink:0}}>{it.icon}</span>
{it.href?<a href={it.href} style={{color:"#cbd5e1",textDecoration:"none"}}>{it.text}</a>:<span>{it.text}</span>}
</div>)}
</div>}
<div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
{hotel.marriott_code&&<a href={`https://www.marriott.com/hotels/travel/${hotel.marriott_code}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#fff",color:"#0f172a",borderRadius:6,padding:"8px 16px",fontSize:12,fontWeight:700,fontFamily:FF,textDecoration:"none",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#e2e8f0"}} onMouseLeave={e=>{e.currentTarget.style.background="#fff"}}>Book on Marriott.com</a>}
{hotel.website&&<a href={hotel.website} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#94a3b8",fontFamily:FF,fontWeight:600,textDecoration:"none",transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#94a3b8"}>Hotel website</a>}
</div>
{hotel.email&&<div style={{marginTop:12}}><GatedEmail hotel={hotel} user={user} onNeedAuth={onNeedAuth}/></div>}
</div>}

/* Nearby hotels */
function NearbyHotels({hotel,allHotels,perkCounts,onSelect}){
if(!hotel.latitude||!hotel.longitude)return null;
const nearby=useMemo(()=>allHotels.filter(h=>h.id!==hotel.id&&h.latitude&&h.longitude).map(h=>({...h,dist:haversine(hotel.latitude,hotel.longitude,h.latitude,h.longitude)})).filter(h=>h.dist<50).sort((a,b)=>a.dist-b.dist).slice(0,8),[hotel.id,hotel.latitude,hotel.longitude,allHotels]);
if(!nearby.length)return null;
return<div style={{marginTop:32}}>
<h3 style={{fontSize:16,fontWeight:700,color:"#0f172a",fontFamily:FF,marginBottom:14}}>Nearby Marriott Properties</h3>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
{nearby.map(h=><div key={h.id} onClick={()=>onSelect(h)} style={{background:"#fff",borderRadius:8,padding:"14px 16px",border:"1px solid #e2e8f0",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#0f172a";e.currentTarget.style.transform="translateY(-1px)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.transform="translateY(0)"}}>
<div style={{fontSize:9,fontWeight:700,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:1.2,marginBottom:4}}>{h.brand}</div>
<div style={{fontSize:13,fontWeight:700,color:"#0f172a",fontFamily:FF,marginBottom:2,lineHeight:1.3}}>{h.name}</div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
<span style={{fontSize:11,color:"#64748b",fontFamily:FF}}>{h.dist<1?`${Math.round(h.dist*1000)}m away`:`${h.dist.toFixed(1)} km`}</span>
<span style={{fontSize:11,color:"#0f172a",fontWeight:700,fontFamily:FF}}>{perkCounts[h.id]||0} reports</span>
</div>
{h.room_count&&<div style={{fontSize:10,color:"#94a3b8",fontFamily:FF,marginTop:4}}>{h.room_count} rooms</div>}
</div>)}
</div></div>}

/* Pagination */
function Pagination({current,total,onChange}){
if(total<=1)return null;
const pages=[];const show=5;let start=Math.max(1,current-Math.floor(show/2));let end=Math.min(total,start+show-1);if(end-start<show-1)start=Math.max(1,end-show+1);
for(let i=start;i<=end;i++)pages.push(i);
return<div style={{display:"flex",gap:4,justifyContent:"center",marginTop:28,alignItems:"center"}}>
<button onClick={()=>onChange(current-1)} disabled={current===1} style={{...BT("#f1f5f9","#64748b"),padding:"6px 12px",fontSize:12,opacity:current===1?0.4:1}}>← Prev</button>
{start>1&&<><button onClick={()=>onChange(1)} style={{...BT("#fff","#64748b"),padding:"6px 10px",fontSize:12,border:"1px solid #e2e8f0"}}>1</button>{start>2&&<span style={{color:"#94a3b8",fontSize:12}}>…</span>}</>}
{pages.map(p=><button key={p} onClick={()=>onChange(p)} style={{...BT(p===current?"#0f172a":"#fff",p===current?"#fff":"#64748b"),padding:"6px 10px",fontSize:12,border:p===current?"none":"1px solid #e2e8f0"}}>{p}</button>)}
{end<total&&<>{end<total-1&&<span style={{color:"#94a3b8",fontSize:12}}>…</span>}<button onClick={()=>onChange(total)} style={{...BT("#fff","#64748b"),padding:"6px 10px",fontSize:12,border:"1px solid #e2e8f0"}}>{total}</button></>}
<button onClick={()=>onChange(current+1)} disabled={current===total} style={{...BT("#f1f5f9","#64748b"),padding:"6px 12px",fontSize:12,opacity:current===total?0.4:1}}>Next →</button>
</div>}

/* Netflix-style horizontal scrolling row */
function HotelRow({title,subtitle,hotels,perkCounts,scores,onSelect,user,isFollowing,onToggleFollow,isFollowBusy}){
const ref=useRef(null);
const scroll=(dir)=>{if(ref.current)ref.current.scrollBy({left:dir*300,behavior:"smooth"})};
if(!hotels||!hotels.length)return null;
return<div style={{marginBottom:40}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:16}}>
<div><h3 style={{fontSize:17,fontWeight:700,color:"#0f172a",fontFamily:FF,margin:0}}>{title}</h3>
{subtitle&&<p style={{fontSize:12,color:"#94a3b8",fontFamily:FF,margin:"4px 0 0"}}>{subtitle}</p>}</div>
<div style={{display:"flex",gap:4,flexShrink:0}}>
<button onClick={()=>scroll(-1)} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:6,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:"#64748b",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#0f172a"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>←</button>
<button onClick={()=>scroll(1)} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:6,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:"#64748b",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#0f172a"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>→</button>
</div></div>
<div ref={ref} className="ps-row" style={{display:"flex",gap:12,overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none",padding:"4px 2px 8px",scrollSnapType:"x mandatory"}}>
{hotels.map(h=>{const c=perkCounts[h.id]||0;const sc=scores[h.id]||0;const followed=!!isFollowing?.(h.id);const busy=!!isFollowBusy?.(h.id);return<div key={h.id} onClick={()=>onSelect(h)} style={{flex:"0 0 260px",scrollSnapAlign:"start",background:"#fff",borderRadius:10,padding:"18px 20px",border:"1px solid #e2e8f0",cursor:"pointer",transition:"all 0.15s",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:140}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#0f172a";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(15,23,42,0.08)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}>
<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}><span style={{fontSize:9,fontWeight:700,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:1.5}}>{h.brand}</span><div style={{display:"flex",alignItems:"center",gap:6}}>{sc>0&&<span style={{fontSize:13,fontWeight:700,color:sc>=70?"#059669":sc>=40?"#d97706":"#dc2626",fontFamily:FF}}>{sc}</span>}{user&&onToggleFollow&&<button onClick={e=>{e.stopPropagation();onToggleFollow(h.id,followed)}} disabled={busy} style={{background:followed?"#e2e8f0":"#f8fafc",border:"1px solid #e2e8f0",borderRadius:4,padding:"2px 6px",fontSize:9,fontWeight:700,color:followed?"#334155":"#475569",fontFamily:FF,cursor:"pointer",opacity:busy?0.65:1}}>{followed?"Following":"Follow"}</button>}</div></div>
<div style={{fontSize:14,fontWeight:700,color:"#0f172a",fontFamily:FF,marginBottom:3,lineHeight:1.3}}>{h.name}</div><div style={{fontSize:11,color:"#94a3b8",fontFamily:FF}}>{h.location}</div></div>
<div style={{fontSize:11,color:"#64748b",fontFamily:FF,display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14,paddingTop:10,borderTop:"1px solid #f1f5f9"}}><span><span style={{color:"#0f172a",fontWeight:700,fontSize:14}}>{c}</span> reports</span>{h.room_count&&<span style={{fontSize:10,color:"#94a3b8"}}>{h.room_count} rooms</span>}</div>
</div>})}
</div></div>}

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

function PerkCard({perk,user,onVote,onEdit,onDelete,onFlag,showHotel}){const cat=gc(perk.category),stay=fsd(perk.stay_date||perk.latest_stay);
const isOwner=user&&perk.user_id===user.id;const hasPromo=perk.promo_code||perk.booking_type==="Employee (MMF, MMP, etc.)"||perk.booking_type==="Employee (MMP)"||perk.booking_type==="Corporate"||perk.booking_type==="3rd Party (e.g. Priceline)";
const score=(perk.upvotes||0)-(perk.downvotes||0);const myVote=perk.my_vote||0;const[flagging,setFlagging]=useState(false);
const submitted=perk.created_at?new Date(perk.created_at).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"";
return<div style={{display:"flex",gap:14,padding:"16px 0",borderBottom:"1px solid #f1f5f9"}}>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:36,paddingTop:2}}>
{user?<button onClick={()=>onVote(perk,myVote===1?0:1)} aria-label="Upvote" style={{background:"none",border:"none",cursor:"pointer",fontSize:16,padding:0,color:myVote===1?"#059669":"#cbd5e1",transition:"color 0.15s"}}>▲</button>:<span style={{fontSize:16,color:"#cbd5e1"}}>▲</span>}
<span style={{fontSize:13,fontWeight:700,color:score>0?"#059669":score<0?"#dc2626":"#94a3b8",fontFamily:FF}}>{score}</span>
{user?<button onClick={()=>onVote(perk,myVote===-1?0:-1)} aria-label="Downvote" style={{background:"none",border:"none",cursor:"pointer",fontSize:16,padding:0,color:myVote===-1?"#dc2626":"#cbd5e1",transition:"color 0.15s"}}>▼</button>:<span style={{fontSize:16,color:"#cbd5e1"}}>▼</span>}
</div>
<div style={{flex:1,minWidth:0}}>
{showHotel&&<div style={{fontSize:11,fontWeight:700,color:"#0f172a",fontFamily:FF,marginBottom:4}}>{perk.hotel_name}</div>}
{/* Row 1: Category */}
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:15}}>{cat.icon}</span><span style={{fontSize:12,fontWeight:700,color:"#0f172a",fontFamily:FF,textTransform:"uppercase",letterSpacing:0.8}}>{cat.label}</span></div>
{/* Row 2: Username · Submitted · Stay date */}
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap",fontSize:11,color:"#64748b",fontFamily:FF}}>
<span style={{fontWeight:600,color:"#334155"}}>{perk.display_name}</span>
{stay&&<><span style={{color:"#cbd5e1"}}>·</span><span>Stayed {stay}</span></>}
{!stay&&<><span style={{color:"#cbd5e1"}}>·</span><span style={{fontStyle:"italic",color:"#94a3b8"}}>Stay date not provided</span></>}
{submitted&&<><span style={{color:"#cbd5e1"}}>·</span><span>Reported {submitted}</span></>}
{perk.edit_count>0&&<><span style={{color:"#cbd5e1"}}>·</span><span style={{fontStyle:"italic",color:"#94a3b8"}} title={perk.last_edited_at?`Last edited ${new Date(perk.last_edited_at).toLocaleDateString()}`:""}>edited{perk.edit_count>1?` ×${perk.edit_count}`:""}</span></>}
</div>
{/* Row 3: Tags */}
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,flexWrap:"wrap"}}>
<span style={{...TAG("#f1f5f9",gt(perk.elite_tier).color)}}>{gt(perk.elite_tier).label}</span>
{perk.upgrade_type&&<span style={{...TAG("#eff6ff","#1d4ed8")}}>{perk.upgrade_type}</span>}
{perk.booking_type&&<span style={{...TAG("#f0fdf4","#15803d")}}>{perk.booking_type}</span>}
{hasPromo&&<span style={{...TAG("#fefce8","#a16207"),cursor:"help"}} title="Booked with a promo/corporate/employee code — perks received may differ from standard elite bookings">⚠️ {perk.promo_code||"Promo/Corp rate"}</span>}
</div>
{/* Row 4: Description */}
<div style={{fontSize:13,color:"#475569",lineHeight:1.6,fontFamily:FF}}>{perk.summary||perk.description}</div>
<CategoryDetailTags category={perk.category} details={perk.category_details}/>
{/* Row 5: Actions */}
<div style={{marginTop:8,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
{isOwner&&onEdit&&<button onClick={()=>onEdit(perk)} aria-label="Edit perk" style={{background:"none",border:"1px solid #dbeafe",borderRadius:4,padding:"2px 8px",fontSize:10,cursor:"pointer",color:"#2563eb",fontFamily:FF,fontWeight:600}}>Edit</button>}
{isOwner&&onDelete&&<button onClick={()=>{if(window.confirm("Delete this perk report?"))onDelete(perk)}} aria-label="Delete perk" style={{background:"none",border:"1px solid #fecaca",borderRadius:4,padding:"2px 8px",fontSize:10,cursor:"pointer",color:"#dc2626",fontFamily:FF}}>Delete</button>}
{user&&!isOwner&&!flagging&&<button onClick={()=>setFlagging(true)} aria-label="Report" style={{background:"none",border:"none",padding:"2px 4px",fontSize:10,cursor:"pointer",color:"#cbd5e1",fontFamily:FF}}>🚩</button>}
{flagging&&<div style={{display:"flex",gap:4,alignItems:"center"}}>{[{k:"spam",l:"Spam"},{k:"offensive",l:"Offensive"},{k:"misinformation",l:"Inaccurate"}].map(r=><button key={r.k} onClick={async()=>{const{error}=await supabase.from("content_flags").insert({reporter_id:user.id,target_type:"perk_report",target_id:perk.id,reason:r.k});if(error?.code==="23505")showToast("Already flagged","error");else if(error)showToast("Error flagging","error");else showToast("Flagged for review. Thank you.");setFlagging(false)}} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:4,padding:"2px 8px",fontSize:9,cursor:"pointer",color:"#dc2626",fontFamily:FF}}>{r.l}</button>)}<button onClick={()=>setFlagging(false)} style={{background:"none",border:"none",fontSize:10,cursor:"pointer",color:"#94a3b8"}}>✕</button></div>}
</div>
</div></div>}

function TierSection({tier,perks,user,onVote,onEdit,onDelete,defaultOpen=true,highlight=false}){const t=gt(tier);const[open,setOpen]=useState(defaultOpen);
if(!perks?.length)return<div style={{padding:20,borderRadius:8,background:highlight?"#f0fdf4":"#fafbfc",border:highlight?"2px solid #86efac":"1px solid #f1f5f9",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer"}} onClick={()=>setOpen(!open)}><span style={{width:6,height:6,borderRadius:"50%",background:t.color}}/><span style={{fontSize:12,fontWeight:700,color:t.color,fontFamily:FF}}>{t.label}</span>{highlight&&<span style={{fontSize:9,background:t.color,color:"#fff",padding:"2px 6px",borderRadius:3,fontFamily:FF,fontWeight:700}}>YOUR TIER</span>}</div><div style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>No perks reported yet. Be the first to share what you received!</div></div>;
return<div style={{padding:"16px 20px",borderRadius:8,background:highlight?"#f0fdf4":"#fff",border:highlight?"2px solid #86efac":"1px solid #e2e8f0",marginBottom:12}}>
<div onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:8,paddingBottom:open?12:0,borderBottom:open?"1px solid #e2e8f0":"none",marginBottom:open?4:0,cursor:"pointer",userSelect:"none"}}>
<span style={{fontSize:12,color:"#94a3b8",transition:"transform 0.2s",transform:open?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
<span style={{width:6,height:6,borderRadius:"50%",background:t.color}}/><span style={{fontSize:13,fontWeight:700,color:t.color,fontFamily:FF}}>{t.label}</span>{highlight&&<span style={{fontSize:9,background:t.color,color:"#fff",padding:"2px 6px",borderRadius:3,fontFamily:FF,fontWeight:700}}>YOUR TIER</span>}<span style={{fontSize:10,color:"#94a3b8",fontFamily:FF,marginLeft:"auto"}}>{perks.length} perk{perks.length!==1?"s":""}</span></div>
{open&&perks.map((p,i)=><PerkCard key={p.id||i} perk={p} user={user} onVote={onVote} onEdit={onEdit} onDelete={onDelete}/>)}</div>}

function Footer(){return<footer style={{background:"#0f172a",borderTop:"1px solid #1e293b",padding:"40px 28px",marginTop:40}}><div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:24}}>
<div><div style={{display:"flex",alignItems:"baseline",gap:1,marginBottom:8}}><span style={{fontSize:20,fontWeight:700,color:"#fff",fontFamily:FD}}>Perk</span><span style={{fontSize:20,fontWeight:700,color:"#94a3b8",fontFamily:FD}}>Snob</span></div>
<p style={{fontSize:12,color:"#64748b",fontFamily:FF,maxWidth:280,lineHeight:1.6}}>Real Marriott Bonvoy elite benefits reported by real guests. Powered by the community!</p></div>
<div style={{display:"flex",gap:32}}>
<div><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Navigate</div>
{[{l:"Home",p:"/"},{l:"Search Perks",p:"/search"},{l:"Compare",p:"/compare"},{l:"Following",p:"/following"},{l:"Leaderboard",p:"/leaderboard"}].map(x=><a key={x.p} href={x.p} onClick={e=>{e.preventDefault();window.history.pushState({},"",x.p);window.dispatchEvent(new PopStateEvent("popstate"))}} style={{display:"block",fontSize:13,color:"#64748b",fontFamily:FF,textDecoration:"none",marginBottom:6,transition:"color 0.15s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="#64748b"}>{x.l}</a>)}</div>
<div><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Community</div>
<a href="https://www.reddit.com/r/marriott/" target="_blank" rel="noopener noreferrer" style={{display:"block",fontSize:13,color:"#64748b",fontFamily:FF,textDecoration:"none",marginBottom:6}}>r/marriott</a>
<a href="https://www.reddit.com/user/MarriottGuy/" target="_blank" rel="noopener noreferrer" style={{display:"block",fontSize:13,color:"#64748b",fontFamily:FF,textDecoration:"none",marginBottom:6}}>Contact (Reddit)</a></div>
</div></div>
<div style={{maxWidth:1100,margin:"20px auto 0",paddingTop:20,borderTop:"1px solid #1e293b"}}><p style={{fontSize:11,color:"#475569",fontFamily:FF}}>PerkSnob is not affiliated with Marriott International. All trademarks belong to their respective owners.</p></div></footer>}

function AuthModal({onClose,onAuth}){const[mode,sMode]=useState("signin"),[em,se]=useState(""),[pw,sp]=useState(""),[nm,sn]=useState(""),[userTier,setUserTier]=useState(""),[ld,sl]=useState(false),[er,sr]=useState(""),[msg,smsg]=useState("");
const go=async()=>{sl(true);sr("");smsg("");try{if(mode==="signup"){if(!nm.trim()||nm.trim().length<2){throw new Error("Display name must be at least 2 characters")}if(nm.trim().length>MAX_NAME){throw new Error(`Display name must be ${MAX_NAME} characters or less`)}
if(!userTier){throw new Error("Please select your Marriott Bonvoy elite status")}
if(RESERVED_NAMES.includes(nm.trim().toLowerCase())){throw new Error("That display name is reserved. Please choose another.")}
if(hasProfanity(nm)){throw new Error("Display name contains inappropriate language. Please choose another.")}
const{data:existingName}=await supabase.from("perk_reports").select("display_name").eq("display_name",nm.trim()).limit(1);
const{data:existingCmt}=await supabase.from("comments").select("display_name").eq("display_name",nm.trim()).limit(1);
if((existingName&&existingName.length>0)||(existingCmt&&existingCmt.length>0)){throw new Error("That display name is already taken. Please choose another.")}
const{data:signUpData,error}=await supabase.auth.signUp({email:em,password:pw,options:{data:{display_name:sanitize(nm),elite_tier:userTier}}});if(error)throw error;
const u=signUpData?.user;if(u&&(u.identities?.length===0||(u.created_at&&(Date.now()-new Date(u.created_at).getTime())>5000))){throw new Error("Unable to create account. Please try a different email or sign in.")}
smsg("Check your email to confirm your account!");sMode("done")}else if(mode==="signin"){const{error}=await supabase.auth.signInWithPassword({email:em,password:pw});if(error)throw error;showToast("Signed in successfully.");onAuth();onClose()}else if(mode==="reset"){const{error}=await supabase.auth.resetPasswordForEmail(em,{redirectTo:window.location.origin});if(error)throw error;smsg("If an account exists with this email, you'll receive a reset link.")}}catch(e){sr(e.message)}sl(false)};
return<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}} onClick={onClose}><div style={{background:"#fff",borderRadius:12,padding:40,maxWidth:380,width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()} role="dialog" aria-label={mode==="signup"?"Create account":mode==="reset"?"Reset password":"Sign in"}>
<h2 style={{fontSize:28,fontFamily:FD,fontWeight:700,marginBottom:4,color:"#0f172a"}}>{mode==="signup"?"Create Account":mode==="reset"?"Reset Password":mode==="done"?"Check Your Email":"Welcome back"}</h2>
<p style={{fontSize:13,color:"#94a3b8",marginBottom:28,fontFamily:FF}}>{mode==="signup"?"Join the community":mode==="reset"?"Enter your email to reset":mode==="done"?"":"Sign in to contribute"}</p>
{er&&<div role="alert" style={{background:"#fef2f2",color:"#dc2626",padding:"10px 14px",borderRadius:6,fontSize:12,marginBottom:14,fontFamily:FF}}>{er}</div>}
{msg&&<div role="status" style={{background:"#ecfdf5",color:"#059669",padding:"10px 14px",borderRadius:6,fontSize:12,marginBottom:14,fontFamily:FF}}>{msg}</div>}
{mode==="done"?<><div style={{background:"#ecfdf5",borderRadius:8,padding:20,textAlign:"center",marginBottom:20}}><div style={{fontSize:32,marginBottom:8}}>✉️</div><p style={{fontSize:14,color:"#059669",fontFamily:FF,fontWeight:600,margin:0}}>We sent a confirmation link to your email.</p><p style={{fontSize:12,color:"#64748b",fontFamily:FF,marginTop:8,marginBottom:0}}>Click the link to activate your account, then come back and sign in.</p></div><button onClick={onClose} style={{width:"100%",...BT(),padding:"13px",fontSize:14}}>Got it</button></>:<>
{mode==="signup"&&<div style={{marginBottom:14}}><label style={LS}>Display Name <CharCount val={nm} max={MAX_NAME}/></label><input value={nm} onChange={e=>sn(e.target.value.slice(0,MAX_NAME))} placeholder="e.g. JetsetterJohn" style={IS} maxLength={MAX_NAME} autoFocus/></div>}
{mode==="signup"&&<div style={{marginBottom:14}}><label style={LS}>Marriott Bonvoy Status</label><select value={userTier} onChange={e=>setUserTier(e.target.value)} style={IS}><option value="">Select your elite status...</option>{TIERS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}<option value="none">I'm not elite level</option></select></div>}
<div style={{marginBottom:14}}><label style={LS}>Email</label><input type="email" value={em} onChange={e=>se(e.target.value)} placeholder="you@email.com" style={IS} autoFocus={mode!=="signup"}/></div>
{mode!=="reset"&&<div style={{marginBottom:28}}><label style={LS}>Password</label><input type="password" value={pw} onChange={e=>sp(e.target.value)} placeholder="••••••••" style={IS} onKeyDown={e=>e.key==="Enter"&&go()}/></div>}
{mode==="reset"&&<div style={{marginBottom:28}}/>}
<button onClick={go} disabled={ld} style={{width:"100%",...BT(),padding:"13px",fontSize:14,opacity:ld?0.5:1}}>{ld?"...":mode==="signup"?"Create Account":mode==="reset"?"Send Reset Link":"Sign In"}</button>
<div style={{textAlign:"center",marginTop:18,display:"flex",flexDirection:"column",gap:8}}>
{mode==="signin"&&<button onClick={()=>{sMode("reset");sr("");smsg("")}} style={{background:"none",border:"none",color:"#94a3b8",fontSize:12,cursor:"pointer",fontFamily:FF}}>Forgot password?</button>}
<button onClick={()=>{sMode(mode==="signup"?"signin":mode==="reset"?"signin":"signup");sr("");smsg("")}} style={{background:"none",border:"none",color:"#0f172a",fontSize:13,cursor:"pointer",fontFamily:FF,fontWeight:600,textDecoration:"underline",textUnderlineOffset:3}}>{mode==="signup"?"Already have an account?":mode==="reset"?"Back to sign in":"New? Join and create account"}</button></div>
</>}
</div></div>}

function PerkSearch({user,onNeedAuth}){const[tier,st]=useState(""),[cat,sc]=useState(""),[res,sr]=useState([]),[ld,sl]=useState(false),[done,sd]=useState(false),[err,ser]=useState("");
const go=async()=>{sl(true);sd(true);ser("");try{let q=supabase.from("perk_reports").select("*, hotels!inner(name,brand,location)").order("stay_date",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false}).limit(50);if(tier)q=q.eq("elite_tier",tier);if(cat)q=q.eq("category",cat);const{data,error}=await q;if(error)throw error;
const pm={};(data||[]).forEach(p=>{const k=`${p.hotel_id}|${p.elite_tier}|${p.category}|${p.description}`;if(!pm[k])pm[k]={...p,total_confirmations:1,summary:p.description,hotel_name:p.hotels?.name,latest_stay:p.stay_date};else{pm[k].total_confirmations+=1;if(p.stay_date>pm[k].latest_stay)pm[k].latest_stay=p.stay_date}});sr(sortPerksByStayDate(Object.values(pm)))}catch(e){ser("Failed to load results. Please try again.");console.error(e)}sl(false)};
return<div><div style={{background:"#fff",borderRadius:10,padding:28,border:"1px solid #e2e8f0",marginBottom:20}}>
<h2 style={{fontSize:22,fontFamily:FD,fontWeight:700,color:"#0f172a",marginBottom:18}}>Find Perks Across All Hotels</h2>
<div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
<div style={{flex:"1 1 180px"}}><label style={LS}>Tier</label><select value={tier} onChange={e=>st(e.target.value)} style={IS}><option value="">Any</option>{TIERS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
<div style={{flex:"1 1 180px"}}><label style={LS}>Category</label><select value={cat} onChange={e=>sc(e.target.value)} style={IS}><option value="">Any</option>{CATS.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
<button onClick={go} style={BT()}>Search</button></div></div>
{err&&<div role="alert" style={{background:"#fef2f2",color:"#dc2626",padding:"12px 16px",borderRadius:8,fontSize:13,fontFamily:FF,marginBottom:16}}>{err} <button onClick={go} style={{background:"none",border:"none",color:"#dc2626",fontWeight:700,cursor:"pointer",textDecoration:"underline",fontFamily:FF}}>Retry</button></div>}
{ld?<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Searching...</div>:done&&<>{res.length>0&&<div style={{fontSize:12,color:"#94a3b8",fontFamily:FF,marginBottom:12}}>{res.length} result{res.length!==1?"s":""}</div>}{res.map((p,i)=><PerkCard key={i} perk={p} user={user} onVote={()=>{}} showHotel/>)}{!res.length&&<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No perks found matching your criteria.</div>}</>}</div>}

function FollowingFeed({user,onNeedAuth,onSelectHotel}){const[followedHotels,setFollowedHotels]=useState([]),[feed,setFeed]=useState([]),[selHotel,setSelHotel]=useState("all"),[ld,sld]=useState(true),[err,setErr]=useState("");
const load=useCallback(async()=>{if(!user){setFollowedHotels([]);setFeed([]);sld(false);return}sld(true);setErr("");try{const{data:follows,error:fErr}=await supabase.from("hotel_follows").select("hotel_id").eq("user_id",user.id);if(fErr)throw fErr;const hotelIds=[...new Set((follows||[]).map(f=>f.hotel_id))];if(!hotelIds.length){setFollowedHotels([]);setFeed([]);sld(false);return}
const{data:hotels,error:hErr}=await supabase.from("hotels").select("id,name,slug,brand,location").in("id",hotelIds).order("name");if(hErr)throw hErr;const hotelMap={};(hotels||[]).forEach(h=>{hotelMap[h.id]=h});
const{data:perks,error:pErr}=await supabase.from("perk_reports").select("*").in("hotel_id",hotelIds).order("stay_date",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false}).limit(300);if(pErr)throw pErr;
setFollowedHotels(hotels||[]);setFeed(sortPerksByStayDate((perks||[]).map(p=>({...p,hotel_name:hotelMap[p.hotel_id]?.name||"Unknown Hotel",hotel_location:hotelMap[p.hotel_id]?.location||"",hotel_slug:hotelMap[p.hotel_id]?.slug||""}))));setSelHotel(curr=>curr!=="all"&&!hotelMap[curr]?"all":curr)}catch(e){setErr("Failed to load followed-hotel activity. Please try again.");console.error(e)}sld(false)},[user?.id]);
useEffect(()=>{load()},[load]);
if(!user)return<div style={{textAlign:"center",padding:60}}><h3 style={{fontSize:24,fontWeight:700,color:"#0f172a",fontFamily:FD,marginBottom:8}}>Following Feed</h3><p style={{fontSize:13,color:"#64748b",fontFamily:FF,marginBottom:18}}>Sign in to follow hotels and see recent community updates in one place.</p><button onClick={onNeedAuth} style={BT()}>Sign In</button></div>;
const filtered=selHotel==="all"?feed:feed.filter(p=>p.hotel_id===selHotel);
const from30Days=Date.now()-30*24*60*60*1000;
const recentCount=filtered.filter(p=>ts(p.stay_date||p.created_at)>=from30Days).length;
const trending=useMemo(()=>{const byHotel={};feed.forEach(p=>{const eventTs=ts(p.stay_date||p.created_at);if(eventTs<from30Days)return;const id=p.hotel_id;if(!byHotel[id])byHotel[id]={hotel_id:id,reports:0,latest:eventTs};byHotel[id].reports+=1;if(eventTs>byHotel[id].latest)byHotel[id].latest=eventTs});return Object.values(byHotel).sort((a,b)=>b.reports-a.reports||b.latest-a.latest).slice(0,6).map(x=>({...x,hotel:followedHotels.find(h=>h.id===x.hotel_id)})).filter(x=>x.hotel)},[feed,followedHotels,from30Days]);
return<div><div style={{background:"#0f172a",borderRadius:12,padding:36,marginBottom:28,color:"#fff"}}><p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:FF}}>Personalized</p><h1 style={{fontSize:34,fontWeight:700,margin:"0 0 6px",fontFamily:FD}}>Following Feed</h1><p style={{fontSize:14,color:"#94a3b8",fontFamily:FF,margin:0}}>Latest reports from hotels you follow, sorted by stay date first.</p></div>
{err&&<div role="alert" style={{background:"#fef2f2",color:"#dc2626",padding:"12px 16px",borderRadius:8,fontSize:13,fontFamily:FF,marginBottom:14}}>{err}</div>}
<div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end",marginBottom:14}}><div style={{flex:"1 1 260px"}}><label style={LS}>Filter by followed hotel</label><select value={selHotel} onChange={e=>setSelHotel(e.target.value)} style={IS}><option value="all">All followed hotels</option>{followedHotels.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></div><button onClick={load} style={BT("#fff","#334155")}>Refresh</button></div>
<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>{[{label:"Hotels Followed",value:followedHotels.length,icon:"🏨"},{label:"Feed Items",value:filtered.length,icon:"📰"},{label:"Last 30 Days",value:recentCount,icon:"🗓️"}].map(s=><div key={s.label} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}><span>{s.icon}</span><div><div style={{fontSize:13,fontWeight:700,color:"#0f172a",fontFamily:FF}}>{s.value}</div><div style={{fontSize:10,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:0.8}}>{s.label}</div></div></div>)}</div>
{!ld&&trending.length>0&&<div style={{marginBottom:16}}><h3 style={{fontSize:13,fontWeight:700,color:"#0f172a",fontFamily:FF,margin:"0 0 8px"}}>Trending In Your Followed Hotels (30 days)</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:8}}>{trending.map(t=><div key={t.hotel_id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:11,fontWeight:700,color:"#0f172a",fontFamily:FF,marginBottom:2}}>{t.hotel?.name}</div><div style={{fontSize:10,color:"#94a3b8",fontFamily:FF,marginBottom:8}}>{t.hotel?.location}</div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:11,color:"#334155",fontFamily:FF}}><strong>{t.reports}</strong> recent report{t.reports!==1?"s":""}</span><button onClick={()=>t.hotel&&onSelectHotel&&onSelectHotel(t.hotel)} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:4,padding:"4px 8px",fontSize:10,color:"#334155",fontFamily:FF,cursor:"pointer"}}>Open</button></div></div>)}</div></div>}
{ld?<div style={{padding:20}}><Skeleton h={120} r={8}/><div style={{height:10}}/><Skeleton h={120} r={8}/></div>:followedHotels.length===0?<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:30,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>⭐</div><h3 style={{fontSize:18,fontWeight:700,color:"#0f172a",fontFamily:FD,margin:"0 0 8px"}}>Follow hotels to build your feed</h3><p style={{fontSize:13,color:"#64748b",fontFamily:FF,margin:0}}>Open a hotel page and click "Follow Hotel" to get updates here and in your monthly digest.</p></div>:filtered.length===0?<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:30,textAlign:"center"}}><div style={{fontSize:30,marginBottom:8}}>🕐</div><p style={{fontSize:13,color:"#64748b",fontFamily:FF,margin:0}}>No reports yet for this selection. Try another followed hotel or check back later.</p></div>:<div style={{background:"#fff",borderRadius:10,padding:"6px 20px",border:"1px solid #e2e8f0"}}>{filtered.map((p,i)=>{const h=followedHotels.find(x=>x.id===p.hotel_id);return<div key={p.id||i} style={{borderBottom:i===filtered.length-1?"none":"1px solid #f1f5f9",paddingTop:8,paddingBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:2}}><button onClick={()=>h&&onSelectHotel&&onSelectHotel(h)} style={{background:"none",border:"none",padding:0,margin:0,fontSize:12,fontWeight:700,color:"#0f172a",fontFamily:FF,cursor:h?"pointer":"default",textDecoration:h?"underline":"none"}}>{p.hotel_name}</button><span style={{fontSize:10,color:"#94a3b8",fontFamily:FF}}>{p.hotel_location||""}</span></div><PerkCard perk={p} user={null} onVote={()=>{}}/></div>})}</div>}
</div>}

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

const BADGES=[
{key:"first",icon:"🏅",label:"First Report",desc:"Submitted your first perk report",test:s=>s.reports>=1},
{key:"regular",icon:"🔥",label:"Regular",desc:"10+ perk reports",test:s=>s.reports>=10},
{key:"power",icon:"⭐",label:"Power Contributor",desc:"25+ perk reports",test:s=>s.reports>=25},
{key:"elite_rev",icon:"👑",label:"Elite Reviewer",desc:"50+ perk reports",test:s=>s.reports>=50},
{key:"globe",icon:"🌍",label:"Globe Trotter",desc:"Reports at 10+ different hotels",test:s=>s.hotels>=10},
{key:"trusted",icon:"✅",label:"Trusted Voice",desc:"10+ upvotes received",test:s=>s.upvotes>=10},
{key:"detail",icon:"📝",label:"Detail King",desc:"10+ reports with all details filled",test:s=>s.detailed>=10},
];
function getBadges(stats){return BADGES.filter(b=>b.test(stats))}
function topBadge(stats){const b=getBadges(stats);return b.length?b[b.length-1]:null}

function UserProfile({userId,currentUser,onBack,hotels}){
const[profile,setProfile]=useState(null),[stats,setStats]=useState({reports:0,hotels:0,upvotes:0,detailed:0}),[perks,setPerks]=useState([]),[editing,setEditing]=useState(false),[ld,sld]=useState(true);
const[bio,setBio]=useState(""),[tier,setTier]=useState(""),[since,setSince]=useState(""),[reddit,setReddit]=useState("");
const[digestEnabled,setDigestEnabled]=useState(true),[digestDay,setDigestDay]=useState("1");
const isOwn=currentUser&&currentUser.id===userId;
useEffect(()=>{(async()=>{sld(true);
const{data:p}=await supabase.from("user_profiles").select("*").eq("id",userId).maybeSingle();
if(p){setProfile(p);setBio(p.bio||"");setTier(p.elite_tier||"");setSince(p.elite_since||"");setReddit(p.reddit_username||"")}
else{const{data:rp2}=await supabase.from("perk_reports").select("display_name").eq("user_id",userId).limit(1);setProfile({id:userId,display_name:rp2?.[0]?.display_name||"User"})}
if(isOwn){const{data:np,error:npErr}=await supabase.from("user_notification_prefs").select("*").eq("user_id",userId).maybeSingle();if(!npErr&&np){setDigestEnabled(np.monthly_digest_enabled!==false);setDigestDay(String(np.digest_send_day||1))}else if(npErr&&!String(npErr.message||"").includes("user_notification_prefs"))console.error(npErr)}
const{data:rp}=await supabase.from("perk_reports").select("*").eq("user_id",userId);
const myPerks=rp||[];setPerks(myPerks);
const hotelSet=new Set(myPerks.map(r=>r.hotel_id));
const detailed=myPerks.filter(r=>r.category_details&&Object.keys(r.category_details).length>=2).length;
const perkIds=myPerks.map(p=>p.id);
let upvoteCount=0;if(perkIds.length){const{count}=await supabase.from("perk_votes").select("*",{count:"exact",head:true}).in("perk_id",perkIds).eq("vote",1);upvoteCount=count||0}
setStats({reports:myPerks.length,hotels:hotelSet.size,upvotes:upvoteCount,detailed});
sld(false)})()},[userId,isOwn]);
const save=async()=>{if(hasProfanity(bio)){showToast("Bio contains inappropriate language. Please revise.","error");return}const cleanBio=sanitize(bio);const cleanReddit=reddit.trim().replace(/[^a-zA-Z0-9_-]/g,"").slice(0,30);const{error}=await supabase.from("user_profiles").upsert({id:userId,display_name:profile?.display_name,bio:cleanBio||null,elite_tier:tier||null,elite_since:since||null,reddit_username:cleanReddit||null});
if(error){showToast("Error saving: "+error.message,"error");return}
if(isOwn){const day=Math.min(28,Math.max(1,parseInt(digestDay||"1",10)||1));const{error:prefErr}=await supabase.from("user_notification_prefs").upsert({user_id:userId,monthly_digest_enabled:digestEnabled,digest_send_day:day,updated_at:new Date().toISOString()});if(prefErr&&!String(prefErr.message||"").includes("user_notification_prefs")){showToast("Profile saved, but email preferences failed to save.","error")}else if(prefErr){showToast("Profile saved. Run digest prefs migration to enable email settings.","error")}}
setProfile({...profile,bio:cleanBio,elite_tier:tier,elite_since:since,reddit_username:cleanReddit});setEditing(false);showToast("Profile saved!")};
const badges=getBadges(stats);const tb=topBadge(stats);const dn=profile?.display_name||"User";
const tierInfo=tier?gt(tier):null;
const hotelMap={};hotels.forEach(h=>{hotelMap[h.id]=h});
return<div><button onClick={onBack} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button>
<div style={{background:"#0f172a",borderRadius:12,padding:36,marginBottom:28,color:"#fff"}}>
<div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
<div style={{width:64,height:64,borderRadius:"50%",background:"#1e293b",border:"2px solid #475569",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,fontFamily:FF,color:"#fff"}}>{dn.charAt(0).toUpperCase()}</div>
<div style={{flex:1}}>
<div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><h1 style={{fontSize:28,fontWeight:700,margin:0,fontFamily:FD}}>{dn}</h1>{tb&&<span style={{fontSize:14}} title={tb.label}>{tb.icon}</span>}</div>
{tierInfo&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}><span style={{fontSize:10,color:"#fff",fontWeight:700,fontFamily:FF,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",padding:"4px 12px",borderRadius:20,textTransform:"uppercase",letterSpacing:0.5}}>{tierInfo.label}{since?` since ${since}`:""}</span></div>}
{profile?.bio&&<p style={{fontSize:13,color:"#cbd5e1",fontFamily:FF,marginTop:8,lineHeight:1.5}}>{profile.bio}</p>}
{profile?.reddit_username&&<a href={`https://reddit.com/u/${profile.reddit_username}`} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#e2e8f0",fontFamily:FF,textDecoration:"none",marginTop:4,display:"inline-block"}}>u/{profile.reddit_username} ↗</a>}
</div>
{isOwn&&!editing&&<button onClick={()=>setEditing(true)} style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"1px solid #475569",borderRadius:6,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FF}}>Edit Profile</button>}
</div></div>
{editing&&<div style={{background:"#fff",borderRadius:10,padding:24,border:"1px solid #e2e8f0",marginBottom:24}}>
<h3 style={{fontSize:16,fontWeight:700,color:"#0f172a",fontFamily:FD,marginTop:0,marginBottom:16}}>Edit Profile</h3>
<div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:14}}>
<div style={{flex:"1 1 180px"}}><label style={LS}>Elite Tier</label><select value={tier} onChange={e=>setTier(e.target.value)} style={IS}><option value="">Select...</option>{TIERS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
<div style={{flex:"1 1 120px"}}><label style={LS}>Elite Since (year)</label><select value={since} onChange={e=>setSince(e.target.value)} style={IS}><option value="">Year...</option>{Array.from({length:15},(_,i)=>2025-i).map(y=><option key={y} value={y}>{y}</option>)}</select></div>
<div style={{flex:"1 1 180px"}}><label style={LS}>Reddit Username</label><input value={reddit} onChange={e=>setReddit(e.target.value.replace(/^u\//,"").slice(0,30))} placeholder="e.g. MarriottGuy" style={IS} maxLength={30}/></div>
</div>
{isOwn&&<div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:14}}>
<div style={{flex:"1 1 220px"}}><label style={LS}>Monthly Email Digest</label><select value={digestEnabled?"enabled":"disabled"} onChange={e=>setDigestEnabled(e.target.value==="enabled")} style={IS}><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></div>
<div style={{flex:"1 1 180px"}}><label style={LS}>Send Day <span style={{fontWeight:400,textTransform:"none"}}>(1-28)</span></label><select value={digestDay} onChange={e=>setDigestDay(e.target.value)} style={IS} disabled={!digestEnabled}>{Array.from({length:28},(_,i)=>String(i+1)).map(d=><option key={d} value={d}>{d}</option>)}</select></div>
</div>}
<div style={{marginBottom:14}}><label style={LS}>Bio <CharCount val={bio} max={200}/></label><textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,200))} placeholder="Tell others about your travel style..." style={{...IS,minHeight:60,resize:"vertical"}} maxLength={200}/></div>
<div style={{display:"flex",gap:8}}><button onClick={save} style={BT()}>Save Profile</button><button onClick={()=>setEditing(false)} style={BT("#e2e8f0","#64748b")}>Cancel</button></div></div>}
<div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
{[{label:"Reports",value:stats.reports,icon:"📊"},{label:"Hotels Reviewed",value:stats.hotels,icon:"🏨"},{label:"Upvotes Received",value:stats.upvotes,icon:"▲"},{label:"Badges Earned",value:badges.length,icon:"🏅"}].map(s=><div key={s.label} style={{flex:"1 1 140px",background:"#fff",borderRadius:10,padding:20,border:"1px solid #e2e8f0",textAlign:"center"}}>
<div style={{fontSize:24,marginBottom:4}}>{s.icon}</div>
<div style={{fontSize:28,fontWeight:700,color:"#0f172a",fontFamily:FD}}>{s.value}</div>
<div style={{fontSize:11,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:1}}>{s.label}</div></div>)}</div>
{badges.length>0&&<div style={{background:"#fff",borderRadius:10,padding:24,border:"1px solid #e2e8f0",marginBottom:24}}>
<h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",fontFamily:FF,marginTop:0,marginBottom:16}}>Badges</h3>
<div style={{display:"flex",gap:12,flexWrap:"wrap"}}>{BADGES.map(b=>{const earned=b.test(stats);return<div key={b.key} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:earned?"#f0fdf4":"#f8fafc",border:earned?"1px solid #bbf7d0":"1px solid #e2e8f0",borderRadius:8,opacity:earned?1:0.4}}>
<span style={{fontSize:20}}>{b.icon}</span><div><div style={{fontSize:12,fontWeight:600,color:"#0f172a",fontFamily:FF}}>{b.label}</div><div style={{fontSize:10,color:"#64748b",fontFamily:FF}}>{b.desc}</div></div></div>})}</div></div>}
{perks.length>0&&<div style={{background:"#fff",borderRadius:10,padding:24,border:"1px solid #e2e8f0"}}>
<h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",fontFamily:FF,marginTop:0,marginBottom:16}}>Recent Reports</h3>
{perks.slice(0,20).map(p=>{const h=hotelMap[p.hotel_id];const cat=gc(p.category);return<div key={p.id} style={{padding:"12px 0",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"flex-start",gap:10}}>
<span style={{fontSize:16}}>{cat.icon}</span><div style={{flex:1}}>
<div style={{fontSize:13,fontWeight:600,color:"#0f172a",fontFamily:FF}}>{h?.name||"Unknown Hotel"}</div>
<div style={{fontSize:11,color:"#64748b",fontFamily:FF}}>{h?.location}</div>
<div style={{fontSize:12,color:"#475569",fontFamily:FF,marginTop:4}}>{p.description}</div>
<CategoryDetailTags category={p.category} details={p.category_details}/>
</div></div>})}
</div>}
{!ld&&!perks.length&&<div style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13,fontFamily:FF}}>{isOwn?"You haven't submitted any reports yet. Start contributing!":"This user hasn't submitted any reports yet."}</div>}
</div>}

function HotelDetail({hotel,user,onBack,onNeedAuth,allHotels,perkCounts,onSelectHotel,onFollowStateChange}){const[sf,ssf]=useState(false),[perks,sp]=useState([]),[cmts,sc]=useState([]),[ld,sl]=useState(true),[err,ser]=useState("");
const[sT,ssT]=useState(""),[sDate,ssDate]=useState(""),[sub,sSub]=useState(false);
const[sBT,ssBT]=useState(""),[sPC,ssPC]=useState("");
const[isFollowing,setIsFollowing]=useState(false),[followBusy,setFollowBusy]=useState(false);
const emptyEntry=()=>({category:"",description:"",upgrade_type:"",category_details:{}});
const[entries,setEntries]=useState([emptyEntry()]);
const updateEntry=(i,field,val)=>{const ne=[...entries];ne[i]={...ne[i],[field]:val};setEntries(ne)};
const addEntry=()=>setEntries([...entries,emptyEntry()]);
const removeEntry=i=>{if(entries.length<=1)return;setEntries(entries.filter((_,j)=>j!==i))};
const[cT,scT]=useState(""),[cX,scX]=useState("");
const[editId,setEditId]=useState(null);const lastSub=useRef(0);
useTitle(`${hotel.name} — Elite Perk Benefits | PerkSnob`);
const load=useCallback(async()=>{sl(true);ser("");try{const{data:pd,error:e1}=await supabase.from("perk_reports").select("*").eq("hotel_id",hotel.id).order("stay_date",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false});if(e1)throw e1;
const{data:votes}=await supabase.from("perk_votes").select("*").in("perk_id",(pd||[]).map(p=>p.id));
const voteMap={};(votes||[]).forEach(v=>{if(!voteMap[v.perk_id])voteMap[v.perk_id]={up:0,down:0,my:0};if(v.vote===1)voteMap[v.perk_id].up++;else voteMap[v.perk_id].down++;if(user&&v.user_id===user.id)voteMap[v.perk_id].my=v.vote});
const perksWithVotes=sortPerksByStayDate((pd||[]).map(p=>({...p,upvotes:voteMap[p.id]?.up||0,downvotes:voteMap[p.id]?.down||0,my_vote:voteMap[p.id]?.my||0})));
sp(perksWithVotes);
if(user?.id){const{data:fd,error:fErr}=await supabase.from("hotel_follows").select("id").eq("hotel_id",hotel.id).eq("user_id",user.id).limit(1);if(!fErr)setIsFollowing(!!(fd&&fd.length));else if(!String(fErr.message||"").includes("hotel_follows"))console.error(fErr)}else setIsFollowing(false);
const{data:cd}=await supabase.from("comments").select("*").eq("hotel_id",hotel.id).order("created_at",{ascending:false});sc(cd||[])}catch(e){ser("Failed to load hotel data. Please try again.");console.error(e)}sl(false)},[hotel.id,user]);useEffect(()=>{load()},[load]);
const toggleFollow=async()=>{if(!user){onNeedAuth();return}if(followBusy)return;setFollowBusy(true);if(isFollowing){const{error}=await supabase.from("hotel_follows").delete().eq("hotel_id",hotel.id).eq("user_id",user.id);if(error){showToast("Couldn't unfollow hotel","error");setFollowBusy(false);return}setIsFollowing(false);onFollowStateChange&&onFollowStateChange(hotel.id,false);showToast("Unfollowed hotel")}else{const{error}=await supabase.from("hotel_follows").insert({hotel_id:hotel.id,user_id:user.id});if(error&&error.code!=="23505"){showToast("Couldn't follow hotel","error");setFollowBusy(false);return}setIsFollowing(true);onFollowStateChange&&onFollowStateChange(hotel.id,true);showToast("Following hotel for updates")}setFollowBusy(false)};
const resetForm=()=>{ssT("");ssDate("");ssBT("");ssPC("");setEntries([emptyEntry()]);setEditId(null);ssf(false)};
const subPerk=async()=>{if(!user){onNeedAuth();return}
const valid=entries.filter(e=>e.category&&e.description.trim());
if(!sT){showToast("Please select your tier","error");return}
if(!valid.length){showToast("Please add at least one category with a description","error");return}
for(const e of valid){if(e.description.trim().length>MAX_DESC){showToast(`Description must be ${MAX_DESC} characters or less`,"error");return}if(hasProfanity(e.description)){showToast("Your report contains inappropriate language. Please revise.","error");return}}
const now=Date.now();if(!editId&&now-lastSub.current<10000){showToast("Please wait a few seconds between submissions","error");return}
sSub(true);
if(editId){const e=valid[0];const row={hotel_id:hotel.id,user_id:user.id,display_name:dname(user),elite_tier:sT,category:e.category,description:sanitize(e.description)};if(sDate)row.stay_date=sDate+"-01";if(sBT)row.booking_type=sBT;if(sPC.trim())row.promo_code=sanitize(sPC);if(e.category==="upgrade"&&e.upgrade_type)row.upgrade_type=e.upgrade_type;
const cd=Object.fromEntries(Object.entries(e.category_details||{}).filter(([_,v])=>v!==undefined&&v!==""&&v!==0));if(Object.keys(cd).length)row.category_details=cd;
const{error}=await supabase.from("perk_reports").update(row).eq("id",editId);if(error){showToast("Error: "+error.message,"error");sSub(false);return}showToast("Perk updated!")}
else{const rows=valid.map(e=>{const row={hotel_id:hotel.id,user_id:user.id,display_name:dname(user),elite_tier:sT,category:e.category,description:sanitize(e.description)};if(sDate)row.stay_date=sDate+"-01";if(sBT)row.booking_type=sBT;if(sPC.trim())row.promo_code=sanitize(sPC);if(e.category==="upgrade"&&e.upgrade_type)row.upgrade_type=e.upgrade_type;
const cd=Object.fromEntries(Object.entries(e.category_details||{}).filter(([_,v])=>v!==undefined&&v!==""&&v!==0));if(Object.keys(cd).length)row.category_details=cd;return row});
const{error}=await supabase.from("perk_reports").insert(rows);if(error){showToast("Error: "+error.message,"error");sSub(false);return}lastSub.current=now;showToast(`${rows.length} perk${rows.length>1?"s":""} submitted! Thanks for contributing.`)}
resetForm();sSub(false);load()};
const startEdit=p=>{setEditId(p.id);ssT(p.elite_tier);setEntries([{category:p.category,description:p.description,upgrade_type:p.upgrade_type||"",category_details:p.category_details||{}}]);ssDate(p.stay_date?p.stay_date.slice(0,7):"");ssBT(p.booking_type||"");ssPC(p.promo_code||"");ssf(true);window.scrollTo({top:0,behavior:"smooth"})};
const deletePerk=async p=>{const{error}=await supabase.from("perk_reports").delete().eq("id",p.id);if(error){showToast("Error deleting: "+error.message,"error");return}showToast("Perk deleted.");load()};
const subCmt=async()=>{if(!user){onNeedAuth();return}if(!cT||!cX.trim())return;if(cX.trim().length>MAX_TIP){showToast(`Tip must be ${MAX_TIP} characters or less`,"error");return}if(hasProfanity(cX)){showToast("Your tip contains inappropriate language. Please revise.","error");return}const{error}=await supabase.from("comments").insert({hotel_id:hotel.id,user_id:user.id,display_name:dname(user),elite_tier:cT,text:sanitize(cX)});if(error){showToast("Error: "+error.message,"error");return}scT("");scX("");showToast("Tip posted!");load()};
const lastVote=useRef(0);
const vote=async(p,val)=>{if(!user){onNeedAuth();return}
if(p.user_id===user.id){showToast("You can't vote on your own report","error");return}
const now=Date.now();if(now-lastVote.current<2000){showToast("Please wait between votes","error");return}lastVote.current=now;
if(val===0){await supabase.from("perk_votes").delete().eq("perk_id",p.id).eq("user_id",user.id);showToast("Vote removed.")}
else{const{error}=await supabase.from("perk_votes").upsert({perk_id:p.id,user_id:user.id,vote:val},{onConflict:"perk_id,user_id"});if(error){showToast(error.message.includes("self")||error.message.includes("own")?"You can't vote on your own report":error.message,"error");return}showToast(val===1?"Upvoted!":"Downvoted.")}
load()};
const byTier={};const tierUp={ambassador:["ambassador","titanium","platinum","gold","silver"],titanium:["titanium","platinum","gold","silver"],platinum:["platinum","gold","silver"],gold:["gold","silver"],silver:["silver"]};TIERS.forEach(t=>{const show=tierUp[t.key]||[t.key];byTier[t.key]=perks.filter(p=>show.includes(p.elite_tier))});const tr=perks.length,catC=new Set(perks.map(p=>p.category)).size,score=pscore(tr,catC);
if(err)return<div style={{textAlign:"center",padding:60}}><p style={{color:"#dc2626",fontFamily:FF,marginBottom:12}}>{err}</p><button onClick={load} style={BT()}>Retry</button><button onClick={onBack} style={{...BT("#e2e8f0","#64748b"),marginLeft:8}}>← Back</button></div>;
return<div><button onClick={onBack} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button>
<div style={{background:"#0f172a",borderRadius:12,padding:"36px 32px",marginBottom:28,color:"#fff"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
<div><p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:FF,margin:"0 0 8px"}}>{hotel.brand}</p><h1 style={{fontSize:30,fontWeight:700,margin:"0 0 6px",fontFamily:FD,lineHeight:1.2}}>{hotel.name}</h1><p style={{fontSize:14,color:"#94a3b8",fontFamily:FF,margin:0}}>{hotel.location}</p></div>
<div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
{tr>0&&<ScoreBadge score={score}/>}
<button onClick={toggleFollow} disabled={followBusy} style={{...BT(isFollowing?"#e2e8f0":"#fff",isFollowing?"#334155":"#0f172a"),padding:"7px 12px",fontSize:11,opacity:followBusy?0.7:1}}>{isFollowing?"Following ✓":"Follow Hotel"}</button>
</div></div>
<div style={{display:"flex",gap:14,marginTop:24,flexWrap:"wrap"}}>{TIERS.map(t=><div key={t.key} style={{background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"12px 18px",border:"1px solid rgba(255,255,255,0.08)"}}><div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontFamily:FF}}>{t.label}</div><div style={{fontSize:22,fontWeight:700,color:"#fff",fontFamily:FD}}>{byTier[t.key]?.length||0} <span style={{fontSize:11,fontWeight:400,color:"#94a3b8",fontFamily:FF}}>perks</span></div></div>)}</div>
<HotelInfoBar hotel={hotel} user={user} onNeedAuth={onNeedAuth}/>
</div>
<div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
<span style={{fontSize:15,fontWeight:700,color:"#0f172a",fontFamily:FF}}>Perks Overview</span>
<span style={{fontSize:11,color:"#64748b",fontFamily:FF}}>Sorted by stay date (most recent first)</span></div>
<div style={{background:"#f8fafc",borderRadius:10,padding:28,border:"1px solid #e2e8f0",marginBottom:24}}>
{sf&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h3 style={{fontSize:20,fontWeight:700,color:"#0f172a",fontFamily:FD,margin:0}}>{editId?"Edit Perk":"Report Your Stay"}</h3><button onClick={()=>{resetForm()}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:20,fontFamily:FF,padding:"0 4px",lineHeight:1}}>×</button></div>}
{!sf&&<h3 style={{fontSize:18,fontWeight:700,color:"#0f172a",fontFamily:FD,marginBottom:16}}>Report Your Stay</h3>}
<div onClick={()=>{if(!user&&!sf){onNeedAuth()}}}>
<div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}><div style={{flex:"1 1 160px"}}><label style={LS}>Your Tier</label><select value={sT} onChange={e=>{if(!user){onNeedAuth();return}ssT(e.target.value);if(!sf)ssf(true)}} style={IS}><option value="">Select...</option>{TIERS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
<div style={{flex:"1 1 200px"}}><label style={LS}>When did you stay?</label><div style={{display:"flex",gap:6}}><select value={sDate?sDate.split("-")[1]:""} onChange={e=>{if(!user){onNeedAuth();return}if(!sf)ssf(true);const yr=sDate?sDate.split("-")[0]:String(new Date().getFullYear());if(e.target.value)ssDate(yr+"-"+e.target.value);else ssDate("")}} style={{...IS,flex:1}}><option value="">Month</option>{["01","02","03","04","05","06","07","08","09","10","11","12"].map((m,i)=>{const now=new Date();const yr=sDate?parseInt(sDate.split("-")[0]):now.getFullYear();const disabled=yr===now.getFullYear()&&(i+1)>now.getMonth()+1;return<option key={m} value={m} disabled={disabled}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i]}</option>})}</select>
<select value={sDate?sDate.split("-")[0]:""} onChange={e=>{if(!user){onNeedAuth();return}if(!sf)ssf(true);const mo=sDate?sDate.split("-")[1]:"01";if(e.target.value){const now=new Date();const yr=parseInt(e.target.value);if(yr===now.getFullYear()&&parseInt(mo)>now.getMonth()+1)ssDate(e.target.value+"-"+String(now.getMonth()+1).padStart(2,"0"));else ssDate(e.target.value+"-"+mo)}else ssDate("")}} style={{...IS,flex:1}}><option value="">Year</option>{Array.from({length:6},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y}>{y}</option>)}</select></div></div>
<div style={{flex:"1 1 180px"}}><label style={LS}>Booking Type <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label><select value={sBT} onChange={e=>{if(!user){onNeedAuth();return}if(!sf)ssf(true);ssBT(e.target.value)}} style={IS}><option value="">Select...</option>{BOOKING_TYPES.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
<div style={{flex:"1 1 180px"}}><label style={LS}>Promo/Corp Code <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label><input value={sPC} onChange={e=>{if(!user){onNeedAuth();return}if(!sf)ssf(true);ssPC(e.target.value.slice(0,30))}} placeholder="e.g. MMP" style={IS} maxLength={30} onFocus={()=>{if(!user)onNeedAuth()}}/></div></div>
{(sf||editId)&&<>{entries.map((entry,i)=><div key={i} style={{background:"#fff",borderRadius:8,padding:20,border:"1px solid #e2e8f0",marginBottom:12,position:"relative"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
<span style={{fontSize:13,fontWeight:700,color:"#0f172a",fontFamily:FF}}>Perk {entries.length>1?`#${i+1}`:""}</span>
{entries.length>1&&<button onClick={()=>removeEntry(i)} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:18,fontFamily:FF,padding:0,lineHeight:1}} aria-label="Remove this perk">×</button>}</div>
<div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:12}}>
<div style={{flex:"1 1 180px"}}><label style={LS}>Category</label><select value={entry.category} onChange={e=>{const ne=[...entries];ne[i]={...ne[i],category:e.target.value,category_details:{}};setEntries(ne)}} style={IS}><option value="">Select...</option>{CATS.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div></div>
{entry.category==="upgrade"&&<div style={{marginBottom:12}}><label style={LS}>Upgrade Type</label><select value={entry.upgrade_type||""} onChange={e=>updateEntry(i,"upgrade_type",e.target.value)} style={IS}><option value="">Select type...</option>{UPGRADE_TYPES.map(u=><option key={u} value={u}>{u}</option>)}</select></div>}
{entry.category&&<CategoryDetailFields category={entry.category} details={entry.category_details||{}} onChange={cd=>updateEntry(i,"category_details",cd)}/>}
<div><label style={LS}>Describe the perk <CharCount val={entry.description} max={MAX_DESC}/></label><textarea value={entry.description} onChange={e=>updateEntry(i,"description",e.target.value.slice(0,MAX_DESC))} placeholder="e.g., Full hot buffet at the main restaurant, free for all Platinum+" style={{...IS,minHeight:70,resize:"vertical"}} maxLength={MAX_DESC}/></div>
</div>)}
{!editId&&<button onClick={addEntry} style={{background:"#fff",color:"#0f172a",border:"2px dashed #e2e8f0",borderRadius:8,padding:"12px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FF,width:"100%",marginBottom:16,transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#0f172a"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>+ Add another category</button>}
<div style={{display:"flex",gap:8}}><button onClick={subPerk} disabled={sub} style={{...BT(),opacity:sub?0.5:1}}>{editId?"Save Changes":`Submit ${entries.filter(e=>e.category&&e.description.trim()).length||""} Perk${entries.filter(e=>e.category&&e.description.trim()).length!==1?"s":""}`}</button><button onClick={resetForm} style={BT("#e2e8f0","#64748b")}>{editId?"Cancel Edit":"Cancel"}</button></div></>}
</div></div>
{ld?<div style={{padding:20}}><Skeleton h={200} r={8}/><div style={{height:12}}/><Skeleton h={150} r={8}/><div style={{height:12}}/><Skeleton h={150} r={8}/></div>:
<div className="ps-detail-layout" style={{display:"flex",gap:24,alignItems:"flex-start"}}>
<div style={{flex:"1 1 0",minWidth:0}}>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,padding:"10px 14px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}><span style={{fontSize:12,color:"#64748b",fontFamily:FF,lineHeight:1.5}}><strong style={{fontWeight:700}}>Note:</strong> Perks cascade upward by tier. For example, Platinum perks also appear under Titanium and Ambassador, since higher tiers receive all lower-tier benefits.</span></div>
{(()=>{const ut=user?.user_metadata?.elite_tier;const tierOrder=ut&&ut!=="none"?[ut,...TIERS.map(t=>t.key).filter(k=>k!==ut)]:TIERS.map(t=>t.key);
return tierOrder.map((tk,idx)=>{const isUserTier=ut&&ut!=="none"&&tk===ut;const isFirst=idx===0;
return<TierSection key={tk} tier={tk} perks={byTier[tk]} user={user} onVote={vote} onEdit={startEdit} onDelete={deletePerk} defaultOpen={isUserTier||!ut||ut==="none"||isFirst} highlight={isUserTier}/>})})()}
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
</div></div></div>}
<NearbyHotels hotel={hotel} allHotels={allHotels||[]} perkCounts={perkCounts||{}} onSelect={onSelectHotel||(()=>{})}/>
</div>}

function HotelCard({hotel,perkCounts,score,onClick,user,isFollowing,onToggleFollow,isFollowBusy}){const c=perkCounts[hotel.id]||0;const followed=!!isFollowing?.(hotel.id);const busy=!!isFollowBusy?.(hotel.id);return<div onClick={onClick} tabIndex={0} role="button" aria-label={`${hotel.name} — ${c} perk reports`} onKeyDown={e=>e.key==="Enter"&&onClick()} style={{background:"#fff",borderRadius:10,padding:"20px 22px",border:"1px solid #e2e8f0",cursor:"pointer",transition:"all 0.15s",display:"flex",flexDirection:"column",justifyContent:"space-between"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#0f172a";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(15,23,42,0.08)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}>
<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}><span style={{fontSize:9,fontWeight:700,color:"#94a3b8",fontFamily:FF,textTransform:"uppercase",letterSpacing:1.5}}>{hotel.brand}</span><div style={{display:"flex",alignItems:"center",gap:6}}>{score>0&&<span style={{fontSize:13,fontWeight:700,color:score>=70?"#059669":score>=40?"#d97706":"#dc2626",fontFamily:FF}}>{score}</span>}{user&&onToggleFollow&&<button onClick={e=>{e.stopPropagation();onToggleFollow(hotel.id,followed)}} disabled={busy} style={{background:followed?"#e2e8f0":"#f8fafc",border:"1px solid #e2e8f0",borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,color:followed?"#334155":"#475569",fontFamily:FF,cursor:"pointer",opacity:busy?0.65:1}}>{followed?"Following":"Follow"}</button>}</div></div>
<div style={{fontSize:15,fontWeight:700,color:"#0f172a",fontFamily:FF,marginBottom:3,lineHeight:1.3}}>{hotel.name}</div><div style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>{hotel.location}</div></div>
<div style={{fontSize:12,color:"#64748b",fontFamily:FF,display:"flex",alignItems:"center",gap:4,marginTop:14,paddingTop:12,borderTop:"1px solid #f1f5f9"}}><span style={{color:"#0f172a",fontWeight:700,fontSize:15}}>{c}</span> perk reports{hotel.room_count&&<span style={{marginLeft:"auto",fontSize:10,color:"#94a3b8"}}>{hotel.room_count} rooms</span>}</div></div>}

function AddPerkModal({onClose,user,onNeedAuth,hotels,onSelect,onRequestHotel}){const[q,sq]=useState("");
const matches=q.trim().length<2?[]:hotels.filter(h=>{const w=q.toLowerCase().split(/\s+/).filter(x=>x.length>1);const hay=[h.name,h.location,h.region||"",h.brand].join(" ").toLowerCase();return w.every(x=>hay.includes(x))}).slice(0,8);
return<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}} onClick={onClose}><div style={{background:"#fff",borderRadius:12,padding:40,maxWidth:480,width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,0.15)",maxHeight:"80vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()} role="dialog" aria-label="Add a perk">
<h2 style={{fontSize:24,fontFamily:FD,fontWeight:700,marginBottom:4,color:"#0f172a"}}>Add a Perk</h2><p style={{fontSize:13,color:"#94a3b8",marginBottom:20,fontFamily:FF}}>Search for a hotel to submit your perk report.</p>
<div style={{position:"relative",marginBottom:16}}><input value={q} onChange={e=>sq(e.target.value)} placeholder="Search hotels..." style={{...IS,fontSize:15,padding:"14px 18px"}} autoFocus/>
{q&&<button onClick={()=>sq("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16}}>×</button>}</div>
<div style={{overflowY:"auto",flex:1,minHeight:0}}>
{q.trim().length>=2&&matches.length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8",fontSize:13,fontFamily:FF}}>
<div style={{marginBottom:10}}>No hotels found matching "{q}"</div>
{onRequestHotel&&<button onClick={()=>onRequestHotel(q.trim())} style={{...BT("#fff","#0f172a"),border:"1px solid #e2e8f0",padding:"8px 14px",fontSize:12}}>Request this hotel</button>}
</div>}
{matches.map(h=><div key={h.id} onClick={()=>{onSelect(h);onClose()}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderBottom:"1px solid #f1f5f9",cursor:"pointer",borderRadius:6,transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
<div><div style={{fontSize:14,fontWeight:600,color:"#0f172a",fontFamily:FF}}>{h.name}</div><div style={{fontSize:11,color:"#94a3b8",fontFamily:FF}}>{h.brand} · {h.location}</div></div>
<span style={{fontSize:12,color:"#64748b",fontFamily:FF}}>→</span></div>)}
{!q.trim()&&<div style={{textAlign:"center",padding:20}}><div style={{fontSize:32,marginBottom:8}}>🏨</div><p style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>Start typing to find your hotel</p></div>}
</div>
</div></div>}

function RequestHotelModal({onClose,user,onNeedAuth,initialName=""}){const[hotelName,setHotelName]=useState(initialName),[brand,setBrand]=useState(""),[city,setCity]=useState(""),[state,setState]=useState(""),[country,setCountry]=useState(""),[marriottCode,setMarriottCode]=useState(""),[marriottUrl,setMarriottUrl]=useState(""),[notes,setNotes]=useState(""),[submitting,setSubmitting]=useState(false);
const submit=async()=>{if(!user){onNeedAuth();return}
const cleanName=sanitize(hotelName||"").slice(0,120).trim(),cleanBrand=sanitize(brand||"").slice(0,80).trim(),cleanCity=sanitize(city||"").slice(0,80).trim(),cleanState=sanitize(state||"").slice(0,80).trim(),cleanCountry=sanitize(country||"").slice(0,80).trim(),cleanCode=sanitize(marriottCode||"").slice(0,20).trim().toUpperCase(),cleanNotes=sanitize(notes||"").slice(0,MAX_HOTEL_REQUEST_NOTES).trim(),cleanUrl=(marriottUrl||"").trim();
if(!cleanName){showToast("Hotel name is required","error");return}
if(hasProfanity(cleanName)||hasProfanity(cleanNotes)){showToast("Please remove inappropriate language","error");return}
if(!cleanCity&&!cleanCountry&&!cleanCode&&!cleanUrl){showToast("Add city/country, Marriott code, or Marriott URL","error");return}
if(cleanUrl&&!/^https?:\/\/\S+$/i.test(cleanUrl)){showToast("Enter a valid Marriott URL (https://...)","error");return}
setSubmitting(true);
const row={user_id:user.id,hotel_name:cleanName};if(cleanBrand)row.brand=cleanBrand;if(cleanCity)row.city=cleanCity;if(cleanState)row.state=cleanState;if(cleanCountry)row.country=cleanCountry;if(cleanCode)row.marriott_code=cleanCode;if(cleanUrl)row.marriott_url=cleanUrl;if(cleanNotes)row.notes=cleanNotes;
const{error}=await supabase.from("hotel_requests").insert(row);
setSubmitting(false);
if(error?.code==="23505"){showToast("You already requested this hotel.","error");return}
if(error){showToast("Error submitting request: "+error.message,"error");return}
showToast("Hotel request submitted. We'll review and add it soon.");onClose()};
return<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}} onClick={onClose}><div style={{background:"#fff",borderRadius:12,padding:28,maxWidth:560,width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,0.15)",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()} role="dialog" aria-label="Request missing hotel">
<h2 style={{fontSize:24,fontFamily:FD,fontWeight:700,marginBottom:4,color:"#0f172a"}}>Request a Missing Hotel</h2>
<p style={{fontSize:13,color:"#94a3b8",marginBottom:20,fontFamily:FF,lineHeight:1.5}}>Couldn't find your property? Submit it here and we'll review it for import.</p>
<div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
<div style={{flex:"1 1 240px"}}><label style={LS}>Hotel Name</label><input value={hotelName} onChange={e=>setHotelName(e.target.value.slice(0,120))} placeholder="e.g. Marriott Marquis Chicago" style={IS} maxLength={120} autoFocus/></div>
<div style={{flex:"1 1 200px"}}><label style={LS}>Brand <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label><select value={brand} onChange={e=>setBrand(e.target.value)} style={IS}><option value="">Select...</option>{BRANDS.map(b=><option key={b} value={b}>{b}</option>)}<option value="Other">Other</option></select></div>
<div style={{flex:"1 1 170px"}}><label style={LS}>City <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label><input value={city} onChange={e=>setCity(e.target.value.slice(0,80))} placeholder="City" style={IS} maxLength={80}/></div>
<div style={{flex:"1 1 120px"}}><label style={LS}>State/Region <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label><input value={state} onChange={e=>setState(e.target.value.slice(0,80))} placeholder="State" style={IS} maxLength={80}/></div>
<div style={{flex:"1 1 170px"}}><label style={LS}>Country <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label><input value={country} onChange={e=>setCountry(e.target.value.slice(0,80))} placeholder="Country" style={IS} maxLength={80}/></div>
<div style={{flex:"1 1 160px"}}><label style={LS}>Marriott Code <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label><input value={marriottCode} onChange={e=>setMarriottCode(e.target.value.slice(0,20).toUpperCase())} placeholder="e.g. NYCMQ" style={IS} maxLength={20}/></div>
<div style={{flex:"1 1 100%"}}><label style={LS}>Marriott URL <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label><input value={marriottUrl} onChange={e=>setMarriottUrl(e.target.value.slice(0,220))} placeholder="https://www.marriott.com/..." style={IS} maxLength={220}/></div>
<div style={{flex:"1 1 100%"}}><label style={LS}>Notes <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span> <CharCount val={notes} max={MAX_HOTEL_REQUEST_NOTES}/></label><textarea value={notes} onChange={e=>setNotes(e.target.value.slice(0,MAX_HOTEL_REQUEST_NOTES))} placeholder="Anything that helps identify this property..." style={{...IS,minHeight:72,resize:"vertical"}} maxLength={MAX_HOTEL_REQUEST_NOTES}/></div>
</div>
<div style={{display:"flex",gap:8,marginTop:18}}><button onClick={submit} disabled={submitting} style={{...BT(),opacity:submitting?0.6:1}}>{submitting?"Submitting...":"Submit Request"}</button><button onClick={onClose} style={BT("#e2e8f0","#64748b")}>Cancel</button></div>
</div></div>}

function AdminHotelRequests({user,isAdmin,onClose,onNeedAuth}){const[statusFilter,setStatusFilter]=useState("pending"),[rows,setRows]=useState([]),[counts,setCounts]=useState({pending:0,approved:0,rejected:0,duplicate:0}),[ld,setLd]=useState(true),[err,setErr]=useState(""),[acting,setActing]=useState("");
const load=useCallback(async()=>{if(!user||!isAdmin){setRows([]);setLd(false);return}setLd(true);setErr("");try{let q=supabase.from("hotel_requests").select("*").order("created_at",{ascending:false}).limit(200);if(statusFilter!=="all")q=q.eq("status",statusFilter);const{data,error}=await q;if(error)throw error;setRows(data||[]);const{data:all,error:countErr}=await supabase.from("hotel_requests").select("status").order("created_at",{ascending:false}).limit(1000);if(!countErr){const c={pending:0,approved:0,rejected:0,duplicate:0};(all||[]).forEach(r=>{if(c[r.status]!==undefined)c[r.status]+=1});setCounts(c)}}catch(e){setErr("Failed to load requests. Please verify the migration and admin setup.");console.error(e)}setLd(false)},[statusFilter,user,isAdmin]);
useEffect(()=>{load()},[load]);
if(!user)return<div style={{textAlign:"center",padding:60}}><h3 style={{fontSize:20,fontWeight:700,color:"#0f172a",fontFamily:FD,marginBottom:8}}>Admin Queue</h3><p style={{fontSize:13,color:"#64748b",fontFamily:FF,marginBottom:18}}>Sign in to access hotel request moderation.</p><button onClick={onNeedAuth} style={BT()}>Sign In</button><button onClick={onClose} style={{...BT("#e2e8f0","#64748b"),marginLeft:8}}>← Back</button></div>;
if(!isAdmin)return<div style={{textAlign:"center",padding:60}}><h3 style={{fontSize:20,fontWeight:700,color:"#0f172a",fontFamily:FD,marginBottom:8}}>Access denied</h3><p style={{fontSize:13,color:"#64748b",fontFamily:FF,marginBottom:18}}>Your account is not in the admin list.</p><button onClick={onClose} style={BT("#e2e8f0","#64748b")}>← Back</button></div>;
const fmtDate=v=>new Date(v).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});
const reqLocation=r=>[r.city,r.state,r.country].filter(Boolean).join(", ");
const strip=u=>Object.fromEntries(Object.entries(u).filter(([_,v])=>v!==undefined&&v!==null&&v!==""));
const updateRequestStatus=async(req,status,hotelId=null)=>{const body={status,reviewed_by:user.id,reviewed_at:new Date().toISOString()};if(hotelId)body.hotel_id=hotelId;const{error}=await supabase.from("hotel_requests").update(body).eq("id",req.id);if(error)throw error};
const slugExists=async slug=>{const{data,error}=await supabase.from("hotels").select("id").eq("slug",slug).limit(1);if(error)return false;return!!(data&&data.length)};
const nextSlug=async base=>{let i=0;let candidate=base;while(i<200){if(!(await slugExists(candidate)))return candidate;i+=1;candidate=`${base}-${i+1}`;}return`${base}-${Date.now()}`};
const findExistingHotel=async req=>{if(req.marriott_code){const{data,error}=await supabase.from("hotels").select("id,name,slug").eq("marriott_code",req.marriott_code).limit(1);if(!error&&data?.length)return data[0]}const base=mkSlug(req.hotel_name||"");const{data,error}=await supabase.from("hotels").select("id,name,slug").eq("slug",base).limit(1);if(!error&&data?.length)return data[0];return null};
const mark=async(req,status)=>{setActing(req.id+status);try{await updateRequestStatus(req,status);showToast(`Marked as ${status}.`);load()}catch(e){showToast("Failed to update request: "+(e?.message||"unknown error"),"error")}setActing("")};
const approve=async req=>{setActing(req.id+"approve");try{const existing=await findExistingHotel(req);if(existing){await updateRequestStatus(req,"duplicate",existing.id);showToast("Existing hotel found. Marked as duplicate.");load();setActing("");return}const slugBase=mkSlug(req.hotel_name||"hotel-request"),slug=await nextSlug(slugBase),location=reqLocation(req)||req.country||"Unknown";const brand=req.brand||"Marriott";const base={name:req.hotel_name,brand,slug,location,city:req.city,state:req.state,country:req.country,marriott_code:req.marriott_code};const candidates=[strip({...base,status:"approved",approved:true,submitted_by:req.user_id}),strip({...base,status:"approved",submitted_by:req.user_id}),strip({...base,approved:true,submitted_by:req.user_id}),strip({...base,submitted_by:req.user_id}),strip({name:base.name,brand:base.brand,slug:base.slug,location:base.location,status:"approved"}),strip({name:base.name,brand:base.brand,slug:base.slug,location:base.location}),strip({name:base.name,brand:base.brand,slug:base.slug,status:"approved"}),strip({name:base.name,brand:base.brand,slug:base.slug})];let inserted=null,lastErr=null;for(const payload of candidates){const{data,error}=await supabase.from("hotels").insert(payload).select("id,name").single();if(!error&&data){inserted=data;break}lastErr=error}if(!inserted)throw new Error(lastErr?.message||"Could not insert hotel row");await updateRequestStatus(req,"approved",inserted.id);showToast("Approved and added hotel.");load()}catch(e){showToast("Approve failed: "+(e?.message||"unknown error"),"error")}setActing("")};
return<div><button onClick={onClose} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button>
<div style={{background:"#0f172a",borderRadius:12,padding:36,marginBottom:28,color:"#fff"}}><p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:FF}}>Admin</p><h1 style={{fontSize:34,fontWeight:700,margin:"0 0 6px",fontFamily:FD}}>Hotel Requests Queue</h1><p style={{fontSize:14,color:"#94a3b8",fontFamily:FF,margin:0}}>Review missing-hotel submissions and auto-add approved properties.</p></div>
<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>{[{k:"pending",l:"Pending"},{k:"approved",l:"Approved"},{k:"rejected",l:"Rejected"},{k:"duplicate",l:"Duplicate"},{k:"all",l:"All"}].map(f=>{const active=statusFilter===f.k;const count=f.k==="all"?Object.values(counts).reduce((a,b)=>a+b,0):(counts[f.k]||0);return<button key={f.k} onClick={()=>setStatusFilter(f.k)} style={{background:active?"#0f172a":"#fff",color:active?"#fff":"#334155",border:active?"1px solid #0f172a":"1px solid #e2e8f0",borderRadius:20,padding:"6px 12px",fontSize:12,fontFamily:FF,cursor:"pointer"}}>{f.l} ({count})</button>})}<button onClick={load} style={BT("#fff","#334155")}>Refresh</button></div>
{err&&<div role="alert" style={{background:"#fef2f2",color:"#dc2626",padding:"10px 14px",borderRadius:8,fontSize:12,fontFamily:FF,marginBottom:12}}>{err}</div>}
{ld?<div style={{padding:20}}><Skeleton h={100} r={8}/><div style={{height:10}}/><Skeleton h={100} r={8}/></div>:rows.length===0?<div style={{textAlign:"center",padding:40,color:"#94a3b8",fontFamily:FF}}>No requests in this view.</div>:<div style={{display:"grid",gap:10}}>{rows.map(r=>{const loc=reqLocation(r);const act=acting.startsWith(r.id);return<div key={r.id} style={{background:"#fff",borderRadius:10,padding:18,border:"1px solid #e2e8f0"}}>
<div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}><div><div style={{fontSize:16,fontWeight:700,color:"#0f172a",fontFamily:FF,lineHeight:1.25}}>{r.hotel_name}</div><div style={{fontSize:12,color:"#64748b",fontFamily:FF,marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>{r.brand&&<span>{r.brand}</span>}{loc&&<><span>·</span><span>{loc}</span></>}{r.marriott_code&&<><span>·</span><span>{r.marriott_code}</span></>}</div></div><span style={{...TAG(r.status==="approved"?"#ecfdf5":r.status==="pending"?"#eff6ff":r.status==="duplicate"?"#fffbeb":"#fef2f2",r.status==="approved"?"#15803d":r.status==="pending"?"#1d4ed8":r.status==="duplicate"?"#a16207":"#dc2626"),fontSize:10,padding:"4px 8px"}}>{r.status}</span></div>
<div style={{fontSize:11,color:"#94a3b8",fontFamily:FF,marginTop:8}}>Requested {fmtDate(r.created_at)} · requester {r.user_id?.slice(0,8)}...</div>
{r.marriott_url&&<div style={{marginTop:8}}><a href={r.marriott_url} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#2563eb",fontFamily:FF,textDecoration:"none"}}>Open Marriott URL</a></div>}
{r.notes&&<div style={{marginTop:8,fontSize:12,color:"#475569",fontFamily:FF,background:"#f8fafc",border:"1px solid #f1f5f9",borderRadius:6,padding:"8px 10px"}}>{r.notes}</div>}
<div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}><button disabled={act||r.status==="approved"} onClick={()=>approve(r)} style={{...BT(),opacity:act||r.status==="approved"?0.6:1}}>Approve + Add Hotel</button><button disabled={act||r.status==="rejected"} onClick={()=>mark(r,"rejected")} style={{...BT("#fff","#dc2626"),border:"1px solid #fecaca",opacity:act||r.status==="rejected"?0.6:1}}>Reject</button><button disabled={act||r.status==="duplicate"} onClick={()=>mark(r,"duplicate")} style={{...BT("#fff","#a16207"),border:"1px solid #fde68a",opacity:act||r.status==="duplicate"?0.6:1}}>Mark Duplicate</button></div>
</div>})}</div>}
</div>}


export default function App(){const[path,nav]=usePath();const[user,su]=useState(null),[isAdmin,setIsAdmin]=useState(false),[hotels,sh]=useState([]),[pc,spc]=useState({}),[scores,ssc]=useState({}),[search,ss]=useState(""),[bf,sbf]=useState(""),[showAuth,ssa]=useState(false),[showAdd,ssad]=useState(false),[showReqHotel,setShowReqHotel]=useState(false),[reqHotelSeed,setReqHotelSeed]=useState(""),[profId,spid]=useState(null),[ld,sld]=useState(true),[showAll,setSA]=useState(false),[perkFilter,setPF]=useState([]),[hotelPerks,setHP]=useState({}),[followedHotelIds,setFollowedHotelIds]=useState(new Set()),[followBusyIds,setFollowBusyIds]=useState(new Set());
const[pgNum,setPgNum]=useState(1),[regionFilter,setRF]=useState("");

const hotelSlug=path.startsWith("/hotel/")?path.split("/hotel/")[1]:null;
const citySlug=path.startsWith("/city/")?decodeURIComponent(path.split("/city/")[1]):null;
const brandSlug=path.startsWith("/brand/")?decodeURIComponent(path.split("/brand/")[1]):null;
const sel=hotelSlug?hotels.find(h=>(h.slug||mkSlug(h.name))===hotelSlug):null;
const page=path==="/leaderboard"?"leaderboard":path==="/search"?"search":path==="/compare"?"compare":path==="/following"?"following":path==="/admin/requests"?"admin_requests":path.startsWith("/profile/")?"profile":citySlug?"city":brandSlug?"brand":hotelSlug?"hotel":"home";

const pageTitle=page==="hotel"&&sel?`${sel.name} — Elite Perk Benefits | PerkSnob`:page==="city"&&citySlug?`Marriott Hotels in ${citySlug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())} | PerkSnob`:page==="brand"&&brandSlug?`${brandSlug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())} Hotels | PerkSnob`:page==="leaderboard"?"Leaderboard | PerkSnob":page==="search"?"Search Perks | PerkSnob":page==="compare"?"Compare Hotels | PerkSnob":page==="following"?"Following Feed | PerkSnob":page==="admin_requests"?"Admin Requests | PerkSnob":"PerkSnob — Marriott Elite Benefits, Crowdsourced";
const pageDescription=page==="hotel"&&sel?`Crowdsourced Marriott elite perks, upgrades, and breakfast intel for ${sel.name}${sel.location?` in ${sel.location}`:""}.`:page==="city"&&citySlug?`Compare Marriott elite perks, benefits, and reports across properties in ${citySlug.replace(/-/g," ")}.`:page==="brand"&&brandSlug?`See community-reported elite benefits across ${brandSlug.replace(/-/g," ")} properties.`:page==="following"?"Recent activity from hotels you follow, sorted by stay date.":page==="leaderboard"?"Top PerkSnob contributors and community reporters.":page==="search"?"Search crowdsourced elite perks across Marriott properties.":"Real Marriott Bonvoy elite benefits reported by real guests. Know what to expect before you book.";
const canonicalUrl=`https://perksnob.com${path==="/"
?"":path}`;
const robots=page==="admin_requests"||page==="profile"||page==="following"?"noindex,nofollow":"index,follow";
const jsonLd=useMemo(()=>{if(page==="hotel"&&sel)return{"@context":"https://schema.org","@type":"Hotel",name:sel.name,url:canonicalUrl,brand:sel.brand||"Marriott",address:sel.location?{"@type":"PostalAddress",addressLocality:sel.location}:undefined};if(page==="brand"&&brandSlug)return{"@context":"https://schema.org","@type":"CollectionPage",name:`${brandSlug.replace(/-/g," ")} Hotels`,url:canonicalUrl};if(page==="city"&&citySlug)return{"@context":"https://schema.org","@type":"CollectionPage",name:`Marriott Hotels in ${citySlug.replace(/-/g," ")}`,url:canonicalUrl};return{"@context":"https://schema.org","@type":"WebSite",name:"PerkSnob",url:"https://perksnob.com",potentialAction:{"@type":"SearchAction",target:"https://perksnob.com/search","query-input":"required name=search_term_string"}}},[page,sel,brandSlug,citySlug,canonicalUrl]);
useSeo({title:pageTitle,description:pageDescription,url:canonicalUrl,image:"https://perksnob.com/og-image.png",robots,jsonLd});

const loadH=async()=>{sld(true);try{
/* Supabase default limit is 1000 — paginate to load all hotels */
let allHotels=[];let from=0;const step=1000;
while(true){const{data,error}=await supabase.from("hotels").select("*").eq("status","approved").order("name").range(from,from+step-1);if(error)throw error;if(!data||!data.length)break;allHotels=allHotels.concat(data);if(data.length<step)break;from+=step}
sh(allHotels);const{data:rp}=await supabase.from("perk_reports").select("hotel_id,category,category_details,stay_date,created_at");const c={},cats={},hp={};(rp||[]).forEach(r=>{c[r.hotel_id]=(c[r.hotel_id]||0)+1;if(!cats[r.hotel_id])cats[r.hotel_id]=new Set();cats[r.hotel_id].add(r.category);if(!hp[r.hotel_id])hp[r.hotel_id]=[];hp[r.hotel_id].push({category:r.category,details:r.category_details,stay_date:r.stay_date,created_at:r.created_at})});spc(c);setHP(hp);const sc={};Object.keys(c).forEach(id=>{sc[id]=pscore(c[id],cats[id]?.size||0)});ssc(sc)}catch(e){console.error("Failed to load hotels:",e)}sld(false)};
useEffect(()=>{supabase.auth.getUser().then(({data})=>{if(data?.user)su(data.user)});supabase.auth.onAuthStateChange((_,s)=>{su(s?.user||null)});loadH()},[]);
useEffect(()=>{let mounted=true;(async()=>{if(!user?.id){if(mounted)setIsAdmin(false);return}const{data,error}=await supabase.from("app_admins").select("user_id").eq("user_id",user.id).maybeSingle();if(!mounted)return;if(error&&error.code!=="PGRST116"){console.error("Admin check failed:",error);setIsAdmin(false);return}setIsAdmin(!!data)})();return()=>{mounted=false}},[user?.id]);
useEffect(()=>{let mounted=true;(async()=>{if(!user?.id){if(mounted)setFollowedHotelIds(new Set());return}const{data,error}=await supabase.from("hotel_follows").select("hotel_id").eq("user_id",user.id);if(!mounted)return;if(error){if(!String(error.message||"").includes("hotel_follows"))console.error("Followed hotels load failed:",error);setFollowedHotelIds(new Set());return}setFollowedHotelIds(new Set((data||[]).map(r=>r.hotel_id)))})();return()=>{mounted=false}},[user?.id]);
useEffect(()=>{if(path.startsWith("/profile/")){spid(path.split("/profile/")[1])}},[path]);
const goHome=()=>{spid(null);nav("/");window.scrollTo(0,0)};const viewProf=id=>{spid(id);nav("/profile/"+id);window.scrollTo(0,0)};
const openHotel=h=>{const slug=h.slug||mkSlug(h.name);nav("/hotel/"+slug);window.scrollTo(0,0)};
const openHotelRequest=seed=>{if(!user){ssa(true);return}setReqHotelSeed(seed||"");setShowReqHotel(true)};
const setFollowState=(hotelId,next)=>setFollowedHotelIds(prev=>{const n=new Set(prev);if(next)n.add(hotelId);else n.delete(hotelId);return n});
const isFollowedHotel=useCallback(hotelId=>followedHotelIds.has(hotelId),[followedHotelIds]);
const isFollowBusy=useCallback(hotelId=>followBusyIds.has(hotelId),[followBusyIds]);
const toggleHotelFollow=async(hotelId,current)=>{if(!user){ssa(true);return}if(isFollowBusy(hotelId))return;setFollowBusyIds(prev=>{const n=new Set(prev);n.add(hotelId);return n});try{if(current){const{error}=await supabase.from("hotel_follows").delete().eq("hotel_id",hotelId).eq("user_id",user.id);if(error)throw error;setFollowState(hotelId,false);showToast("Unfollowed hotel")}else{const{error}=await supabase.from("hotel_follows").insert({hotel_id:hotelId,user_id:user.id});if(error&&error.code!=="23505")throw error;setFollowState(hotelId,true);showToast("Following hotel for updates")}}catch(e){showToast("Could not update follow status","error");console.error(e)}setFollowBusyIds(prev=>{const n=new Set(prev);n.delete(hotelId);return n})};
const PERK_FILTERS=[
{key:"free_breakfast",label:"🍳 Free Breakfast",icon:"🍳",test:perks=>perks?.some(p=>p.category==="breakfast"&&(p.details?.cost==="Complimentary"||!p.details?.cost))},
{key:"lounge_open",label:"🍸 Lounge Open",icon:"🍸",test:perks=>perks?.some(p=>p.category==="lounge"&&p.details?.status!=="Closed"&&p.details?.status!=="No lounge")},
{key:"suite_upgrade",label:"⬆️ Suite Upgrades",icon:"⬆️",test:perks=>perks?.some(p=>p.category==="upgrade")},
{key:"late_checkout",label:"🕐 Late Checkout",icon:"🕐",test:perks=>perks?.some(p=>p.category==="late_checkout"&&p.details?.time_granted!=="No late checkout")},
{key:"free_parking",label:"🅿️ Free Parking",icon:"🅿️",test:perks=>perks?.some(p=>p.category==="parking"&&p.details?.included==="Yes, free")},
{key:"solid_bathroom",label:"🚿 Solid Doors",icon:"🚿",test:perks=>perks?.some(p=>p.category==="bathroom"&&(p.details?.door_type==="Solid wood/standard"||p.details?.door_type==="Pocket door"))},
{key:"spa_perks",label:"💆 Spa Benefits",icon:"💆",test:perks=>perks?.some(p=>p.category==="spa"&&p.details?.spa_type!=="Nothing")},
{key:"fnb_credit",label:"💳 F&B Credit",icon:"💳",test:perks=>perks?.some(p=>p.category==="fnb_credit")},
{key:"welcome_gift",label:"🎁 Welcome Gift",icon:"🎁",test:perks=>perks?.some(p=>p.category==="gift"&&p.details?.gift_type!=="Nothing")},
{key:"good_wifi",label:"📶 Good WiFi",icon:"📶",test:perks=>perks?.some(p=>p.category==="wifi"&&(p.details?.speed==="Excellent (50+ Mbps)"||p.details?.speed==="Good (20–50 Mbps)"))},
{key:"pool_open",label:"🏊 Pool Open",icon:"🏊",test:perks=>perks?.some(p=>p.category==="pool"&&p.details?.pool_open==="Yes")},
{key:"great_staff",label:"🤝 Great Staff",icon:"🤝",test:perks=>perks?.some(p=>p.category==="staff_service"&&p.details?.honors_status?.startsWith("Yes"))},
];
const filt=hotels.filter(h=>{const words=search.toLowerCase().split(/\s+/).filter(w=>w.length>0);const hay=[h.name,h.location,h.region||"",h.brand,h.country||""].join(" ").toLowerCase();const ms=!search||words.every(w=>hay.includes(w));const mb=!bf||h.brand===bf;const mr=!regionFilter||h.region===regionFilter;const mp=!perkFilter.length||perkFilter.every(pk=>PERK_FILTERS.find(f=>f.key===pk)?.test(hotelPerks[h.id]));return ms&&mb&&mr&&mp});
const sortedFilt=[...filt].sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)||(pc[b.id]||0)-(pc[a.id]||0)||a.name.localeCompare(b.name));
const ub=[...new Set(hotels.map(h=>h.brand))].sort();

/* Curated Netflix-style rows */
const curatedRows=useMemo(()=>{
if(!hotels.length)return[];
const withReports=hotels.filter(h=>(pc[h.id]||0)>0);
const rows=[];

/* Top Rated */
const topRated=[...withReports].filter(h=>(scores[h.id]||0)>=40).sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)).slice(0,20);
if(topRated.length>=3)rows.push({title:"Top Rated Properties",subtitle:"Highest perk scores based on guest reports",hotels:topRated});

/* Luxury focus */
const ambHotels=withReports.filter(h=>(hotelPerks[h.id]||[]).some(p=>true)).filter(h=>hotels.find(x=>x.id===h.id)?.brand&&["The Ritz-Carlton","St. Regis","W Hotels","EDITION","The Luxury Collection","JW Marriott"].includes(hotels.find(x=>x.id===h.id)?.brand)).sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)).slice(0,20);
if(ambHotels.length>=3)rows.push({title:"Best for Ambassador & Titanium Elite",subtitle:"Luxury brands with the most reported perks",hotels:ambHotels});

/* Free Breakfast Confirmed */
const bfHotels=withReports.filter(h=>(hotelPerks[h.id]||[]).some(p=>p.category==="breakfast"&&(!p.details?.cost||p.details?.cost==="Complimentary"))).sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)).slice(0,20);
if(bfHotels.length>=3)rows.push({title:"Free Breakfast Confirmed",subtitle:"Hotels where complimentary breakfast has been reported",hotels:bfHotels});

/* Lounge Access */
const loungeHotels=withReports.filter(h=>(hotelPerks[h.id]||[]).some(p=>p.category==="lounge"&&p.details?.status!=="Closed"&&p.details?.status!=="No lounge")).sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)).slice(0,20);
if(loungeHotels.length>=3)rows.push({title:"Lounge Access Available",subtitle:"Properties with confirmed executive lounge access",hotels:loungeHotels});

/* Suite Upgrade Friendly */
const upgradeHotels=withReports.filter(h=>(hotelPerks[h.id]||[]).some(p=>p.category==="upgrade")).sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)).slice(0,20);
if(upgradeHotels.length>=3)rows.push({title:"Suite Upgrade Friendly",subtitle:"Hotels where room upgrades have been reported",hotels:upgradeHotels});

/* Late Checkout Champions */
const lateHotels=withReports.filter(h=>(hotelPerks[h.id]||[]).some(p=>p.category==="late_checkout"&&p.details?.time_granted!=="No late checkout")).sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)).slice(0,20);
if(lateHotels.length>=3)rows.push({title:"Late Checkout Champions",subtitle:"Properties that honor late checkout requests",hotels:lateHotels});

/* Most Reported */
const mostReported=[...withReports].sort((a,b)=>(pc[b.id]||0)-(pc[a.id]||0)).slice(0,20);
if(mostReported.length>=3)rows.push({title:"Most Reported",subtitle:"Hotels with the most community perk reports",hotels:mostReported});

/* Recently Reported — prioritize latest stay date, then submission date */
const latestActivityByHotel={};withReports.forEach(h=>{let latest=0;(hotelPerks[h.id]||[]).forEach(p=>{const t=ts(p.stay_date||p.created_at);if(t>latest)latest=t});latestActivityByHotel[h.id]=latest});
const recentHotels=[...withReports].sort((a,b)=>(latestActivityByHotel[b.id]||0)-(latestActivityByHotel[a.id]||0)).slice(0,20);
if(recentHotels.length>=3)rows.push({title:"Recently Reported",subtitle:"Most recently stayed or reported hotels",hotels:recentHotels});

/* Regional rows — top regions by report count */
const regionCounts={};withReports.forEach(h=>{const r=h.region;if(r){regionCounts[r]=(regionCounts[r]||0)+(pc[h.id]||0)}});
const topRegions=Object.entries(regionCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);
topRegions.forEach(([region])=>{
const rHotels=withReports.filter(h=>h.region===region).sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)).slice(0,20);
if(rHotels.length>=3)rows.push({title:`Popular in ${region}`,subtitle:`Top-rated properties in ${region}`,hotels:rHotels});
});

return rows;
},[hotels,pc,scores,hotelPerks]);
const navBtn=(l,p)=>{const active=path===p;return<button onClick={()=>{nav(p)}} style={{background:active?"rgba(255,255,255,0.12)":"transparent",color:active?"#fff":"#94a3b8",border:"none",padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FF,borderRadius:6,transition:"all 0.15s"}}>{l}</button>};
const isHome=page==="home";
return<div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:FF,display:"flex",flexDirection:"column"}}>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>{`::selection{background:#0f172a;color:#fff}input::placeholder,textarea::placeholder{color:#94a3b8}body{margin:0}
*:focus-visible{outline:2px solid #2563eb;outline-offset:2px;border-radius:4px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.ps-row::-webkit-scrollbar{display:none}
@media(max-width:768px){.ps-header{flex-direction:column!important;align-items:flex-start!important}.ps-nav{order:1;width:100%;justify-content:flex-start!important;margin-left:-16px}.ps-auth{order:2;width:100%;margin-top:2px;margin-left:-2px}.ps-detail-layout{flex-direction:column!important}.ps-tips-sidebar{flex:1 1 auto!important;position:static!important;width:100%!important;max-width:100%!important}.ps-stats>div{flex-direction:column!important;gap:2px!important}}`}</style>
<Toaster/>
{showAuth&&<AuthModal onClose={()=>ssa(false)} onAuth={()=>supabase.auth.getUser().then(({data})=>su(data?.user))}/>}
{showAdd&&<AddPerkModal onClose={()=>ssad(false)} user={user} onNeedAuth={()=>ssa(true)} hotels={hotels} onSelect={h=>{openHotel(h);setTimeout(()=>window.scrollTo({top:0,behavior:"smooth"}),100)}} onRequestHotel={name=>{ssad(false);openHotelRequest(name)}}/>}
{showReqHotel&&<RequestHotelModal onClose={()=>setShowReqHotel(false)} user={user} onNeedAuth={()=>ssa(true)} initialName={reqHotelSeed}/>}
<div style={{background:"#0f172a",padding:isHome?"0 0 56px":"0 0 20px"}}><div style={{maxWidth:1100,margin:"0 auto",padding:"16px 28px 0"}}>
<div className="ps-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
<div onClick={goHome} style={{cursor:"pointer",display:"flex",alignItems:"baseline",gap:1}} role="link" aria-label="PerkSnob home"><span style={{fontSize:36,fontWeight:700,color:"#fff",fontFamily:FD}}>Perk</span><span style={{fontSize:36,fontWeight:700,color:"#94a3b8",fontFamily:FD}}>Snob</span></div>
<nav className="ps-nav" style={{display:"flex",alignItems:"center",gap:2}} aria-label="Main navigation">{navBtn("Compare","/compare")}{navBtn("Leaderboard","/leaderboard")}{user&&navBtn("Following","/following")}{isAdmin&&navBtn("Admin","/admin/requests")}</nav>
<div className="ps-auth" style={{display:"flex",gap:8,alignItems:"center"}}>
{user?<><button onClick={()=>{spid(user.id);nav("/profile/"+user.id)}} style={{background:"transparent",color:"#94a3b8",border:"none",padding:"7px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FF,textDecoration:path==="/profile/"+user.id?"underline":"none"}}>{dname(user)}</button><button onClick={async()=>{await supabase.auth.signOut();su(null);showToast("Signed out.")}} style={{background:"transparent",color:"#94a3b8",border:"1px solid #475569",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FF}}>Logout</button></>:<button onClick={()=>ssa(true)} style={{background:"transparent",color:"#94a3b8",border:"1px solid #475569",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FF}}>Sign In</button>}
<button onClick={()=>user?ssad(true):ssa(true)} style={{background:"#fff",color:"#0f172a",border:"none",borderRadius:6,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FF}}>+ Add Perk</button></div></div>
{isHome&&<div style={{paddingTop:24,paddingBottom:8}}><h1 style={{fontSize:52,fontWeight:700,color:"#fff",margin:"0 0 14px",lineHeight:1.02,maxWidth:520,fontFamily:FD}}>Titanium, Platinum, Ambassador Elite Perks &amp; Benefits</h1>
<p style={{fontSize:16,color:"#94a3b8",margin:"0 0 36px",maxWidth:460,lineHeight:1.6,fontFamily:FF}}>Real Marriott Bonvoy elite benefits reported by real guests. Know what you're getting before you book.</p>
{Object.keys(pc).length>0&&<div className="ps-stats" style={{display:"flex",gap:24,marginBottom:28}}>{[[Object.values(pc).reduce((a,b)=>a+b,0),"perk reports"],[Object.keys(pc).length,"hotels with data"],[hotels.length,"properties"]].map(([n,l])=><div key={l} style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}><span style={{fontSize:28,fontWeight:700,color:"#fff",fontFamily:FD}}>{n.toLocaleString()}</span><span style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>{l}</span></div>)}</div>}
<div style={{display:"flex",gap:10,flexWrap:"wrap"}}><div style={{flex:"1 1 320px",position:"relative"}}><input type="text" value={search} onChange={e=>{ss(e.target.value);setPgNum(1)}} placeholder="Search hotels or destinations..." aria-label="Search hotels" style={{width:"100%",padding:"14px 40px 14px 18px",borderRadius:8,border:"1px solid #1e293b",background:"#1e293b",color:"#e2e8f0",fontSize:14,fontFamily:FF,outline:"none",boxSizing:"border-box"}}/>
{search&&<button onClick={()=>ss("")} aria-label="Clear search" style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#94a3b8",fontSize:18,cursor:"pointer",padding:0,lineHeight:1,fontFamily:FF}}>×</button>}</div>
<select value={bf} onChange={e=>sbf(e.target.value)} aria-label="Filter by brand" style={{padding:"14px 42px 14px 18px",borderRadius:8,border:"1px solid #1e293b",background:"#1e293b",color:"#e2e8f0",fontSize:13,fontFamily:FF,outline:"none",cursor:"pointer",minWidth:120,maxWidth:200,WebkitAppearance:"none",MozAppearance:"none",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 18px center"}}><option value="" style={{background:"#fff",color:"#0f172a"}}>All Brands</option>{ub.map(b=><option key={b} value={b} style={{background:"#fff",color:"#0f172a"}}>{b}</option>)}</select>
<select value={regionFilter} onChange={e=>setRF(e.target.value)} aria-label="Filter by region" style={{padding:"14px 42px 14px 18px",borderRadius:8,border:"1px solid #1e293b",background:"#1e293b",color:"#e2e8f0",fontSize:13,fontFamily:FF,outline:"none",cursor:"pointer",minWidth:120,maxWidth:200,WebkitAppearance:"none",MozAppearance:"none",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 18px center"}}><option value="" style={{background:"#fff",color:"#0f172a"}}>All Regions</option>{[...new Set(hotels.map(h=>h.region).filter(Boolean))].sort().map(r=><option key={r} value={r} style={{background:"#fff",color:"#0f172a"}}>{r}</option>)}</select></div>
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:14}}><span style={{fontSize:11,color:"#64748b",fontFamily:FF,alignSelf:"center",marginRight:4}}>Filter by perk:</span>{PERK_FILTERS.map(f=>{const active=perkFilter.includes(f.key);const count=Object.keys(hotelPerks).filter(id=>f.test(hotelPerks[id])).length;return<button key={f.key} onClick={()=>setPF(active?perkFilter.filter(k=>k!==f.key):[...perkFilter,f.key])} style={{background:active?"#fff":"rgba(255,255,255,0.08)",color:active?"#0f172a":"#94a3b8",border:active?"1px solid #fff":"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FF,transition:"all 0.15s",display:"flex",alignItems:"center",gap:4}}>{f.label}{count>0&&<span style={{fontSize:9,opacity:0.7}}>({count})</span>}</button>})}{perkFilter.length>0&&<button onClick={()=>setPF([])} style={{background:"none",border:"none",color:"#94a3b8",fontSize:11,cursor:"pointer",fontFamily:FF,textDecoration:"underline"}}>Clear filters</button>}</div>
</div>}</div></div>
<div style={{flex:1,maxWidth:1100,margin:isHome?"-28px auto 0":"16px auto 0",padding:"0 28px 60px",position:"relative",width:"100%"}}>
{page==="leaderboard"?<Leaderboard onClose={goHome} onProfile={viewProf}/>:page==="search"?<><button onClick={goHome} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button><PerkSearch user={user} onNeedAuth={()=>ssa(true)}/></>:page==="compare"?<Comparison hotels={hotels} onClose={goHome}/>:page==="following"?<FollowingFeed user={user} onNeedAuth={()=>ssa(true)} onSelectHotel={openHotel}/>:page==="admin_requests"?<AdminHotelRequests user={user} isAdmin={isAdmin} onClose={goHome} onNeedAuth={()=>ssa(true)}/>:page==="profile"&&profId?<UserProfile userId={profId} currentUser={user} onBack={goHome} hotels={hotels}/>:page==="hotel"&&sel?<HotelDetail hotel={sel} user={user} onBack={goHome} onNeedAuth={()=>ssa(true)} allHotels={hotels} perkCounts={pc} onSelectHotel={openHotel} onFollowStateChange={setFollowState}/>:page==="hotel"&&hotelSlug&&!ld&&!sel?<div style={{textAlign:"center",padding:60}}><div style={{fontSize:40,marginBottom:12}}>🏨</div><h3 style={{fontSize:20,fontWeight:700,color:"#0f172a",fontFamily:FD,marginBottom:6}}>Hotel not found</h3><p style={{fontSize:13,color:"#94a3b8",marginBottom:18}}>This property may not exist yet.</p><div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}><button onClick={()=>openHotelRequest((hotelSlug||"").replace(/-/g," ").trim())} style={BT("#0f172a","#fff")}>{user?"Request this hotel":"Sign in to request hotel"}</button><button onClick={goHome} style={BT("#e2e8f0","#64748b")}>← Back to all hotels</button></div></div>
:page==="city"&&citySlug?<>{(()=>{const cityName=citySlug.replace(/-/g," ");const cityHotels=hotels.filter(h=>(h.location||h.city||"").toLowerCase().includes(cityName.toLowerCase()));const cityBrands=[...new Set(cityHotels.map(h=>h.brand))].sort();const cPage=pgNum;const cTotal=Math.ceil(cityHotels.length/PAGE_SIZE);const cSlice=cityHotels.slice((cPage-1)*PAGE_SIZE,cPage*PAGE_SIZE);
return<div><button onClick={goHome} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button>
<div style={{background:"#0f172a",borderRadius:12,padding:36,marginBottom:28,color:"#fff"}}><p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:FF}}>Destination</p><h1 style={{fontSize:34,fontWeight:700,margin:"0 0 6px",fontFamily:FD}}>Marriott Hotels in {cityName.replace(/\b\w/g,c=>c.toUpperCase())}</h1><p style={{fontSize:14,color:"#94a3b8",fontFamily:FF,margin:0}}>{cityHotels.length} propert{cityHotels.length!==1?"ies":"y"} · {cityBrands.length} brand{cityBrands.length!==1?"s":""}</p></div>
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>{cityBrands.map(b=><span key={b} style={{...TAG("#f1f5f9","#334155"),fontSize:10,padding:"4px 10px"}}>{b} ({cityHotels.filter(h=>h.brand===b).length})</span>)}</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>{cSlice.map(h=><HotelCard key={h.id} hotel={h} perkCounts={pc} score={scores[h.id]||0} onClick={()=>openHotel(h)} user={user} isFollowing={isFollowedHotel} isFollowBusy={isFollowBusy} onToggleFollow={toggleHotelFollow}/>)}</div>
<Pagination current={cPage} total={cTotal} onChange={p=>{setPgNum(p);window.scrollTo({top:0,behavior:"smooth"})}}/>
</div>})()}</>
:page==="brand"&&brandSlug?<>{(()=>{const brandName=brandSlug.replace(/-/g," ");const brandHotels=hotels.filter(h=>(h.brand||"").toLowerCase()===brandName.toLowerCase()).sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)||(pc[b.id]||0)-(pc[a.id]||0));const regions=[...new Set(brandHotels.map(h=>h.region).filter(Boolean))].sort();const reported=brandHotels.filter(h=>(pc[h.id]||0)>0).length;const bPage=pgNum;const bTotal=Math.ceil(brandHotels.length/PAGE_SIZE);const bSlice=brandHotels.slice((bPage-1)*PAGE_SIZE,bPage*PAGE_SIZE);
return<div><button onClick={goHome} style={{background:"#fff",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,fontFamily:FF,padding:"8px 16px",marginBottom:24,borderRadius:6}}>← Back</button>
<div style={{background:"#0f172a",borderRadius:12,padding:36,marginBottom:28,color:"#fff"}}><p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:FF}}>Brand</p><h1 style={{fontSize:34,fontWeight:700,margin:"0 0 6px",fontFamily:FD}}>{brandHotels[0]?.brand||brandName.replace(/\b\w/g,c=>c.toUpperCase())}</h1><p style={{fontSize:14,color:"#94a3b8",fontFamily:FF,margin:0}}>{brandHotels.length} propert{brandHotels.length!==1?"ies":"y"} worldwide · {reported} with reports</p></div>
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>{regions.map(r=><span key={r} style={{...TAG("#f1f5f9","#334155"),fontSize:10,padding:"4px 10px"}}>{r} ({brandHotels.filter(h=>h.region===r).length})</span>)}</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>{bSlice.map(h=><HotelCard key={h.id} hotel={h} perkCounts={pc} score={scores[h.id]||0} onClick={()=>openHotel(h)} user={user} isFollowing={isFollowedHotel} isFollowBusy={isFollowBusy} onToggleFollow={toggleHotelFollow}/>)}</div>
<Pagination current={bPage} total={bTotal} onChange={p=>{setPgNum(p);window.scrollTo({top:0,behavior:"smooth"})}}/>
</div>})()}</>
:ld?<div style={{padding:"60px 0"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>{Array.from({length:12}).map((_,i)=><CardSkeleton key={i}/>)}</div></div>:<>{(()=>{const isSearching=!!search||!!bf||perkFilter.length>0||!!regionFilter;const scored=sortedFilt.filter(h=>(scores[h.id]||0)>0);const unscored=sortedFilt.filter(h=>!scores[h.id]);const showUnscored=isSearching||showAll;

if(!isSearching&&curatedRows.length>0){
/* Netflix-style curated rows */
return<div style={{marginTop:52}}>
{curatedRows.map((row,i)=><HotelRow key={i} title={row.title} subtitle={row.subtitle} hotels={row.hotels} perkCounts={pc} scores={scores} onSelect={openHotel} user={user} isFollowing={isFollowedHotel} isFollowBusy={isFollowBusy} onToggleFollow={toggleHotelFollow}/>)}
<div style={{height:1,background:"linear-gradient(to right,transparent,#e2e8f0,transparent)",margin:"16px 0 24px"}}/>
<div style={{textAlign:"center"}}>
<p style={{fontSize:13,color:"#94a3b8",fontFamily:FF,marginBottom:12}}>{hotels.length.toLocaleString()} total properties in database</p>
<button onClick={()=>setSA(true)} style={{background:"#fff",color:"#0f172a",border:"2px solid #e2e8f0",borderRadius:8,padding:"10px 28px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FF,transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#0f172a"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0"}}>Browse all properties</button>
</div>
{showAll&&<><div style={{marginTop:32,marginBottom:14}}><span style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>All {hotels.length.toLocaleString()} properties</span></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>{hotels.slice((pgNum-1)*PAGE_SIZE,pgNum*PAGE_SIZE).map(h=><HotelCard key={h.id} hotel={h} perkCounts={pc} score={scores[h.id]||0} onClick={()=>openHotel(h)} user={user} isFollowing={isFollowedHotel} isFollowBusy={isFollowBusy} onToggleFollow={toggleHotelFollow}/>)}</div>
<Pagination current={pgNum} total={Math.ceil(hotels.length/PAGE_SIZE)} onChange={p=>{setPgNum(p);window.scrollTo({top:0,behavior:"smooth"})}}/></>}
</div>}
else{
/* Search/filter results — flat grid with pagination */
return<><div style={{marginBottom:14,marginTop:42}}><span style={{fontSize:12,color:"#94a3b8",fontFamily:FF}}>{isSearching?`${sortedFilt.length} propert${sortedFilt.length!==1?"ies":"y"}`:`${scored.length} featured propert${scored.length!==1?"ies":"y"}`}</span></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>{(isSearching?sortedFilt.slice((pgNum-1)*PAGE_SIZE,pgNum*PAGE_SIZE):scored).map(h=><HotelCard key={h.id} hotel={h} perkCounts={pc} score={scores[h.id]||0} onClick={()=>openHotel(h)} user={user} isFollowing={isFollowedHotel} isFollowBusy={isFollowBusy} onToggleFollow={toggleHotelFollow}/>)}</div>
{isSearching&&<Pagination current={pgNum} total={Math.ceil(sortedFilt.length/PAGE_SIZE)} onChange={p=>{setPgNum(p);window.scrollTo({top:0,behavior:"smooth"})}}/>}
{!sortedFilt.length&&<div style={{textAlign:"center",padding:"60px 20px"}}><h3 style={{fontSize:20,fontWeight:700,color:"#0f172a",fontFamily:FD,marginBottom:6}}>No hotels found</h3><p style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Try a different search or filter.</p><button onClick={()=>{ss("");sbf("");setPF([]);setRF("")}} style={BT()}>Clear Filters</button></div>}</>}
})()}</>}</div>
<Footer/></div>}
