// Extracted from App.jsx in Phase 2b of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-11).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState } from "react";
import { Users, BookOpen, Anchor, Receipt, HardDriveDownload, Archive, Sparkles, Bell, Phone } from "lucide-react";
import { GOLD, stripLeadEmoji, mINP, mCARD } from "../styles/theme";
import { SVCS, svcPayUrl, DEF_SETTINGS, PREMIUM_TIERS } from "../constants/meta";
import { planOf, planLabel, ChooseAmount } from "../components/premium";
import { useTh } from "../contexts/theme";
import { fmtPh } from "../utils/finance";
import { useReducedMotion } from "../hooks/anim";
import { Donut, Waterfall } from "../components/charts";
import { Modal, SaveBar } from "../components/primitives";
import { supabase, gaSendSupportEmail } from "../services/supabase";
import { SignaturePad } from "../components/legal";
// v0.83.3 — BackupPage uses these but the Phase-2b extraction never imported them into admin.jsx,
// so both the Download-backup click (expBackup) and the Restore-backup modal (BackupImportModal) were
// latent ReferenceErrors. Importing here fixes both. import.js / clientData.jsx don't import admin → no cycle.
import { expBackup } from "../utils/import";
import { BackupImportModal } from "../components/clientData";

const AVATAR_PRESETS=[
  {group:"Brand",  id:"mh-gold",       label:"MH · gold"},
  {group:"Brand",  id:"mh-navy",       label:"MH · navy"},
  {group:"Brand",  id:"anchor-gold",   label:"Anchor"},
  {group:"Brand",  id:"monogram-cream",label:"GA · cream"},
  {group:"Finance",id:"coin",          label:"Gold coin"},
  {group:"Finance",id:"chart",         label:"Growth"},
  {group:"Finance",id:"briefcase",     label:"Briefcase"},
  {group:"Finance",id:"key",           label:"Key"},
  {group:"Animal", id:"fox",           label:"Fox"},
  {group:"Animal", id:"owl",           label:"Owl"},
  {group:"Animal", id:"whale",         label:"Whale"},
  {group:"Animal", id:"bear",          label:"Bear"},
];
function AvatarImg({id,size,ring}){
  const valid=AVATAR_PRESETS.find(p=>p.id===id);
  const src=valid?`/avatars/${valid.id}.svg`:null;
  if(!src) return <div style={{width:size,height:size,borderRadius:999,background:GOLD,color:"#0D1B2A",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:Math.round(size*0.4),boxShadow:ring?`0 0 0 2px ${GOLD}`:"none"}}>MH</div>;
  return <img src={src} alt="" width={size} height={size} style={{display:"block",borderRadius:999,background:"transparent",boxShadow:ring?`0 0 0 2px ${GOLD}`:"none"}}/>;
}
function AvatarPickerModal({open,current,onPick,onClose,t,theme}){
  if(!open) return null;
  const th=theme;
  const groups=["Brand","Finance","Animal"];
  const groupLabels={Brand:t?.brandLbl||"Brand",Finance:t?.financeLbl||"Finance",Animal:t?.animalsLbl||"Animals"};
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.67)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
    <div onClick={e=>e.stopPropagation()} style={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:16,boxShadow:"0 32px 80px rgba(0,0,0,0.55)",width:"min(540px, 100%)",maxHeight:"90vh",overflowY:"auto",padding:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:th.text}}>{t?.chooseProfileImage||"Choose a profile image"}</div>
          <div style={{fontSize:11,color:th.muted,marginTop:4}}>{t?.chooseProfileImageHelp||"Click any image to set it as your avatar — it updates the top bar and sidebar instantly."}</div>
        </div>
        <button onClick={onClose} title={t?.close||"Close"} style={{background:"transparent",border:"none",color:th.muted,fontSize:22,cursor:"pointer",lineHeight:1,padding:4}}>×</button>
      </div>
      {groups.map(g=><div key={g} style={{marginTop:18}}>
        <div style={{fontSize:10,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>{groupLabels[g]}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:10}}>
          {AVATAR_PRESETS.filter(p=>p.group===g).map(p=>{
            const active=p.id===current;
            return <button key={p.id} onClick={()=>onPick(p.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:active?th.accent+"1A":"transparent",border:`1px solid ${active?th.accent+"66":th.cardBorder}`,borderRadius:10,padding:"10px 6px",cursor:"pointer"}}>
              <img src={`/avatars/${p.id}.svg`} alt="" width="64" height="64" style={{display:"block",borderRadius:999}}/>
              <span style={{fontSize:10,color:active?th.accent:th.muted,fontWeight:active?700:500}}>{p.label}</span>
            </button>;
          })}
        </div>
      </div>)}
      <div style={{marginTop:18,padding:"10px 12px",background:th.bg,border:`1px solid ${th.cardBorder}`,borderRadius:10,fontSize:10,color:th.dim,fontStyle:"italic",lineHeight:1.6}}>{t?.avatarPickerFooter||"Live in /public/avatars/ — drop in your own SVGs (80×80, circular) to extend the set."}</div>
    </div>
  </div>;
}

