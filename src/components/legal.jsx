// Extracted from App.jsx in Phase 2b of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-11).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState, useEffect, useRef } from "react";
import { Anchor } from "lucide-react";
import { GOLD } from "../styles/theme";
import { ENGAGEMENT_LETTER, ELT_DEFAULTS, fillTokens } from "../engagementLetterTemplate";

function LogoImg({settings,mode,size,fallbackColor}){
  const logo = mode==="light" ? (settings?.logoLight||"") : (settings?.logoDark||"");
  const px = size||32;
  if(logo) return <img src={logo} alt="Golden Anchor" style={{height:px,width:"auto",maxWidth:px*2,objectFit:"contain",display:"inline-block",verticalAlign:"middle"}}/>;
  const brandSrc = px<=48 ? "/anchor-monogram.svg" : "/logo-anchor.png";
  return <img src={brandSrc} alt="Golden Anchor" style={{height:px,width:"auto",maxWidth:px*2,objectFit:"contain",display:"inline-block",verticalAlign:"middle"}} onError={e=>{e.currentTarget.replaceWith(Object.assign(document.createElement("span"),{textContent:"⚓",style:`color:${fallbackColor||GOLD};font-size:${px}px`}));}}/>;
}

/* ── SignaturePad — Canvas draw OR typed name+date toggle ── */
function SignaturePad({value,onChange,t,theme,label,defaultName,typedOnly=false}){
  // v0.16.1: default mode is "typed" (was "draw").
  // v0.31.0: `typedOnly` collapses the component to a single typed input — no
  // mode toggle, no canvas. Used on the public intake engagement letter where
  // a typed signature is the only legally-defensible flow.
  const [mode,setMode]=useState((value&&value.kind==="drawn"&&!typedOnly)?"draw":"typed");
  const [typed,setTyped]=useState(value?.kind==="typed"?(value.text||""):(value&&typeof value==="string"?value:(defaultName||"")));
  const canvasRef=useRef(null);
  const isDrawingRef=useRef(false);
  const lastRef=useRef(null);
  const TH=theme||{};
  // v0.29.1 — Auto-commit the prefilled `defaultName` to parent state on mount.
  // v0.31.0 — Also re-commit when defaultName changes (e.g. invite-token resolve
  // updates the prospect's name AFTER SignaturePad first mounted). Without this,
  // typed stays empty if defaultName arrived async.
  useEffect(()=>{
    if(mode==="typed"&&!value&&defaultName&&defaultName.trim()){
      if(!typed||!typed.trim())setTyped(defaultName);
      onChange&&onChange({kind:"typed",text:defaultName,signedAt:new Date().toISOString()});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[defaultName]);
  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    const ctx=c.getContext("2d");
    ctx.lineWidth=2; ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.strokeStyle="#0F172A";
    if(value&&value.kind==="drawn"&&value.dataUrl){
      const img=new Image();
      img.onload=()=>{ ctx.clearRect(0,0,c.width,c.height); ctx.drawImage(img,0,0,c.width,c.height); };
      img.src=value.dataUrl;
    }
  },[mode]);
  const getPos=(e)=>{ const c=canvasRef.current; const r=c.getBoundingClientRect(); const sx=c.width/r.width, sy=c.height/r.height; const cx=e.touches?e.touches[0].clientX:e.clientX; const cy=e.touches?e.touches[0].clientY:e.clientY; return {x:(cx-r.left)*sx,y:(cy-r.top)*sy}; };
  const start=(e)=>{ e.preventDefault(); isDrawingRef.current=true; lastRef.current=getPos(e); };
  const move=(e)=>{ if(!isDrawingRef.current) return; e.preventDefault(); const c=canvasRef.current; const ctx=c.getContext("2d"); const p=getPos(e); ctx.beginPath(); ctx.moveTo(lastRef.current.x,lastRef.current.y); ctx.lineTo(p.x,p.y); ctx.stroke(); lastRef.current=p; };
  const end=()=>{ if(!isDrawingRef.current) return; isDrawingRef.current=false; const c=canvasRef.current; const dataUrl=c.toDataURL("image/png"); onChange&&onChange({kind:"drawn",dataUrl,signedAt:new Date().toISOString()}); };
  const clear=()=>{ const c=canvasRef.current; if(!c) return; const ctx=c.getContext("2d"); ctx.clearRect(0,0,c.width,c.height); onChange&&onChange(null); };
  const onTyped=(v)=>{ setTyped(v); onChange&&onChange({kind:"typed",text:v,signedAt:new Date().toISOString()}); };
  return <div style={{border:`1px solid ${TH.cardBorder||"#E2E8F0"}`,borderRadius:10,padding:12,background:TH.card||"#fff"}}>
    {label&&<div style={{fontSize:11,fontWeight:700,color:TH.muted||"#475569",marginBottom:8}}>{label}</div>}
    {!typedOnly&&<div style={{display:"flex",gap:4,marginBottom:8}}>
      <button type="button" onClick={()=>setMode("draw")} style={{flex:1,padding:"6px 10px",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",background:mode==="draw"?(TH.accent||GOLD):"transparent",color:mode==="draw"?"#fff":(TH.muted||"#475569"),border:`1px solid ${mode==="draw"?(TH.accent||GOLD):(TH.cardBorder||"#E2E8F0")}`}}>✍️ {t.sigDrawTab||"Draw signature"}</button>
      <button type="button" onClick={()=>setMode("typed")} style={{flex:1,padding:"6px 10px",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",background:mode==="typed"?(TH.accent||GOLD):"transparent",color:mode==="typed"?"#fff":(TH.muted||"#475569"),border:`1px solid ${mode==="typed"?(TH.accent||GOLD):(TH.cardBorder||"#E2E8F0")}`}}>⌨️ {t.sigTypedTab||"Type name"}</button>
    </div>}
    {mode==="draw"&&!typedOnly?<div>
      <canvas ref={canvasRef} width={500} height={140} style={{width:"100%",height:140,background:"#FFFFFF",border:`1px dashed ${TH.cardBorder||"#CBD5E1"}`,borderRadius:8,touchAction:"none",cursor:"crosshair",display:"block"}} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
        <span style={{fontSize:10,color:TH.dim||"#94A3B8",fontStyle:"italic"}}>{t.sigDrawHint||"Sign with mouse or finger"}</span>
        <button type="button" onClick={clear} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"transparent",color:TH.muted||"#475569",border:`1px solid ${TH.cardBorder||"#E2E8F0"}`,cursor:"pointer"}}>↺ {t.sigClear||"Clear"}</button>
      </div>
    </div>:<div>
      <input value={typed} onChange={e=>onTyped(e.target.value)} placeholder={t.sigTypedPlaceholder||"Type your full legal name"} style={{width:"100%",padding:"10px 12px",fontSize:18,fontFamily:"'Brush Script MT',cursive,serif",fontStyle:"italic",background:"#FFFFFF",border:`1px dashed ${TH.cardBorder||"#CBD5E1"}`,borderRadius:8,color:"#0F172A",outline:"none",boxSizing:"border-box"}}/>
      <div style={{fontSize:10,color:TH.dim||"#94A3B8",marginTop:6,fontStyle:"italic"}}>{t.sigTypedHint||"By typing your name above and submitting, you are signing this document electronically."}</div>
    </div>}
  </div>;
}

/* ── ToSModal — mandatory acceptance gate on first login ── */
function ToSModal({onAccept,onCancel,t,theme}){
  const[checked,setChecked]=useState(false);
  const MONO="'JetBrains Mono',monospace";
  return <div style={{position:"fixed",inset:0,background:theme.bg,display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:14,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
    <div style={{background:theme.card,border:`1px solid ${theme.cardBorder}`,borderRadius:18,padding:"26px 26px 22px",maxWidth:520,width:"100%",boxShadow:"0 24px 70px rgba(0,0,0,0.35)",maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{fontSize:9.5,color:theme.accent,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:12}}>Golden Anchor</div>
      <div style={{fontSize:21,fontWeight:600,color:theme.text,letterSpacing:"-0.02em",marginBottom:14,lineHeight:1.25}}>{t.tosTitle||"Terms of Service & Privacy"}</div>
      <div style={{fontSize:12.5,color:theme.muted,lineHeight:1.7,marginBottom:16,padding:"14px 15px",background:theme.inp,border:`1px solid ${theme.cardBorder}`,borderRadius:12,maxHeight:220,overflowY:"auto"}}>
        <p style={{margin:"0 0 8px"}}>{t.tosBody1||"Welcome. By using this application, you agree to our Terms of Service and Privacy Policy. Golden Anchor provides financial education and coaching. Mauricio Hernandez (FL License FL0215) does not provide investment advisory services, manage securities, or act as a fiduciary unless separately agreed in writing."}</p>
        <p style={{margin:"0 0 4px",fontWeight:600,color:theme.text}}>{t.tosKeyTerms||"Key terms:"}</p>
        <ul style={{margin:"4px 0 0 18px",padding:0}}>
          <li>{t.tosBullet1||"Education and coaching — not investment advice"}</li>
          <li>{t.tosBullet2||"Your data is encrypted and confidential"}</li>
          <li>{t.tosBullet3||"Consult professionals for tax, legal, or investment decisions"}</li>
        </ul>
      </div>
      <label style={{display:"flex",alignItems:"flex-start",gap:11,marginBottom:18,padding:"12px 14px",background:checked?theme.accent+"14":theme.inp,border:`1px solid ${checked?theme.accent:theme.cardBorder}`,borderRadius:12,cursor:"pointer",transition:"border-color .15s,background .15s"}}>
        <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} style={{width:18,height:18,cursor:"pointer",marginTop:1,flexShrink:0,accentColor:GOLD}}/>
        <span style={{fontSize:12.5,color:theme.text,lineHeight:1.5}}>{t.tosAcceptMsg||"I have read and accept the Terms of Service and Privacy Policy"}</span>
      </label>
      <div style={{display:"flex",gap:9}}>
        <button type="button" onClick={onCancel} style={{flex:1,padding:"13px 16px",borderRadius:10,fontWeight:600,fontSize:12.5,cursor:"pointer",background:"transparent",color:theme.muted,border:`1px solid ${theme.cardBorder}`,minHeight:48,fontFamily:"inherit"}}>{t.tosRejectBtn||"Cancel"}</button>
        <button type="button" className="ga-press" onClick={()=>{ if(checked) onAccept(); }} style={{flex:1.4,padding:"13px 16px",borderRadius:10,fontWeight:700,fontSize:13,cursor:checked?"pointer":"not-allowed",background:checked?"linear-gradient(180deg,#EBD089 0%,#C9A84C 52%,#B58E1C 100%)":theme.cardBorder,color:checked?"#1A1405":theme.dim,border:"none",opacity:checked?1:0.55,minHeight:48,touchAction:"manipulation",fontFamily:"inherit",boxShadow:checked?"inset 0 1px 0 rgba(255,255,255,0.32)":"none"}}>{t.tosAcceptBtn||"Accept & Continue"}</button>
      </div>
    </div>
  </div>;
}

/* ── EngagementLetter — renders the full letter with token substitution.
   Section 4 (Compensation & Fees) shows the selected service price.        */
function EngagementLetter({settings,clientName1,clientName2,selectedService,lang,t,theme,signatureClient1,signatureClient2,onSig1,onSig2,readOnly}){
  const TH=theme;
  const L=ENGAGEMENT_LETTER[lang]||ENGAGEMENT_LETTER.en;
  const today=new Date().toLocaleDateString(lang==="es"?"es-US":"en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const greetNames=[clientName1,clientName2].filter(s=>!!s&&s.trim()).join(" & ");
  const greeting = `${lang==="es"?"Estimado/a":"Dear"} ${greetNames||"___________"},`;
  const ctx={
    date: today,
    firmName: settings.companyName || "Golden Anchor Financial Planning & Wealth Management",
    firmPhone: settings.companyPhone || settings.advisorPhone || "(305) 490-6868",
    firmEmail: settings.advisorEmail || "mauricio@goldenanchor.life",
    firmTagline: ELT_DEFAULTS.firmTagline,
    advisorName: settings.advisorName || "Mauricio Hernandez",
    clientGreeting: greeting,
    selectedServiceName: selectedService?.name || "—",
    selectedServicePrice: selectedService?.price || "—",
    ongoingFeeAmount: settings.ongoingFeeAmount || ELT_DEFAULTS.ongoingFeeAmount,
    ongoingFeeMonthlyLite: settings.ongoingFeeMonthlyLite || ELT_DEFAULTS.ongoingFeeMonthlyLite,
    aumPct: settings.aumPct || ELT_DEFAULTS.aumPct,
    aumFrequency: settings.aumFrequency || ELT_DEFAULTS.aumFrequency
  };
  const fill=(s)=>fillTokens(s,ctx);
  const isCouple=!!(clientName2&&clientName2.trim());
  return <div style={{background:"#FFFFFF",color:"#0F172A",padding:"28px 26px",borderRadius:12,fontFamily:"Georgia,serif",lineHeight:1.6,fontSize:13}}>
    {/* Header: advisor name on top, company name below, then contact line (no labels) */}
    <div style={{textAlign:"center",borderBottom:"2px solid #D4A017",paddingBottom:16,marginBottom:18}}>
      <div style={{marginBottom:8}}><LogoImg settings={settings} mode="light" size={56}/></div>
      <div style={{fontSize:24,fontWeight:800,color:"#1F2937",letterSpacing:"0.01em"}}>{ctx.advisorName}</div>
      <div style={{fontSize:14,color:"#475569",marginTop:4}}>{ctx.firmName}</div>
      <div style={{fontSize:13,fontStyle:"italic",color:"#64748B",marginTop:6}}>{L.headerSub}</div>
    </div>
    {/* Contact line — phone · email, no labels */}
    <div style={{textAlign:"center",fontSize:12,color:"#475569",marginBottom:14}}>
      {[ctx.firmPhone, ctx.firmEmail].filter(v=>v&&v!=="—").join(" · ")}
      {ctx.firmTagline && <div style={{fontSize:12,fontStyle:"italic",color:"#94A3B8",marginTop:4}}>{ctx.firmTagline}</div>}
    </div>
    <div style={{fontSize:12,marginBottom:16,fontWeight:600}}>{fill(L.dateLabel)}</div>
    {/* Greeting */}
    <div style={{fontSize:14,marginBottom:12,fontWeight:600}}>{fill(L.greeting)}</div>
    <div style={{marginBottom:12,textAlign:"justify"}}>{L.intro}</div>
    <div style={{marginBottom:14,textAlign:"justify"}}>{L.introCarefully}</div>
    <div style={{marginBottom:6}}>{L.sincerely}</div>
    {/* Advisor signature — v0.31.0 hardened against legacy formats:
       - Legacy strings starting with "data:" or "http" → drawn image
       - Other strings → treated as typed text (was breaking on "Mauricio Hernandez")
       - Empty/null → fall back to advisor name as a typed cursive render so the letter
         always shows SOMETHING (better than placeholder when the advisor's saved sig is mid-migration) */}
    <div style={{marginBottom:24,paddingBottom:6,borderBottom:`1px solid #94A3B855`,minHeight:60}}>
      {(() => {
        const sig = settings.advisorSignature;
        const advisorName = settings.advisorName || ctx.advisorName || "";
        // Empty signature — render advisor name in cursive as a defensible fallback
        if (!sig) {
          return advisorName
            ? <span style={{fontSize:26,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A"}}>{advisorName}</span>
            : <span style={{color:"#94A3B8",fontStyle:"italic"}}>{t.advisorSigPending||"(advisor signature)"}</span>;
        }
        if (typeof sig === "string") {
          if (sig.startsWith("data:") || sig.startsWith("http")) {
            return <img src={sig} alt="advisor signature" style={{height:50,maxWidth:240,objectFit:"contain"}}/>;
          }
          // Legacy: plain string was the typed name. Render in cursive.
          return <span style={{fontSize:26,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A"}}>{sig}</span>;
        }
        if (sig.kind === "drawn" && sig.dataUrl) return <img src={sig.dataUrl} alt="advisor signature" style={{height:50,maxWidth:240,objectFit:"contain"}}/>;
        if (sig.kind === "typed" && sig.text) return <span style={{fontSize:26,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A"}}>{sig.text}</span>;
        return advisorName
          ? <span style={{fontSize:26,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A"}}>{advisorName}</span>
          : <span style={{color:"#94A3B8",fontStyle:"italic"}}>{t.advisorSigPending||"(advisor signature)"}</span>;
      })()}
    </div>
    <div style={{fontSize:13,fontWeight:700,marginBottom:24,paddingTop:0}}>{fill(L.signatureLine)}</div>
    {/* Sections */}
    {L.sections.map(sec=><div key={sec.n} style={{marginBottom:18,pageBreakInside:"avoid"}}>
      <div style={{fontSize:14,fontWeight:800,color:"#1F2937",marginBottom:8,borderBottom:"1px solid #E2E8F0",paddingBottom:4}}>{sec.n}. {sec.title}</div>
      {sec.body && <div style={{marginBottom:8,textAlign:"justify"}}>{sec.body}</div>}
      {sec.sub && sec.sub.map((sb,i)=><div key={i} style={{marginBottom:10,paddingLeft:8}}>
        <div style={{fontWeight:700,marginBottom:4,fontSize:13}}>{sb.t}</div>
        {sb.b && <div style={{marginBottom:6}}>{sb.b}</div>}
        {sb.list && <ul style={{margin:"0 0 6px 18px",padding:0}}>{sb.list.map((li,j)=><li key={j} style={{marginBottom:4}}>{li}</li>)}</ul>}
        {sb.after && <div style={{marginTop:6}}>{sb.after}</div>}
      </div>)}
      {sec.steps && <ol style={{margin:"6px 0 0 22px",padding:0}}>{sec.steps.map((st,i)=><li key={i} style={{marginBottom:6}}><b>{st[0]}.</b> {st[1]}</li>)}</ol>}
      {sec.list && <ul style={{margin:"4px 0 0 18px",padding:0}}>{sec.list.map((li,j)=><li key={j} style={{marginBottom:4}}>{li}</li>)}</ul>}
      {sec.kind==="section4" && sec.section4 && <div style={{margin:"8px 0",padding:"12px 14px",background:"#FEF9E7",border:"1px solid #F0D870",borderRadius:8}}>
        <div style={{marginBottom:8}}>
          <div style={{fontWeight:700}}>{sec.section4.planLabel}: <span style={{color:"#92400E"}}>{ctx.selectedServiceName} — {ctx.selectedServicePrice}</span></div>
          <div style={{fontSize:12,fontStyle:"italic",color:"#475569",marginLeft:8,marginTop:2}}>{sec.section4.planNote}</div>
        </div>
        <div style={{marginBottom:8}}><b>{sec.section4.ongoingLabel}:</b> {fill(sec.section4.ongoingValue)}</div>
        <div><b>{sec.section4.referralLabel}:</b> {sec.section4.referralValue}</div>
      </div>}
      {sec.after && <div style={{marginTop:8,fontStyle:"italic",fontSize:12}}>{sec.after}</div>}
    </div>)}
    {/* Client signatures */}
    <div style={{marginTop:28,paddingTop:18,borderTop:"2px solid #D4A017"}}>
      <div style={{fontSize:14,fontWeight:800,marginBottom:14,color:"#1F2937"}}>{t.clientSignaturesHdr||"Client Signature(s)"}</div>
      {!readOnly && <>
        <div style={{marginBottom:14}}>
          {/* v0.31.0 — Inline the typed signature in the "Client signature: <name>" label.
             When the prospect types their name, it shows in cursive on the bar above the SignaturePad. */}
          <div style={{fontSize:12,fontWeight:700,marginBottom:6,display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
            <span>{t.clientSig1Label||"Client signature"}:</span>
            {signatureClient1?.kind==="typed"&&signatureClient1.text
              ? <span style={{fontSize:22,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A",fontWeight:400,lineHeight:1.1}}>{signatureClient1.text}</span>
              : <span style={{color:"#94A3B8",fontStyle:"italic"}}>{clientName1||"___________"}</span>}
          </div>
          <SignaturePad value={signatureClient1} onChange={onSig1} t={t} theme={TH} defaultName={clientName1} typedOnly={true}/>
        </div>
        {isCouple && <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:6,display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
            <span>{t.clientSig2Label||"Co-client signature"}:</span>
            {signatureClient2?.kind==="typed"&&signatureClient2.text
              ? <span style={{fontSize:22,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif",color:"#0F172A",fontWeight:400,lineHeight:1.1}}>{signatureClient2.text}</span>
              : <span style={{color:"#94A3B8",fontStyle:"italic"}}>{clientName2||"___________"}</span>}
          </div>
          <SignaturePad value={signatureClient2} onChange={onSig2} t={t} theme={TH} defaultName={clientName2} typedOnly={true}/>
        </div>}
      </>}
      {readOnly && <>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#475569"}}>{clientName1||"—"}</div>
          {signatureClient1?.kind==="drawn" && <img src={signatureClient1.dataUrl} alt="sig" style={{height:48,maxWidth:240,border:"1px solid #E2E8F0",borderRadius:6,padding:4,background:"#FFF"}}/>}
          {signatureClient1?.kind==="typed" && <div style={{fontSize:22,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif"}}>{signatureClient1.text}</div>}
          {signatureClient1?.signedAt && <div style={{fontSize:10,color:"#64748B",marginTop:2}}>{(t.signedAtLbl||"Signed")}: {new Date(signatureClient1.signedAt).toLocaleString()}</div>}
        </div>
        {isCouple && <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#475569"}}>{clientName2}</div>
          {signatureClient2?.kind==="drawn" && <img src={signatureClient2.dataUrl} alt="sig2" style={{height:48,maxWidth:240,border:"1px solid #E2E8F0",borderRadius:6,padding:4,background:"#FFF"}}/>}
          {signatureClient2?.kind==="typed" && <div style={{fontSize:22,fontStyle:"italic",fontFamily:"'Brush Script MT',cursive,serif"}}>{signatureClient2.text}</div>}
          {signatureClient2?.signedAt && <div style={{fontSize:10,color:"#64748B",marginTop:2}}>{(t.signedAtLbl||"Signed")}: {new Date(signatureClient2.signedAt).toLocaleString()}</div>}
        </div>}
      </>}
    </div>
  </div>;
}




/* ── IntakeFormBody — shared editor body used by PublicIntake step 4 and
   IntakeSubmissionEditor modal. Wraps the income/bills/debt/customAssets/
   notes editors against a client-shaped draft, plus SSN + DOB + address +
   how-heard fields. Restored in v0.15.1 — the component was referenced
   since v0.7.1 but never defined (production bug: step 4 went blank). */

export { EngagementLetter, LogoImg, SignaturePad, ToSModal };
