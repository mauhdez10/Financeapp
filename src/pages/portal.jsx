// Extracted from App.jsx in Phase 2b of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-11).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState, useEffect } from "react";
import { Anchor } from "lucide-react";
import { GOLD, makeDark, makeLight, mINP, mCARD } from "../styles/theme";
import { ThemeCtx, useTh, HideCtx } from "../contexts/theme";
import { _gaLang } from "../constants/meta";
import { fmtDate, fmt, vEmail, sumB, sumN, sumMin, totalA, totalL, liquidA } from "../utils/finance";
import { Donut, Waterfall, SmoothAreaLine, RadialGauge } from "../components/charts";
import { SC, Modal } from "../components/primitives";
import { supabase, gaResolvePortal, gaListPortalLinks, gaCreatePortalLink, gaSendPortalLink, gaRevokePortalLink } from "../services/supabase";

function PortalShareModal({client,settings,t,onClose}){
  const th=useTh();
  const[uid,setUid]=useState(null);
  const[links,setLinks]=useState([]);
  const[busy,setBusy]=useState(false);
  const[copied,setCopied]=useState(false);
  const[err,setErr]=useState("");
  const[expiry,setExpiry]=useState("never");
  const[mods,setMods]=useState({cashflow:true,assets:true,trend:true,ef:true,goals:true});
  const[emailBusy,setEmailBusy]=useState(false);
  const[emailOk,setEmailOk]=useState(null); // null | true | "error text"
  const localId=String(client.id);
  const reload=async(userId)=>{const ls=await gaListPortalLinks(userId,localId);setLinks((ls||[]).filter(l=>!l.revoked));};
  useEffect(()=>{(async()=>{try{const{data}=await supabase.auth.getUser();const u=data&&data.user&&data.user.id;setUid(u||null);if(u)await reload(u);}catch(e){}})();},[]);
  const active=links[0]||null;
  const urlFor=tok=>(typeof window!=="undefined"?window.location.origin:"")+"/portal?token="+tok;
  const MODS=[["cashflow",t.modCashflow||"Cash flow"],["assets",t.modAssets||"Assets"],["trend",t.modTrend||"Debt & savings trend"],["ef",t.modEf||"Emergency fund"],["goals",t.modGoals||"Goals"]];
  const gen=async()=>{if(!uid){setErr("Not signed in. Please reload.");return;}setBusy(true);setErr("");setEmailOk(null);for(const l of links){await gaRevokePortalLink(l.id);}const expiresAt=expiry==="never"?null:new Date(Date.now()+(+expiry)*864e5).toISOString();const r=await gaCreatePortalLink(uid,localId,{expiresAt,modules:mods});if(!r.ok){setErr(r.error||"Failed to create link.");setBusy(false);return;}await reload(uid);setBusy(false);};
  const revoke=async(id)=>{await gaRevokePortalLink(id);setEmailOk(null);if(uid)await reload(uid);};
  const copy=async(tok)=>{try{await navigator.clipboard.writeText(urlFor(tok));setCopied(true);setTimeout(()=>setCopied(false),1500);}catch(e){}};
  const canEmail=vEmail(client.email||"");
  const emailIt=async()=>{if(!active||!canEmail)return;setEmailBusy(true);setEmailOk(null);const r=await gaSendPortalLink({to:client.email,token:active.token,clientName:client.firstName||"",advisorName:(settings&&settings.advisorName)||"",lang:_gaLang()});setEmailBusy(false);setEmailOk(r.ok?true:(r.error||"Send failed"));};
  return <Modal title={t.sharePortal||"Share portal"} onClose={onClose} width={520}>
    <div style={{fontSize:12.5,color:th.muted,lineHeight:1.6,marginBottom:16}}>{t.portalModalDesc||"Generate a private, read-only link to this client's financial overview. They can open it without a password. You can revoke it anytime."}</div>
    {active?<div style={{...mCARD(th),padding:16,marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:700,color:th.dim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{t.portalActiveHdr||"Active link"}{active.expires_at&&<span style={{marginLeft:8,color:th.warn,textTransform:"none",letterSpacing:0}}>{(t.portalExpires||"expires")+" "+fmtDate(active.expires_at,_gaLang())}</span>}</div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <input readOnly value={urlFor(active.token)} onFocus={e=>e.target.select()} style={{...mINP(th),flex:1,minWidth:200,fontSize:11.5,fontFamily:"'JetBrains Mono',monospace"}}/>
        <button onClick={()=>copy(active.token)} style={{padding:"9px 15px",borderRadius:8,background:th.accent,color:"#1A1405",border:"none",fontWeight:700,fontSize:12,cursor:"pointer"}}>{copied?(t.portalCopiedMsg||"Copied"):(t.portalCopyBtn||"Copy")}</button>
      </div>
      <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
        <button onClick={()=>window.open(urlFor(active.token),"_blank","noopener")} style={{flex:1,minWidth:150,fontSize:12,padding:"9px 12px",borderRadius:8,background:"transparent",color:th.text,border:"1px solid "+th.cardBorder,cursor:"pointer",fontWeight:600}}>{t.portalPreviewBtn||"Preview as client"}</button>
        <button onClick={emailIt} disabled={emailBusy||!canEmail} title={canEmail?"":(t.portalNoEmail||"Client has no email on file")} style={{flex:1,minWidth:150,fontSize:12,padding:"9px 12px",borderRadius:8,background:canEmail?th.accent+"18":th.inp,color:canEmail?th.accent:th.dim,border:"1px solid "+(canEmail?th.accent+"44":th.cardBorder),cursor:emailBusy?"wait":(canEmail?"pointer":"not-allowed"),fontWeight:700}}>{emailBusy?"…":(t.portalEmailBtn||"Email link to client")}</button>
      </div>
      {emailOk!==null&&<div style={{fontSize:11,color:emailOk===true?th.pos:th.neg,marginTop:8}}>{emailOk===true?(t.portalEmailSent||"Sent — the client has the link."):emailOk}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
        <span style={{fontSize:10.5,color:th.dim}}>{(active.view_count||0)} {t.portalViewsLbl||"views"}</span>
        <button onClick={()=>revoke(active.id)} style={{fontSize:11,padding:"5px 12px",borderRadius:7,background:"transparent",color:th.neg,border:"1px solid rgba(248,113,113,0.4)",cursor:"pointer",fontWeight:600}}>{t.portalRevokeBtn||"Revoke"}</button>
      </div>
    </div>:<div style={{fontSize:12,color:th.dim,fontStyle:"italic",marginBottom:14}}>{t.portalNoneYet||"No active link yet."}</div>}
    <div style={{...mCARD(th),padding:14,marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:700,color:th.dim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>{t.portalNextLinkHdr||"Next link options"}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:12}}>
        <span style={{fontSize:12,color:th.muted}}>{t.portalExpiryLbl||"Link expires"}</span>
        <select value={expiry} onChange={e=>setExpiry(e.target.value)} style={{...mINP(th),width:150,padding:"7px 10px",fontSize:12}}>
          <option value="never">{t.expNever||"Never"}</option>
          <option value="30">{t.exp30||"In 30 days"}</option>
          <option value="90">{t.exp90||"In 90 days"}</option>
        </select>
      </div>
      <div style={{fontSize:12,color:th.muted,marginBottom:8}}>{t.portalModulesLbl||"Visible sections"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {MODS.map(([k,l])=><label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:th.text,cursor:"pointer"}}><input type="checkbox" checked={mods[k]!==false} onChange={e=>setMods(p=>({...p,[k]:e.target.checked}))} style={{accentColor:th.accent,cursor:"pointer"}}/>{l}</label>)}
      </div>
    </div>
    {err&&<div style={{fontSize:11,color:th.neg,marginBottom:10}}>{err}</div>}
    <button onClick={gen} disabled={busy} style={{width:"100%",padding:"12px",borderRadius:10,background:active?"transparent":th.accent,color:active?th.accent:"#1A1405",border:active?"1px solid "+th.accent+"66":"none",fontWeight:700,fontSize:13,cursor:busy?"wait":"pointer"}}>{busy?"…":(active?(t.portalRegenBtn||"Generate new link"):(t.portalGenerateBtn||"Generate portal link"))}</button>
  </Modal>;
}

function PublicPortal(){
  const[mode,setMode]=useState(()=>{try{return localStorage.getItem("ga_portal_mode")||"light";}catch{return "light";}});
  const[lang,setLang]=useState("en");
  const[st,setSt]=useState({loading:true,error:"",client:null,advisor:null,modules:null});
  const isDark=mode==="dark";
  useEffect(()=>{(async()=>{
    const params=new URLSearchParams(window.location.search);
    const token=params.get("token")||((window.location.pathname.match(/\/portal\/([^/?]+)/)||[])[1])||"";
    if(!token){setSt({loading:false,error:"missing",client:null,advisor:null});return;}
    const r=await gaResolvePortal(token);
    if(!r.ok){setSt({loading:false,error:r.error||"failed",client:null,advisor:null});return;}
    setSt({loading:false,error:"",client:r.client||{},advisor:r.advisor||{},modules:r.modules||null});
    if(r.lang==="es"||r.lang==="en")setLang(r.lang);
  })();},[]);
  useEffect(()=>{try{localStorage.setItem("ga_portal_mode",mode);}catch(e){}if(typeof document!=="undefined"){const b=isDark?"#0C0D11":"#F5F3EF";document.documentElement.style.background=b;document.body.style.background=b;}},[mode,isDark]);
  const adv=st.advisor||{};
  const th=isDark?makeDark(adv.darkAccent||GOLD):makeLight(adv.lightAccent||"#C9A84C");
  const L=(en,es)=>lang==="es"?es:en;
  const MONO="'JetBrains Mono',ui-monospace,monospace";
  const Toggles=()=><div style={{display:"flex",gap:8,alignItems:"center"}}>
    <div style={{display:"flex",border:"1px solid "+th.cardBorder,borderRadius:8,overflow:"hidden"}}>{["en","es"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"5px 11px",fontSize:11,fontWeight:700,background:lang===l?th.accent+"22":"transparent",color:lang===l?th.accent:th.muted,border:"none",cursor:"pointer",letterSpacing:"0.05em",textTransform:"uppercase"}}>{l}</button>)}</div>
    <button onClick={()=>setMode(isDark?"light":"dark")} style={{background:"transparent",color:th.muted,border:"1px solid "+th.cardBorder,borderRadius:8,padding:"5px 11px",fontSize:12,cursor:"pointer"}}>{isDark?L("Light","Claro"):L("Dark","Oscuro")}</button>
  </div>;
  const Shell=({children})=><ThemeCtx.Provider value={th}><HideCtx.Provider value={{hide:false}}><div className="ga-np" style={{minHeight:"100vh",background:th.bg,color:th.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}><style>{`@media(max-width:760px){.ga-portal-kpi{grid-template-columns:repeat(2,minmax(0,1fr))!important}.ga-portal-2{grid-template-columns:1fr!important}}`}</style>{children}</div></HideCtx.Provider></ThemeCtx.Provider>;

  if(st.loading)return <Shell><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",fontSize:13,color:th.muted}}>{L("Loading your overview…","Cargando tu resumen…")}</div></Shell>;
  if(st.error||!st.client){const msg=st.error==="missing"?L("This link is missing its token.","A este enlace le falta el token."):L("This portal link is invalid, revoked, or expired. Please ask your advisor for a new link.","Este enlace del portal es inválido, revocado o expiró. Pide a tu asesor un enlace nuevo.");return <Shell><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24}}><div style={{...mCARD(th),padding:30,maxWidth:420,textAlign:"center"}}><img src="/anchor-monogram.svg" style={{width:44,height:44,marginBottom:14,opacity:0.85}} alt=""/><div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{L("Portal unavailable","Portal no disponible")}</div><div style={{fontSize:12.5,color:th.muted,lineHeight:1.6}}>{msg}</div></div></div></Shell>;}

  const c=st.client;
  const showMod=k=>!st.modules||st.modules[k]!==false;
  const income=Math.round(sumN(c.incomeStreams)),bills=Math.round(sumB(c.bills)),minPay=Math.round(sumMin(c.cards));
  const debt=Math.round(totalL(c)),assets=Math.round(totalA(c)),net=assets-debt,liquid=Math.round(liquidA(c));
  const leftover=income-bills-minPay;
  const efMonths=+c.efMonths||3,efTarget=bills*efMonths;
  const cash=Math.round((c.accounts||[]).reduce((s,a)=>s+(+a.value||0),0));
  const invest=Math.round((c.marketInvestments||[]).reduce((s,a)=>s+(+a.value||0),0));
  const propV=Math.round([].concat(c.customAssets||[],c.properties||[]).reduce((s,a)=>s+(+a.value||0),0));
  const assetSlices=[{label:L("Cash & accounts","Efectivo y cuentas"),value:cash,color:th.pos},{label:L("Investments","Inversiones"),value:invest,color:th.accent},{label:L("Property & assets","Propiedad y bienes"),value:propV,color:th.blue||th.warn}].filter(x=>x.value>0);
  const snaps=Array.isArray(c.monthSnapshots)?c.monthSnapshots:[];
  const trend=snaps.slice(-6).map(x=>({label:String(x.label||"").split(" ")[0],debt:Math.round(+x.debt||0),savings:Math.round(+x.savings||0)}));
  trend.push({label:L("Now","Hoy"),debt:debt,savings:liquid});
  const g=c.notes||{};
  const hasGoals=g.goals||g.shortTerm||g.midTerm||g.longTerm;
  const logo=isDark?adv.logoDark:adv.logoLight;
  const wf=[{label:L("Income","Ingresos"),value:income,color:th.pos},{label:L("Bills","Gastos"),value:-bills,color:th.neg},{label:L("Debt pay","Pago deuda"),value:-minPay,color:th.warn},{label:L("Leftover","Sobrante"),kind:"total",color:th.accent}];
  const Card=({children,style})=><div className="ga-lift" style={{...mCARD(th),padding:18,...style}}>{children}</div>;
  const Eyebrow=({children})=><div style={{fontSize:10,fontWeight:600,letterSpacing:"0.14em",color:th.dim,fontFamily:MONO,textTransform:"uppercase",marginBottom:12}}>{children}</div>;

  return <Shell>
    <header style={{padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid "+th.cardBorder,flexWrap:"wrap",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:11}}>
        {logo?<img src={logo} alt="" style={{height:30,maxWidth:160,objectFit:"contain"}}/>:<><div style={{width:32,height:32,borderRadius:9,background:th.accent+"18",border:"1px solid "+th.accent+"33",display:"flex",alignItems:"center",justifyContent:"center"}}><img src="/anchor-monogram.svg" style={{width:18,height:18}} alt=""/></div><div><div style={{fontWeight:700,fontSize:14,color:th.text}}>{adv.companyName||adv.advisorName||"Golden Anchor"}</div><div style={{fontSize:8.5,color:th.dim,fontFamily:MONO,letterSpacing:"0.14em",textTransform:"uppercase"}}>{L("Financial Advisory","Asesoría Financiera")}</div></div></>}
      </div>
      <Toggles/>
    </header>
    <main style={{maxWidth:1080,margin:"0 auto",padding:"28px 24px 60px"}}>
      <div className="ga-rise" style={{marginBottom:26}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.18em",color:th.dim,fontFamily:MONO,textTransform:"uppercase",marginBottom:9}}>{L("Your financial overview","Tu resumen financiero")}</div>
        <h1 style={{margin:0,fontSize:"clamp(24px,4vw,34px)",fontWeight:800,letterSpacing:"-0.02em",color:th.text}}>{L("Hi","Hola")}{c.firstName?", "+c.firstName:""}.</h1>
        <p style={{fontSize:13,color:th.muted,lineHeight:1.6,maxWidth:560,marginTop:10}}>{L("A read-only snapshot prepared by your advisor","Un resumen de solo lectura preparado por tu asesor")}{adv.advisorName?" "+adv.advisorName:""}.</p>
      </div>
      <div className="ga-portal-kpi" style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12,marginBottom:14}}>
        <SC label={L("Monthly income","Ingreso mensual")} value={fmt(income)} color={th.pos}/>
        <SC label={L("Monthly bills","Gastos mensuales")} value={fmt(bills)} color={th.neg}/>
        <SC label={L("Total debt","Deuda total")} value={fmt(debt)} color={th.neg}/>
        <SC label={L("Net worth","Patrimonio neto")} value={fmt(net)} color={net>=0?th.pos:th.neg}/>
      </div>
      <div className="ga-portal-2" style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:14,marginBottom:14}}>
        {showMod("cashflow")&&<Card><Eyebrow>{L("Monthly cash flow","Flujo mensual")}</Eyebrow><div style={{width:"100%",overflowX:"auto"}}><Waterfall segments={wf} height={190} width={560}/></div><div style={{fontSize:11.5,color:leftover>=0?th.pos:th.neg,marginTop:8,fontWeight:600}}>{leftover>=0?L("You keep","Te queda")+" "+fmt(leftover)+L("/mo","/mes"):L("Shortfall of","Déficit de")+" "+fmt(-leftover)+L("/mo","/mes")}</div></Card>}
        {showMod("assets")&&<Card><Eyebrow>{L("Where your money is","Dónde está tu dinero")}</Eyebrow>{assetSlices.length?<div style={{display:"flex",justifyContent:"center"}}><Donut data={assetSlices} size={168} centerLabel={L("Assets","Activos")} centerValue={fmt(assets)} centerColor={th.text}/></div>:<div style={{fontSize:12,color:th.dim,fontStyle:"italic",padding:20,textAlign:"center"}}>{L("No assets recorded yet.","Aún no hay activos.")}</div>}<div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>{assetSlices.map(x=><div key={x.label} style={{display:"flex",alignItems:"center",gap:8,fontSize:11.5}}><span style={{width:8,height:8,borderRadius:99,background:x.color,flexShrink:0}}/><span style={{color:th.muted,flex:1}}>{x.label}</span><span style={{fontFamily:MONO,color:th.text,fontWeight:600}}>{fmt(x.value)}</span></div>)}</div></Card>}
      </div>
      <div className="ga-portal-2" style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:14,marginBottom:14}}>
        {showMod("trend")&&<Card><Eyebrow>{L("Debt vs. savings trend","Deuda vs. ahorro")}</Eyebrow>{trend.length>=2?<div style={{width:"100%",overflowX:"auto"}}><SmoothAreaLine data={trend} height={190} debtColor={th.neg} savingsColor={th.pos} legendDebt={L("Debt","Deuda")} legendSav={L("Savings","Ahorro")}/></div>:<div style={{fontSize:12,color:th.dim,fontStyle:"italic",padding:20,textAlign:"center"}}>{L("Trend appears after a few monthly check-ins.","La tendencia aparece tras varias revisiones.")}</div>}</Card>}
        {showMod("ef")&&<Card style={{display:"flex",flexDirection:"column"}}><Eyebrow>{L("Emergency fund","Fondo de emergencia")}</Eyebrow><div style={{display:"flex",justifyContent:"center",flex:1,alignItems:"center"}}><RadialGauge value={liquid} max={Math.max(1,efTarget)} label={L("Saved","Ahorrado")} subLabel={efMonths+L("-mo target","-mes meta")} color={th.pos} fmt={v=>fmt(v)}/></div><div style={{fontSize:11,color:th.muted,textAlign:"center"}}>{fmt(liquid)} {L("of","de")} {fmt(efTarget)} {L("target","meta")}</div></Card>}
      </div>
      {showMod("goals")&&hasGoals&&<Card style={{marginBottom:14}}><Eyebrow>{L("Your goals","Tus metas")}</Eyebrow><div className="ga-portal-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[[L("Focus","Enfoque"),g.goals],[L("Short term","Corto plazo"),g.shortTerm],[L("Mid term","Mediano plazo"),g.midTerm],[L("Long term","Largo plazo"),g.longTerm]].filter(x=>x[1]).map(x=><div key={x[0]} style={{padding:"12px 14px",background:th.bg,border:"1px solid "+th.cardBorder,borderRadius:10}}><div style={{fontSize:10,fontWeight:700,color:th.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>{x[0]}</div><div style={{fontSize:12.5,color:th.muted,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{x[1]}</div></div>)}</div></Card>}
      <div style={{marginTop:26,paddingTop:18,borderTop:"1px solid "+th.cardBorder,fontSize:11,color:th.dim,lineHeight:1.7,textAlign:"center"}}>
        <div>{L("Educational financial coaching only — not investment, legal, or tax advice.","Solo coaching financiero educativo — no es asesoría de inversión, legal ni fiscal.")}</div>
        {adv.advisorEmail&&<div style={{marginTop:6}}>{L("Questions? Contact","¿Preguntas? Contacta")} <a href={"mailto:"+adv.advisorEmail} style={{color:th.accent,fontWeight:600,textDecoration:"none"}}>{adv.advisorEmail}</a></div>}
        <div style={{marginTop:10,fontFamily:MONO,letterSpacing:"0.1em",opacity:0.7}}>GOLDEN ANCHOR</div>
      </div>
    </main>
  </Shell>;
}


export { PortalShareModal, PublicPortal };
