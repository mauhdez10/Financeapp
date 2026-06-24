// Advisor profile / settings modal (+ AccRow, BgPicker) — extracted from App.jsx
// in Phase 2 of docs/ARCHITECTURE-PLAN.md (D-37). Verbatim from the single-file era.
import { useState } from "react";
import { SVCS } from "../constants/meta";
import { useTh } from "../contexts/theme";
import { DARK_ACCENTS, DARK_BG_PRESETS, DARK_CARD_PRESETS, GOLD, LIGHT_ACCENTS, LIGHT_BG_PRESETS, LIGHT_CARD_PRESETS, mCARD, mIIN, mINP } from "../styles/theme";
import { fmtDate } from "../utils/finance";
import { expBackup } from "../utils/import";
import { Dashboard } from "./dashboard";
import { SignaturePad } from "./legal";
import { Field, Modal, ProfileToggleField, Row2, SaveBar } from "./primitives";
import { Anchor, Phone } from "lucide-react";

export function ProfileModal({settings,onSave,onClose,t,section,clients}){const th=useTh();const[s,setS]=useState({...settings});const[svcSecOpen,setSvcSecOpen]=useState({memberships:true});const[svcOpen,setSvcOpen]=useState({});const[themeOpen,setThemeOpen]=useState(false);const[bgOpen,setBgOpen]=useState(false);const[brandingOpen,setBrandingOpen]=useState(false);const[optionalOpen,setOptionalOpen]=useState(false);const[servicesOpen,setServicesOpen]=useState(false);const[backupOpen,setBackupOpen]=useState(false);const u=k=>e=>setS(p=>({...p,[k]:e.target.value}));const INP=mINP(th);
const services = s.services && s.services.length ? s.services : SVCS.map(v=>({id:v.id,icon:v.icon,name:(v.en||""),price:(v.price||""),stripeUrl:(s.stripeLinks||{})[v.id]||""}));
const updateService=(idx,field,val)=>{const next=services.map((sv,i)=>i===idx?{...sv,[field]:val}:sv);setS(p=>({...p,services:next}));};
const addService=()=>{const next=[...services,{id:"svc-"+Date.now(),icon:"💼",name:"",price:"",stripeUrl:""}];setS(p=>({...p,services:next}));};
const removeService=(idx)=>{if(!confirm(t.confirmRemoveSvc||"Remove this service?"))return;const next=services.filter((_,i)=>i!==idx);setS(p=>({...p,services:next}));};
const uploadLogo=(mode)=>(e)=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(f.size>500*1024){alert((t.logoTooLarge||"Logo image is too large (max 500KB).")+" "+(f.size/1024).toFixed(0)+"KB");return;}const r=new FileReader();r.onload=ev=>{const key=mode==="light"?"logoLight":"logoDark";setS(p=>({...p,[key]:ev.target.result}));};r.readAsDataURL(f);};
const clearLogo=(mode)=>{const key=mode==="light"?"logoLight":"logoDark";setS(p=>({...p,[key]:""}));};
const AccRow=({label,k,presets})=><div style={{marginBottom:14}}><div style={{fontSize:11,color:th.muted,marginBottom:6}}>{label}</div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>{presets.map(p=><div key={p.v} onClick={()=>setS(prev=>({...prev,[k]:p.v}))} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}><div style={{width:26,height:26,borderRadius:"50%",background:p.v,border:s[k]===p.v?"3px solid white":"2px solid transparent",boxShadow:s[k]===p.v?`0 0 0 2px ${p.v}`:"0 0 0 1px #0002"}}/><span style={{fontSize:9,color:th.dim}}>{t["color"+p.l]||p.l}</span></div>)}<input type="color" value={s[k]||presets[0].v} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} style={{width:26,height:26,cursor:"pointer",border:"none",borderRadius:4}}/><input value={s[k]||''} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} style={{...mIIN(th),width:80,fontFamily:"monospace",fontSize:11}} placeholder="#000000"/></div></div>;
// v0.56 — BgPicker: dropped the hex text input per Mauricio's feedback
// ("Appearance should have the box with the colors instead of the weird
// numbers no one understands"). Now just shows preset swatches (28px,
// up from 24px so they read as solid color tiles) plus a custom color
// picker. The hex value still updates from picker selection — just no
// raw text entry.
const BgPicker=({label,k,presets,def})=>{const v=s[k]||def;return<div style={{marginBottom:10}}><div style={{fontSize:10,color:th.muted,marginBottom:6,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>{label}</div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>{presets.map(c=><div key={c} onClick={()=>setS(p=>({...p,[k]:c}))} title={c} style={{width:32,height:32,borderRadius:8,background:c,cursor:"pointer",border:(v||"").toLowerCase()===c.toLowerCase()?`2px solid ${th.accent}`:`1px solid ${th.cardBorder}`,boxShadow:(v||"").toLowerCase()===c.toLowerCase()?`0 0 0 3px ${th.accent}33`:"none",transition:"transform 100ms ease"}}/>)}<label title={t.customColorLbl||"Custom color"} style={{position:"relative",width:32,height:32,borderRadius:8,border:`1px dashed ${th.cardBorder}`,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",color:th.dim,fontSize:14}}>＋<input type="color" value={/^#[0-9a-fA-F]{6}$/.test(v||"")?v:def} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer"}}/></label></div></div>;};
// ToggleField extracted to top-level ProfileToggleField — see comment above ProfileModal.
// Call sites pass {k,label,s,setS,th,INP} directly so the component type stays stable.
if(section==="services"){
  /* MD-H (v0.75.2) — owner: "stripe links should be collapsible twice, one per section
     and one per service with a + - sign". Sections group the catalog; each service row
     collapses to icon·name·price and expands to its fields. */
  const SVC_GROUPS=[
    {id:"memberships",label:t.svcGroupMemberships||"Memberships",ids:["monthly-lite","monthly-lite-plus","annual-bundle"]},
    {id:"onetime",label:t.svcGroupOneTime||"One-time services",ids:["initial-checkup","quarterly-review","strategy-session"]},
    {id:"other",label:t.svcGroupOther||"Other & custom",ids:null},
  ];
  const grouped=SVC_GROUPS.map(g=>({...g,rows:services.map((svc,idx)=>({svc,idx})).filter(({svc})=>g.ids?g.ids.includes(svc.id):!SVC_GROUPS.flatMap(x=>x.ids||[]).includes(svc.id))}));
  const PM=({open})=><span style={{fontSize:14,fontWeight:700,color:th.accent,fontFamily:"'JetBrains Mono',monospace",width:16,display:"inline-block",textAlign:"center"}}>{open?"−":"+"}</span>;
  return<Modal title={t.servicesAndStripeLinks||"Services & Stripe Links"} onClose={onClose} width={520} disableBackdropClose={true}>
<div style={{fontSize:10,color:th.dim,marginBottom:12,lineHeight:1.5,fontStyle:"italic"}}>{t.ourServicesHelp||"Edit the name, price, and Stripe Payment Link for each service. These appear on the public intake form for clients to choose from."}</div>
{grouped.map(g=>{const secOpen=!!svcSecOpen[g.id];return<div key={g.id} style={{marginBottom:8,border:`1px solid ${th.cardBorder}`,borderRadius:9,overflow:"hidden"}}>
  <button type="button" onClick={()=>setSvcSecOpen(p=>({...p,[g.id]:!p[g.id]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"10px 12px",background:th.bg,border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
    <PM open={secOpen}/><span style={{flex:1,fontSize:11,fontWeight:700,color:th.text,letterSpacing:"0.04em",textTransform:"uppercase"}}>{g.label}</span><span style={{fontSize:10,color:th.dim,fontFamily:"'JetBrains Mono',monospace"}}>{g.rows.length}</span>
  </button>
  {secOpen&&<div style={{padding:"8px 10px"}}>
    {g.rows.map(({svc,idx})=>{const k=svc.id||("i"+idx);const open=!!svcOpen[k];return<div key={k} style={{marginBottom:6,border:`1px solid ${th.cardBorder}`,borderRadius:8,overflow:"hidden"}}>
      <button type="button" onClick={()=>setSvcOpen(p=>({...p,[k]:!p[k]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
        <PM open={open}/><span style={{fontSize:13}}>{svc.icon||"💼"}</span><span style={{flex:1,fontSize:12,fontWeight:600,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{svc.name||(t.svcUnnamed||"Unnamed service")}</span><span style={{fontSize:11,fontWeight:700,color:th.accent,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{svc.price||"—"}</span>{svc.stripeUrl?<span title="Stripe link set" style={{width:7,height:7,borderRadius:99,background:th.pos,flexShrink:0}}/>:<span title="No Stripe link" style={{width:7,height:7,borderRadius:99,background:th.cardBorder,flexShrink:0}}/>}
      </button>
      {open&&<div style={{padding:"6px 10px 10px",background:th.bg}}>
        <Row2><Field label={t.svcIcon||"Icon"}><input style={INP} value={svc.icon||""} onChange={e=>updateService(idx,"icon",e.target.value)} maxLength={3}/></Field><Field label={t.svcPrice||"Price"}><input style={INP} value={svc.price||""} onChange={e=>updateService(idx,"price",e.target.value)} placeholder="$149"/></Field></Row2>
        <Field label={t.svcName||"Service name"}><input style={INP} value={svc.name||""} onChange={e=>updateService(idx,"name",e.target.value)}/></Field>
        <Field label={t.svcStripeUrl||"Stripe Payment Link"}><input style={{...INP,fontFamily:"monospace",fontSize:11}} placeholder="https://buy.stripe.com/..." value={svc.stripeUrl||""} onChange={e=>updateService(idx,"stripeUrl",e.target.value)}/></Field>
        <button type="button" onClick={()=>removeService(idx)} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.neg,border:`1px solid ${th.neg}44`,cursor:"pointer"}}>{t.removeSvc||"Remove"}</button>
      </div>}
    </div>;})}
    {!g.rows.length&&<div style={{fontSize:11,color:th.dim,fontStyle:"italic",padding:"4px 2px"}}>{t.svcGroupEmpty||"No services here yet."}</div>}
  </div>}
</div>;})}
<button type="button" onClick={addService} style={{fontSize:11,padding:"6px 12px",borderRadius:8,background:GOLD+"22",color:GOLD,border:`1px solid ${GOLD}55`,cursor:"pointer",fontWeight:600}}>+ {t.addService||"Add service"}</button>
<SaveBar onSave={()=>onSave(s)} onCancel={onClose} t={t}/>
</Modal>;}
if(section==="backup"){return<Modal title={t.backupAndData||"Backup & Data"} onClose={onClose} width={520} disableBackdropClose={true}>
<div style={{fontSize:11,color:th.dim,marginBottom:12,lineHeight:1.6,fontStyle:"italic"}}>{t.settingsBackupHelp||"Export a full backup monthly via Dashboard → ⋯ → Backup All (JSON). Save the file to your password-manager vault or encrypted drive."}</div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:th.bg,borderRadius:8,marginBottom:12,border:`1px solid ${th.cardBorder}`}}><span style={{fontSize:11,color:th.muted}}>{t.lastBackupLbl||"Last verified backup"}</span><span style={{fontSize:11,fontWeight:700,color:th.text,fontFamily:"'JetBrains Mono',monospace"}}>{s.lastBackupVerified?fmtDate(s.lastBackupVerified):(t.settingsBackupNever||"never")}</span></div>
<button onClick={()=>expBackup(clients||[],s)} style={{fontSize:12,padding:"10px 14px",borderRadius:9,background:th.accent,color:"#1A1208",border:"none",cursor:"pointer",fontWeight:700,display:"block",width:"100%",marginBottom:8}}>{t.saveBackupBtn||"Save backup (.json)"}</button><div style={{fontSize:10,color:th.dim,marginBottom:14,lineHeight:1.5,fontStyle:"italic"}}>{t.saveBackupHelp||"Choose where to save, your computer or a synced Drive folder. (Some browsers save straight to Downloads.)"}</div><button onClick={()=>setS(p=>({...p,lastBackupVerified:new Date().toISOString().slice(0,10)}))} style={{fontSize:11,padding:"6px 12px",borderRadius:8,background:th.accent+"22",color:th.accent,border:`1px solid ${th.accent}44`,cursor:"pointer",fontWeight:600}}>✓ {t.settingsBackupMarkVerified||"Mark Verified Today"}</button>
<SaveBar onSave={()=>onSave(s)} onCancel={onClose} t={t}/>
</Modal>;}
return<Modal title={t.profileSettings} onClose={onClose} width={520} disableBackdropClose={true}>

<div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8,letterSpacing:"0.07em"}}>{t.appZoom||"APP ZOOM"}</div>
<div style={{marginBottom:18}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}><input type="range" min={50} max={200} step={10} value={Math.round((s.appZoom||1)*100)} onChange={e=>setS(p=>({...p,appZoom:(+e.target.value||100)/100}))} style={{flex:1,accentColor:th.accent,cursor:"pointer"}}/><span style={{fontSize:13,fontWeight:700,color:th.accent,minWidth:52}}>{Math.round((s.appZoom||1)*100)}%</span></div></div>

<div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8,letterSpacing:"0.07em"}}>{t.advisorInfoHdr||"ADVISOR INFORMATION"}</div>
<Row2><Field label={t.settingsAdvisorName||"Advisor Name"}><input style={INP} value={s.advisorName||""} onChange={u("advisorName")}/></Field><Field label={t.settingsEmail||"Email"}><input style={INP} value={s.advisorEmail||""} onChange={u("advisorEmail")}/></Field></Row2>
<Row2><Field label={t.advisorPhone||"Personal Phone"}><input style={INP} value={s.advisorPhone||""} onChange={u("advisorPhone")} placeholder="(305) 555-1234"/></Field><Field label={t.settingsInstagram||"Instagram"}><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:th.dim,fontSize:12}}>@</span><input style={{...INP,paddingLeft:28}} value={s.ig||""} onChange={u("ig")}/></div></Field></Row2>
<Field label={t.companyName||"Company Name"}><input style={INP} value={s.companyName||""} onChange={u("companyName")} placeholder="Golden Anchor Financial Planning & Wealth Management"/></Field>

{/* OPTIONAL — collapsible */}
<div style={{...mCARD(th),padding:"10px 14px",marginTop:14,marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setOptionalOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>➕ {t.optionalFieldsHdr||"Optional fields"} {optionalOpen?"▲":"▼"}</span></div>
  {optionalOpen && <div style={{marginTop:10}}>
    <ProfileToggleField k="companyPhone" label={t.companyPhone||"Company Phone"} s={s} setS={setS} th={th} INP={INP}/>
    <ProfileToggleField k="businessAddress" label={t.businessAddress||"Business Address"} s={s} setS={setS} th={th} INP={INP}/>
    <ProfileToggleField k="googleMapsUrl" label={t.googleMapsUrl||"Google Maps URL"} s={s} setS={setS} th={th} INP={INP}/>
    <ProfileToggleField k="website" label={t.website||"Website"} s={s} setS={setS} th={th} INP={INP}/>
  </div>}
</div>

{/* BRANDING — collapsible (Logos + Signature inside) */}
<div style={{...mCARD(th),padding:"10px 14px",marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setBrandingOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>🎨 {t.brandingHdr||"Branding"} {brandingOpen?"▲":"▼"}</span></div>
  {brandingOpen && <div style={{marginTop:10}}>
    <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8,letterSpacing:"0.07em"}}>{t.logoHdr||"LOGOS (LIGHT & DARK)"}</div>
    <div style={{fontSize:10,color:th.dim,marginBottom:10,fontStyle:"italic",lineHeight:1.5}}>{t.logoHelp||"Upload a logo for each theme. Used in app header and engagement letter. Max 500KB per image."}</div>
    <Row2>
      <div>
        <div style={{fontSize:10,color:th.muted,marginBottom:4,fontWeight:600}}>☀️ {t.lightModeLogo||"Light mode logo"}</div>
        <div style={{...mCARD(th),padding:10,background:"#FFFFFF",border:`1px dashed ${th.cardBorder}`,minHeight:80,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:6}}>{s.logoLight?<img src={s.logoLight} alt="light" style={{maxHeight:70,maxWidth:"100%",objectFit:"contain"}}/>:<span style={{fontSize:11,color:th.dim,fontStyle:"italic"}}>{t.logoNone||"No logo set"}</span>}</div>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo("light")} style={{fontSize:11,width:"100%"}}/>
        {s.logoLight && <button type="button" onClick={()=>clearLogo("light")} style={{fontSize:10,marginTop:4,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>↺ {t.clearLogo||"Clear"}</button>}
      </div>
      <div>
        <div style={{fontSize:10,color:th.muted,marginBottom:4,fontWeight:600}}>🌙 {t.darkModeLogo||"Dark mode logo"}</div>
        <div style={{...mCARD(th),padding:10,background:"#0D1B2A",border:`1px dashed ${th.cardBorder}`,minHeight:80,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:6}}>{s.logoDark?<img src={s.logoDark} alt="dark" style={{maxHeight:70,maxWidth:"100%",objectFit:"contain"}}/>:<span style={{fontSize:11,color:"#94A3B8",fontStyle:"italic"}}>{t.logoNone||"No logo set"}</span>}</div>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo("dark")} style={{fontSize:11,width:"100%"}}/>
        {s.logoDark && <button type="button" onClick={()=>clearLogo("dark")} style={{fontSize:10,marginTop:4,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>↺ {t.clearLogo||"Clear"}</button>}
      </div>
    </Row2>
    <div style={{fontSize:11,fontWeight:700,color:th.dim,marginBottom:8,marginTop:14,letterSpacing:"0.07em"}}>{t.advisorSigHdr||"YOUR SIGNATURE (FOR ENGAGEMENT LETTERS)"}</div>
    {/* v0.31.0 — Force typed-only on the advisor signature too, AND robustly coerce legacy formats.
       Legacy string values were being mistaken for image dataUrls. Now: if string is a dataUrl
       (starts with "data:"), treat as drawn; if string contains text, treat as typed; if null/empty,
       fall back to auto-commit from defaultName. The typed text gets auto-committed on mount so the
       advisor's signature reliably persists. */}
    <SignaturePad
      value={(()=>{
        const v=s.advisorSignature;
        if(!v)return null;
        if(typeof v==="string"){
          if(v.startsWith("data:")||v.startsWith("http"))return{kind:"drawn",dataUrl:v};
          return{kind:"typed",text:v,signedAt:null};
        }
        return v;
      })()}
      onChange={v=>setS(p=>({...p,advisorSignature:v||""}))}
      t={t}
      theme={th}
      defaultName={s.advisorName}
      typedOnly={true}
    />
  </div>}
</div>

<div style={{...mCARD(th),padding:"10px 14px",marginTop:18,marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setThemeOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>🎨 {t.themeColors||"Theme Colors"} {themeOpen?"▲":"▼"}</span></div>
  {themeOpen && <div style={{marginTop:10}}>
    <AccRow label={t.darkMode+" "+(t.settingsAccentSuffix||"Accent")} k="darkAccent" presets={DARK_ACCENTS}/>
    <AccRow label={t.lightMode+" "+(t.settingsAccentSuffix||"Accent")} k="lightAccent" presets={LIGHT_ACCENTS}/>
  </div>}
</div>

<div style={{...mCARD(th),padding:"10px 14px",marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setBgOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>🖼️ {t.appearanceHdr||"Background Colors"} {bgOpen?"▲":"▼"}</span></div>
  {bgOpen && <div style={{marginTop:10}}>
    {[{m:"light",lbl:t.lightMode,emoji:"☀️",bgK:"lightBg",cardK:"lightCard",bgDef:"#F1F5F9",cardDef:"#FFFFFF",bgP:LIGHT_BG_PRESETS,cardP:LIGHT_CARD_PRESETS,txt:"#0F172A",bd:"#E2E8F0"},{m:"dark",lbl:t.darkMode,emoji:"🌙",bgK:"darkBg",cardK:"darkCard",bgDef:"#111827",cardDef:"#1F2937",bgP:DARK_BG_PRESETS,cardP:DARK_CARD_PRESETS,txt:"#F1F5F9",bd:"#374151"}].map(M=>{const bgV=s[M.bgK]||M.bgDef,cardV=s[M.cardK]||M.cardDef;return<div key={M.m} style={{...mCARD(th),padding:"12px 14px",marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:12,fontWeight:700,color:th.text}}>{M.emoji} {M.lbl}</span><button onClick={()=>setS(p=>({...p,[M.bgK]:M.bgDef,[M.cardK]:M.cardDef}))} style={{fontSize:10,padding:"3px 9px",borderRadius:6,background:"transparent",color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>↺ {t.resetToDefault||"Reset"}</button></div><BgPicker label={t.pageBackgroundLbl||"Page background"} k={M.bgK} presets={M.bgP} def={M.bgDef}/><BgPicker label={t.cardBackgroundLbl||"Card background"} k={M.cardK} presets={M.cardP} def={M.cardDef}/></div>;})}
  </div>}
</div>

<div style={{...mCARD(th),padding:"10px 14px",marginBottom:14,background:GOLD+"08",border:`1px solid ${GOLD}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setServicesOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:GOLD}}>💼 {t.ourServices||"Our Services"} {servicesOpen?"▲":"▼"}</span><span style={{fontSize:10,color:th.dim}}>{services.length}</span></div>
  {servicesOpen && <div style={{marginTop:10}}>
    <div style={{fontSize:10,color:th.dim,marginBottom:10,lineHeight:1.5,fontStyle:"italic"}}>{t.ourServicesHelp||"Edit the name, price, and Stripe Payment Link for each service. These appear on the public intake form for clients to choose from."}</div>
    {services.map((svc,idx)=><div key={svc.id||idx} style={{padding:"10px 12px",background:th.bg,borderRadius:8,marginBottom:8,border:`1px solid ${th.cardBorder}`}}>
      <Row2>
        <Field label={t.svcIcon||"Icon"}><input style={INP} value={svc.icon||""} onChange={e=>updateService(idx,"icon",e.target.value)} maxLength={3}/></Field>
        <Field label={t.svcPrice||"Price"}><input style={INP} value={svc.price||""} onChange={e=>updateService(idx,"price",e.target.value)} placeholder="$149"/></Field>
      </Row2>
      <Field label={t.svcName||"Service name"}><input style={INP} value={svc.name||""} onChange={e=>updateService(idx,"name",e.target.value)}/></Field>
      <Field label={t.svcStripeUrl||"Stripe Payment Link"}><input style={{...INP,fontFamily:"monospace",fontSize:11}} placeholder="https://buy.stripe.com/..." value={svc.stripeUrl||""} onChange={e=>updateService(idx,"stripeUrl",e.target.value)}/></Field>
      <button type="button" onClick={()=>removeService(idx)} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"transparent",color:th.neg,border:`1px solid ${th.neg}44`,cursor:"pointer"}}>🗑 {t.removeSvc||"Remove"}</button>
    </div>)}
    <button type="button" onClick={addService} style={{fontSize:11,padding:"6px 12px",borderRadius:8,background:GOLD+"22",color:GOLD,border:`1px solid ${GOLD}55`,cursor:"pointer",fontWeight:600}}>+ {t.addService||"Add service"}</button>
  </div>}
</div>

<div style={{...mCARD(th),padding:"10px 14px",marginBottom:14,background:th.accent+"08",border:`1px solid ${th.accent}33`}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setBackupOpen(o=>!o)}><span style={{fontSize:12,fontWeight:700,color:th.accent}}>💾 {t.settingsBackup||"Backup Verification"} {backupOpen?"▲":"▼"}</span><span style={{fontSize:10,color:th.dim}}>{s.lastBackupVerified?fmtDate(s.lastBackupVerified):(t.settingsBackupNever||"never")}</span></div>
  {backupOpen && <div style={{marginTop:10}}>
    <div style={{fontSize:10,color:th.dim,marginBottom:8,lineHeight:1.6,fontStyle:"italic"}}>{t.settingsBackupHelp||"Export a full backup monthly via Dashboard → ⋯ → Backup All (JSON). Save the file to your password-manager vault or encrypted drive."}</div>
    <button onClick={()=>setS(p=>({...p,lastBackupVerified:new Date().toISOString().slice(0,10)}))} style={{fontSize:11,padding:"5px 12px",borderRadius:8,background:th.accent+"22",color:th.accent,border:`1px solid ${th.accent}44`,cursor:"pointer",fontWeight:600}}>✓ {t.settingsBackupMarkVerified||"Mark Verified Today"}</button>
  </div>}
</div>

<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span style={{fontSize:11,color:th.muted}}>{t.settingsNoContact||"No-contact threshold:"}</span><input type="number" min={7} max={180} value={s.noContactDays||30} onChange={e=>setS(p=>({...p,noContactDays:+e.target.value||30}))} style={{...mIIN(th),width:60,textAlign:"center"}}/><span style={{fontSize:11,color:th.dim}}>{t.settingsDays||"days"}</span></div>

<SaveBar onSave={()=>onSave(s)} onCancel={onClose} t={t}/>
</Modal>;}

/* ── NEW CLIENT MODAL (with optional partner) ────────────────────────────── */

