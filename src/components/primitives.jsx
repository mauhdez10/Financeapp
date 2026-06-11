// Extracted from App.jsx in Phase 1b of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-10).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState, useEffect, useRef, useCallback } from "react";
import { LayoutDashboard, Users, FileInput, Calculator, Tag, BookOpen, Anchor, Settings as SettingsIcon, Shield, Receipt, HardDriveDownload, Archive, Sparkles, Bell, HelpCircle, LogOut, ImageIcon, BarChart3 } from "lucide-react";
import { useTh, useHN } from "../contexts/theme";
import { GOLD, stripLeadEmoji, mCARD, mINP, mIIN, mTD, mTDR } from "../styles/theme";
import { CP } from "../constants/meta";
import { fmt, bE, fmtSSN } from "../utils/finance";
import { Sparkline } from "./charts";

// v0.44.0 — Lucide icon wrapper. Map a stable key → SVG component so callers
// can do <GAIcon name="dashboard" size={16}/> without importing each one.
const _GA_ICONS = {
  dashboard: LayoutDashboard,
  clients: Users,
  intake: FileInput,
  calculators: Calculator,
  promotions: Tag,
  resources: BookOpen,
  about: Anchor,
  settings: SettingsIcon,
  security: Shield,
  billing: Receipt,
  backup: HardDriveDownload,
  archived: Archive,
  whatsNew: Sparkles,
  help: HelpCircle,
  signOut: LogOut,
  profile: ImageIcon,
  charts: BarChart3,
};
function GAIcon({name,size=16,color,style,className}){
  const Comp=_GA_ICONS[name];
  if(!Comp)return null;
  return<Comp size={size} color={color||"currentColor"} strokeWidth={1.6} style={{flexShrink:0,...style}} className={className}/>;
}

const FH=({v,c:client,forcePts})=>{const{hide}=useHN();return hide||(client?.hideNumbers)?<span style={{letterSpacing:"0.1em",color:"inherit",filter:"blur(4px)",userSelect:"none"}}>{"●●●●"}</span>:<>{v}</>;};
/* helper: wrap fmt with hide */

/* ── TRANSLATIONS ── moved to src/translations.js per D-29 (v0.6.2) ──────── */

const useSrt=(items,dk,dd="asc")=>{const[sk,setSK]=useState(dk);const[sd,setSD]=useState(dd);const tgl=k=>{if(k===sk)setSD(d=>d==="asc"?"desc":"asc");else{setSK(k);setSD("asc");}};const srt=[...items].sort((a,b)=>{const av=a[sk],bv=b[sk];const r=typeof av==="string"?(av||"").localeCompare(bv||""):(+av||0)-(+bv||0);return sd==="asc"?r:-r;});return{sorted:srt,sortK:sk,sortD:sd,toggle:tgl};};
const SA=({col,sortK,sortD})=><span style={{fontSize:9,opacity:0.5,marginLeft:6}}>{sortK===col?(sortD==="asc"?"↑":"↓"):"↕"}</span>;