/* ── SecurityPage — change password (Supabase). v0.18.0 ─────────────────── */
function SecurityPage({t}){
  const th=useTh();
  const[pw,setPw]=useState("");const[pw2,setPw2]=useState("");const[busy,setBusy]=useState(false);
  const[err,setErr]=useState("");const[msg,setMsg]=useState("");
  const INP={width:"100%",padding:"10px 12px",background:th.inp,border:"1px solid "+th.inpBorder,color:th.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"};
  const go=async()=>{
    setErr("");setMsg("");
    if(!pw||pw.length<8){setErr(t?.passwordMin8||"Password must be at least 8 characters.");return;}
    if(pw!==pw2){setErr(t?.passwordMismatch||"Passwords don't match.");return;}
    if(!supabase){setErr(t?.supabaseError||"Connection error.");return;}
    setBusy(true);
    try{
      const{error}=await supabase.auth.updateUser({password:pw});
      if(error)setErr(error.message||"Update failed.");
      else{setMsg(t?.passwordUpdated||"Password updated successfully.");setPw("");setPw2("");}
    }catch(e){setErr(e?.message||"Update failed.");}
    setBusy(false);
  };
  return <div className="ga-np" style={{padding:24,maxWidth:520,margin:"0 auto"}}>
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.securitySub||"Change your account password. Sessions on other devices stay signed in until they expire."}</div>
    <div style={{...mCARD(th),padding:18}}>
      <div style={{fontSize:11,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase",marginBottom:14}}>{t?.changePassword||"Change Password"}</div>
      <div style={{marginBottom:12}}><div style={{fontSize:11,color:th.muted,marginBottom:4,fontWeight:600}}>{t?.newPassword||"New password"}</div><input type="password" value={pw} onChange={e=>setPw(e.target.value)} style={INP} autoComplete="new-password"/></div>
      <div style={{marginBottom:12}}><div style={{fontSize:11,color:th.muted,marginBottom:4,fontWeight:600}}>{t?.confirmPassword||"Confirm new password"}</div><input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} style={INP} autoComplete="new-password" onKeyDown={e=>e.key==="Enter"&&!busy&&go()}/></div>
      {err&&<div style={{fontSize:11,color:th.neg,padding:"8px 10px",background:th.neg+"11",borderRadius:8,marginBottom:10}}>{err}</div>}
      {msg&&<div style={{fontSize:11,color:th.pos,padding:"8px 10px",background:th.pos+"11",borderRadius:8,marginBottom:10}}>{msg}</div>}
      <button onClick={go} disabled={busy} style={{width:"100%",padding:"11px",borderRadius:10,background:GOLD,color:"#0D1B2A",fontWeight:800,fontSize:13,border:"none",cursor:busy?"wait":"pointer",opacity:busy?0.7:1}}>{busy?"…":(t?.updatePassword||"Update password")}</button>
    </div>
    <div style={{marginTop:14,fontSize:11,color:th.dim,fontStyle:"italic",lineHeight:1.6}}>{t?.securityNote||"Tip: use a password manager. We do not store your password directly — Supabase Auth handles hashing."}</div>
  </div>;
}

/* ── BillingPage — services & Stripe links editor. v0.18.0 ──────────────── */
function BillingPage({settings,onSettingsChange,t}){
  const th=useTh();
  /* MD-H (v0.75.2) — owner: collapsible TWICE (per section + per service, with +/−). */
  const[secOpen,setSecOpen]=useState({memberships:true});
  const[rowOpen,setRowOpen]=useState({});
  const services=Array.isArray(settings.services)?settings.services:[];
  const INP={padding:"8px 10px",background:th.inp,border:"1px solid "+th.inpBorder,color:th.text,borderRadius:6,fontSize:12,outline:"none",boxSizing:"border-box",width:"100%"};
  const set=(i,k,v)=>onSettingsChange({...settings,services:services.map((s,idx)=>idx===i?{...s,[k]:v}:s)});
  const addSvc=()=>{onSettingsChange({...settings,services:[...services,{id:"svc-"+Date.now(),name:"New Service",price:"$0",stripeUrl:""}]});setSecOpen(p=>({...p,other:true}));};
  const delSvc=i=>{if(!confirm(t?.confirmRemoveSvc||"Remove this service?"))return;onSettingsChange({...settings,services:services.filter((_,idx)=>idx!==i)});};
  const GROUPS=[
    {id:"memberships",label:t?.svcGroupMemberships||"Memberships",ids:["monthly-lite","monthly-lite-plus","annual-bundle"]},
    {id:"onetime",label:t?.svcGroupOneTime||"One-time services",ids:["initial-checkup","quarterly-review","strategy-session"]},
    {id:"other",label:t?.svcGroupOther||"Other & custom",ids:null},
  ];
  const known=GROUPS.flatMap(g=>g.ids||[]);
  const grouped=GROUPS.map(g=>({...g,rows:services.map((s,i)=>({s,i})).filter(({s})=>g.ids?g.ids.includes(s.id):!known.includes(s.id))}));
  const PM=({open})=><span style={{fontSize:15,fontWeight:700,color:th.accent,fontFamily:"'JetBrains Mono',monospace",width:16,display:"inline-block",textAlign:"center"}}>{open?"−":"+"}</span>;
  return <div className="ga-np" style={{padding:24,maxWidth:900,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:10}}>
      {/* v0.24.0 — page title removed (TopBar shows it). */}
      <div>
        <div style={{fontSize:12,color:th.muted}}>{t?.billingSub||"Manage your service catalog and Stripe payment links."}</div>
      </div>
      <button onClick={addSvc} style={{padding:"8px 14px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:700,fontSize:12,border:"none",cursor:"pointer"}}>＋ {t?.addService||"Add service"}</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:14}}>
      {grouped.map(g=>{const on=!!secOpen[g.id];return<div key={g.id} style={{...mCARD(th),padding:0,overflow:"hidden"}}>
        <button onClick={()=>setSecOpen(p=>({...p,[g.id]:!p[g.id]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"13px 16px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
          <PM open={on}/><span style={{flex:1,fontSize:11,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase"}}>{g.label}</span><span style={{fontSize:10.5,color:th.dim,fontFamily:"'JetBrains Mono',monospace"}}>{g.rows.length}</span>
        </button>
        {on&&<div style={{padding:"0 12px 12px"}}>
          {g.rows.map(({s,i})=>{const k=s.id||("i"+i);const ron=!!rowOpen[k];return<div key={k} style={{marginBottom:7,border:"1px solid "+th.cardBorder,borderRadius:9,overflow:"hidden"}}>
            <button onClick={()=>setRowOpen(p=>({...p,[k]:!p[k]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"10px 12px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
              <PM open={ron}/><span style={{flex:1,fontSize:12.5,fontWeight:600,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name||(t?.svcUnnamed||"Unnamed service")}</span>
              <span style={{fontSize:11.5,fontWeight:700,color:th.accent,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{s.price||"—"}</span>
              <span title={s.stripeUrl?"Stripe link set":"No Stripe link"} style={{width:7,height:7,borderRadius:99,background:s.stripeUrl?th.pos:th.cardBorder,flexShrink:0}}/>
            </button>
            {ron&&<div style={{padding:"4px 12px 12px",display:"grid",gridTemplateColumns:"1.4fr 0.6fr",gap:8}}>
              <input style={INP} value={s.name||""} onChange={e=>set(i,"name",e.target.value)} placeholder={t?.serviceNamePh||"Service name"}/>
              <input style={{...INP,fontFamily:"'JetBrains Mono',monospace"}} value={s.price||""} onChange={e=>set(i,"price",e.target.value)} placeholder="$0"/>
              <input style={{...INP,fontFamily:"'JetBrains Mono',monospace",fontSize:11,gridColumn:"1 / -1"}} value={s.stripeUrl||""} onChange={e=>set(i,"stripeUrl",e.target.value)} placeholder={t?.stripeUrlPh||"https://buy.stripe.com/..."}/>
              <button onClick={()=>delSvc(i)} style={{justifySelf:"start",padding:"5px 12px",borderRadius:6,background:"transparent",color:th.neg,border:`1px solid ${th.neg}44`,cursor:"pointer",fontSize:11}}>{t?.delete||"Delete"}</button>
            </div>}
          </div>;})}
          {!g.rows.length&&<div style={{fontSize:11.5,color:th.dim,fontStyle:"italic",padding:"2px 6px 6px"}}>{t?.svcGroupEmpty||"No services here yet."}</div>}
        </div>}
      </div>;})}
    </div>
    <div style={{marginTop:14,fontSize:11,color:th.dim,fontStyle:"italic",lineHeight:1.6}}>{t?.billingNote||"Stripe payment links are created in your Stripe dashboard. Paste the full URL into the field above — clients will be redirected there when they click \"Submit & pay now\" on the intake form."}</div>
    {/* MD-K.2 (v0.75.3) — per-advisor referral network: editable here, shown on About
        with a compensation disclosure. Lives "on services & stripe links" per owner. */}
    <ReferralNetworkEditor settings={settings} onSettingsChange={onSettingsChange} t={t}/>
  </div>;
}
const REF_CATS=[["insurance-car","Car insurance","Seguro de auto"],["insurance-home","Home insurance","Seguro de hogar"],["realtor","Realtor","Agente inmobiliario"],["lender","Lender / loans","Prestamista / préstamos"],["tax","Tax preparer","Preparador de impuestos"],["legal","Legal","Legal"],["other","Other","Otro"]];
function ReferralNetworkEditor({settings,onSettingsChange,t}){
  const th=useTh();
  const[open,setOpen]=useState(false);const[rowOpen,setRowOpen]=useState({});
  const list=Array.isArray(settings.referralContacts)?settings.referralContacts:[];
  const INP={padding:"8px 10px",background:th.inp,border:"1px solid "+(th.inpBorder||th.cardBorder),color:th.text,borderRadius:6,fontSize:12,outline:"none",boxSizing:"border-box",width:"100%"};
  const setC=(i,k,v)=>onSettingsChange({...settings,referralContacts:list.map((c,idx)=>idx===i?{...c,[k]:v}:c)});
  const add=()=>{onSettingsChange({...settings,referralContacts:[...list,{id:"ref-"+Date.now(),cat:"other",name:"",company:"",phone:"",email:"",note:""}]});setOpen(true);};
  const del=i=>{if(!confirm(t?.refConfirmRemove||"Remove this contact?"))return;onSettingsChange({...settings,referralContacts:list.filter((_,idx)=>idx!==i)});};
  const es=(settings.lang==="es");
  const catLbl=(id)=>{const c=REF_CATS.find(x=>x[0]===id);return c?(es?c[2]:c[1]):id;};
  return <div style={{...mCARD(th),padding:0,overflow:"hidden",marginTop:14}}>
    <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"13px 16px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
      <span style={{fontSize:15,fontWeight:700,color:th.accent,fontFamily:"'JetBrains Mono',monospace",width:16,textAlign:"center"}}>{open?"−":"+"}</span>
      <span style={{flex:1,fontSize:11,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase"}}>{t?.refNetworkHdr||"Referral network"}</span>
      <span style={{fontSize:10.5,color:th.dim,fontFamily:"'JetBrains Mono',monospace"}}>{list.length}</span>
    </button>
    {open&&<div style={{padding:"0 14px 14px"}}>
      <div style={{fontSize:11,color:th.dim,lineHeight:1.6,marginBottom:10,fontStyle:"italic"}}>{t?.refNetworkHelp||"Your trusted contacts (car insurance, realtors, lenders…). They appear on your About page with a compensation disclosure. Each advisor manages their own list."}</div>
      {list.map((c,i)=>{const ron=!!rowOpen[c.id];return<div key={c.id} style={{marginBottom:7,border:"1px solid "+th.cardBorder,borderRadius:9,overflow:"hidden"}}>
        <button onClick={()=>setRowOpen(p=>({...p,[c.id]:!p[c.id]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"10px 12px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
          <span style={{fontSize:14,fontWeight:700,color:th.accent,fontFamily:"'JetBrains Mono',monospace",width:14,textAlign:"center"}}>{ron?"−":"+"}</span>
          <span style={{flex:1,fontSize:12.5,fontWeight:600,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name||(t?.refUnnamed||"New contact")}{c.company?" · "+c.company:""}</span>
          <span style={{fontSize:9.5,color:th.dim,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>{catLbl(c.cat)}</span>
        </button>
        {ron&&<div style={{padding:"4px 12px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <input style={INP} value={c.name||""} onChange={e=>setC(i,"name",e.target.value)} placeholder={t?.refNamePh||"Contact name"}/>
          <select value={c.cat||"other"} onChange={e=>setC(i,"cat",e.target.value)} style={INP}>{REF_CATS.map(([id,en2,es2])=><option key={id} value={id}>{es?es2:en2}</option>)}</select>
          <input style={INP} value={c.company||""} onChange={e=>setC(i,"company",e.target.value)} placeholder={t?.refCompanyPh||"Company"}/>
          <input style={INP} value={c.phone||""} onChange={e=>setC(i,"phone",e.target.value)} placeholder={t?.phoneLbl||"Phone"}/>
          <input style={{...INP,gridColumn:"1 / -1"}} value={c.email||""} onChange={e=>setC(i,"email",e.target.value)} placeholder="email@…"/>
          <input style={{...INP,gridColumn:"1 / -1"}} value={c.note||""} onChange={e=>setC(i,"note",e.target.value)} placeholder={t?.refNotePh||"One-line note clients see (optional)"}/>
          <button onClick={()=>del(i)} style={{justifySelf:"start",padding:"5px 12px",borderRadius:6,background:"transparent",color:th.neg,border:`1px solid ${th.neg}44`,cursor:"pointer",fontSize:11}}>{t?.delete||"Delete"}</button>
        </div>}
      </div>;})}
      <button onClick={add} style={{fontSize:11,padding:"6px 12px",borderRadius:8,background:GOLD+"22",color:GOLD,border:`1px solid ${GOLD}55`,cursor:"pointer",fontWeight:600}}>+ {t?.refAdd||"Add contact"}</button>
    </div>}
  </div>;
}

/* ── BackupPage — download + restore all data. v0.18.0 ─────────────────── */
function BackupPage({clients,settings,onRestoreBackup,loadAllBlobs,t}){
  const th=useTh();
  const[restoreOpen,setRestoreOpen]=useState(false);
  const[busy,setBusy]=useState(false);
  // v0.83.3 — page the FULL blobs (advisor `clients` are summary rows) before writing the backup.
  const doDownload=async()=>{if(busy)return;setBusy(true);try{const all=loadAllBlobs?await loadAllBlobs():clients;await expBackup(all,settings);}finally{setBusy(false);}};
  return <div className="ga-np" style={{padding:24,maxWidth:680,margin:"0 auto"}}>
    {restoreOpen&&<BackupImportModal onImport={(b,m)=>{onRestoreBackup(b,m);setRestoreOpen(false);}} onClose={()=>setRestoreOpen(false)} existingClients={clients} t={t}/>}
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.backupSub||"Export every client and your settings as a single JSON file. Keep a copy somewhere safe — Supabase has its own backups but a manual export is your fallback."}</div>
    <div style={{...mCARD(th),padding:18,marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>{t?.downloadEverything||"Download Everything"}</div>
      <div style={{fontSize:12,color:th.muted,marginBottom:12,lineHeight:1.5}}>{(t?.downloadEverythingHelp||"Downloads {n} clients + all your settings as a single JSON file.").replace("{n}",clients.length)}</div>
      <button onClick={doDownload} disabled={busy} style={{width:"100%",padding:"12px",borderRadius:10,background:GOLD,color:"#0D1B2A",fontWeight:800,fontSize:13,border:"none",cursor:busy?"wait":"pointer",opacity:busy?0.7:1}}>{busy?(t?.preparingBackup||"Preparing…"):"⬇ "+(t?.downloadBackup||"Download backup (JSON)")}</button>
    </div>
    <div style={{...mCARD(th),padding:18,marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:th.accent,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>{t?.restoreFromBackup||"Restore from Backup"}</div>
      <div style={{fontSize:12,color:th.muted,marginBottom:12,lineHeight:1.5}}>{t?.restoreFromBackupHelp||"Upload a backup JSON file. You'll be asked whether to merge with current data or replace it."}</div>
      <button onClick={()=>setRestoreOpen(true)} style={{width:"100%",padding:"12px",borderRadius:10,background:"transparent",color:th.text,fontWeight:700,fontSize:13,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>📂 {t?.uploadBackup||"Upload backup JSON"}</button>
    </div>
    <div style={{fontSize:11,color:th.dim,fontStyle:"italic",lineHeight:1.6}}>{t?.backupNote||"Backups never include passwords or session tokens — only client data and app settings."}</div>
  </div>;
}

/* ── ArchivedClientsPage — list + restore + permanent delete. v0.18.0 ──── */
function ArchivedClientsPage({clients,onRestore,onDelete,t}){
  const th=useTh();
  const archived=clients.filter(c=>c.archived);
  return <div className="ga-np" style={{padding:24,maxWidth:880,margin:"0 auto"}}>
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{(t?.archivedClientsSub||"{n} client(s) currently archived. Restore them back to the active list, or delete permanently. Deleted clients cannot be recovered.").replace("{n}",archived.length)}</div>
    {archived.length===0?<div style={{...mCARD(th),padding:30,textAlign:"center",color:th.dim,fontStyle:"italic"}}>{t?.noArchivedClients||"No archived clients."}</div>:
      <div style={{...mCARD(th),padding:0,overflow:"hidden"}}>
        {archived.map((c,i)=><div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderTop:i===0?"none":`1px solid ${th.cardBorder}`}}>
          <div style={{width:40,height:40,borderRadius:99,background:GOLD+"22",color:GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,border:`2px solid ${GOLD}44`,flexShrink:0}}>{(c.firstName||"?")[0]}{(c.lastName||"?")[0]}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:th.text}}>{c.firstName} {c.lastName}{c.partnerFirst?` & ${c.partnerFirst}`:""}</div>
            <div style={{fontSize:11,color:th.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email||"—"}</div>
          </div>
          <button onClick={()=>onRestore(c.id)} title={t?.restore||"Restore"} style={{padding:"6px 12px",borderRadius:8,background:th.pos+"22",color:th.pos,fontWeight:700,fontSize:11,border:`1px solid ${th.pos}44`,cursor:"pointer"}}>↩ {t?.restoreLbl||"Restore"}</button>
          <button onClick={()=>{if(confirm((t?.confirmDeleteClient||"Permanently delete {name}? This cannot be undone.").replace("{name}",`${c.firstName} ${c.lastName}`)))onDelete(c.id);}} title={t?.deletePermanent||"Delete permanently"} style={{padding:"6px 12px",borderRadius:8,background:"transparent",color:th.neg,fontWeight:700,fontSize:11,border:`1px solid ${th.neg}44`,cursor:"pointer"}}>🗑 {t?.delete||"Delete"}</button>
        </div>)}
      </div>}
  </div>;
}

/* ── WhatsNewPage — release notes. v0.18.0 — hardcoded, edit this array. ─ */
/* MD-I (v0.75.2) — entries carry aud:"client"|"advisor"|"all"; entries WITHOUT aud
   are legacy advisor notes. WhatsNewPage filters by the viewer's role. */
const WHATS_NEW_ENTRIES=[
  {v:"v0.75",date:"2026-06-11",aud:"client",title:"Premium is choose-what-you-pay — from $3 a month",bullets:[
    "Pick ANY whole-dollar amount from $3/mo — every amount unlocks the same full Premium access (your calculators with real numbers, complete reports, month compare, investment packages).",
    "Pay and your account activates automatically.",
    "Account emails (verification, resets) now arrive from Golden Anchor's own address."
  ]},
  {v:"v0.74",date:"2026-06-11",aud:"client",title:"Free & Premium plans",bullets:[
    "Your account is free forever: profile, public calculators, and resources.",
    "Premium unlocks the in-profile calculators, the Complete Report, month-over-month compare, and extra investment packages — see Settings → Your plan.",
    "Advisor plans (Monthly Lite / Lite+ / Annual) include everything in Premium plus a human advisor."
  ]},
  {v:"v0.73",date:"2026-06-11",aud:"client",title:"A proper welcome — and verified email",bullets:[
    "New accounts confirm their email before signing in (security upgrade).",
    "A short welcome wizard sets up your name and goals — and you can ask for a free health-insurance consult or car-insurance help right there.",
    "The website got a real front door: landing page, About, Contact, and Q&A."
  ]},
  {v:"v0.75",date:"2026-06-11",aud:"advisor",title:"Members admin — your master view",bullets:[
    "New 'Members' page (sidebar): every client account, plan, onboarding status, and insurance interests.",
    "Gift complimentary Premium to any client by email — or revoke it. Grants are stamped with who comped them.",
    "Monthly income (MRR) panel lights up once the Stripe key is set in Vercel.",
    "Payments now auto-activate Premium via webhook; pricing realigned in Stripe (one Checkup product + GACLIENT50 for returning clients)."
  ]},
  {v:"v0.71",date:"2026-06-10",aud:"advisor",title:"Share portal v2",bullets:[
    "Portal links now support expiry (30/90 days), per-section visibility, 'Preview as client', and a branded email straight to the client.",
    "Client accounts launched: clients self-serve with their own restricted portal — your data and theirs never mix."
  ]},
  {v:"v0.35.0",date:"2026-05-23",title:"Cleaner charts (Donut, smooth lines) + better PDF page breaks",bullets:[
    "Net Worth Distribution donut on the Dashboard now renders crisper edges — same data, hand-drawn SVG.",
    "Cash-flow Waterfall component is wired up and ready to drop into the next Monthly Snapshot rebuild.",
    "Printing a Monthly or Complete report now gives each section its own page — Income on page 1, Bills on 2, Debt on 3, and so on."
  ]},
  {v:"v0.34.0",date:"2026-05-23",title:"Smooth two-curve charts on client trends",bullets:[
    "The 'Debt vs Savings' and 'Cash Flow Trend' charts on every client's profile are now hand-drawn SVG with smooth curves, a gold area gradient, and a gold dot marker where the curves cross.",
    "Y-axis labels stamped in JetBrains Mono with nice-rounded values (0 / 17K / 33K / 50K).",
    "Range pills (3m / 6m / 12m / All) and filter pills (All / Rev / Cur) now tint gold instead of blue when active."
  ]},
  {v:"v0.33.0",date:"2026-05-23",title:"Public intake unified on the brand gold palette",bullets:[
    "The structured intake form on prospect's Tab 4 now matches the welcome/service/engagement stages — gold instead of the previous blue/brown mix.",
    "Section headers, totals, '+ Add Income / + Add Bill' buttons, and Avalanche/Snowball strategy pills all use the brand gold.",
    "Semantic colors (green for positive cashflow, red for debt, amber for warnings) kept intact."
  ]},
  {v:"v0.32.0",date:"2026-05-23",title:"Couple invites — partner data flows end-to-end",bullets:[
    "New Invite modal now has a Just-me / Partner & me toggle. Pick 'Partner & me' to add partner name (required) + email + phone.",
    "When the prospect opens their link: both names land in the engagement letter greeting, both signature pads auto-prefill, and Tab 4 Contact shows both rows pre-filled.",
    "Prospect name is now required on every invite (was: only email). That was the root cause of the prefill not working before.",
    "Engagement letter copy email cleaned up — removed the duplicate Florida license parenthetical and the redundant bottom disclaimer."
  ]},
  {v:"v0.31.0",date:"2026-05-22",title:"Intake hardening pass — signature, back button, PDF email, plus more",bullets:[
    "Signature is typed-only now (drawing was confusing on mobile). Your name appears in cursive on the 'Client signature:' line as you type.",
    "Browser back works through the intake stages — Welcome → Service → Engagement → Details — predictable navigation.",
    "Pay Now is always clickable (was disabled when no payment link). If no link is set, the Done modal explains the advisor will send it directly.",
    "Done modal removed the reference token + 'Submit another' button, added a 'You can safely close this tab' line.",
    "After submission, the prospect (and advisor) receive a copy of the signed engagement letter by email automatically.",
    "Welcome screen tightened — less whitespace, larger anchor image.",
    "Tab 4 'Your information' now uses the full advisor-style intake (add line-item credit cards / income streams / debts / accounts / goals) instead of the simplified totals form."
  ]},
  {v:"v0.30.0",date:"2026-05-22",title:"Public intake redesign — 5-stage flow",bullets:[
    "New flow: Welcome → Service → Engagement → Your information → Done modal.",
    "Welcome stage shows the brand-gold hero card with the anchor logo + tagline.",
    "Step rail at the top of every stage shows progress; past steps get a ✓, current step is gold.",
    "Sticky service sidebar on web during the engagement + intake stages.",
    "Done modal overlays the form instead of replacing it — Esc resets cleanly back to Welcome."
  ]},
  {v:"v0.29.0",date:"2026-05-22",title:"Intake Forms admin page rebuild + New Invite modal",bullets:[
    "Intake Forms (sidebar) rebuilt with a clean header — pending count, public URL toggle, and ＋ New invite button.",
    "Public intake URL is collapsed by default — click the toggle to reveal EN + ES copy links with one-tap copy buttons.",
    "Submissions table with filter pills (All / Pending / Reviewed / Approved) and a per-row ⋯ kebab with 10 actions (Open submission / Resend invite EN+ES / Copy intake link / Message prospect / Mark reviewed / Mark approved / Convert to client / Archive).",
    "New Invite modal — language picker + name + email + phone + personal note. Stripe links auto-populate per service."
  ]},
  {v:"v0.28.0",date:"2026-05-22",title:"Dismiss or mute alerts",bullets:[
    "Each advisor alert + client-due row now has a small ✕ — click to snooze.",
    "Credit-card / bill alerts dismiss until next billing cycle and re-appear automatically next month — perfect for the 'I paid it' case.",
    "Each card has a '(N muted) ▾' expander to see what you snoozed and restore it with one click.",
    "Toast confirms every dismiss + restore, in English or Spanish."
  ]},
  {v:"v0.27.0",date:"2026-05-22",title:"Smoother dashboard — skeleton, count-ups, pulse",bullets:[
    "Dashboard now loads with a soft shimmer skeleton instead of a plain ⚓ Loading… text.",
    "KPI tile numbers smoothly count up when they change (filter clients, archive someone, etc.) instead of snapping.",
    "Critical alert pills ('No Contact >60d', 'Promo Expiring <14d') gently pulse so they don't get lost in the list.",
    "Every search input now has a proper screen-reader label.",
    "All animations respect your OS 'Reduce motion' setting."
  ]},
  {v:"v0.26.0",date:"2026-05-22",title:"Accessibility + polish pass",bullets:[
    "Dark-mode greys bumped to pass WCAG AA contrast — small labels are noticeably more readable.",
    "Every Save / Archive / Restore / Delete now triggers a green ✓ confirmation toast.",
    "TopBar icon buttons (theme, hide-numbers, EN/ES, avatar) all carry accessible labels and 'pressed' state.",
    "Tables, hover states, focus rings, and motion-reduction all standardized.",
    "Z-index scale defined as CSS variables — fewer modal-stacking surprises going forward."
  ]},
  {v:"v0.25.x",date:"2026-05-22",title:"Clients page tidied",bullets:[
    "Search + Sort + actions all sit on one row on desktop again (no more vertical stacking).",
    "Per-row kebab was added then removed — felt noisy. Bulk actions remain in the section kebab; per-client actions live inside the client detail header.",
    "Sort dropdown shrunk to a compact 190px with cleaner ⇅-prefixed labels."
  ]},
  {v:"v0.24.0",date:"2026-05-22",title:"Audit-driven bug pass",bullets:[
    "Duplicate page titles removed from 11 pages — the TopBar already shows them.",
    "Dashboard chart now disambiguates 'Jan' vs 'Jan' across years (Jan '25 / Jan '26).",
    "Settings phone fields auto-format. EmailSupport modal clarifies that 'recipient' is the reply-to address.",
    "Alert pill titles no longer have leading emojis hard-coded — cleaner labels."
  ]},
  {v:"v0.23.0",date:"2026-05-22",title:"Client Due search + T&C gate + intake Welcome",bullets:[
    "Client Due card has its own search bar (was sharing the advisor-alerts one).",
    "Terms of Service modal now waits for full bootstrap before showing — no more dashboard 'flash' behind it.",
    "Public intake `/intake?invite=...` opens with a branded Welcome step before the form.",
    "Calculators page goes from 2-col to 3-4 col tiles with descriptions. Resources page tightens to match.",
    "Promotions get a colored 'X days left' / 'Expired' badge."
  ]},
  {v:"v0.21.0",date:"2026-05-21",title:"PDF / print rebuild",bullets:[
    "Saving any report as PDF now uses Source Serif 4 for body text, Newsreader italic for titles, JetBrains Mono with tabular numerals for currency.",
    "Branded print header + footer on every page (gold hairline, monogram + wordmark).",
    "Intake-form PDF template rebuilt to match the same spec."
  ]},
  {v:"v0.20.0",date:"2026-05-21",title:"Net Worth donut + Email Support + sort + alert parity",bullets:[
    "Dashboard now shows a Net Worth Distribution donut (Negative / $0–50K / $50K–250K / $250K+).",
    "In-app Email Support modal — send a question to mauricio@goldenanchor.life right from the avatar menu.",
    "Client sort moved out of the dashboard onto the Clients page where it belongs.",
    "Advisor Alerts + Client Due cards rendered side-by-side."
  ]},
  {v:"v0.19.0",date:"2026-05-21",title:"Sidebar polish + Client Detail nav + ES translations",bullets:[
    "Sidebar items got proper spacing, dividers, and active-state highlighting.",
    "Client Detail tabs gain ◀ / ▶ arrows so you can step through tabs on narrow screens.",
    "Spanish translations filled in across many newer labels."
  ]},
  {v:"v0.18.0",date:"2026-05-21",title:"Avatar picker + Security/Billing/Backup/Help pages",bullets:[
    "Profile in the top-right menu now opens an Avatar Picker (12 SVG presets — Brand, Finance, Animal).",
    "Security page lets you change your password in-app.",
    "Billing & Plan replaces the old Services & Stripe section — add/edit/delete services and paste Stripe links.",
    "Backup page exposes one-click JSON download + restore.",
    "Archived Clients page with Restore + permanent Delete per row.",
    "Help & Support page with FAQ + email-the-advisor link.",
    "Sidebar cleanup: theme, EN/ES, and Sign Out moved to the top bar where they belong."
  ]},
  {v:"v0.17.0",date:"2026-05-21",title:"TopBar + Settings page (Claude design Phase 8)",bullets:[
    "New TopBar on every page with title, EN/ES, theme, and gold MH avatar dropdown.",
    "Settings became a full page (6 cards) instead of a modal."
  ]},
  {v:"v0.16.x",date:"2026-05-21",title:"Phase 8 dashboard + bugfix pass",bullets:[
    "Dashboard: 4 wide KPIs, Income vs Spending composed chart, sidebar profile widget.",
    "Defined the missing IntakeFormBody — step 4 of public intake no longer goes blank.",
    "Engagement letter Section 4 simplified ($500/yr or $30/mo Lite; AUM + Commissions lines removed).",
    "Public intake submit/pay split into two buttons."
  ]},
  {v:"v0.15.x",date:"2026-05-21",title:"Claude Design System port (Phases 1-4)",bullets:[
    "Brand assets, Plus Jakarta Sans + Newsreader fonts, PDF rebuild, area charts everywhere."
  ]}
];
function WhatsNewPage({t,role}){
  const th=useTh();
  // MD-I: clients see client/all entries; advisors see everything except client-only.
  const entries=WHATS_NEW_ENTRIES.filter(e=>role==="client"?(e.aud==="client"||e.aud==="all"):(e.aud!=="client"));
  return <div className="ga-np" style={{padding:24,maxWidth:820,margin:"0 auto"}}>
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.whatsNewSub||"Recent updates to the app. Full changelog lives in the GitHub repo."}</div>
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {entries.map(e=><div key={e.v+(e.aud||"")} style={{...mCARD(th),padding:18}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6,flexWrap:"wrap"}}>
          <span style={{fontSize:14,fontWeight:800,color:GOLD,fontFamily:"'JetBrains Mono',monospace"}}>{e.v}</span>
          <span style={{fontSize:10,color:th.dim,letterSpacing:"0.04em"}}>{e.date}</span>
        </div>
        <div style={{fontSize:13,fontWeight:700,color:th.text,marginBottom:10}}>{e.title}</div>
        <ul style={{margin:"0 0 0 18px",padding:0,fontSize:12,color:th.muted,lineHeight:1.7}}>
          {e.bullets.map((b,i)=><li key={i} style={{marginBottom:4}}>{b}</li>)}
        </ul>
      </div>)}
    </div>
  </div>;
}

/* ── HelpSupportPage — FAQ + email link. v0.18.0 ────────────────────────── */
const FAQ_ENTRIES=[
  {q:"How do I add a new client?",a:"From the Clients tab or Dashboard, click the gold \"+ Add\" button at the top right. Fill in name + email at minimum. You can also send an intake invite from Intake Forms → \"New invite\" and the prospect fills out their own info."},
  {q:"Why isn't my signature showing on engagement letters?",a:"Open the avatar dropdown (top right) → Settings → Branding → draw or type your signature. Save. Open any client's engagement letter — your signature should appear at the top. If the public intake doesn't show it, check that you've signed at least once in Profile & Settings."},
  {q:"How do I send an intake invite to a prospect?",a:"Go to Intake Forms (sidebar) → click the gold \"New invite\" button. Enter the prospect's name, email, and phone, pick a language, and choose Email or SMS. Click Send."},
  {q:"How do I export a single client's data?",a:"Open the client → click the kebab (⋯) in the top-right of the header → Export CSV. To back up ALL clients at once, open the avatar dropdown → Backup data → Download backup."},
  {q:"How do I change my password?",a:"Avatar dropdown (top right) → Security. Type a new password (8+ characters) and confirm. Other devices stay signed in until their sessions expire."},
  {q:"Why are some numbers blurred?",a:"You've turned on \"Hide all numbers\" — the 👁 button in the top bar. Click it again to show numbers. This is for screen-sharing or showing the app to non-clients."}
];
/* ── EmailSupportModal — in-app contact form. Sends via Resend through
   /api/send-support-email to finance@goldenanchor.life. v0.20.0           */
function EmailSupportModal({onClose,t,settings,authUser}){
  const th=useTh();
  const[subject,setSubject]=useState(t?.emailSupportDefaultSubject||"Question about the app");
  const[message,setMessage]=useState("");
  const[busy,setBusy]=useState(false);
  const[err,setErr]=useState("");
  const[done,setDone]=useState(false);
  const INP={width:"100%",padding:"10px 12px",background:th.inp,border:"1px solid "+th.inpBorder,color:th.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  const send=async()=>{
    setErr("");
    if(!message.trim()||message.trim().length<5){setErr(t?.emailSupportTooShort||"Please write at least a few words about your question.");return;}
    setBusy(true);
    const r=await gaSendSupportEmail({
      subject:subject.trim()||"Golden Anchor app — support request",
      message:message.trim(),
      advisorName:settings?.advisorName||"",
      advisorEmail:settings?.advisorEmail||authUser?.email||"",
      buildMarker:(typeof window!=="undefined"&&window.__GA_BUILD__)||"—"
    });
    setBusy(false);
    if(r.ok){setDone(true);setTimeout(()=>onClose(),1800);}
    else setErr(r.error||"Send failed.");
  };
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.67)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:14}}>
    <div style={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:16,boxShadow:"0 32px 80px rgba(0,0,0,0.55)",width:"min(560px,100%)",maxHeight:"90vh",overflowY:"auto",padding:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:th.text}}>📧 {t?.emailSupportTitle||"Email support"}</div>
          <div style={{fontSize:11,color:th.muted,marginTop:4,lineHeight:1.5}}>{t?.emailSupportHelp||"Sends your message to finance@goldenanchor.life. We'll reply to your advisor email on file."}</div>
        </div>
        <button onClick={onClose} title={t?.close||"Close"} style={{background:"transparent",border:"none",color:th.muted,fontSize:22,cursor:"pointer",lineHeight:1,padding:4}}>×</button>
      </div>
      {!done?<>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:th.muted,marginBottom:4,fontWeight:600}}>{t?.emailSupportReplyTo||"Reply-to (we'll respond to this address)"}</div>
          <div style={{fontSize:12,color:th.text,padding:"8px 12px",background:th.bg,border:`1px solid ${th.cardBorder}`,borderRadius:8,fontFamily:"'JetBrains Mono',monospace"}}>{settings?.advisorEmail||authUser?.email||"(no email on file)"}</div>
          <div style={{fontSize:10,color:th.dim,marginTop:4,fontStyle:"italic"}}>{t?.emailSupportDestHint||"Goes to finance@goldenanchor.life"}</div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:th.muted,marginBottom:4,fontWeight:600}}>{t?.emailReportSubject||"Subject"}</div>
          <input value={subject} onChange={e=>setSubject(e.target.value)} style={INP}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:th.muted,marginBottom:4,fontWeight:600}}>{t?.emailReportMessage||"Message"}</div>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder={t?.emailSupportPh||"Describe your question or issue. Include screenshots if useful by replying to the email after sending."} style={{...INP,minHeight:140,resize:"vertical"}}/>
        </div>
        {err&&<div style={{fontSize:11,color:th.neg,padding:"8px 10px",background:th.neg+"11",borderRadius:8,marginBottom:10}}>⚠️ {err}</div>}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} disabled={busy} style={{padding:"10px 16px",borderRadius:8,background:"transparent",color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer",fontSize:12,fontWeight:600}}>{t?.cancel||"Cancel"}</button>
          <button onClick={send} disabled={busy} style={{padding:"10px 18px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:800,fontSize:13,border:"none",cursor:busy?"wait":"pointer",opacity:busy?0.6:1}}>{busy?(t?.intakeSubmitting||"Sending…"):"📧 "+(t?.send||"Send")}</button>
        </div>
      </>:
      <div style={{textAlign:"center",padding:"30px 10px"}}>
        <div style={{fontSize:48,color:th.pos,marginBottom:10}}>✓</div>
        <div style={{fontSize:14,fontWeight:700,color:th.text,marginBottom:6}}>{t?.emailSupportSent||"Message sent!"}</div>
        <div style={{fontSize:12,color:th.muted}}>{t?.emailSupportSentSub||"Our team will reply to your advisor email shortly."}</div>
      </div>}
    </div>
  </div>;
}

function HelpSupportPage({t,settings,authUser}){
  const th=useTh();
  const[open,setOpen]=useState(null);
  const[modalOpen,setModalOpen]=useState(false);
  return <div className="ga-np" style={{padding:24,maxWidth:820,margin:"0 auto"}}>
    {modalOpen&&<EmailSupportModal onClose={()=>setModalOpen(false)} t={t} settings={settings} authUser={authUser}/>}
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.helpSub||"Common questions. Can't find an answer? Email support directly."}</div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
      {FAQ_ENTRIES.map((e,i)=><div key={i} style={{...mCARD(th),padding:0,overflow:"hidden"}}>
        <button onClick={()=>setOpen(o=>o===i?null:i)} style={{width:"100%",textAlign:"left",padding:"14px 16px",background:"transparent",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <span style={{fontSize:13,fontWeight:700,color:th.text}}>{e.q}</span>
          <span style={{fontSize:14,color:th.muted,flexShrink:0}}>{open===i?"−":"+"}</span>
        </button>
        {open===i&&<div style={{padding:"0 16px 16px",fontSize:12,color:th.muted,lineHeight:1.7,borderTop:`1px solid ${th.cardBorder}`,paddingTop:14}}>{e.a}</div>}
      </div>)}
    </div>
    <div style={{...mCARD(th),padding:18,background:GOLD+"08",border:`1px solid ${GOLD}33`}}>
      <div style={{fontSize:13,fontWeight:700,color:th.text,marginBottom:6}}>📧 {t?.stillNeedHelp||"Still need help?"}</div>
      <div style={{fontSize:12,color:th.muted,marginBottom:12,lineHeight:1.6}}>{t?.stillNeedHelpSubInApp||"Open a support request directly from the app — our team will reply to your advisor email."}</div>
      <button onClick={()=>setModalOpen(true)} style={{display:"inline-block",padding:"10px 16px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:700,fontSize:12,border:"none",cursor:"pointer"}}>📧 {t?.emailSupport||"Email support"}</button>
    </div>
  </div>;
}

/* ── SettingsCard — 2-col read-only card for the Profile & Settings page.
   Click "Edit" to open the ProfileModal scoped to that section.            */
function SettingsCard({title,icon:Icon,desc,rows,fields,onSave,onEdit,settings,t,th,flipOn,actions}){
  const[editing,setEditing]=useState(false);const[draft,setDraft]=useState({});
  const rm=useReducedMotion();const[flip,setFlip]=useState(false);
  const _flipOn=flipOn!==false;const showBack=_flipOn?(flip||editing):true;
  const set=(k,v)=>setDraft(p=>({...p,[k]:v}));
  const begin=()=>{if(!fields){onEdit&&onEdit();return;}const d={};fields.forEach(f=>{if(f.type==="logos"){d.logoLight=(settings&&settings.logoLight)||"";d.logoDark=(settings&&settings.logoDark)||"";return;}if(f.type==="signature"){d.advisorSignature=(settings&&settings.advisorSignature)||"";return;}let v=settings?settings[f.k]:undefined;if(f.type==="toggle")v=(v===undefined?(f.def||false):!!v);else v=(v??f.def??"");d[f.k]=v;});setDraft(d);setEditing(true);};
  const save=()=>{const patch={...draft};fields.forEach(f=>{if(f.type==="number")patch[f.k]=(patch[f.k]===""||patch[f.k]==null)?undefined:+patch[f.k];});onSave&&onSave(patch);setEditing(false);};
  const canEdit=!!fields||!!onEdit;
  return <>
    {editing&&fields&&<Modal title={stripLeadEmoji(title)} onClose={()=>setEditing(false)} width={460} disableBackdropClose={true}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        {fields.map(f=>{const onLogo=(mode)=>(e)=>{const fl=e.target.files&&e.target.files[0];if(!fl)return;if(fl.size>500*1024){alert((t?.logoTooLarge||"Logo image is too large (max 500KB).")+" "+Math.round(fl.size/1024)+"KB");return;}const r=new FileReader();r.onload=ev=>set(mode==="light"?"logoLight":"logoDark",ev.target.result);r.readAsDataURL(fl);};
        if(f.type==="logos")return <div key={f.k} style={{display:"flex",flexDirection:"column",gap:7,paddingTop:4}}><span style={{fontSize:10,fontWeight:500,color:th.dim,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{f.l}</span><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[["light","#FFFFFF","logoLight"],["dark","#0D1B2A","logoDark"]].map(([m,bgc,k])=><div key={m}><div style={{padding:8,background:bgc,border:"1px solid "+th.cardBorder,borderRadius:9,minHeight:54,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:5}}>{draft[k]?<img src={draft[k]} alt={m} style={{maxHeight:42,maxWidth:"100%",objectFit:"contain"}}/>:<span style={{fontSize:10,color:"#9AA0A8",fontStyle:"italic"}}>{t?.logoNone||"No logo"}</span>}</div><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogo(m)} style={{fontSize:10,width:"100%",color:th.muted}}/>{draft[k]&&<button type="button" onClick={()=>set(k,"")} style={{fontSize:9,marginTop:3,padding:"2px 8px",borderRadius:5,background:"transparent",color:th.muted,border:"1px solid "+th.cardBorder,cursor:"pointer"}}>{t?.clearLogo||"Clear"}</button>}</div>)}</div></div>;
        if(f.type==="signature")return <div key={f.k} style={{display:"flex",flexDirection:"column",gap:7,paddingTop:4}}><span style={{fontSize:10,fontWeight:500,color:th.dim,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{f.l}</span><SignaturePad value={draft.advisorSignature} onChange={v=>set("advisorSignature",v||"")} defaultName={draft.advisorName} t={t} theme={th} typedOnly/></div>;
        const _inline=(f.type==="toggle"||f.type==="color");
        return <div key={f.k} style={_inline?{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,minHeight:34}:{display:"flex",flexDirection:"column",gap:6}}>
          <span style={{fontSize:11.5,color:th.muted,flexShrink:0}}>{f.l}</span>
          {f.type==="toggle"?<div onClick={()=>set(f.k,!draft[f.k])} style={{width:38,height:22,borderRadius:99,background:draft[f.k]?th.accent:th.cardBorder,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}><div style={{position:"absolute",top:2,left:draft[f.k]?18:2,width:18,height:18,borderRadius:99,background:"#fff",transition:"left .2s"}}/></div>
          :f.type==="select"?<select value={draft[f.k]} onChange={e=>set(f.k,e.target.value)} style={{...mINP(th),width:"100%",boxSizing:"border-box",padding:"10px 11px",fontSize:12.5}}>{f.options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
          :f.type==="color"?<span style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10.5,fontFamily:"'JetBrains Mono',monospace",color:th.dim}}>{(draft[f.k]||"").toString().toUpperCase()}</span><input type="color" value={draft[f.k]||"#000000"} onChange={e=>set(f.k,e.target.value)} style={{width:34,height:28,border:"1px solid "+th.cardBorder,borderRadius:7,background:"transparent",cursor:"pointer",padding:2}}/></span>
          :<input type={f.type==="number"?"number":"text"} value={draft[f.k]} step={f.step} min={f.min} max={f.max} onChange={e=>set(f.k,e.target.value)} style={{...mINP(th),width:"100%",boxSizing:"border-box",padding:"10px 11px",fontSize:12.5}}/>}
        </div>;})}
      </div>
      <SaveBar onSave={save} onCancel={()=>setEditing(false)} t={t}/>
    </Modal>}
    <div className="ga-lift ga-spot" onMouseEnter={()=>_flipOn&&!rm&&setFlip(true)} onMouseLeave={()=>_flipOn&&!rm&&!editing&&setFlip(false)} onClick={()=>_flipOn&&rm&&setFlip(f=>!f)} style={{...mCARD(th),position:"relative",perspective:1600,padding:0,overflow:"hidden"}}>
      <div style={{position:"relative",minHeight:"100%",transformStyle:"preserve-3d",transition:rm?"none":"transform .55s cubic-bezier(.23,1,.32,1)",transform:showBack?"rotateY(180deg)":"rotateY(0deg)"}}>
        <div style={{boxSizing:"border-box",backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",padding:16,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>{Icon&&<div style={{width:28,height:28,borderRadius:8,background:th.accent+"14",border:"1px solid "+th.accent+"26",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={14} strokeWidth={1.6} color={th.accent}/></div>}<div style={{fontSize:10,fontWeight:500,color:th.dim,letterSpacing:".13em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{stripLeadEmoji(title)}</div></div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{rows.map(([k,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",fontSize:12,paddingBottom:8,borderBottom:"1px solid "+(th.glassBorder||th.cardBorder),gap:10}}><span style={{color:th.muted,flex:"0 1 auto",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k}</span><span style={{color:th.text,fontWeight:600,fontVariantNumeric:"tabular-nums",textAlign:"right",flex:"1 1 auto",minWidth:0,wordBreak:"break-word"}}>{v}</span></div>)}</div>
          {actions&&<div onClick={e=>e.stopPropagation()} style={{marginTop:12}}>{actions}</div>}
          {canEdit&&<div style={{marginTop:12,textAlign:"right"}}><button className="ga-press" onClick={(e)=>{e.stopPropagation();begin();}} style={{fontSize:11,padding:"5px 14px",borderRadius:8,background:th.accent+"22",color:th.accent,border:"1px solid "+th.accent+"44",cursor:"pointer",fontWeight:700}}>{t?.edit||"Edit"}</button></div>}
        </div>
        <div style={{position:"absolute",inset:0,boxSizing:"border-box",backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",padding:18,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",gap:10}}>
          {Icon&&<div style={{width:44,height:44,borderRadius:12,background:th.accent+"14",border:"1px solid "+th.accent+"26",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={22} strokeWidth={1.6} color={th.accent}/></div>}
          <div style={{fontSize:15,fontWeight:700,color:th.text,letterSpacing:"-0.01em"}}>{stripLeadEmoji(title)}</div>
          {desc&&<div style={{fontSize:12,color:th.muted,lineHeight:1.55}}>{desc}</div>}
        </div>
      </div>
    </div>
  </>;
}

/* ── SettingsPage — full-page replacement for the old scrollable ProfileModal.
   Matches ui_kits/advisor_app/index.html SettingsView (2-col card grid).    */
function SettingsPage({settings,onEdit,onSave,onBackup,onRestoreBackup,t,clients,role,onUpdateClient}){
  const th=useTh();
  const numArchived=(clients||[]).filter(c=>c.archived).length;
  const advisorRows=[
    [t?.nameLbl||"Name", settings.advisorName||"—"],
    [t?.emailLbl||"Email", settings.advisorEmail||"—"],
    [t?.phoneLbl||"Phone", settings.advisorPhone?(typeof fmtPh==="function"?fmtPh(settings.advisorPhone):settings.advisorPhone):"—"],
    [t?.instagram||"Instagram", settings.ig||"—"],
    [t?.company||"Company", settings.companyName||"—"],
  ];
  // v0.56-r5 — Appearance summary shows actual color swatches instead of
  // hex codes ("color boxes" per Mauricio's persistent ask). Each row's
  // value is JSX: 16px colored tile + name + small mono hex caption.
  const accent=(settings.darkAccent||GOLD).toString().toUpperCase();
  const bg=((settings.darkBg)||"#111827").toString().toUpperCase();
  const card=((settings.darkCard)||"#1F2937").toString().toUpperCase();
  const lightAccent=(settings.lightAccent||"#2563EB").toString().toUpperCase();
  const lightBg=((settings.lightBg)||"#F1F5F9").toString().toUpperCase();
  const lightCard=((settings.lightCard)||"#FFFFFF").toString().toUpperCase();
  const isDarkTheme=settings.darkMode!==false;
  // v0.57.1 — hex codes removed from summary per Mauricio ("Appearance still
  // has the codes next to the colors"). Swatch + friendly name only; hex shows
  // in the edit modal where it's actually editable.
  const ColorRow=({color,name})=><span style={{display:"inline-flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
    <span style={{width:18,height:18,borderRadius:5,background:color,border:`1px solid ${th.cardBorder}`,boxShadow:"inset 0 0 0 1px rgba(0,0,0,0.05)"}}/>
    <span style={{color:th.text,fontWeight:600}}>{name}</span>
  </span>;
  const appearanceRows=[
    [t?.theme||"Theme", settings.darkMode!==false?("🌙 "+(t?.darkMode||"Dark")):("☀️ "+(t?.lightMode||"Light"))],
    [t?.accent||"Accent", <ColorRow key="acc" color={isDarkTheme?accent:lightAccent} name={isDarkTheme?"Gold":"Blue"}/>],
    [t?.background||"Background", <ColorRow key="bg" color={isDarkTheme?bg:lightBg} name={isDarkTheme?"Navy":"Cream"}/>],
    [t?.card||"Card", <ColorRow key="card" color={isDarkTheme?card:lightCard} name={isDarkTheme?"Navy 600":"White"}/>],
    [t?.appZoom||"App zoom", Math.round((settings.appZoom||1)*100)+"%"],
  ];
  const localizationRows=[
    [t?.language||"Language", settings.lang==="es"?"Español (ES)":(t?.englishEn||"English (EN)")],
    [t?.dateFormat||"Date format", settings.dateFormat==="short"?"MM/DD/YYYY":"Month DD, YYYY"],
    [t?.currency||"Currency", (settings.currency||"USD")],
  ];
  const localizationFields=[
    {k:"lang",l:t?.language||"Language",type:"select",options:[["en",t?.englishEn||"English (EN)"],["es","Espanol (ES)"]]},
    {k:"dateFormat",l:t?.dateFormat||"Date format",type:"select",options:[["long","Month DD, YYYY"],["short","MM/DD/YYYY"]]},
    {k:"currency",l:t?.currency||"Currency",type:"select",options:[["USD","USD ($)"],["EUR","EUR (\u20ac)"],["GBP","GBP (\u00a3)"],["MXN","MXN ($)"],["CAD","CAD ($)"]]},
  ];
  const remindersRows=[
    [t?.noContactThresh||"No-contact threshold", (settings.noContactDays||30)+" "+(t?.daysLbl||"days")],
    [t?.highDsrAlert||"High DSR alert", settings.dsrAlert!==false?(t?.onLbl||"On"):(t?.offLbl||"Off")],
    [t?.promoExpiringAlert||"Promo expiring alert", (settings.promoLeadDays||60)+" "+(t?.daysOutLbl||"days out")],
    [t?.debtRisingAlert||"Debt-rising alert", settings.debtRisingAlert?(t?.onLbl||"On"):(t?.offLbl||"Off")],
  ];
  const svcList=Array.isArray(settings.services)&&settings.services.length?settings.services:[
    {name:t?.initialCheckup||"Initial Checkup",price:"$149"},
    {name:t?.quarterlyReview||"Quarterly Review",price:"$199"},
    {name:t?.strategySession||"Strategy Session",price:"$129"},
    {name:t?.monthlyLite||"Monthly Lite",price:"$49/mo"},
    {name:t?.insuranceConsult||"Insurance Consult",price:"Free"}
  ];
  const servicesRows=svcList.slice(0,6).map(s=>[s.name||"Service",`${s.price||"—"} · ${s.stripeUrl?(t?.linkedLbl||"linked"):(t?.unlinkedLbl||"not linked")}`]);
  const backupRows=[
    [t?.lastBackupLbl||"Last verified backup", settings.lastBackupVerified||"—"],
    [t?.autoBackup||"Auto-backup", t?.weeklyLbl||"Weekly"],
    [t?.exportFormat||"Export format", "JSON + CSV"],
  ];
  const advisorFields=[{k:"advisorName",l:t?.nameLbl||"Name",type:"text"},{k:"advisorEmail",l:t?.emailLbl||"Email",type:"text"},{k:"advisorPhone",l:t?.phoneLbl||"Phone",type:"text"},{k:"ig",l:t?.instagram||"Instagram",type:"text"},{k:"websiteUrl",l:t?.website||"Website",type:"text"},{k:"companyName",l:t?.company||"Company",type:"text"},{k:"branding",l:t?.brandingHdr||"Logos (light & dark)",type:"logos"},{k:"advisorSignature",l:t?.advisorSigHdr||"Signature",type:"signature"}];
  const appearanceFields=[{k:"darkAccent",l:(t?.darkMode||"Dark")+" "+(t?.accent||"accent"),type:"color",def:GOLD},{k:"lightAccent",l:(t?.lightMode||"Light")+" "+(t?.accent||"accent"),type:"color",def:"#C9A84C"},{k:"appZoom",l:t?.appZoom||"App zoom",type:"number",step:0.05,min:0.8,max:1.5,def:1}];
  const remindersFields=[{k:"noContactDays",l:t?.noContactThresh||"No-contact days",type:"number",def:30},{k:"dsrAlert",l:t?.highDsrAlert||"High DSR alert",type:"toggle",def:true},{k:"promoLeadDays",l:t?.promoExpiringAlert||"Promo lead days",type:"number",def:60},{k:"debtRisingAlert",l:t?.debtRisingAlert||"Debt-rising alert",type:"toggle",def:false}];
  const flipOn=settings.cardsFlip!==false;
  if(role==="client"){
    const me=(clients&&clients[0])||{};
    const profRows=[[t?.nameLbl||"Name",(((me.firstName||"")+" "+(me.lastName||"")).trim())||"—"],[t?.emailLbl||"Email",me.email||"—"]];
    const profFields=[{k:"firstName",l:t?.firstName||"First name",type:"text"},{k:"lastName",l:t?.lastName||"Last name",type:"text"},{k:"email",l:t?.emailLbl||"Email",type:"text"}];
    const isEs=settings.lang==="es";
    const myPlan=planOf(me);
    const planRows=[[t?.planLbl||"Plan",planLabel(myPlan,isEs)],[t?.planIncludesLbl||"Includes",myPlan==="free"?(t?.planIncludesVal||"Profile, calculators & resources"):(isEs?"Todo: reportes, comparación, calculadoras con tus números":"Everything: reports, compare, calculators with your numbers")]];
    const upgradeBtns=["monthly-lite","monthly-lite-plus","annual-bundle"].map(id=>{
      const svc=SVCS.find(s=>s.id===id);if(!svc)return null;
      const url=svcPayUrl(svc,settings)||DEF_SETTINGS.stripeLinks?.[id]||"";if(!url)return null;
      return <a key={id} className="ga-press" href={url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"7px 12px",borderRadius:8,background:th.accent+"14",border:"1px solid "+th.accent+"33",textDecoration:"none",cursor:"pointer"}}>
        <span style={{fontSize:11.5,fontWeight:600,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isEs?svc.es:svc.en}</span>
        <span style={{fontSize:11.5,fontWeight:700,color:th.accent,fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",flexShrink:0}}>{svc.price}</span>
      </a>;
    }).filter(Boolean);
    const _ref=(typeof localStorage!=="undefined"&&localStorage.getItem("ga_cache_uid"))||"";
    const showPrem=myPlan==="free";
    const planActions=true?<div style={{display:"flex",flexDirection:"column",gap:7}}>
      {showPrem&&<><div style={{fontSize:10,fontWeight:500,color:th.dim,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{isEs?"Premium — paga lo que elijas":"Premium — choose what you pay"}</div><ChooseAmount lang={isEs?"es":"en"} onFallbackTier={tr=>window.open(tr.link+(_ref?"?client_reference_id="+encodeURIComponent(_ref):""),"_blank","noopener")}/></>}
      <div style={{fontSize:10,fontWeight:500,color:th.dim,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginTop:showPrem?5:0}}>{isEs?"Con asesor":"With an advisor"}</div>
      {upgradeBtns}
      <div style={{fontSize:10,color:th.dim,fontStyle:"italic"}}>{t?.upgradeNote||"Opens secure Stripe checkout in a new tab."}</div>
    </div>:null;
    return <div className="ga-np" style={{padding:24,maxWidth:1100,margin:"0 auto"}}>
      <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.clientSettingsSub||"Manage your profile, appearance and language."}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:11,marginBottom:14}}><span style={{fontSize:11.5,color:th.muted,fontWeight:600}}>{t?.flipCards||"Flip cards"}</span><div onClick={()=>onSave({cardsFlip:!flipOn})} role="switch" aria-checked={flipOn} style={{width:42,height:24,borderRadius:99,background:flipOn?th.accent:th.cardBorder,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}><div style={{position:"absolute",top:2,left:flipOn?20:2,width:20,height:20,borderRadius:99,background:"#fff",transition:"left .2s"}}/></div></div>
      <div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <SettingsCard icon={Users} title={t?.myProfile||"My profile"} desc={t?.myProfileDesc||"Your name & contact email"} rows={profRows} fields={profFields} onSave={patch=>onUpdateClient&&onUpdateClient({...me,...patch})} settings={me} t={t} th={th} flipOn={flipOn}/>
        <SettingsCard icon={Sparkles} title={t?.appearance||"Appearance"} desc={t?.descAppearance||"Theme accent & app zoom"} rows={appearanceRows} fields={appearanceFields} onSave={onSave} settings={settings} t={t} th={th} flipOn={flipOn}/>
        <SettingsCard icon={BookOpen} title={t?.localization||"Localization"} desc={t?.descLocalization||"Language, date format & currency"} rows={localizationRows} fields={localizationFields} onSave={onSave} settings={settings} t={t} th={th} flipOn={flipOn}/>
        <SettingsCard icon={Receipt} title={t?.yourPlan||"Your plan"} desc={t?.yourPlanDesc||"What's included today"} rows={planRows} actions={planActions} t={t} th={th} flipOn={flipOn}/>
      </div>
    </div>;
  }

  return <div className="ga-np" style={{padding:24,maxWidth:1100,margin:"0 auto"}}>
    {/* v0.24.0 — page title removed (TopBar shows it). */}
    <div style={{fontSize:12,color:th.muted,marginBottom:18}}>{t?.profileSettingsSub||"Edit any section to update your details, services, or theme."}</div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:11,marginBottom:14}}><span style={{fontSize:11.5,color:th.muted,fontWeight:600}}>{t?.flipCards||"Flip cards"}</span><div onClick={()=>onSave({cardsFlip:!flipOn})} role="switch" aria-checked={flipOn} style={{width:42,height:24,borderRadius:99,background:flipOn?th.accent:th.cardBorder,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}><div style={{position:"absolute",top:2,left:flipOn?20:2,width:20,height:20,borderRadius:99,background:"#fff",transition:"left .2s"}}/></div></div>
    <div data-ga-grid="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <SettingsCard icon={Users} title={t?.advisorInformation||"Advisor Information"} desc={t?.descAdvisor||"Name, contact, branding & signature"} flipOn={flipOn} rows={advisorRows} fields={advisorFields} onSave={onSave} settings={settings} t={t} th={th}/>
      <SettingsCard icon={Sparkles} title={t?.appearance||"Appearance"} desc={t?.descAppearance||"Theme accent & app zoom"} flipOn={flipOn} rows={appearanceRows} fields={appearanceFields} onSave={onSave} settings={settings} t={t} th={th}/>
      <SettingsCard icon={BookOpen} title={t?.localization||"Localization"} desc={t?.descLocalization||"Language, date format & currency"} flipOn={flipOn} rows={localizationRows} fields={localizationFields} onSave={onSave} settings={settings} t={t} th={th}/>
      <SettingsCard icon={Bell} title={t?.reminders||"Reminders"} desc={t?.descReminders||"Alert thresholds & toggles"} flipOn={flipOn} rows={remindersRows} fields={remindersFields} onSave={onSave} settings={settings} t={t} th={th}/>
      <SettingsCard icon={Receipt} title={t?.servicesAndStripeLinks||"Services & Stripe Links"} desc={t?.descServices||"Your services & payment links"} flipOn={flipOn} rows={servicesRows} onEdit={()=>onEdit("services")} t={t} th={th}/>
      <SettingsCard icon={HardDriveDownload} title={t?.backupAndData||"Backup & Data"} desc={t?.descBackup||"Export & verify your backups"} flipOn={flipOn} rows={backupRows} onEdit={()=>onEdit("backup")} t={t} th={th}/>
    </div>
    {numArchived>0 && <div style={{marginTop:14,padding:"10px 14px",background:th.warn+"11",border:`1px solid ${th.warn}33`,borderRadius:10,fontSize:11,color:th.muted}}>🗂 {numArchived} {t?.archivedClientsLbl||"archived clients"} · <button onClick={()=>onEdit("archived")} style={{background:"transparent",border:"none",color:th.accent,fontWeight:700,fontSize:11,cursor:"pointer",padding:0,textDecoration:"underline"}}>{t?.viewArchived||"View archived"}</button></div>}
  </div>;
}

/* ── AvatarBubble — gold initials chip used in TopBar + sidebar footer ──── */

export { AVATAR_PRESETS, ArchivedClientsPage, AvatarImg, AvatarPickerModal, BackupPage, BillingPage, EmailSupportModal, FAQ_ENTRIES, HelpSupportPage, SecurityPage, SettingsCard, SettingsPage, WHATS_NEW_ENTRIES, WhatsNewPage };
