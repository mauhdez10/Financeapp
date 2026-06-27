// Extracted from App.jsx in Phase 2a of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-10).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState, useEffect, useRef } from "react";
import { Tag, Anchor, Shield, PiggyBank, TrendingUp, Home, TrendingDown, Globe, AtSign, Mail, Phone, Award, GraduationCap, HeartHandshake, Target, Languages, ShieldCheck, CalendarCheck } from "lucide-react";
import { GOLD, mINP, mCARD } from "../styles/theme";
import { useTh } from "../contexts/theme";
import { SVCS, CERTS, _gaLang, DEF_SETTINGS, PREMIUM_TIERS } from "../constants/meta";
import { ChooseAmount } from "../components/premium";
import { bE, gid } from "../utils/finance";
import { Field, useViewport, Row2, Btn, BSolid, MaskedNumInp, Modal, SaveBar } from "../components/primitives";

function PromotionsPage({settings,onSettingsChange,t}){
  const th=useTh();
  const INP=mINP(th);
  /* MD-H (v0.76.1) — live Stripe promotion codes, auto-synced (owner ask). Renders
     only when the server endpoint has data; silently absent on dev / before env. */
  const[livePromos,setLivePromos]=useState(null);
  useEffect(()=>{let dead=false;fetch("/api/billing").then(r=>r.json()).then(j=>{if(!dead&&j&&j.ok&&j.configured&&(j.promos||[]).length)setLivePromos(j.promos);}).catch(()=>{});return()=>{dead=true;};},[]);
  const promos=Array.isArray(settings.promotions)?settings.promotions:[];
  const services=Array.isArray(settings.services)&&settings.services.length?settings.services:["initial","quarterly","monthly","all"];
  const[editing,setEditing]=useState(null);
  const[draft,setDraft]=useState(null);
  const newPromo=()=>({id:gid(),name:"",type:"percent",value:25,appliesTo:"initial",startDate:"",endDate:"",code:"",clientFilter:"all",active:true,createdAt:new Date().toISOString()});
  const startEdit=p=>{setDraft({...p});setEditing(p.id);};
  const startNew=()=>{const p=newPromo();setDraft(p);setEditing(p.id);};
  const save=()=>{if(!draft.name.trim()){alert(t.promoNameReq||"Promotion name is required.");return;}const exists=promos.find(p=>p.id===draft.id);const updated=exists?promos.map(p=>p.id===draft.id?draft:p):[...promos,draft];onSettingsChange({...settings,promotions:updated});setEditing(null);setDraft(null);};
  const cancel=()=>{setEditing(null);setDraft(null);};
  const del=id=>{if(!confirm(t.confirmDeletePromo||"Delete this promotion?"))return;onSettingsChange({...settings,promotions:promos.filter(p=>p.id!==id)});};
  const toggleActive=id=>onSettingsChange({...settings,promotions:promos.map(p=>p.id===id?{...p,active:!p.active}:p)});
  const describe=p=>{const val=p.type==="percent"?`${p.value}% off`:p.type==="flat"?`$${p.value} off`:`$${p.value} bundle price`;const when=p.startDate&&p.endDate?`${p.startDate} → ${p.endDate}`:p.startDate?`from ${p.startDate}`:p.endDate?`until ${p.endDate}`:"always active";return`${val} · ${when}`;};
  const isActive=p=>{if(!p.active)return false;const today=new Date().toISOString().slice(0,10);if(p.startDate&&today<p.startDate)return false;if(p.endDate&&today>p.endDate)return false;return true;};
  const Label=({children})=><div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:4}}>{children}</div>;
  // v0.56 — stats derived from promo list for the header KPI strip.
  const _stats=(()=>{
    const today=new Date().toISOString().slice(0,10);
    const active=promos.filter(p=>{if(!p.active)return false;if(p.startDate&&today<p.startDate)return false;if(p.endDate&&today>p.endDate)return false;return true;});
    const expSoon=active.filter(p=>{if(!p.endDate)return false;const dl=Math.ceil((new Date(p.endDate)-new Date())/864e5);return dl>=0&&dl<=30;});
    const scheduled=promos.filter(p=>p.active&&p.startDate&&today<p.startDate);
    const expired=promos.filter(p=>p.endDate&&today>p.endDate);
    return{active:active.length,expSoon:expSoon.length,scheduled:scheduled.length,expired:expired.length,total:promos.length};
  })();
  return<div style={{padding:24}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div>
        {/* MD-G (v0.74.3): h1 removed — banner already says "Promotions"; eyebrow + desc carry the page. */}
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.18em",color:th.dim,fontFamily:"'JetBrains Mono',ui-monospace,monospace",marginBottom:9,textTransform:"uppercase"}}>{t.promoEyebrow||"Offers"}</div>
        <p style={{fontSize:13,color:th.muted,margin:0,maxWidth:560,lineHeight:1.55}}>{t.promotionsDesc}</p>
      </div>
      <BSolid onClick={startNew}>＋ {t.newPromotion||"New Promotion"}</BSolid>
    </div>
    {livePromos&&<div style={{...mCARD(th),padding:16,marginBottom:14,border:"1px solid "+th.accent+"44"}}>
      <div style={{fontSize:10,fontWeight:600,color:th.accent,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>{t.livePromosHdr||"Live in Stripe right now"}</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {livePromos.map(p=><div key={p.code} style={{padding:"9px 14px",borderRadius:10,background:th.inp,border:"1px solid "+th.cardBorder}}>
          <span style={{fontSize:13,fontWeight:800,color:th.accent,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.06em"}}>{p.code}</span>
          <span style={{fontSize:11.5,color:th.muted,marginLeft:9}}>{p.percentOff?p.percentOff+"% off":p.amountOff?("$"+p.amountOff+" off"):""}{p.name?" · "+p.name:""}{p.expiresAt?" · "+(t.livePromoUntil||"until")+" "+p.expiresAt:""}</span>
        </div>)}
      </div>
      <div style={{fontSize:10,color:th.dim,fontStyle:"italic",marginTop:8}}>{t.livePromosNote||"Synced automatically from your Stripe account — manage codes in the Stripe dashboard."}</div>
    </div>}
    {/* v0.56 — stats strip at top so the page feels like an analytics surface,
       not just a CRUD list. Active / Expiring soon / Scheduled / Total. */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
      <div className="ga-lift ga-spot" style={{...mCARD(th),padding:"10px 12px"}}>
        <div style={{fontSize:9.5,color:th.dim,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700}}>{t.promoStatActive||"Active"}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:18,fontWeight:700,color:th.pos,marginTop:2,lineHeight:1.1}}>{_stats.active}</div>
      </div>
      <div className="ga-lift ga-spot" style={{...mCARD(th),padding:"10px 12px"}}>
        <div style={{fontSize:9.5,color:th.dim,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700}}>{t.promoStatExpSoon||"Expiring ≤ 30d"}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:18,fontWeight:700,color:_stats.expSoon>0?"#C9A84C":th.muted,marginTop:2,lineHeight:1.1}}>{_stats.expSoon}</div>
      </div>
      <div className="ga-lift ga-spot" style={{...mCARD(th),padding:"10px 12px"}}>
        <div style={{fontSize:9.5,color:th.dim,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700}}>{t.promoStatScheduled||"Scheduled"}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:18,fontWeight:700,color:th.blue,marginTop:2,lineHeight:1.1}}>{_stats.scheduled}</div>
      </div>
      <div className="ga-lift ga-spot" style={{...mCARD(th),padding:"10px 12px"}}>
        <div style={{fontSize:9.5,color:th.dim,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700}}>{t.promoStatTotal||"All-time"}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:18,fontWeight:700,color:th.text,marginTop:2,lineHeight:1.1}}>{_stats.total}</div>
      </div>
    </div>
    <div style={{...mCARD(th),padding:"10px 14px",marginBottom:16,background:GOLD+"08",borderLeft:`3px solid ${GOLD}`}}>
      <div style={{fontSize:11,color:th.muted,lineHeight:1.55}}><b style={{color:GOLD}}>{t.howItWorks||"How promotions work"}</b> — {t.howItWorksDesc||"Active promotions appear on client invoices and on your public flyer/landing page."}</div>
    </div>
    {promos.length===0&&!editing&&<div style={{...mCARD(th),padding:40,textAlign:"center"}}>
      
      <div style={{fontSize:14,fontWeight:700,color:th.text,marginBottom:4}}>{t.noPromosTitle||"No promotions yet"}</div>
      <div style={{fontSize:12,color:th.dim,marginBottom:14}}>{t.noPromosDesc||'Click "New Promotion" to create your first discount.'}</div>
    </div>}
    {/* v0.56 — Stripe sync note per Mauricio's promotions ask. */}
    <div style={{...mCARD(th),padding:"9px 14px",marginBottom:14,background:th.blue+"10",borderLeft:`3px solid ${th.blue}`,fontSize:11,color:th.muted,lineHeight:1.55}}>
      <b style={{color:th.blue}}>{t.stripeSyncNote||"Stripe sync"}</b> — {t.stripeSyncBody||"Promotions configured here currently appear on client invoices and your public flyer only. Auto-syncing them to Stripe coupon codes is on the roadmap (one-click create + apply to the matching service in your Stripe dashboard)."}
    </div>
    {/* v0.56 — promo list rendered as a table per image 2 reference (instead of
       the vertical card stack). Edit mode still expands inline below the row. */}
    {promos.length>0&&<div style={{...mCARD(th),padding:0,marginBottom:20,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{background:th.bg}}>
          <th style={{textAlign:"left",padding:"10px 14px",color:th.dim,fontWeight:700,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",borderBottom:`1px solid ${th.cardBorder}`}}>{t.promotionName||"Name"}</th>
          <th style={{textAlign:"left",padding:"10px 14px",color:th.dim,fontWeight:700,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",borderBottom:`1px solid ${th.cardBorder}`}}>{t.promoCode||"Code"}</th>
          <th style={{textAlign:"left",padding:"10px 14px",color:th.dim,fontWeight:700,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",borderBottom:`1px solid ${th.cardBorder}`}}>{t.discountLbl||"Discount"}</th>
          <th style={{textAlign:"left",padding:"10px 14px",color:th.dim,fontWeight:700,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",borderBottom:`1px solid ${th.cardBorder}`}}>{t.applyToLbl||"Applies To"}</th>
          <th style={{textAlign:"left",padding:"10px 14px",color:th.dim,fontWeight:700,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",borderBottom:`1px solid ${th.cardBorder}`}}>{t.endDateLbl||"Ends"}</th>
          <th style={{textAlign:"right",padding:"10px 14px",color:th.dim,fontWeight:700,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",borderBottom:`1px solid ${th.cardBorder}`}}>{t.daysLeftHdr||"Days Left"}</th>
          <th style={{textAlign:"right",padding:"10px 14px",color:th.dim,fontWeight:700,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",borderBottom:`1px solid ${th.cardBorder}`}}></th>
        </tr></thead>
        <tbody>
        {promos.map(p=>{const active=isActive(p);if(editing===p.id){
          return<tr key={p.id}><td colSpan={7} style={{padding:14,borderBottom:`1px solid ${th.cardBorder}`,background:th.accent+"06"}}><div style={{borderLeft:`3px solid ${th.accent}`,paddingLeft:12}}>
            {/* inline edit form (kept original layout) */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><Label>{(t.promotionName||"Promotion Name")+" *"}</Label><input style={INP} value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder={t.promoNamePh||'e.g. "New Year Reset 2026"'}/></div>
            <div><Label>{(t.promoCode||"Promo Code")+" (optional)"}</Label><input style={INP} value={draft.code} onChange={e=>setDraft(d=>({...d,code:e.target.value.toUpperCase()}))} placeholder={t.promoCodePh||"e.g. WELCOME25"}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div><Label>{t.discountTypeLbl||"Discount Type"}</Label><select style={INP} value={draft.type} onChange={e=>setDraft(d=>({...d,type:e.target.value}))}><option value="percent">{t.percentOff||"% off"}</option><option value="flat">{t.flatOff||"$ off"}</option><option value="bundle">{t.bundlePrice||"Bundle price"}</option></select></div>
            <div><Label>{draft.type==="percent"?(t.percentOff||"% Off"):draft.type==="flat"?(t.flatOff||"$ Off"):((t.bundlePrice||"Bundle Price")+" ($)")}</Label><MaskedNumInp style={INP} value={draft.value} onChange={e=>setDraft(d=>({...d,value:+e.target.value||0}))} min={0} max={draft.type==="percent"?100:99999} onKeyDown={bE}/></div>
            <div><Label>{t.applyToLbl||"Applies To"}</Label><select style={INP} value={draft.appliesTo} onChange={e=>setDraft(d=>({...d,appliesTo:e.target.value}))}><option value="initial">{t.initialCheckup||"Initial Checkup"}</option><option value="quarterly">{t.quarterlyCheckup||"Quarterly Checkup"}</option><option value="monthly">{t.monthlySubscription||"Monthly Subscription"}</option><option value="yearly">{t.annualBundleLbl||"Annual Bundle"}</option><option value="all">{t.allServices||"All Services"}</option></select></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div><Label>{t.startDateLbl||"Start Date"}</Label><input style={INP} type="date" value={draft.startDate} onChange={e=>setDraft(d=>({...d,startDate:e.target.value}))}/></div>
            <div><Label>{t.endDateLbl||"End Date"}</Label><input style={INP} type="date" value={draft.endDate} onChange={e=>setDraft(d=>({...d,endDate:e.target.value}))}/></div>
            <div><Label>{t.clientFilterLbl||"Client Filter"}</Label><select style={INP} value={draft.clientFilter} onChange={e=>setDraft(d=>({...d,clientFilter:e.target.value}))}><option value="all">{t.allClients||"All clients"}</option><option value="new">{t.newClientsOnly||"New clients only"}</option><option value="health">{t.healthClients||"Health/insurance clients"}</option><option value="referred">{t.referredOnly||"Referred clients only"}</option></select></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:th.muted,cursor:"pointer"}}><input type="checkbox" checked={draft.active} onChange={e=>setDraft(d=>({...d,active:e.target.checked}))} style={{accentColor:th.pos}}/> {t.active||"Active"}</label>
          </div>
          <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><Btn onClick={cancel}>{t.cancel||"Cancel"}</Btn><BSolid onClick={save}>{t.save}</BSolid></div>
          </div></td></tr>;
        }
        // ── view row ──
        const dl=p.endDate?Math.ceil((new Date(p.endDate)-new Date())/864e5):null;
        const dlCol=dl==null?th.muted:dl<0?"#6B7280":dl<30?"#EF4444":dl<90?"#F59E0B":th.pos;
        const dlLbl=dl==null?"—":dl<0?(t.promoExpired||"Expired"):`${dl}d`;
        const discount=p.type==="percent"?`${p.value}%`:p.type==="flat"?`$${p.value}`:`$${p.value} bundle`;
        return<tr key={p.id} style={{borderBottom:`1px solid ${th.cardBorder}`}}>
          <td style={{padding:"10px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:6,height:6,borderRadius:99,background:active?th.pos:th.dim,flexShrink:0}} title={active?(t.active||"Active"):(t.paused||"Inactive")}/>
              <span style={{fontWeight:700,color:th.text,fontSize:12}}>{p.name}</span>
            </div>
          </td>
          <td style={{padding:"10px 14px"}}>{p.code?<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:GOLD,background:GOLD+"14",padding:"2px 8px",borderRadius:4,fontWeight:600}}>{p.code}</span>:<span style={{color:th.dim,fontSize:11}}>—</span>}</td>
          <td style={{padding:"10px 14px",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:th.text,fontWeight:600}}>{discount} {p.type==="percent"||p.type==="flat"?(t.off||"off"):""}</td>
          <td style={{padding:"10px 14px",fontSize:11,color:th.muted}}>{p.appliesTo==="all"?(t.allServices||"All Services"):p.appliesTo}</td>
          <td style={{padding:"10px 14px",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:th.muted}}>{p.endDate||"—"}</td>
          <td style={{padding:"10px 14px",textAlign:"right"}}>
            {dl!=null?<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,fontWeight:700,padding:"3px 10px",borderRadius:99,background:dlCol+"22",color:dlCol,border:`1px solid ${dlCol}55`,letterSpacing:"0.02em"}}>{dlLbl}</span>:<span style={{color:th.dim}}>—</span>}
          </td>
          <td style={{padding:"6px 14px",textAlign:"right",whiteSpace:"nowrap"}}>
            <button onClick={()=>toggleActive(p.id)} title={p.active?(t.pause||"Pause"):(t.activate||"Activate")} style={{background:"transparent",border:`1px solid ${th.cardBorder}`,color:th.muted,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",marginRight:4}}>{p.active?"⏸":"▶"}</button>
            <button onClick={()=>startEdit(p)} title={t.editLabel||"Edit"} style={{background:"transparent",border:`1px solid ${th.cardBorder}`,color:th.muted,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",marginRight:4}}>✏</button>
            <button onClick={()=>del(p.id)} title={t.deleteLbl||"Delete"} style={{background:"transparent",border:`1px solid ${th.neg}55`,color:th.neg,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer"}}>🗑</button>
          </td>
        </tr>;
        })}
        </tbody></table></div>
    </div>}
    {editing&&!promos.find(p=>p.id===editing)&&<div style={{...mCARD(th),padding:14,marginBottom:20,borderLeft:`4px solid ${th.accent}`}}>
      <div style={{fontSize:13,fontWeight:800,color:th.accent,marginBottom:10}}>＋ {t.newPromotion||"New Promotion"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div><Label>{(t.promotionName||"Promotion Name")+" *"}</Label><input style={INP} value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder={t.promoNamePh||'e.g. "New Year Reset 2026"'}/></div>
        <div><Label>{(t.promoCode||"Promo Code")+" (optional)"}</Label><input style={INP} value={draft.code} onChange={e=>setDraft(d=>({...d,code:e.target.value.toUpperCase()}))} placeholder={t.promoCodePh||"e.g. WELCOME25"}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
        <div><Label>{t.discountTypeLbl||"Discount Type"}</Label><select style={INP} value={draft.type} onChange={e=>setDraft(d=>({...d,type:e.target.value}))}><option value="percent">{t.percentOff||"% off"}</option><option value="flat">{t.flatOff||"$ off"}</option><option value="bundle">{t.bundlePrice||"Bundle price"}</option></select></div>
        <div><Label>{draft.type==="percent"?(t.percentOff||"% Off"):draft.type==="flat"?(t.flatOff||"$ Off"):((t.bundlePrice||"Bundle Price")+" ($)")}</Label><MaskedNumInp style={INP} value={draft.value} onChange={e=>setDraft(d=>({...d,value:+e.target.value||0}))} min={0} max={draft.type==="percent"?100:99999} onKeyDown={bE}/></div>
        <div><Label>{t.applyToLbl||"Applies To"}</Label><select style={INP} value={draft.appliesTo} onChange={e=>setDraft(d=>({...d,appliesTo:e.target.value}))}><option value="initial">{t.initialCheckup||"Initial Checkup"}</option><option value="quarterly">{t.quarterlyCheckup||"Quarterly Checkup"}</option><option value="monthly">{t.monthlySubscription||"Monthly Subscription"}</option><option value="yearly">{t.annualBundleLbl||"Annual Bundle"}</option><option value="all">{t.allServices||"All Services"}</option></select></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
        <div><Label>{t.startDateLbl||"Start Date"}</Label><input style={INP} type="date" value={draft.startDate} onChange={e=>setDraft(d=>({...d,startDate:e.target.value}))}/></div>
        <div><Label>{t.endDateLbl||"End Date"}</Label><input style={INP} type="date" value={draft.endDate} onChange={e=>setDraft(d=>({...d,endDate:e.target.value}))}/></div>
        <div><Label>{t.clientFilterLbl||"Client Filter"}</Label><select style={INP} value={draft.clientFilter} onChange={e=>setDraft(d=>({...d,clientFilter:e.target.value}))}><option value="all">{t.allClients||"All clients"}</option><option value="new">{t.newClientsOnly||"New clients only"}</option><option value="health">{t.healthClients||"Health/insurance clients"}</option><option value="referred">{t.referredOnly||"Referred clients only"}</option></select></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:th.muted,cursor:"pointer"}}><input type="checkbox" checked={draft.active} onChange={e=>setDraft(d=>({...d,active:e.target.checked}))} style={{accentColor:th.pos}}/> {t.active||"Active"}</label>
      </div>
      <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><Btn onClick={cancel}>{t.cancel||"Cancel"}</Btn><BSolid onClick={save}>{t.createPromotion||"Create Promotion"}</BSolid></div>
    </div>}
    <div style={{...mCARD(th),padding:16}}>
      <div style={{fontSize:12,fontWeight:700,color:th.dim,marginBottom:10}}>💡 {(t.suggestedTitle||"Suggested Starter Promotions").toUpperCase()}</div>
      <div style={{fontSize:11,color:th.muted,lineHeight:1.8}}>
        {[
          t.welcomeDiscountSugg||"Welcome Discount — 40% off Initial Checkup ($149 → $89) for first 10 clients",
          t.healthClientSugg||"Health Client Bundle — Free Initial Checkup for existing insurance clients (retention)",
          t.referralRewardSugg||"Referral Reward — 25% off Initial Checkup, code REFERRED25",
          t.newYearSugg||"New Year Reset — $99 Initial Checkup, January 1 – January 31",
          t.springSugg||"Spring Review — $99 Quarterly Checkup, March 15 – April 30",
          t.annualBundleSugg||"Annual Bundle — 4 Quarterly Checkups for $299 (save $97)",
        ].map((line,i)=>{const ix=line.indexOf(" — ");const ti=ix<0?line:line.slice(0,ix);const bo=ix<0?"":line.slice(ix+3);return<div key={i}>• <b>{ti}</b>{bo?" — "+bo:""}</div>;})}
      </div>
    </div>
  </div>;
}
function ResourcesPage({t}){
  const th=useTh();const{isMobile}=useViewport();
  const guides=[
    {key:"credit",Icon:TrendingUp,c:"#7FA8C9",title:t.guideCreditTitle||"Understanding Your Credit Score",desc:t.guideCreditDesc||"How credit scores are calculated and actionable strategies to improve yours.",url:"https://www.experian.com/blogs/ask-experian/credit-education/score-basics/understanding-credit-scores/"},
    {key:"debt",Icon:TrendingDown,c:"#F0857B",title:t.guideDebtTitle||"Debt Payoff Strategies",desc:t.guideDebtDesc||"Avalanche vs. Snowball, which method is right for your situation.",url:"https://www.nerdwallet.com/article/finance/debt-snowball-vs-avalanche"},
    {key:"ef",Icon:Shield,c:"#3DD68C",title:t.guideEFTitle||"Building an Emergency Fund",desc:t.guideEFDesc||"Why 3-6 months of expenses matters and how to build it fast.",url:"https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/"},
    {key:"ret",Icon:PiggyBank,c:"#9D8CFF",title:t.guideRetTitle||"Retirement Savings 101",desc:t.guideRetDesc||"Roth IRA, 401k, contribution strategies, and employer matching.",url:"https://www.investor.gov/additional-resources/retirement-toolkit"},
    {key:"home",Icon:Home,c:GOLD,title:t.guideHomeTitle||"First-Time Homebuyer Guide",desc:t.guideHomeDesc||"Pre-approval, down payment, DTI requirements, and timing.",url:"https://www.consumerfinance.gov/owning-a-home/"},
    {key:"invest",Icon:TrendingUp,c:"#46D6C6",title:t.guideInvestTitle||"Investment Allocation Basics",desc:t.guideInvestDesc||"Risk tolerance, time horizon, and diversification principles.",url:"https://www.investor.gov/introduction-investing/getting-started/asset-allocation"},
  ];
  const ref=useRef(null);const[stt,setStt]=useState({s:true,e:false});
  const sync=()=>{const el=ref.current;if(!el)return;setStt({s:el.scrollLeft<6,e:el.scrollLeft+el.clientWidth>=el.scrollWidth-6});};
  useEffect(()=>{sync();},[]);
  const scroll=d=>{const el=ref.current;if(!el)return;const cw=(el.querySelector("[data-rc]")?.offsetWidth||330)+18;el.scrollBy({left:d*cw,behavior:"smooth"});};
  const arr=on=>({flexShrink:0,width:42,height:42,borderRadius:99,border:"1px solid "+th.cardBorder,background:th.glassBg,color:th.text,cursor:on?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",opacity:on?1:0.3,fontSize:20,lineHeight:1});
  return<div style={{padding:"24px 24px 44px"}}>
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:22,gap:16,flexWrap:"wrap"}}>
      <div>
        {/* MD-G (v0.74.3): "Resources" eyebrow removed — banner already says it; the editorial h1 stays. */}
        <h1 style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontWeight:500,fontSize:30,color:th.text,margin:0,lineHeight:1.05}}>{t.resourcesHeadline||(_gaLang()==="es"?"Aprende los fundamentos":"Learn the fundamentals")}</h1>
        <p style={{fontSize:13,color:th.muted,margin:"9px 0 0",maxWidth:540,lineHeight:1.6}}>{t.resourcesDesc}</p>
      </div>
      {!isMobile&&<div style={{display:"flex",gap:8}}><button onClick={()=>scroll(-1)} disabled={stt.s} style={arr(!stt.s)} aria-label={_gaLang()==="es"?"Anterior":"Previous"}>‹</button><button onClick={()=>scroll(1)} disabled={stt.e} style={arr(!stt.e)} aria-label={_gaLang()==="es"?"Siguiente":"Next"}>›</button></div>}
    </div>
    <div ref={ref} onScroll={sync} style={{display:"grid",gridAutoFlow:"column",gridAutoColumns:isMobile?"84%":"400px",gap:20,overflowX:"auto",scrollSnapType:"x proximity",scrollbarWidth:"none",msOverflowStyle:"none",padding:"4px 2px 14px"}}>
      {guides.map(g=>{const Ic=g.Icon;return<a key={g.key} data-rc href={g.url} target="_blank" rel="noopener noreferrer" className="ga-lift" style={{scrollSnapAlign:"start",textDecoration:"none",position:"relative",height:isMobile?340:460,borderRadius:18,overflow:"hidden",border:"1px solid "+th.cardBorder,display:"block",background:"linear-gradient(150deg, "+g.c+"2E 0%, "+th.glassBg+" 58%)"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(120% 80% at 82% 0%, "+g.c+"33, transparent 55%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:22,left:22,width:52,height:52,borderRadius:14,background:g.c+"22",border:"1px solid "+g.c+"55",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic size={26} strokeWidth={1.5} color={g.c}/></div>
        <div style={{position:"absolute",left:0,right:0,bottom:0,padding:"22px 22px 24px",background:"linear-gradient(0deg, "+th.bg+"F2 0%, "+th.bg+"D0 52%, transparent 100%)"}}>
          <div style={{fontSize:17,fontWeight:700,color:th.text,lineHeight:1.25,marginBottom:8,letterSpacing:"-0.01em"}}>{g.title}</div>
          <div style={{fontSize:12.5,color:th.muted,lineHeight:1.55,marginBottom:14,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{g.desc}</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:600,color:g.c}}>{(t.openGuide||"Read more").replace(/\s*→\s*$/,"")} <span style={{fontSize:14}}>→</span></div>
        </div>
      </a>;})}
    </div>
  </div>;
}
function ServiceRequestModal({svc,lang,t,onClose}){const th=useTh();const[f,setF]=useState({name:"",email:"",phone:"",message:""});const[sent,setSent]=useState(false);const u=k=>e=>setF(p=>({...p,[k]:e.target.value}));const send=()=>{const sub=encodeURIComponent(`Service Request: ${svc[lang]||svc.en}`);const body=encodeURIComponent(`Name: ${f.name}\nEmail: ${f.email}\nPhone: ${f.phone}\n\n${f.message||"Interested."}`);window.location.href=`mailto:mauricio@goldenanchor.life?subject=${sub}&body=${body}`;setSent(true);setTimeout(onClose,2000);};const INP=mINP(th);return<Modal title={"📋 "+t.requestServiceTitle} onClose={onClose}>{sent?<div style={{textAlign:"center",padding:20,color:th.pos,fontSize:14,fontWeight:700}}>✅ {t.requestSent}</div>:<><div style={{...mCARD(th),padding:12,marginBottom:16,display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:24}}>{svc.icon}</span><div><div style={{fontWeight:700,color:th.text}}>{svc[lang]||svc.en}</div><div style={{fontSize:11,color:th.accent}}>{svc.price}</div></div></div><Field label={t.yourName}><input style={INP} value={f.name} onChange={u("name")}/></Field><Row2><Field label={t.yourEmail}><input style={INP} value={f.email} onChange={u("email")}/></Field><Field label={t.yourPhone}><input style={INP} value={f.phone} onChange={u("phone")}/></Field></Row2><Field label={t.message}><textarea style={{...INP,height:80,resize:"vertical"}} value={f.message} onChange={u("message")} placeholder={t?.tellUsNeedsPh||"Tell us about your needs…"}/></Field><SaveBar onSave={send} onCancel={onClose} t={{...t,save:t.sendRequest}}/></>}</Modal>;}
// v0.59 — About / Services rebuilt from Playwright screenshot. Services
// grid had per-card height drift because some cards rendered 1 button
// (Free + Insurance Advisory) while others rendered 2, producing uneven
// rows. Now: button row always reserves 2 slots — Free shows a single
// full-width Request button; paid-without-Stripe shows a disabled
// Pay-Now placeholder. Tile padding, typography hierarchy, and price
// emphasis tightened per ui-ux-pro-max spec.
/* ── v0.63 — PricingPlans: reusable visual pricing (landing + in-app). Tiered
   membership cards w/ included-features + one-time services, B style, halo lift,
   Stripe Pay / Get-started. Replaces the old About-page service boxes. */
const PLAN_FEATURES={"monthly-lite":{en:["Brief monthly check-ins","Message-based Q&A","Accountability & progress tracking","Client dashboard access"],es:["Chequeos mensuales breves","Preguntas por mensaje","Acompañamiento y seguimiento","Acceso al panel de cliente"]},"monthly-lite-plus":{en:["Everything in Lite","1 Strategy Session / month","Priority responses"],es:["Todo lo de Lite","1 Sesión Estratégica / mes","Respuestas prioritarias"]},"annual-bundle":{en:["4 Quarterly Reviews","Priority Strategy Sessions","Year-end report","Best value vs monthly"],es:["4 Revisiones Trimestrales","Sesiones Estratégicas prioritarias","Informe de fin de año","Mejor valor vs mensual"]}};
function PricingPlans({t,lang,settings,variant="app",onRequest}){
  const th=useTh();const L=lang==="es"?"es":"en";
  const links=(settings&&settings.stripeLinks)||DEF_SETTINGS.stripeLinks||{};
  const recurring=SVCS.filter(s=>/\/(mo|yr)/.test(s.price));
  const oneTime=SVCS.filter(s=>!/\/(mo|yr)/.test(s.price)&&s.id!=="insurance-consult"&&s.id!=="donation");
  const extras=SVCS.filter(s=>s.id==="insurance-consult"||s.id==="donation");
  const ctaLabel=variant==="landing"?(L==="es"?"Comenzar":"Get started"):(L==="es"?"Elegir plan":"Choose plan");
  const Hdr=({children})=><div style={{fontSize:10,fontWeight:500,color:th.dim,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",margin:"6px 0 14px"}}>{children}</div>;
  const Check=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={th.pos} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><path d="M20 6 9 17l-5-5"/></svg>;
  const Price=({p})=>{const cad=p.includes("/mo")?"/mo":p.includes("/yr")?"/yr":"";return<div style={{display:"flex",alignItems:"baseline",gap:3,marginTop:8}}><span style={{fontSize:29,fontWeight:600,color:th.text,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"-0.02em",lineHeight:1}}>{p.replace(/\/(mo|yr)$/,"")}</span>{cad&&<span style={{fontSize:12,color:th.dim,fontFamily:"'JetBrains Mono',monospace"}}>{cad}</span>}</div>;};
  const cta=(s)=>{const url=links[s.id]||s.payUrl||"";const free=s.price==="Free"||s.price==="Any amount";
    if(free)return<button className="ga-press" onClick={()=>{if(onRequest)onRequest(s);else window.location.href="mailto:"+((settings&&settings.advisorEmail)||"mauricio@goldenanchor.life");}} style={{width:"100%",boxSizing:"border-box",fontSize:12,fontWeight:600,padding:"10px 14px",borderRadius:8,background:th.accent+"18",color:th.accent,border:"1px solid "+th.accent+"44",cursor:"pointer",fontFamily:"inherit"}}>{s.id==="donation"?(L==="es"?"Donar":"Donate"):(L==="es"?"Solicitar":"Request consult")}</button>;
    return<a className="ga-press" href={url||undefined} target={url?"_blank":undefined} rel="noreferrer" onClick={e=>{if(!url)e.preventDefault();}} style={{display:"block",width:"100%",boxSizing:"border-box",fontSize:12,fontWeight:600,padding:"10px 14px",borderRadius:8,background:url?GOLD:th.inp,color:url?"#0B0C0E":th.dim,border:"none",cursor:url?"pointer":"not-allowed",textAlign:"center",textDecoration:"none",opacity:url?1:0.6,fontFamily:"inherit"}}>{ctaLabel}</a>;};
  return<div>
    <Hdr>{L==="es"?"Planes y Membresías":"Plans & Memberships"}</Hdr>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14,marginBottom:28}}>
      {recurring.map(s=>{const pop=s.id==="monthly-lite-plus";const feats=(PLAN_FEATURES[s.id]||{})[L]||[];return<div key={s.id} className="ga-lift" style={{...mCARD(th),padding:"20px",display:"flex",flexDirection:"column",border:pop?("1px solid "+GOLD):undefined,position:"relative"}}>
        {pop&&<div style={{position:"absolute",top:-9,left:20,fontSize:8.5,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",background:GOLD,color:"#0B0C0E",padding:"3px 9px",borderRadius:99}}>{L==="es"?"Más popular":"Most popular"}</div>}
        <div style={{fontSize:14,fontWeight:600,color:th.text,lineHeight:1.3}}>{s[L]||s.en}</div>
        <Price p={s.price}/>
        <div style={{height:1,background:th.cardBorder,margin:"16px 0"}}/>
        <div style={{display:"flex",flexDirection:"column",gap:10,flex:1,marginBottom:18}}>{feats.map((f,i)=><div key={i} style={{display:"flex",gap:9,fontSize:12,color:th.muted,lineHeight:1.4}}><Check/>{f}</div>)}</div>
        {cta(s)}
      </div>;})}
    </div>
    <Hdr>{L==="es"?"Servicios puntuales":"One-time services"}</Hdr>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12,marginBottom:24}}>
      {oneTime.map(s=><div key={s.id} className="ga-lift" style={{...mCARD(th),padding:"16px 18px",display:"flex",flexDirection:"column",gap:9}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10}}><div style={{fontSize:13,fontWeight:600,color:th.text,lineHeight:1.3}}>{s[L]||s.en}</div><div style={{fontSize:14,fontWeight:600,color:GOLD,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{s.price}</div></div>
        <div style={{fontSize:11.5,color:th.muted,lineHeight:1.5,flex:1}}>{(L==="es"&&s.descEs)||s.desc}</div>
        {cta(s)}
      </div>)}
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      {extras.map(s=><div key={s.id} className="ga-lift" style={{...mCARD(th),padding:"14px 16px",display:"flex",alignItems:"center",gap:14,flex:"1 1 280px"}}>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,color:th.text}}>{s[L]||s.en}</div><div style={{fontSize:11,color:th.dim,marginTop:2}}>{s.price}</div></div>
        <div style={{width:144,flexShrink:0}}>{cta(s)}</div>
      </div>)}
    </div>
  </div>;
}
/* v0.63.2 LineField: ambient auto-drifting line-field (echoes the landing, no mouse). */
function LineField({color="150,180,220",dark=true}){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;const ctx=c.getContext("2d");const DPR=Math.min(2,window.devicePixelRatio||1);
    const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    const E={friction:0.5,trails:40,size:32,dampening:0.025,tension:0.99};const pos={x:0,y:0};
    let lines=[],raf,phase=1.3,drift=0,running=true;
    const resize=()=>{c.width=c.clientWidth*DPR;c.height=c.clientHeight*DPR;pos.x=c.width*0.5;pos.y=c.height*0.34;};
    const Node=function(){this.x=pos.x;this.y=pos.y;this.vx=0;this.vy=0;};
    const build=()=>{lines=[];for(let i=0;i<E.trails;i++){const l={spring:0.4+(i/E.trails)*0.025,friction:E.friction+(Math.random()*0.01-0.005),nodes:[]};for(let j=0;j<E.size;j++)l.nodes.push(new Node());lines.push(l);}};
    const upd=(l)=>{let e=l.spring,t=l.nodes[0];t.vx+=(pos.x-t.x)*e;t.vy+=(pos.y-t.y)*e;for(let i=0;i<l.nodes.length;i++){t=l.nodes[i];if(i>0){const n=l.nodes[i-1];t.vx+=(n.x-t.x)*e;t.vy+=(n.y-t.y)*e;t.vx+=n.vx*E.dampening;t.vy+=n.vy*E.dampening;}t.vx*=l.friction;t.vy*=l.friction;t.x+=t.vx;t.y+=t.vy;e*=E.tension;}};
    const draw=(l)=>{ctx.beginPath();ctx.moveTo(l.nodes[0].x,l.nodes[0].y);let i;for(i=1;i<l.nodes.length-2;i++){const a=l.nodes[i],b=l.nodes[i+1];ctx.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);}const a=l.nodes[i],b=l.nodes[i+1];ctx.quadraticCurveTo(a.x,a.y,b.x,b.y);ctx.stroke();};
    const render=()=>{if(!running)return;drift+=0.006;pos.x=c.width*(0.5+0.34*Math.sin(drift*0.7));pos.y=c.height*(0.36+0.26*Math.cos(drift*0.9));ctx.clearRect(0,0,c.width,c.height);phase+=0.0016;const sh=0.5+Math.sin(phase)*0.5;ctx.globalCompositeOperation=dark?"lighter":"source-over";const a=dark?(0.04+sh*0.05):(0.06+sh*0.06);ctx.strokeStyle="rgba("+color+","+a+")";ctx.lineWidth=DPR*(dark?5:4);for(const l of lines){upd(l);draw(l);}raf=requestAnimationFrame(render);};
    resize();build();const onR=()=>{resize();build();};window.addEventListener("resize",onR);
    if(reduced){for(let k=0;k<60;k++)for(const l of lines)upd(l);ctx.strokeStyle="rgba("+color+",0.06)";ctx.lineWidth=DPR*5;for(const l of lines)draw(l);}else render();
    return ()=>{running=false;cancelAnimationFrame(raf);window.removeEventListener("resize",onR);};
  },[dark,color]);
  return <canvas ref={ref} aria-hidden="true" style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}}/>;
}
/* v0.63.2 PricingCarousel: long cards, 3 visible, prev/next arrows (Mauricio's ask). */
function PricingCarousel({lang,settings,onRequest,ctaLabel}){
  const th=useTh();const L=lang==="es"?"es":"en";const{isMobile}=useViewport();
  const ref=useRef(null);const[stt,setStt]=useState({s:true,e:false});
  const links=(settings&&settings.stripeLinks)||DEF_SETTINGS.stripeLinks||{};
  const sync=()=>{const el=ref.current;if(!el)return;setStt({s:el.scrollLeft<6,e:el.scrollLeft+el.clientWidth>=el.scrollWidth-6});};
  useEffect(()=>{sync();},[lang]);
  const scroll=d=>{const el=ref.current;if(!el)return;const cw=(el.querySelector("[data-card]")?.offsetWidth||300)+18;el.scrollBy({left:d*cw,behavior:"smooth"});};
  const Ck=()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={th.pos} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><path d="M20 6 9 17l-5-5"/></svg>;
  const arr=on=>({flexShrink:0,width:42,height:42,borderRadius:99,border:"1px solid "+th.cardBorder,background:th.glassBg,color:th.text,cursor:on?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",opacity:on?1:0.3,fontSize:20,lineHeight:1});
  const cta=(svc)=>{const url=links[svc.id]||svc.payUrl||"";const free=svc.price==="Free"||svc.price==="Any amount";const lbl=free?(L==="es"?"Solicitar":"Request"):ctaLabel;
    const base={marginTop:"auto",display:"block",width:"100%",boxSizing:"border-box",textAlign:"center",fontSize:12.5,fontWeight:600,padding:"11px 16px",borderRadius:9,fontFamily:"inherit",textDecoration:"none"};
    if(free)return<button className="ga-press" onClick={()=>{if(onRequest)onRequest(svc);else window.location.href="mailto:"+((settings&&settings.advisorEmail)||"mauricio@goldenanchor.life");}} style={{...base,background:"transparent",color:th.text,border:"1px solid "+th.cardBorder,cursor:"pointer"}}>{lbl}</button>;
    return<a className="ga-press" href={url||undefined} target={url?"_blank":undefined} rel="noreferrer" onClick={e=>{if(!url)e.preventDefault();}} style={{...base,background:url?"linear-gradient(180deg,#EBD089 0%,#C9A84C 52%,#B58E1C 100%)":th.inp,boxShadow:url?"inset 0 1px 0 rgba(255,255,255,0.32), 0 6px 16px rgba(201,168,76,0.22)":"none",color:url?"#16120A":th.dim,border:"none",cursor:url?"pointer":"not-allowed",opacity:url?1:0.6}}>{lbl}</a>;};
  return<div><div style={{display:"flex",alignItems:"center",gap:isMobile?8:14}}>
    {!isMobile&&<button onClick={()=>scroll(-1)} disabled={stt.s} style={arr(!stt.s)} aria-label={L==="es"?"Anterior":"Previous"}>‹</button>}
    <div ref={ref} onScroll={sync} style={{flex:1,display:"grid",gridAutoFlow:"column",gridAutoColumns:isMobile?"86%":"calc((100% - 36px)/3)",gap:18,overflowX:"auto",scrollSnapType:"x proximity",scrollbarWidth:"none",msOverflowStyle:"none",scrollPaddingLeft:14,scrollPaddingRight:26,padding:"16px 26px 16px 14px"}}>
      {["monthly-lite","monthly-lite-plus","annual-bundle","initial-checkup","quarterly-review","strategy-session","insurance-consult"].map(_id=>SVCS.find(s=>s.id===_id)).filter(Boolean).map(svc=>{const feats=(PLAN_FEATURES[svc.id]||{})[L];const pop=svc.id==="monthly-lite-plus";return<div key={svc.id} data-card className="ga-lift ga-spot" style={{scrollSnapAlign:"start",...mCARD(th),padding:"22px 20px",display:"flex",flexDirection:"column",minHeight:isMobile?350:430,border:pop?("1px solid "+th.glassBorder):undefined}}>
        {pop&&<span style={{alignSelf:"flex-start",fontSize:8.5,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",background:"rgba(198,216,242,0.16)",color:th.text,padding:"4px 10px",borderRadius:99,marginBottom:14,border:"1px solid rgba(198,216,242,0.4)"}}>{L==="es"?"Más popular":"Most popular"}</span>}
        <div style={{fontSize:17,fontWeight:600,color:th.text,letterSpacing:"-0.01em"}}>{svc[L]||svc.en}</div>
        <div style={{fontSize:12,color:th.dim,lineHeight:1.5,margin:"5px 0 16px",minHeight:32}}>{(L==="es"&&svc.descEs)||svc.desc}</div>
        <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:18}}><span style={{fontSize:36,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"-0.02em",lineHeight:1,color:th.text}}>{svc.price.replace(/\/(mo|yr)$/,"")}</span>{/\/(mo|yr)/.test(svc.price)&&<span style={{fontSize:13,color:th.dim,fontFamily:"'JetBrains Mono',monospace"}}>{svc.price.indexOf("/mo")>=0?"/mo":"/yr"}</span>}</div>
        {feats?<div style={{display:"flex",flexDirection:"column",gap:11,flex:1,marginBottom:20}}>{feats.map((f,i)=><div key={i} style={{display:"flex",gap:10,fontSize:12.5,color:th.muted,lineHeight:1.4}}><Ck/>{f}</div>)}</div>:<div style={{flex:1}}/>}
        {svc.id==="initial-checkup"&&<div style={{fontSize:11,color:th.dim,lineHeight:1.5,marginBottom:12,fontStyle:"italic"}}>{L==="es"?"¿Ya eres cliente de Golden Anchor? Pide tu código de descuento a tu asesor.":"Already a Golden Anchor client? Ask your advisor for your discount code."}</div>}
        {cta(svc)}
      </div>;})}
    </div>
    {!isMobile&&<button onClick={()=>scroll(1)} disabled={stt.e} style={arr(!stt.e)} aria-label={L==="es"?"Siguiente":"Next"}>›</button>}
  </div></div>;
}
/* v0.63.2 PlanComparison: grouped feature matrix (everything the app does, by plan). */
function PlanComparison({lang}){
  const th=useTh();const L=lang==="es"?"es":"en";const HL="rgba(198,216,242,0.06)";
  const cols=[["monthly-lite","Lite"],["monthly-lite-plus","Lite +"],["annual-bundle","Annual"]];
  const groups=[
    {g:{en:"Coaching & support",es:"Asesoría y soporte"},rows:[
      {f:{en:"Client dashboard access",es:"Acceso al panel de cliente"},inc:["monthly-lite","monthly-lite-plus","annual-bundle"]},
      {f:{en:"Monthly check-ins",es:"Chequeos mensuales"},inc:["monthly-lite","monthly-lite-plus"]},
      {f:{en:"Message-based Q&A",es:"Preguntas por mensaje"},inc:["monthly-lite","monthly-lite-plus","annual-bundle"]},
      {f:{en:"Priority responses",es:"Respuestas prioritarias"},inc:["monthly-lite-plus","annual-bundle"]},
    ]},
    {g:{en:"Strategy & reviews",es:"Estrategia y revisiones"},rows:[
      {f:{en:"Strategy Session / month",es:"Sesión Estratégica / mes"},inc:["monthly-lite-plus"]},
      {f:{en:"4 Quarterly Reviews",es:"4 Revisiones Trimestrales"},inc:["annual-bundle"]},
      {f:{en:"Priority Strategy Sessions",es:"Sesiones Estratégicas prioritarias"},inc:["annual-bundle"]},
      {f:{en:"Year-end report",es:"Informe de fin de año"},inc:["annual-bundle"]},
    ]},
    {g:{en:"Tools in the app",es:"Herramientas en la app"},rows:[
      {f:{en:"Income, bills, debt & savings tracking",es:"Seguimiento de ingresos, gastos, deuda y ahorro"},inc:["monthly-lite","monthly-lite-plus","annual-bundle"]},
      {f:{en:"Debt payoff calculators",es:"Calculadoras de pago de deuda"},inc:["monthly-lite","monthly-lite-plus","annual-bundle"]},
      {f:{en:"Retirement & investment projections",es:"Proyecciones de retiro e inversión"},inc:["monthly-lite-plus","annual-bundle"]},
      {f:{en:"Net-worth & cash-flow trends",es:"Tendencias de patrimonio y flujo"},inc:["monthly-lite","monthly-lite-plus","annual-bundle"]},
      {f:{en:"Downloadable PDF reports",es:"Reportes PDF descargables"},inc:["monthly-lite-plus","annual-bundle"]},
    ]},
  ];
  const Ck=()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={th.pos} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
  const Xx=()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={th.dim} strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
  return<div style={{...mCARD(th),padding:0,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
    <thead><tr style={{borderBottom:"1px solid "+th.cardBorder}}><th style={{textAlign:"left",padding:"13px 16px",fontSize:10,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase",color:th.dim,fontWeight:500}}>{L==="es"?"Función":"Feature"}</th>{cols.map(([id,nm])=><th key={id} style={{textAlign:"center",padding:"13px 14px",fontSize:11.5,fontWeight:600,color:th.text,background:id==="monthly-lite-plus"?HL:"transparent",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{nm}</th>)}</tr></thead>
    <tbody>{groups.flatMap((grp,gi)=>[
      <tr key={"g"+gi}><td colSpan={4} style={{padding:"15px 16px 7px",fontSize:10,letterSpacing:"0.13em",textTransform:"uppercase",color:th.dim,fontFamily:"'JetBrains Mono',monospace",fontWeight:500,background:"rgba(198,216,242,0.035)"}}>{grp.g[L]}</td></tr>,
      ...grp.rows.map((r,i)=><tr key={gi+"-"+i}><td style={{padding:"11px 16px",fontSize:12.5,color:th.muted,borderTop:"1px solid "+th.cardBorder}}>{r.f[L]}</td>{cols.map(([id])=><td key={id} style={{padding:"11px 14px",textAlign:"center",borderTop:"1px solid "+th.cardBorder,background:id==="monthly-lite-plus"?HL:"transparent"}}><span style={{display:"inline-flex",verticalAlign:"middle"}}>{r.inc.includes(id)?<Ck/>:<Xx/>}</span></td>)}</tr>)
    ])}</tbody>
  </table></div></div>;
}
/* v0.63.2 PricingPage: standalone (public from landing w/ line-field + EN/ES + modes, or app nav). */
const REF_CAT_LBL={"insurance-car":["Car insurance","Seguro de auto"],"insurance-home":["Home insurance","Seguro de hogar"],realtor:["Realtor","Inmobiliario"],lender:["Lender","Prestamista"],tax:["Tax","Impuestos"],legal:["Legal","Legal"],other:["Other","Otro"]};
/* MD-A (v0.74) — self-serve ladder: Free + Premium (choose-your-price) above the services. */
function SelfServePlans({lang,variant,onSignIn}){
  const th=useTh();const es=lang==="es";
  const _ref=(typeof localStorage!=="undefined"&&localStorage.getItem("ga_cache_uid"))||"";
  const freeFeats=es?["Tu perfil financiero","Calculadoras públicas","Recursos y artículos","Soporte por correo"]:["Your financial profile","Public calculators","Resources & articles","Email support"];
  const premFeats=es?["Calculadoras con TUS números","Reporte completo + comparación de meses","Paquetes de inversión adicionales","Descarga de reportes en PDF","Directorio de recursos útiles"]:["Calculators with YOUR numbers","Complete report + month compare","Additional investment packages","PDF report downloads","Useful-links resource directory"];
  const Ck=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={th.pos} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:2}}><path d="M20 6 9 17l-5-5"/></svg>;
  const card={...mCARD(th),padding:"24px 22px",display:"flex",flexDirection:"column",minHeight:330};
  return<div style={{maxWidth:760,margin:"0 auto 44px"}}>
    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:th.dim,textAlign:"center",marginBottom:8}}>{es?"Hazlo tú mismo":"Self-serve"}</div>
    <div style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontWeight:500,fontSize:25,color:th.text,textAlign:"center",margin:"0 0 22px",lineHeight:1.15}}>{es?"Usa la app con o sin asesor":"Use the app with or without an advisor"}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18}}>
      <div className="ga-lift" style={card}>
        <div style={{fontSize:17,fontWeight:600,color:th.text}}>{es?"Gratis":"Free"}</div>
        <div style={{fontSize:12,color:th.dim,margin:"5px 0 14px"}}>{es?"Para empezar a ordenar tus finanzas.":"To start getting organized."}</div>
        <div style={{fontSize:34,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"-0.02em",color:th.text,marginBottom:16}}>$0</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,flex:1,marginBottom:18}}>{freeFeats.map((f,i)=><div key={i} style={{display:"flex",gap:9,fontSize:12.5,color:th.muted,lineHeight:1.4}}><Ck/>{f}</div>)}</div>
        {variant==="public"&&<button className="ga-press" onClick={onSignIn} style={{display:"block",width:"100%",textAlign:"center",fontSize:12.5,fontWeight:600,padding:"11px 16px",borderRadius:9,background:"transparent",color:th.text,border:"1px solid "+th.cardBorder,cursor:"pointer",fontFamily:"inherit"}}>{es?"Crear cuenta gratis":"Create a free account"}</button>}
      </div>
      <div className="ga-lift" style={{...card,border:"1px solid "+th.accent+"55"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{fontSize:17,fontWeight:600,color:th.text}}>Premium</div><span style={{fontSize:8.5,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",background:th.accent+"1A",color:th.accent,padding:"4px 10px",borderRadius:99,border:"1px solid "+th.accent+"44"}}>{es?"Paga lo que elijas":"Choose your price"}</span></div>
        <div style={{fontSize:12,color:th.dim,margin:"5px 0 14px"}}>{es?"Todo desbloqueado — tú decides cuánto aportar.":"Everything unlocked — you decide how much to give."}</div>
        <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:16}}><span style={{fontSize:34,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"-0.02em",color:th.text}}>$3+</span><span style={{fontSize:13,color:th.dim,fontFamily:"'JetBrains Mono',monospace"}}>/{es?"mes":"mo"}</span></div>
        <div style={{display:"flex",flexDirection:"column",gap:10,flex:1,marginBottom:18}}>{premFeats.map((f,i)=><div key={i} style={{display:"flex",gap:9,fontSize:12.5,color:th.muted,lineHeight:1.4}}><Ck/>{f}</div>)}</div>
        {variant==="public"
          ?<button className="ga-press" onClick={onSignIn} style={{display:"block",width:"100%",textAlign:"center",fontSize:12.5,fontWeight:600,padding:"11px 16px",borderRadius:9,background:"linear-gradient(180deg,#EBD089 0%,#C9A84C 52%,#B58E1C 100%)",color:"#16120A",border:"none",cursor:"pointer",fontFamily:"inherit",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.32), 0 6px 16px rgba(201,168,76,0.22)"}}>{es?"Empezar gratis y mejorar":"Start free, then upgrade"}</button>
          :<ChooseAmount lang={es?"es":"en"} onFallbackTier={tr=>window.open(tr.link+(_ref?"?client_reference_id="+encodeURIComponent(_ref):""),"_blank","noopener")}/>}
      </div>
    </div>
  </div>;
}
function PricingPage({t,lang,settings,variant="app",onBack,onSignIn,onRequest,isDark,onToggleTheme,onToggleLang}){
  const th=useTh();const L=lang==="es"?"es":"en";
  const ctaLabel=(variant==="public")?(L==="es"?"Comenzar":"Get started"):(L==="es"?"Elegir plan":"Choose plan");
  const inner=<div style={{maxWidth:1180,margin:"0 auto",padding:variant==="public"?"8px 24px 72px":"24px 16px 48px",position:"relative",zIndex:1}}>
    <div style={{textAlign:"center",marginBottom:30}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:th.dim,marginBottom:10}}>{L==="es"?"Precios":"Pricing"}</div>
      <h1 style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontWeight:500,fontSize:35,color:th.text,margin:"0 0 10px",letterSpacing:"-0.01em",lineHeight:1.1}}>{L==="es"?"Elige el plan adecuado para ti":"Choose the plan that fits you"}</h1>
      <p style={{fontSize:14,color:th.muted,maxWidth:560,margin:"0 auto",lineHeight:1.6}}>{L==="es"?"Membresías y servicios puntuales para cada etapa de tu camino financiero. Sin permanencia, cancela cuando quieras.":"Memberships and one-time services for every stage of your financial journey. No lock-in, cancel anytime."}</p>
    </div>
    <SelfServePlans lang={lang} variant={variant} onSignIn={onSignIn}/>
    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:th.dim,textAlign:"center",marginBottom:8}}>{L==="es"?"Con tu asesor":"With your advisor"}</div>
    <div style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontWeight:500,fontSize:25,color:th.text,textAlign:"center",margin:"0 0 22px",lineHeight:1.15}}>{L==="es"?"Membresías y servicios de asesoría":"Advisory memberships & services"}</div>
    <PricingCarousel lang={lang} settings={settings} onRequest={onRequest} ctaLabel={ctaLabel}/>
    <div style={{maxWidth:980,margin:"50px auto 0"}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:th.dim,textAlign:"center",marginBottom:8}}>{L==="es"?"Comparación completa":"Full comparison"}</div>
      <div style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontWeight:500,fontSize:25,color:th.text,textAlign:"center",margin:"0 0 22px",lineHeight:1.15}}>{L==="es"?"Todo lo que puedes hacer, por plan":"Everything you can do, by plan"}</div>
      <PlanComparison lang={lang}/>
    </div>
  </div>;
  if(variant!=="public")return inner;
  const pill={fontSize:12,fontWeight:600,padding:"8px 13px",borderRadius:99,border:"1px solid "+th.cardBorder,background:"transparent",color:th.muted,cursor:"pointer",fontFamily:"inherit"};
  return <div style={{minHeight:"100vh",position:"relative",overflow:"hidden",background:th.bg,color:th.text}}>
    {/* MD-F (v0.74.2): quiet radial glow — matches the landing page; the cursor line-field read as noise here */}
    <div aria-hidden style={{position:"fixed",top:-200,right:60,width:620,height:620,borderRadius:"50%",background:`radial-gradient(circle,${isDark?"rgba(203,168,90,0.12)":"rgba(184,144,30,0.08)"},transparent 70%)`,filter:"blur(50px)",pointerEvents:"none",zIndex:0}}/>
    <div style={{position:"relative",zIndex:1}}>
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 26px",maxWidth:1240,margin:"0 auto"}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:11,background:"transparent",border:"none",cursor:"pointer",padding:0}}><div style={{width:36,height:36,borderRadius:10,background:th.glassBg,border:"1px solid "+th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={th.navAcc||GOLD} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M5 13H3M19 13h2"/></svg></div><div style={{textAlign:"left"}}><div style={{fontSize:14.5,fontWeight:700,color:th.text,letterSpacing:"-0.01em",lineHeight:1.1}}>Golden Anchor</div><div style={{fontSize:8.5,letterSpacing:"0.16em",color:th.dim,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",marginTop:3}}>{L==="es"?"Asesoría Financiera":"Financial Advisory"}</div></div></button>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          {onToggleLang&&<button onClick={onToggleLang} style={pill}>{L==="es"?"EN":"ES"}</button>}
          {onToggleTheme&&<button onClick={onToggleTheme} style={pill}>{isDark?(L==="es"?"Claro":"Light"):(L==="es"?"Oscuro":"Dark")}</button>}
          <button className="ga-press" onClick={onSignIn} style={{fontSize:12.5,fontWeight:600,padding:"9px 18px",borderRadius:99,background:GOLD,color:"#0B0C0E",border:"none",cursor:"pointer",fontFamily:"inherit"}}>{L==="es"?"Iniciar sesión":"Sign in"}</button>
        </div>
      </header>
      {inner}
    </div>
  </div>;
}
function AboutPage({t,settings,lang,isDark}){
  const th=useTh();
  const ig=(settings&&settings.ig)||"golden_anchor_inc";
  const email=(settings&&settings.advisorEmail)||"mauricio@goldenanchor.life";
  const phone=(settings&&settings.advisorPhone)||"";
  const goldGrad=isDark?"linear-gradient(100deg,#F4DC9B 0%,#D8B14E 50%,#C9A84C 100%)":"linear-gradient(100deg,#B8901E 0%,#8A6B1E 100%)";
  const clip={backgroundImage:goldGrad,WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",WebkitTextFillColor:"transparent"};
  const feats=[
    {Icon:HeartHandshake,ti:t.featCoachingT||"Educational coaching",de:t.featCoachingD||"Guidance, not management. You learn the why behind every decision.",span:2},
    {Icon:Languages,ti:t.featBilingualT||"Bilingual, EN & ES",de:t.featBilingualD||"Every plan, document, and conversation in your language.",span:1},
    {Icon:Target,ti:t.featPlanT||"Personalized plans",de:t.featPlanD||"Built around your goals, income, and timeline.",span:1},
    {Icon:TrendingDown,ti:t.featDebtT||"Debt payoff strategy",de:t.featDebtD||"Avalanche or snowball, mapped to your real numbers.",span:1},
    {Icon:ShieldCheck,ti:t.featInsuranceT||"Insurance advisory",de:t.featInsuranceD||"Life and health coverage matched to your stage.",span:1},
    {Icon:CalendarCheck,ti:t.featCheckinT||"Monthly check-ins",de:t.featCheckinD||"We track progress together, every single month.",span:3},
  ];
  const _site=((settings&&settings.websiteUrl)||"https://goldenanchor.life").trim();
  const _siteHref=_site.startsWith("http")?_site:"https://"+_site;
  const socials=[
    {Icon:Globe,label:t.website||"Website",val:_site.replace(/^https?:\/\//,""),href:_siteHref},
    {Icon:AtSign,label:"Instagram",val:"@"+ig,href:"https://instagram.com/"+ig},
    {Icon:Mail,label:t.lblEmail||"Email",val:email,href:"mailto:"+email},
  ];
  if(phone)socials.push({Icon:Phone,label:t.phone||"Phone",val:phone,href:"tel:"+phone.replace(/[^0-9+]/g,"")});
  return <div className="ga-np" style={{padding:24,maxWidth:1180,margin:"0 auto"}}>
    <style>{`@keyframes gaSpinSlow{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes gaSpinRev{from{transform:rotate(0)}to{transform:rotate(-360deg)}}.ga-orbit{animation:gaSpinSlow 42s linear infinite;transform-box:fill-box;transform-origin:center}.ga-orbit-rev{animation:gaSpinRev 58s linear infinite;transform-box:fill-box;transform-origin:center}.ga-social-dot{transition:transform .25s cubic-bezier(.23,1,.32,1)}.ga-social-dot:hover{transform:translateY(-3px)}.ga-social-dot:hover .ga-social-ring{box-shadow:0 12px 30px ${GOLD}44;border-color:${GOLD}}@media (prefers-reduced-motion:reduce){.ga-orbit,.ga-orbit-rev{animation:none}}`}</style>

    {/* HERO */}
    <div data-ga-grid="about-hero" className="ga-rise" style={{display:"grid",gridTemplateColumns:"minmax(0,1.1fr) minmax(0,.9fr)",gap:32,alignItems:"center",margin:"6px 0 38px"}}>
      <div>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.2em",color:th.dim,fontFamily:"'JetBrains Mono',ui-monospace,monospace",marginBottom:18}}>{t.aboutEyebrow||"EDUCATIONAL FINANCIAL COACHING"}</div>
        <h1 style={{margin:0,fontFamily:"'Newsreader',Georgia,serif",fontWeight:500,fontSize:"clamp(30px,4.4vw,48px)",lineHeight:1.1,letterSpacing:"-0.01em",color:th.text}}><span style={{fontStyle:"italic",...clip}}>{t.aboutHeroTitle||"Anchored in your financial future."}</span></h1>
        <p style={{fontSize:14,color:th.muted,lineHeight:1.8,maxWidth:540,margin:"20px 0 0"}}>{t.aboutDesc}</p>
        <div style={{display:"flex",gap:9,marginTop:24,flexWrap:"wrap"}}>{["EN · ES","Miami, FL"].map((c,i)=><span key={i} style={{fontSize:11,fontWeight:600,color:th.muted,padding:"6px 13px",borderRadius:99,background:th.card,border:"1px solid "+th.cardBorder,letterSpacing:"0.02em"}}>{c}</span>)}</div>
      </div>
      {/* MD-F (v0.74.2): spinning dashed orbits read as clip-art — replaced with calm
          static hairline rings + soft glow. Quieter, more Linear/Mercury. */}
      <div style={{position:"relative",width:"100%",maxWidth:330,aspectRatio:"1",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{position:"absolute",inset:"12%",borderRadius:"50%",background:"radial-gradient(circle at 50% 45%, "+GOLD+"26, transparent 64%)"}}/>
        <svg viewBox="0 0 200 200" style={{position:"absolute",inset:0,width:"100%",height:"100%"}} aria-hidden="true">
          <circle cx="100" cy="100" r="88" fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.30"/>
          <circle cx="100" cy="100" r="68" fill="none" stroke={th.muted} strokeWidth="0.4" opacity="0.18"/>
          <circle cx="100" cy="12" r="2.2" fill={GOLD} opacity="0.8"/>
        </svg>
        <div style={{position:"relative",width:"44%",height:"44%",borderRadius:26,background:th.card,border:"1px solid "+th.cardBorder,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 22px 60px "+GOLD+"22"}}><img src="/anchor-monogram.svg" style={{width:"60%",height:"60%"}} alt="Golden Anchor"/></div>
      </div>
    </div>

    {/* feature bento — "What we do" header removed (MD-F, owner: it's said elsewhere) */}
    <div data-ga-grid="bento" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14,marginBottom:34}}>
      {feats.map((f,i)=><div key={i} className="ga-lift ga-spot" style={{...mCARD(th),gridColumn:"span "+f.span,padding:22,display:"flex",flexDirection:"column",gap:13,minHeight:140}}>
        <div style={{width:42,height:42,borderRadius:12,background:GOLD+"1A",border:"1px solid "+GOLD+"3A",display:"flex",alignItems:"center",justifyContent:"center",color:GOLD,flexShrink:0}}><f.Icon size={20} strokeWidth={1.6}/></div>
        <div><div style={{fontSize:15,fontWeight:700,color:th.text,letterSpacing:"-0.01em",marginBottom:5}}>{f.ti}</div><div style={{fontSize:12.5,color:th.muted,lineHeight:1.65,maxWidth:560}}>{f.de}</div></div>
      </div>)}
    </div>

    {/* ADVISOR + CONNECT + REFERRAL */}
    <div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1.25fr 1fr",gap:16,alignItems:"stretch"}}>
      <div className="ga-lift ga-spot" style={{...mCARD(th),padding:26,display:"flex",flexDirection:"column"}}>
        <div style={{fontSize:10.5,fontWeight:600,letterSpacing:"0.16em",color:th.dim,fontFamily:"'JetBrains Mono',ui-monospace,monospace",marginBottom:12,textTransform:"uppercase"}}>{t.aboutAdvisorEyebrow||"Your advisor"}</div>
        <div style={{fontSize:20,fontWeight:800,color:th.text,letterSpacing:"-0.01em",marginBottom:10}}>{(settings&&settings.advisorName)||"Mauricio Hernandez"}</div>
        <div style={{fontSize:13,color:th.muted,lineHeight:1.8,marginBottom:22}}>{t.advisorBio}</div>
        <div style={{fontSize:10.5,fontWeight:600,letterSpacing:"0.12em",color:th.dim,marginBottom:14,textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><Award size={14} strokeWidth={1.7} style={{color:GOLD}}/>{t.certifications}</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:"auto"}}>{CERTS.map(c=><div key={c} style={{fontSize:12.5,color:th.muted,display:"flex",gap:11,alignItems:"flex-start",lineHeight:1.5}}><GraduationCap size={15} strokeWidth={1.6} style={{color:GOLD,flexShrink:0,marginTop:1}}/><span>{c}</span></div>)}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div className="ga-lift" style={{...mCARD(th),padding:24}}>
          <div style={{fontSize:14,fontWeight:700,color:th.text,marginBottom:4}}>{t.aboutConnectHdr||"Connect with us"}</div>
          <div style={{fontSize:12,color:th.muted,lineHeight:1.6,marginBottom:18}}>{t.aboutConnectSub||"Questions, or ready to start? Reach out."}</div>
          {/* MD-F (v0.74.2): badge-style social dots → clean hairline rows (icon · label · value).
              Values are editable in Settings → Advisor information. */}
          <div style={{display:"flex",flexDirection:"column"}}>{socials.map((so,i)=><a key={i} href={so.href} target={so.href.startsWith("http")?"_blank":"_self"} rel="noreferrer" className="ga-press" style={{display:"flex",alignItems:"center",gap:12,padding:"11px 2px",textDecoration:"none",borderBottom:i<socials.length-1?("1px solid "+(th.glassBorder||th.cardBorder)):"none"}}>
            <span style={{width:30,height:30,borderRadius:9,background:th.accent+"12",border:"1px solid "+th.accent+"26",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><so.Icon size={14} strokeWidth={1.7} color={th.accent}/></span>
            <span style={{fontSize:10,color:th.dim,fontWeight:500,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:"0.1em",width:74,flexShrink:0}}>{so.label}</span>
            <span style={{fontSize:12.5,color:th.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{so.val}</span>
          </a>)}</div>
        </div>
        <div className="ga-lift" style={{...mCARD(th),padding:24,background:"linear-gradient(135deg,"+GOLD+"1F,"+GOLD+"08)",border:"1px solid "+GOLD+"55"}}>
          <div style={{fontSize:10.5,fontWeight:700,color:GOLD,marginBottom:10,letterSpacing:"0.14em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><Tag size={14} strokeWidth={1.8}/>{t.referralCode||"Referral code"}</div>
          <div style={{fontSize:27,fontWeight:800,color:GOLD,letterSpacing:"0.1em",fontFamily:"'JetBrains Mono',ui-monospace,monospace"}}>GOLDEN-2026</div>
          <div style={{fontSize:11.5,color:th.muted,marginTop:9,lineHeight:1.55}}>{t.referralDesc}</div>
        </div>
        {/* MD-K.2 (v0.75.3) — the advisor's trusted-contacts network, with disclosure. */}
        {Array.isArray(settings&&settings.referralContacts)&&settings.referralContacts.filter(c=>c.name).length>0&&<div className="ga-lift" style={{...mCARD(th),padding:24}}>
          <div style={{fontSize:14,fontWeight:700,color:th.text,marginBottom:4}}>{t.refTrustedHdr||"Trusted contacts"}</div>
          <div style={{fontSize:11.5,color:th.muted,lineHeight:1.6,marginBottom:14}}>{t.refTrustedSub||"People we know and refer for needs beyond coaching."}</div>
          <div style={{display:"flex",flexDirection:"column"}}>
            {settings.referralContacts.filter(c=>c.name).map((c,i,arr)=><div key={c.id||i} style={{padding:"10px 2px",borderBottom:i<arr.length-1?("1px solid "+(th.glassBorder||th.cardBorder)):"none"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:12.5,fontWeight:700,color:th.text}}>{c.name}</span>
                {c.company&&<span style={{fontSize:11.5,color:th.muted}}>{c.company}</span>}
                <span style={{fontSize:9,color:th.dim,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginLeft:"auto"}}>{(REF_CAT_LBL[c.cat]&&(_gaLang()==="es"?REF_CAT_LBL[c.cat][1]:REF_CAT_LBL[c.cat][0]))||c.cat}</span>
              </div>
              {(c.phone||c.email)&&<div style={{fontSize:11,color:th.muted,marginTop:3}}>{[c.phone,c.email].filter(Boolean).join(" · ")}</div>}
              {c.note&&<div style={{fontSize:11,color:th.dim,marginTop:3,lineHeight:1.5}}>{c.note}</div>}
            </div>)}
          </div>
          <div style={{fontSize:9.5,color:th.dim,fontStyle:"italic",lineHeight:1.55,marginTop:12,paddingTop:10,borderTop:"1px solid "+(th.glassBorder||th.cardBorder)}}>{t.refDisclosure||"Disclosure: we may receive referral compensation from some of these contacts. You never pay more for being referred, and you're always free to choose anyone else."}</div>
        </div>}
      </div>
    </div>
  </div>;
}

/* ── CLIENT DETAIL ───────────────────────────────────────────────────────── */

export { AboutPage, LineField, PLAN_FEATURES, PlanComparison, PricingCarousel, PricingPage, PricingPlans, PromotionsPage, ResourcesPage, ServiceRequestModal };