/* ── PRIMITIVES ──────────────────────────────────────────────────────────── */
function Pill({children,color="#94A3B8",pulse=false}){return<span className={pulse?"ga-pill-pulse":undefined} style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{children}</span>;}
function InfoTip({text}){const[v,setV]=useState(false);const th=useTh();const c=th.accent;return<span style={{position:"relative",display:"inline-block",marginLeft:4}}><span onMouseEnter={()=>setV(true)} onMouseLeave={()=>setV(false)} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:99,fontSize:9,cursor:"help",background:c+"22",color:c,border:`1px solid ${c}44`,fontWeight:700}}>?</span>{v&&<span style={{position:"absolute",bottom:22,left:"50%",transform:"translateX(-50%)",width:240,padding:"10px 12px",borderRadius:10,fontSize:11,lineHeight:1.6,zIndex:999,background:th.modal,border:`1px solid ${th.cardBorder}`,color:th.muted,boxShadow:"0 12px 40px #000a"}}>{text}</span>}</span>;}
// v0.27.0 — tweens the digit portion of a KPI value (string like "$12,345" or a plain number) toward
// the new target over ~600ms ease-out. Skips animation under prefers-reduced-motion, on non-numeric
// values (e.g. "●●●" hide-numbers placeholder), and on first render.
function useAnimatedDisplay(value){
  const[display,setDisplay]=useState(value);
  const prevRef=useRef(null);
  useEffect(()=>{
    const reduce=typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCurrency=typeof value==="string"&&/^\$/.test(value);
    const numeric=typeof value==="number"?value:(typeof value==="string"?parseFloat(value.replace(/[^0-9.-]/g,"")):NaN);
    const prev=prevRef.current;
    prevRef.current=numeric;
    if(reduce||prev==null||!isFinite(numeric)||!isFinite(prev)||numeric===prev){setDisplay(value);return;}
    const fmtCur=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
    const fmtPlain=new Intl.NumberFormat("en-US",{maximumFractionDigits:0});
    const dur=600;
    const start=performance.now();
    let raf;
    const tick=now=>{
      const k=Math.min(1,(now-start)/dur);
      const e=1-Math.pow(1-k,3);
      const n=prev+(numeric-prev)*e;
      setDisplay(isCurrency?fmtCur.format(n):fmtPlain.format(n));
      if(k<1)raf=requestAnimationFrame(tick);else setDisplay(value);
    };
    raf=requestAnimationFrame(tick);
    return()=>{if(raf)cancelAnimationFrame(raf);};
  },[value]);
  return display;
}
// v0.56 — KpiTile: Dashboard KPI tile w/ inline sparkline + delta caption.
// Per Mauricio's image 3 reference (ACTIVE CLIENTS · 14 · ↑2 this month · spark).
// Layout: label top (small uppercase), value + sparkline as a row, optional
// delta sub-caption below.
// v0.59.2 — Mauricio: top KPI tile "lines need to be bigger and centered".
// Sparkline moved out of the top row (was maxWidth:120 squished beside the
// label) into its own full-width row below the value. Height 28 → 40,
// stroke 1.25 → 1.5 for a more visible chart. minHeight 104 → 124.
function KpiTile({label,value,color,sub,delta,spark}){
  const th=useTh();
  // v0.60 — modern (Origin): mono micro-label, neutral light-sans value, thin gold
  // sparkline on the right, arrow delta. Value is neutral (th.text), not color-coded.
  return<div className="ga-sc ga-lift" style={{...mCARD(th),padding:"15px 18px",flex:1,minWidth:0,overflow:"hidden",display:"flex",flexDirection:"column"}}>
    <div style={{fontSize:9.5,color:th.dim,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:500,fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>{label}</div>
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:10}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:27,fontWeight:600,color:th.text,fontVariantNumeric:"tabular-nums",lineHeight:1,letterSpacing:"-0.5px",fontFamily:"'JetBrains Mono',ui-monospace,monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>
        {(delta||sub)&&<div style={{fontSize:11,color:th.dim,display:"flex",alignItems:"center",gap:7,marginTop:9}}>
          {delta&&<span style={{background:(delta.up?th.pos:delta.down?th.neg:th.dim)+"1A",color:delta.up?th.pos:delta.down?th.neg:th.dim,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontSize:10.5,padding:"2px 8px",borderRadius:99,lineHeight:1.4,whiteSpace:"nowrap"}}>{delta.up?"▲":delta.down?"▼":"→"} {delta.value}</span>}
          {sub&&<span>{sub}</span>}
        </div>}
      </div>
      {spark&&spark.length>=2&&<div style={{flexShrink:0}}><Sparkline data={spark} color={th.accent} width={92} height={32} strokeWidth={1} fill={false}/></div>}
    </div>
  </div>;
}

// v0.56 — SC (Summary Card) tightened. Was padding:14 with 18px value and
// extra wasted vertical space. Now 10px/12px padding, JetBrains Mono on the
// value, uppercase 0.06em label, more compact rhythm — same data, half the
// blank space. Used everywhere via KPI strips (Monthly Report, Dashboard,
// ClientDetail header).
function SC({label,value,color,sub}){const th=useTh();const disp=useAnimatedDisplay(value);return<div className="ga-sc ga-lift" style={{...mCARD(th),padding:"12px 14px",flex:1,minWidth:0,overflow:"hidden"}}><div style={{fontSize:10,color:th.muted,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:700}}>{stripLeadEmoji(label)}</div><div style={{fontSize:17,fontWeight:700,color:color||th.accent,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace",fontVariantNumeric:"tabular-nums",lineHeight:1.1}}>{disp}</div>{sub&&<div style={{fontSize:9.5,color:th.dim,marginTop:2,letterSpacing:"0.02em"}}>{sub}</div>}</div>;}
// v0.27.0 — Skeleton primitive: matte shimmer block. width/height accept any CSS length.
function Skel({w="100%",h=12,style}){return<div className="ga-skel" style={{width:w,height:h,...style}}/>;}
// v0.27.0 — Bootstrap skeleton: matches the live dashboard's silhouette (sidebar/topbar + 4 KPIs +
// chart + client row strip) so the live UI fades in rather than popping. Pure presentational —
// no state, no effects, top-level (per pitfall #17). Spinner-fallback text remains in screen-reader
// only span so a11y tools still announce "Loading…".
function BootstrapSkeleton({theme,t,isMobile}){
  const bg=theme.bg,card=theme.card||theme.modal||"#FFF",border=theme.cardBorder||"#94A3B833",muted=theme.muted;
  const baseRow={background:card,border:`1px solid ${border}`,borderRadius:12};
  return<div role="status" aria-live="polite" style={{minHeight:"100vh",background:bg,padding:isMobile?14:24,display:"flex",flexDirection:"column",gap:14}}>
    <span style={{position:"absolute",left:-9999,width:1,height:1,overflow:"hidden"}}>{t.loadingClients||"Loading clients…"}</span>
    {/* fake topbar */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Skel w={28} h={28} style={{borderRadius:99}}/>
        <Skel w={140} h={14}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Skel w={26} h={26} style={{borderRadius:7}}/>
        <Skel w={26} h={26} style={{borderRadius:7}}/>
        <Skel w={32} h={32} style={{borderRadius:99}}/>
      </div>
    </div>
    {/* 4 KPI tiles */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12}}>
      {[0,1,2,3].map(i=><div key={i} style={{...baseRow,padding:14}}>
        <Skel w={"55%"} h={10} style={{marginBottom:10}}/>
        <Skel w={"80%"} h={20}/>
      </div>)}
    </div>
    {/* two-col chart row */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"3fr 2fr",gap:12}}>
      <div style={{...baseRow,padding:16}}>
        <Skel w={"40%"} h={10} style={{marginBottom:14}}/>
        <Skel w={"100%"} h={isMobile?160:200}/>
      </div>
      <div style={{...baseRow,padding:16}}>
        <Skel w={"40%"} h={10} style={{marginBottom:14}}/>
        <Skel w={"100%"} h={isMobile?160:200}/>
      </div>
    </div>
    {/* alerts row */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
      {[0,1].map(i=><div key={i} style={{...baseRow,padding:14,display:"flex",flexDirection:"column",gap:8}}>
        <Skel w={"38%"} h={10} style={{marginBottom:6}}/>
        {[0,1,2].map(j=><div key={j} style={{display:"flex",alignItems:"center",gap:10}}>
          <Skel w={"60%"} h={11}/>
          <Skel w={70} h={18} style={{borderRadius:99,marginLeft:"auto"}}/>
        </div>)}
      </div>)}
    </div>
    {/* clients list strip */}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {[0,1,2,3].map(i=><div key={i} style={{...baseRow,padding:isMobile?"12px 14px":"14px 18px",display:"flex",alignItems:"center",gap:14}}>
        <Skel w={isMobile?38:44} h={isMobile?38:44} style={{borderRadius:99}}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
          <Skel w={"45%"} h={12}/>
          <Skel w={"30%"} h={10}/>
        </div>
        {!isMobile&&<div style={{display:"flex",gap:18}}>
          <Skel w={70} h={14}/>
          <Skel w={70} h={14}/>
          <Skel w={70} h={14}/>
        </div>}
      </div>)}
    </div>
    {/* anchor mark — subtle, bottom-right */}
    <div style={{textAlign:"center",color:muted,fontSize:11,letterSpacing:".18em",marginTop:4,opacity:0.6}}>⚓ {(t.loadingClients||"Loading clients…").toUpperCase()}</div>
  </div>;
}
function Field({label,children}){const th=useTh();return<div data-cf={typeof label==="string"?label:""} style={{marginBottom:14}}><label style={{fontSize:11,color:th.muted,display:"block",marginBottom:5}}>{label}</label>{children}</div>;}
function useViewport(){const[v,setV]=useState(()=>typeof window!=="undefined"?{w:window.innerWidth,h:window.innerHeight}:{w:1280,h:800});useEffect(()=>{if(typeof window==="undefined")return;let raf=null;const onR=()=>{if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>setV({w:window.innerWidth,h:window.innerHeight}));};window.addEventListener("resize",onR);window.addEventListener("orientationchange",onR);return()=>{window.removeEventListener("resize",onR);window.removeEventListener("orientationchange",onR);if(raf)cancelAnimationFrame(raf);};},[]);return{w:v.w,h:v.h,isMobile:v.w<720,isTablet:v.w>=720&&v.w<1024,isDesktop:v.w>=1024};}
function Row2({children,forceMobileStack=true}){const{isMobile}=useViewport();const count=Array.isArray(children)?children.filter(Boolean).length:1;const cols=(isMobile&&forceMobileStack)?"1fr":`repeat(${count},1fr)`;return<div style={{display:"grid",gridTemplateColumns:cols,gap:12}}>{children}</div>;}
function SHdr({label,right}){const th=useTh();return<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><span style={{fontSize:12,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase"}}>{stripLeadEmoji(label)}</span>{right}</div>;}
function PTag({who,client,t}){const color=who==="p1"?client.color1:who==="p2"?(client.color2||"#94A3B8"):"#94A3B8";const name=who==="p1"?client.firstName:who==="p2"?(client.partnerFirst||"P2"):"Joint";return<Pill color={color}>{name}</Pill>;}
function SBadge({value,meta,t,ratioKey}){if(value===null||value===undefined||isNaN(value))return<Pill color="#94A3B8">N/A</Pill>;const g=meta.better==="higher"?value>=meta.threshold:value<=meta.threshold;const w=meta.better==="higher"?value>=meta.threshold*0.5:value<=meta.threshold*1.4;const c=g?"#10B981":w?"#F59E0B":"#EF4444";return<Pill color={c}>{g?t.good:w?t.warning:t.critical}</Pill>;}
function Btn({children,onClick,color,small,style={}}){const th=useTh();const c=color||th.accent;return<button className="ga-press" onClick={onClick} style={{fontSize:small?11:12,padding:small?"3px 10px":"8px 16px",borderRadius:8,background:c+"18",color:c,border:`1px solid ${c}44`,cursor:"pointer",fontWeight:600,...style}}>{children}</button>;}
function BSolid({children,onClick,style={},color}){const th=useTh();const c=color||th.accent;const ink=color?"#fff":"#1A1405";return<button className="ga-press" onClick={onClick} style={{fontSize:12,padding:"8px 20px",borderRadius:8,background:c,color:ink,fontWeight:700,border:"none",cursor:"pointer",...style}}>{children}</button>;}
function Tog({label,checked,onChange}){const th=useTh();return<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:12,color:th.muted}}>{label}</span><div onClick={()=>onChange(!checked)} style={{width:36,height:20,borderRadius:99,background:checked?th.accent:th.cardBorder,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{position:"absolute",top:2,left:checked?18:2,width:16,height:16,borderRadius:99,background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px #0004"}}/></div></div>;}
function MaskedNumInp({value,onChange,style={},min=0,max,step,prefix,...rest}){
  const fmtMask=v=>{if(v===""||v===null||v===undefined)return"";const s=String(v);const[int,dec]=s.split(".");const withCommas=int.replace(/\B(?=(\d{3})+(?!\d))/g,",");return dec!==undefined?withCommas+"."+dec:withCommas;};
  const[disp,setDisp]=useState(fmtMask(value));
  useEffect(()=>{setDisp(fmtMask(value));},[value]);
  const handle=e=>{const raw=e.target.value.replace(/,/g,"");if(raw===""){setDisp("");onChange({target:{value:""}});return;}if(!/^-?\d*\.?\d*$/.test(raw))return;setDisp(fmtMask(raw));const n=parseFloat(raw);if(!isNaN(n)){if(max!==undefined&&n>max)return;if(min!==undefined&&n<min&&raw!=="-")return;}onChange({target:{value:raw}});};
  return<input type="text" inputMode="decimal" value={disp} onChange={handle} onFocus={e=>e.target.select()} onKeyDown={bE} style={{...style,MozAppearance:"textfield",appearance:"textfield"}} {...rest}/>;
}

function Kebab({items,label="☰",t}){const th=useTh();const[open,setOpen]=useState(false);const[side,setSide]=useState("right");const ref=useRef();useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);// v0.9.2 — when menu opens, decide whether to anchor right:0 or left:0 based on the button's position in the viewport. Avoids clipping on mobile when the Kebab is in the left half of a row (e.g. ClientList action ☰ at left edge after v0.8.0).
const toggle=()=>{if(!open&&ref.current){const r=ref.current.getBoundingClientRect();const vw=window.innerWidth||document.documentElement.clientWidth;setSide(r.left<vw/2?"left":"right");}setOpen(o=>!o);};return<div ref={ref} style={{position:"relative",display:"inline-block"}}><button onClick={toggle} title={t?.kebabActions||"Actions"} style={{fontSize:16,padding:"5px 12px",borderRadius:8,cursor:"pointer",background:open?th.accent+"22":th.inp,color:open?th.accent:th.muted,border:`1px solid ${open?th.accent:th.cardBorder}`,fontWeight:800,lineHeight:1}}>{label}</button>{open&&<div style={{position:"absolute",top:"calc(100% + 4px)",[side]:0,background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.25)",minWidth:200,zIndex:100,padding:4}}>{items.filter(Boolean).map((it,i)=>it.divider?<div key={i} style={{height:1,background:th.cardBorder,margin:"4px 0"}}/>:<button key={i} onClick={()=>{setOpen(false);it.onClick();}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",background:"transparent",border:"none",color:it.color||th.text,fontSize:12,cursor:"pointer",borderRadius:6,fontWeight:it.bold?700:500}} onMouseEnter={e=>e.currentTarget.style.background=th.inp} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{it.label}</button>)}</div>}</div>;}

function Paginator({total,page,setPage,perPage=10}){const th=useTh();const pages=Math.max(1,Math.ceil(total/perPage));if(pages<=1)return null;const go=p=>setPage(Math.max(1,Math.min(pages,p)));return<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:4,marginTop:10,fontSize:11}}><button onClick={()=>go(page-1)} disabled={page<=1} style={{padding:"4px 10px",borderRadius:6,background:"transparent",border:`1px solid ${th.cardBorder}`,color:page<=1?th.dim:th.muted,cursor:page<=1?"default":"pointer"}}>‹</button>{Array.from({length:Math.min(pages,7)}).map((_,i)=>{let p;if(pages<=7)p=i+1;else if(page<=4)p=i+1;else if(page>=pages-3)p=pages-6+i;else p=page-3+i;return<button key={p} onClick={()=>go(p)} style={{padding:"4px 9px",borderRadius:6,background:page===p?th.accent:"transparent",color:page===p?"#fff":th.muted,border:`1px solid ${page===p?th.accent:th.cardBorder}`,cursor:"pointer",fontWeight:page===p?700:400,minWidth:24}}>{p}</button>;})}<button onClick={()=>go(page+1)} disabled={page>=pages} style={{padding:"4px 10px",borderRadius:6,background:"transparent",border:`1px solid ${th.cardBorder}`,color:page>=pages?th.dim:th.muted,cursor:page>=pages?"default":"pointer"}}>›</button><span style={{color:th.dim,marginLeft:10}}>{total} items</span></div>;}

function YearInp({value,onChange,min=1900,max=2100,style={},...rest}){
  const handle=e=>{const raw=e.target.value.replace(/[^\d]/g,"");if(raw===""){onChange({target:{value:""}});return;}if(raw.length<=4)onChange({target:{value:raw}});};
  return<input type="text" inputMode="numeric" value={value||""} onChange={handle} onFocus={e=>e.target.select()} onKeyDown={bE} maxLength={4} style={style} {...rest}/>;
}


function NumInp({value,onChange,style={},min=0,...rest}){return<input type="number" value={value} onChange={onChange} onFocus={e=>e.target.select()} min={min} style={{...style,MozAppearance:"textfield",appearance:"textfield"}} {...rest}/>;}
function CalcRow({label,value,color,big}){const th=useTh();return<div data-cr-label={typeof label==="string"?label:""} data-cr-value={typeof value==="string"?value:""} data-cr-big={big?"1":""} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${th.cardBorder}`}}><span style={{fontSize:big?14:12,color:th.muted}}>{label}</span><span style={{fontSize:big?16:13,fontWeight:big?800:600,color:color||th.accent}}>{value}</span></div>;}
function CCircle({value,onChange}){const[open,setOpen]=useState(false);const th=useTh();return<div style={{position:"relative"}}><div onClick={()=>setOpen(o=>!o)} style={{width:34,height:34,borderRadius:"50%",background:value,border:"3px solid white",boxShadow:"0 0 0 1px #0004",cursor:"pointer",flexShrink:0}}/>{open&&<><div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:299}}/><div style={{position:"absolute",top:40,left:0,background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:12,padding:10,zIndex:300,boxShadow:"0 16px 40px #000a",width:194}}><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:10}}>{CP.map(c=><div key={c} onClick={()=>{onChange({target:{value:c}});setOpen(false);}} style={{width:28,height:28,borderRadius:"50%",background:c,border:value===c?"3px solid white":"2px solid transparent",cursor:"pointer",boxShadow:"0 0 0 1px #0003"}}/>)}</div><input type="color" value={value} onChange={onChange} style={{width:"100%",height:26,cursor:"pointer",borderRadius:6,border:"none"}}/></div></> }</div>;}
function SSNInput({value,onChange,t}){const[show,setShow]=useState(false);const th=useTh();return<div style={{display:"flex",gap:8,alignItems:"center"}}><input type={show?"text":"password"} value={value} onChange={e=>onChange({target:{value:fmtSSN(e.target.value)}})} style={{...mINP(th),flex:1}} placeholder="###-##-####" maxLength={11}/><button onClick={()=>setShow(s=>!s)} style={{fontSize:11,padding:"6px 10px",borderRadius:7,background:th.inp,color:th.muted,border:`1px solid ${th.inpBorder}`,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{show?t.hideSSN:t.showSSN}</button></div>;}

/* ── MODAL / SAVEBAR / IADD ──────────────────────────────────────────────── */
function Modal({title,onClose,children,width=480,disableBackdropClose=false}){const th=useTh();const{isMobile}=useViewport();
  // v0.13.2 — amend D-27 bottom-sheet to centered modals on mobile per Mauricio's request.
  // Keep mobile-friendly properties: edge padding, smaller max-height for browser chrome,
  // rounded corners all around, downward-pointing shadow.
  return<div onClick={e=>{if(disableBackdropClose)return;if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"#000b",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?12:20}}><div style={{background:th.modal,border:`1px solid ${th.cardBorder}`,borderRadius:16,padding:isMobile?"18px 16px":24,width:"100%",maxWidth:isMobile?"100%":width,maxHeight:isMobile?"85dvh":"90vh",overflowY:"auto",boxShadow:"0 24px 60px #000d"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isMobile?14:20}}><span style={{fontSize:14,fontWeight:700,color:th.text}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",color:th.muted,cursor:"pointer",fontSize:24,lineHeight:1,minWidth:36,minHeight:36,touchAction:"manipulation"}}>×</button></div>{children}</div></div>;}
function SaveBar({onSave,onCancel,onDelete,t,saveLabel}){const[conf,setConf]=useState(false);const th=useTh();return<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20,paddingTop:16,borderTop:`1px solid ${th.cardBorder}`}}><div>{onDelete&&!conf&&<button onClick={()=>setConf(true)} style={{fontSize:12,padding:"6px 14px",borderRadius:8,background:"#EF444422",color:"#EF4444",border:"1px solid #EF444444",cursor:"pointer"}}>{t.deleteLabel}</button>}{onDelete&&conf&&<div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:11,color:"#EF4444"}}>{t.confirmDelete}</span><button onClick={onDelete} style={{fontSize:12,padding:"5px 12px",borderRadius:8,background:"#EF4444",color:"#fff",border:"none",cursor:"pointer"}}>Yes</button><button onClick={()=>setConf(false)} style={{fontSize:12,padding:"5px 12px",borderRadius:8,background:th.cardBorder,color:th.muted,border:"none",cursor:"pointer"}}>No</button></div>}</div><div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{fontSize:12,padding:"7px 16px",borderRadius:8,background:th.inp,color:th.muted,border:`1px solid ${th.cardBorder}`,cursor:"pointer"}}>{t.cancel}</button><BSolid onClick={onSave}>{saveLabel||t.save}</BSolid></div></div>;}
function IAdd({cols,onSave,label="＋ Add row…"}){const th=useTh();const[open,setOpen]=useState(false);const[vals,setVals]=useState({});const u=k=>e=>setVals(p=>({...p,[k]:e.target.value}));const save=()=>{if(onSave(vals)){setVals({});setOpen(false);}};if(!open)return<tr onClick={()=>setOpen(true)} style={{cursor:"pointer"}}><td colSpan={cols.length+1} style={{...mTD(th),color:th.dim,fontStyle:"italic",padding:"8px 0"}}>{label}</td></tr>;return<tr style={{background:th.bg+"88"}}>{cols.map(c=><td key={c.key} style={{...mTD(th),paddingRight:6}}>{c.type==="select"?<select value={vals[c.key]||c.default||""} onChange={u(c.key)} style={{...mIIN(th),padding:"3px 6px"}}>{c.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>:<input type={c.type||"text"} placeholder={c.placeholder||""} value={vals[c.key]||""} onChange={u(c.key)} onKeyDown={c.numeric?bE:undefined} style={mIIN(th)} onKeyUp={e=>e.key==="Enter"&&save()}/>}</td>)}<td style={{...mTDR(th),whiteSpace:"nowrap"}}><button onClick={save} style={{fontSize:12,padding:"3px 10px",borderRadius:6,background:GOLD,color:"#0D1B2A",border:"none",cursor:"pointer",fontWeight:700,marginRight:4}}>✓</button><button onClick={()=>setOpen(false)} style={{fontSize:12,padding:"3px 8px",borderRadius:6,background:th.inp,color:th.muted,border:"none",cursor:"pointer"}}>×</button></td></tr>;}

/* ── PROFILE MODAL ───────────────────────────────────────────────────────── */
/* ── ProfileToggleField — extracted to a stable top-level component so the
   input inside doesn't unmount on every ProfileModal re-render. The previous
   in-body definition caused a one-character-at-a-time typing bug on every
   ToggleField input (company phone, business address, etc.). */
function ProfileToggleField({k,label,s,setS,th,INP}){
  const hasIt=!!s["has_"+k];
  return <div style={{marginBottom:10}}>
    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:hasIt?6:0}}>
      <input type="checkbox" checked={hasIt} onChange={e=>setS(p=>({...p,["has_"+k]:e.target.checked,...(e.target.checked?{}:{[k]:""})}))} style={{cursor:"pointer"}}/>
      <span style={{fontSize:11,color:th.muted,fontWeight:600}}>{label}</span>
    </label>
    {hasIt && <input style={INP} value={s[k]||""} onChange={e=>setS(p=>({...p,[k]:e.target.value}))} placeholder={label}/>}
  </div>;
}


export { BSolid, BootstrapSkeleton, Btn, CCircle, CalcRow, FH, Field, GAIcon, IAdd, InfoTip, Kebab, KpiTile, MaskedNumInp, Modal, NumInp, PTag, Paginator, Pill, ProfileToggleField, Row2, SA, SBadge, SC, SHdr, SSNInput, SaveBar, Skel, Tog, YearInp, _GA_ICONS, useAnimatedDisplay, useSrt, useViewport };
