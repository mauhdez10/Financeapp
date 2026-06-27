// Extracted from App.jsx in Phase 2b of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-11).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState, useEffect, Fragment } from "react";
import { Anchor, Archive, Phone } from "lucide-react";
import { GOLD, mCARD } from "../styles/theme";
import { ThemeCtx, useTh } from "../contexts/theme";
import { SVCS, _gaLang } from "../constants/meta";
import { gid, mk, mig, vEmail, fmtPh, fmtSSN } from "../utils/finance";
import { Pill, Field, useViewport, Btn, BSolid, Modal, SaveBar } from "../components/primitives";
import { gaLoadIntakeSubmissions, gaSubmitIntake, gaUpdateIntakeStatus, gaUpdateIntakeData, gaDeleteIntakeSubmission, gaDeleteIntakeSubmissionsByStatus, gaSendIntakeInvite, gaResolveIntakeInvite, gaMarkIntakeInviteSubmitted } from "../services/supabase";
import { EngagementLetter } from "../components/legal";
import { T } from "../translations";

function IntakeFormBody({draft,setDraft,t,TH,lang}){
  const INP={width:"100%",padding:"10px 12px",background:TH.inp,border:"1px solid "+TH.inpBorder,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"};
  const LBL={fontSize:11,color:TH.muted,marginBottom:4,fontWeight:600};
  const Div=()=><div style={{height:1,background:TH.cardBorder,margin:"22px 0"}}/>;
  const up=k=>e=>setDraft(d=>({...d,[k]:e.target.value}));
  const hasP2=!!(draft.partnerFirst&&String(draft.partnerFirst).trim());
  return <ThemeCtx.Provider value={TH}>
    <div style={{fontSize:13,fontWeight:700,color:TH.text,marginBottom:8}}>{t.personalInfoHdr||"Personal information"}</div>
    <div style={{marginBottom:10}}><div style={LBL}>{t.address||"Address"}</div><input style={INP} value={draft.address||""} onChange={up("address")}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div><div style={LBL}>{t.dob||"Date of birth"}</div><input type="date" style={INP} value={draft.dob||""} onChange={up("dob")}/></div>
      <div><div style={LBL}>{t.social||"SSN"}</div><input style={INP} value={draft.social||""} onChange={e=>setDraft(d=>({...d,social:fmtSSN?fmtSSN(e.target.value):e.target.value}))} placeholder="XXX-XX-XXXX" autoComplete="off" data-lpignore="true" data-1p-ignore="true"/></div>
    </div>
    {hasP2 && <>
      <div style={{fontSize:11,fontWeight:700,color:TH.dim,marginTop:14,marginBottom:8}}>👤 {draft.partnerFirst||"Partner"} — {t.personalInfoHdr||"Personal info"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div><div style={LBL}>{t.dob||"Date of birth"}</div><input type="date" style={INP} value={draft.p2Dob||""} onChange={up("p2Dob")}/></div>
        <div><div style={LBL}>{t.social||"SSN"}</div><input style={INP} value={draft.p2Social||""} onChange={e=>setDraft(d=>({...d,p2Social:fmtSSN?fmtSSN(e.target.value):e.target.value}))} placeholder="XXX-XX-XXXX" autoComplete="off" data-lpignore="true" data-1p-ignore="true"/></div>
      </div>
    </>}
    <div style={{marginTop:12,marginBottom:10}}><div style={LBL}>{t.howHeardLbl||"How did you hear about us?"}</div><input style={INP} value={draft.howHeard||""} onChange={up("howHeard")} placeholder={t.howHeardPlaceholder||"Referral, ad, online search…"}/></div>
    <Div/>
    <IncomeSection client={draft} onUpdate={setDraft} t={t}/>
    <Div/>
    <BillsSection client={draft} onUpdate={setDraft} t={t}/>
    <Div/>
    <DebtSection client={draft} onUpdate={setDraft} t={t}/>
    <Div/>
    <CustomAssetsSection client={draft} onUpdate={setDraft} t={t}/>
    <Div/>
    <div style={{fontSize:13,fontWeight:700,color:TH.text,marginBottom:8}}>📝 {t.goalsAndNotesHdr||"Goals & notes"}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div><div style={LBL}>{t.shortTermLbl||"Short-term (0–1yr)"}</div><textarea style={{...INP,minHeight:60,fontFamily:"inherit",resize:"vertical"}} value={draft.notes?.shortTerm||""} onChange={e=>setDraft(d=>({...d,notes:{...(d.notes||{}),shortTerm:e.target.value}}))}/></div>
      <div><div style={LBL}>{t.midTermLbl||"Mid-term (1–5yr)"}</div><textarea style={{...INP,minHeight:60,fontFamily:"inherit",resize:"vertical"}} value={draft.notes?.midTerm||""} onChange={e=>setDraft(d=>({...d,notes:{...(d.notes||{}),midTerm:e.target.value}}))}/></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div><div style={LBL}>{t.longTermLbl||"Long-term (5+yr)"}</div><textarea style={{...INP,minHeight:60,fontFamily:"inherit",resize:"vertical"}} value={draft.notes?.longTerm||""} onChange={e=>setDraft(d=>({...d,notes:{...(d.notes||{}),longTerm:e.target.value}}))}/></div>
      <div><div style={LBL}>{t.generalNotesLbl||"General notes / anything else we should know"}</div><textarea style={{...INP,minHeight:60,fontFamily:"inherit",resize:"vertical"}} value={draft.notes?.general||""} onChange={e=>setDraft(d=>({...d,notes:{...(d.notes||{}),general:e.target.value}}))}/></div>
    </div>
  </ThemeCtx.Provider>;
}

/* ── PUBLIC INTAKE (Tier-3, v0.7.1 — full parity with old IntakeSection) ── */
/* ── v0.30.0 — Phase 4 public intake redesign — helper components ──────────
   New 5-stage flow: Welcome → Service → Engagement Letter → Your Information → Done modal.
   All helpers defined at top-level per pitfall #17 (no nested-component focus loss).
   Layout split: web (>720px) vs mobile (<=720px) — driven by `isMobile` viewport flag.
   Brand tokens (#C9A84C, JetBrains Mono, Newsreader italic) come from colors_and_type.css. */

// 5-step rail rendered at the top of every intake stage. Numbered circles +
// "›" separators on web; wrapping chips on mobile. The "done" step has no
// number; shows a ✓ glyph when the user lands on it (during the Done modal).
function IntakeStepRail({stage,doneActive,t,TH,isMobile}){
  const STEPS=[
    {k:"welcome",lbl:t.intakeStepWelcome||"Welcome"},
    {k:"service",lbl:t.intakeStepService||"Service"},
    {k:"engagement",lbl:t.intakeStepEngagement||"Engagement"},
    {k:"intake",lbl:t.intakeStepInfo||"Your information"},
    {k:"done",lbl:t.intakeStepDone||"Done"}
  ];
  const order=["welcome","service","engagement","intake","done"];
  const curIdx=order.indexOf(stage);
  if(isMobile){
    return<div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:14}}>
      {STEPS.map((s,i)=>{const here=i===curIdx||(s.k==="done"&&doneActive),done=i<curIdx;return<div key={s.k} style={{padding:"5px 12px",borderRadius:99,fontSize:10,fontWeight:700,border:`1px solid ${here?GOLD:TH.cardBorder}`,background:here?GOLD+"22":"transparent",color:here?GOLD:(done?TH.muted:TH.dim),letterSpacing:"0.02em"}}>{s.k==="done"&&(here||doneActive)?"✓ ":(done?"✓ ":(i+1)+" ")}{s.lbl}</div>;})}
    </div>;
  }
  return<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:24,flexWrap:"wrap"}}>
    {STEPS.map((s,i)=>{
      const here=i===curIdx||(s.k==="done"&&doneActive);
      const done=i<curIdx;
      const isDoneStep=s.k==="done";
      return<Fragment key={s.k}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 14px",borderRadius:999,border:`1px solid ${here?GOLD:"transparent"}`,background:here?GOLD+"22":"transparent",color:here?"#0D1B2A":(done?"#755023":TH.dim),fontSize:12,fontWeight:600}}>
          <span style={{width:22,height:22,borderRadius:11,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,background:here?"#0D1B2A":(done?"#755023":TH.cardBorder),color:here?GOLD:"#fff"}}>{isDoneStep?(here||doneActive?"✓":""):(done?"✓":(i+1))}</span>
          <span style={{color:here?GOLD:(done?"#755023":TH.dim)}}>{s.lbl}</span>
        </div>
        {i<STEPS.length-1&&<span style={{width:22,height:1,background:TH.cardBorder,margin:"0 4px"}}/>}
      </Fragment>;
    })}
  </div>;
}

// Selected-service mini card. Used as the right-hand sticky sidebar on web during
// Engagement and Intake stages. Mauricio's "you can change later" affordance.
function IntakeSelectedServiceCard({service,lang,t,TH,showChange,onChange}){
  if(!service)return null;
  return<div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:12,padding:16,position:"sticky",top:24}}>
    <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>{t.intakeSelectedServiceHdr||"Selected service"}</div>
    <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:10}}>
      <div style={{width:46,height:46,borderRadius:8,background:GOLD+"22",border:`1px solid ${GOLD}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{service.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:700,color:TH.text,lineHeight:1.3}}>{service.name}</div>
        <div style={{fontSize:13,fontWeight:800,color:GOLD,marginTop:2,fontVariantNumeric:"tabular-nums"}}>{service.price}</div>
      </div>
    </div>
    {service.desc&&<div style={{fontSize:11,color:TH.muted,lineHeight:1.6,marginBottom:12}}>{service.desc}</div>}
    {showChange&&<button onClick={onChange} style={{fontSize:11,padding:"5px 12px",borderRadius:99,background:"transparent",color:TH.muted,border:`1px solid ${TH.cardBorder}`,cursor:"pointer",fontWeight:600,marginBottom:12}}>← {t.intakeChangeService||"Change"}</button>}
    <div style={{padding:"10px 12px",background:TH.bg,borderRadius:8,border:`1px dashed ${TH.cardBorder}`,fontSize:11,color:TH.dim,lineHeight:1.5,fontStyle:"italic"}}>{t.intakePrivacyHint||"Your information stays encrypted and only your advisor sees it."}</div>
  </div>;
}

// Welcome stage. v0.31.0 — tighter padding, larger hero on web (anchor logo + headline
// share a single full-width band), less empty white. Web: 2-col stays but headline sits
// higher and CTA more prominent. Mobile: same compact phone-frame.
function IntakeWelcomeStage({onStart,advisorSettings,lang,t,TH,isMobile}){
  const tagline=t.taglineSecuring||"Securing Your Health, Anchoring Your Future.";
  const wordmark=(advisorSettings.companyName||"Golden Anchor").toUpperCase();
  if(isMobile){
    return<div style={{maxWidth:520,margin:"0 auto",padding:"0 4px"}}>
      <div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:"22px 20px 24px",textAlign:"center"}}>
        <div style={{marginBottom:10}}><img src="/logo-anchor.png" alt="Golden Anchor" style={{width:120,height:120,objectFit:"contain"}}/></div>
        <div style={{fontSize:17,fontWeight:500,color:GOLD,fontFamily:"'Newsreader',Georgia,serif",letterSpacing:"0.14em"}}>{wordmark}</div>
        <div style={{fontSize:11,fontStyle:"italic",color:GOLD+"BB",fontFamily:"'Newsreader',Georgia,serif",marginTop:4,letterSpacing:"0.02em"}}>{tagline}</div>
        <div style={{height:1,width:48,background:GOLD,margin:"14px auto"}}/>
        <div style={{fontSize:22,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,lineHeight:1.2,marginBottom:6}}>{t.intakeWelcomeHeadline||(lang==="es"?"Bienvenido a Golden Anchor":"Welcome to Golden Anchor")}</div>
        <div style={{fontSize:13,color:TH.muted,lineHeight:1.6,marginBottom:16,maxWidth:380,margin:"0 auto 16px"}}>{t.intakeWelcomeSub||"Let's start with a few questions so your advisor knows how to help. It takes about 5 minutes."}</div>
        <button onClick={onStart} style={{width:"100%",padding:"14px 24px",borderRadius:8,background:GOLD,color:"#0D1B2A",border:"none",fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:"0.02em",minHeight:48,touchAction:"manipulation",boxShadow:"0 4px 12px rgba(201,168,76,0.28)"}}>{t.intakeWelcomeStartBtn||(lang==="es"?"Comenzar →":"Start intake →")}</button>
        <div style={{fontSize:11,color:TH.dim,marginTop:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontStyle:"italic"}}>🔒 {t.intakePrivacyLine||(lang==="es"?"Encriptado y privado. Solo lo ve tu asesor.":"Encrypted and private. Only your advisor sees this.")}</div>
      </div>
    </div>;
  }
  // Web: 2-col, hero on right. Tightened padding throughout; larger anchor image.
  return<div style={{maxWidth:1040,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 360px",gap:20,alignItems:"stretch"}}>
    <div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:"30px 32px"}}>
      <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:"0.10em",textTransform:"uppercase",marginBottom:8}}>{t.intakeWelcomeTag||(lang==="es"?"Admisión pública":"Public intake")}</div>
      <div style={{fontSize:34,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,lineHeight:1.1,marginBottom:10,letterSpacing:"-0.005em"}}>{t.intakeWelcomeHeadline||(lang==="es"?"Bienvenido a Golden Anchor":"Welcome to Golden Anchor")}</div>
      <div style={{height:1,width:60,background:GOLD,margin:"2px 0 14px"}}/>
      <div style={{fontSize:14,color:TH.muted,lineHeight:1.65,marginBottom:18,maxWidth:480}}>{t.intakeWelcomeSubWeb||(lang==="es"?"Cuéntanos un poco sobre tu situación para que tu asesor llegue preparado a tu primera cita. Toma alrededor de 5 minutos y puedes guardar y volver más tarde.":"Tell us a bit about your situation so your advisor arrives prepared to your first meeting. It takes about 5 minutes; you can save and come back later.")}</div>
      <button onClick={onStart} style={{padding:"14px 28px",borderRadius:8,background:GOLD,color:"#0D1B2A",border:"none",fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:"0.02em",boxShadow:"0 4px 12px rgba(201,168,76,0.28)"}}>{t.intakeWelcomeStartBtn||(lang==="es"?"Comenzar →":"Start intake →")}</button>
      <div style={{fontSize:12,color:TH.dim,marginTop:14,display:"flex",alignItems:"center",gap:6,fontStyle:"italic"}}>🔒 {t.intakePrivacyLine||(lang==="es"?"Encriptado y privado. Solo lo ve tu asesor.":"Encrypted and private. Only your advisor sees this.")}</div>
    </div>
    <div style={{background:"radial-gradient(at 60% 30%, "+GOLD+"33, transparent 60%), linear-gradient(135deg, #0D1B2A 0%, #1F2937 100%)",border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:"24px 18px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",minHeight:280}}>
      <img src="/logo-anchor.png" alt="Golden Anchor" style={{width:140,height:140,objectFit:"contain",marginBottom:12}}/>
      <div style={{fontSize:14,fontWeight:500,color:GOLD,fontFamily:"'Newsreader',Georgia,serif",letterSpacing:"0.14em"}}>{wordmark}</div>
      <div style={{height:1,width:48,background:GOLD,margin:"10px auto"}}/>
      <div style={{fontSize:13,fontStyle:"italic",color:"#EDD594",fontFamily:"'Newsreader',Georgia,serif",lineHeight:1.5,maxWidth:260}}>{tagline}</div>
    </div>
  </div>;
}

// Section wrapper used by the new intake form. Numbered gold circle + italic
// Newsreader title + gold-to-transparent hairline.
function IntakeFormSection({n,title,children}){
  const TH=useTh();
  return<div style={{marginBottom:32}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
      <span style={{width:26,height:26,borderRadius:13,background:GOLD+"22",border:`1px solid ${GOLD}55`,color:GOLD,fontSize:11,fontWeight:800,display:"inline-flex",alignItems:"center",justifyContent:"center",fontVariantNumeric:"tabular-nums",flexShrink:0}}>{n}</span>
      <span style={{fontSize:18,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,whiteSpace:"nowrap"}}>{title}</span>
      <span style={{flex:1,height:1,background:`linear-gradient(to right, ${GOLD}55, transparent)`}}/>
    </div>
    {children}
  </div>;
}

// Currency input with $ glyph and gold focus ring. Returns a controlled number.
function IntakeCurrencyInput({value,onChange,placeholder,TH}){
  const[focused,setFocused]=useState(false);
  return<div style={{position:"relative"}}>
    <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:TH.dim,fontSize:13,fontWeight:600,pointerEvents:"none"}}>$</span>
    <input inputMode="decimal" value={value||""} onChange={e=>{const v=e.target.value.replace(/[^0-9.]/g,"");onChange(v);}} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder={placeholder||"0"} style={{width:"100%",padding:"12px 14px 12px 28px",background:TH.inp,border:`1px solid ${focused?GOLD:TH.inpBorder}`,outline:focused?`2px solid ${GOLD}33`:"none",color:TH.text,borderRadius:8,fontSize:13,boxSizing:"border-box",fontVariantNumeric:"tabular-nums",fontFamily:"'JetBrains Mono',ui-monospace,Menlo,monospace"}}/>
  </div>;
}

// Field label primitive — caps + tracking matches Claude Design.
function IntakeFieldLabel({children}){const TH=useTh();return<div style={{fontSize:10,fontWeight:700,color:TH.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>{children}</div>;}

// v0.30.0 → v0.31.0 — IntakeFormV2 (the simplified 12-totals + 2-textareas form)
// shipped briefly in v0.30.0, then was replaced in v0.31.0 by the restored
// IntakeFormBody + inline Contact block to give prospects line-item entry like
// the advisor side. The IntakeFormV2 function body was removed in v0.36.0 as
// dead code (~64 lines). IntakeFormSection + IntakeCurrencyInput + IntakeFieldLabel
// are still used directly by the inline Contact block in PublicIntake.

// Done modal — overlay confirmation that keeps the underlying form mounted.
// Triggered when Submit or Pay Now lands. v0.31.0: dropped reference token +
// "Submit another" — added "You can safely close this tab" line.
function IntakeDoneModal({open,onClose,lang,t,TH,payingNow,noPaymentLink}){
  useEffect(()=>{if(!open)return;const h=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[open,onClose]);
  if(!open)return null;
  const mainCopy=payingNow?
    (noPaymentLink
      ? (t.intakeDonePayMissing||(lang==="es"?"Tu intake llegó. Tu asesor te enviará el enlace de pago directamente.":"Your intake is in. Your advisor will send you the payment link directly."))
      : (t.intakeDoneSubPay||(lang==="es"?"Te estamos redirigiendo al pago seguro en una nueva pestaña. También te enviamos una copia de la carta de compromiso a tu correo.":"Redirecting you to secure checkout in a new tab. We've also emailed you a copy of the engagement letter."))
    )
    : (t.intakeDoneSub||(lang==="es"?"Tu asesor revisará tu información y te contactará en un día hábil. Te enviamos una copia de la carta de compromiso firmada a tu correo.":"Your advisor will review and reach out within one business day. We've emailed you a copy of the signed engagement letter."));
  return<div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,background:"rgba(13,27,42,0.72)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:18,animation:"ga-fade 200ms ease"}}>
    <div style={{background:"#fff",border:`1px solid ${TH.cardBorder}`,borderRadius:20,padding:isMobileViewport()?"32px 22px":"40px 36px",maxWidth:480,width:"100%",boxShadow:"0 32px 80px rgba(0,0,0,0.45)",animation:"ga-modal-pop 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",textAlign:"center",color:"#0F172A"}}>
      <div style={{width:76,height:76,borderRadius:38,background:"#10B98122",border:"1px solid #10B98155",color:"#10B981",fontSize:36,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,marginBottom:18}}>✓</div>
      <div style={{fontSize:28,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",lineHeight:1.1,marginBottom:8,color:"#0F172A"}}>{t.intakeDoneTitle||(lang==="es"?"¡Recibimos tu información!":"Submission received")}</div>
      <div style={{height:1,width:60,background:GOLD,margin:"14px auto 18px"}}/>
      <div style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:14,maxWidth:400,margin:"0 auto 14px"}}>{mainCopy}</div>
      <div style={{fontSize:12,color:"#64748B",fontStyle:"italic",marginTop:6}}>{t.intakeDoneCloseTab||(lang==="es"?"Ya puedes cerrar esta pestaña.":"You can safely close this tab.")}</div>
    </div>
  </div>;
}

// Helper for the modal to detect mobile viewport (avoids prop-drilling).
function isMobileViewport(){return typeof window!=="undefined"&&window.innerWidth<720;}

function PublicIntake(){
  const urlParams=typeof window!=="undefined"?new URLSearchParams(window.location.search):new URLSearchParams("");
  const inviteToken=urlParams.get("invite")||urlParams.get("token")||"";
  const promoFromUrl=urlParams.get("promo")||"";
  const[resolvedAdvisorId,setResolvedAdvisorId]=useState(urlParams.get("advisor")||"");
  const[resolvedSettings,setResolvedSettings]=useState(null);
  const advisorId=resolvedAdvisorId;
  const initialLang=(urlParams.get("lang")||"en").toLowerCase()==="es"?"es":"en";
  const[lang,setLang]=useState(initialLang);
  const t=T[lang]||T.en;
  // v0.30.0 — 5-stage flow: welcome → service → engagement → intake → done modal.
  // Old "household" step is gone; its content (name/email/phone + couple toggle)
  // is now Section 1 of the IntakeFormV2.
  const[step,setStep]=useState("welcome");
  const[draft,setDraft]=useState(()=>mk({recommendedBy:"",howHeard:"",preferredService:"",contactMethod:"email",householdType:"single",intakeSnapshot:{}}));
  const householdType=draft.householdType||"single";
  const[selectedServiceId,setSelectedServiceId]=useState("");
  const[promoCode,setPromoCode]=useState(promoFromUrl);
  const[sig1,setSig1]=useState(null);
  const[sig2,setSig2]=useState(null);
  const[submitting,setSubmitting]=useState(false);
  const[submitted,setSubmitted]=useState(false);
  const[payingNow,setPayingNow]=useState(false);
  const[noPaymentLink,setNoPaymentLink]=useState(false);
  const[err,setErr]=useState("");
  const[inviteResolved,setInviteResolved]=useState(!inviteToken);
  const[inviteError,setInviteError]=useState("");
  const vp=useViewport();
  const isMobile=vp.isMobile;
  // a11y (WCAG 3.1.1) — sync <html lang> with the intake form's language.
  useEffect(()=>{if(typeof document!=="undefined")document.documentElement.lang=lang;},[lang]);
  // v0.31.0 — Browser back navigation. Pushes a history entry on each step
  // transition and listens for popstate so the back button walks through the
  // flow naturally. Initial mount uses replaceState so back from welcome
  // exits the intake (returns to the previous page).
  useEffect(()=>{
    if(typeof window==="undefined")return;
    if(!window.history.state||!window.history.state.gaIntakeStep){
      window.history.replaceState({gaIntakeStep:"welcome"},"",window.location.href);
    }
    const onPop=(e)=>{
      const target=e?.state?.gaIntakeStep;
      if(target==="welcome"||target==="service"||target==="engagement"||target==="intake"){
        setStep(target);
        setErr("");
      }
    };
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  },[]);
  const goToStep=(newStep)=>{
    if(typeof window!=="undefined"){
      try{window.history.pushState({gaIntakeStep:newStep},"",window.location.href);}catch{}
    }
    setStep(newStep);
  };
  useEffect(()=>{if(!inviteToken)return;let cancelled=false;(async()=>{
    const r=await gaResolveIntakeInvite(inviteToken);
    if(cancelled)return;
    if(!r.ok){setInviteError(r.error||"invite-resolve-failed");setInviteResolved(true);return;}
    setResolvedAdvisorId(r.advisorId||resolvedAdvisorId);
    if(r.advisorProfile)setResolvedSettings(r.advisorProfile);
    else if(r.advisorSettings)setResolvedSettings(r.advisorSettings);
    if(r.lang==="es"||r.lang==="en")setLang(r.lang);
    // v0.32.0 — prefill prospect + partner from the invite row. Both members
    // of a couple invite land in the engagement letter greeting, both signatures
    // (defaultName auto-commits), and the Contact section on Tab 4.
    const pFirst=(r.prospectName||"").trim().split(" ")[0]||"";
    const pLast=((r.prospectName||"").trim().split(" ").slice(1).join(" "))||"";
    const partnerFirst=(r.partnerName||"").trim().split(" ")[0]||"";
    const partnerLast=((r.partnerName||"").trim().split(" ").slice(1).join(" "))||"";
    setDraft(d=>({
      ...d,
      firstName:d.firstName||pFirst,
      lastName:d.lastName||pLast,
      email:d.email||r.prospectEmail||"",
      phone:d.phone||r.prospectPhone||"",
      householdType:d.householdType==="couple"||r.householdType==="couple"?"couple":(d.householdType||"single"),
      partnerFirst:d.partnerFirst||partnerFirst,
      partnerLast:d.partnerLast||partnerLast,
      partnerEmail:d.partnerEmail||r.partnerEmail||"",
      partnerPhone:d.partnerPhone||r.partnerPhone||""
    }));
    setInviteResolved(true);
  })();return()=>{cancelled=true;};},[inviteToken]);
  const[mode,setMode]=useState(()=>{if(typeof window==="undefined")return "dark";try{return window.localStorage.getItem("ga_intake_mode")||"dark";}catch(e){return "dark";}});
  const isDark=mode==="dark";
  // v0.54.0 (PR 2 from HANDOFF-v0.46) — Light-mode intake palette swapped from
  // Tailwind cool slate to the warm cream + amber spec in preview/22-intake-colors.html.
  // 11 hex pairs: page bg, card border, focus border + ring, primary CTA fill +
  // text + hover, active step pill + text, error tone, body text. Section labels
  // pick up the new accent via synthTheme below.
  const TH=isDark?{bg:"#0D1B2A",text:"#fff",muted:"#94A3B8",dim:"#64748B",pos:"#10B981",neg:"#EF4444",accent:GOLD,card:"#1A2940",cardBorder:"#1F2C44",inp:"#0F1E33",inpBorder:"#1F2C44",modal:"#1A2940",warn:"#F59E0B",blue:"#3B82F6",nav:"#1A2940",navBorder:"#1F2C44",sideText:"#fff",sideMuted:"#94A3B8"}:{bg:"#F7F4EC",text:"#0F172A",muted:"#475569",dim:"#94A3B8",pos:"#059669",neg:"#B83227",accent:"#C9A84C",card:"#FFFFFF",cardBorder:"#E8DFC6",inp:"#FFFFFF",inpBorder:"#E8DFC6",modal:"#FFFFFF",warn:"#D97706",blue:"#C9A84C",nav:"#FFFFFF",navBorder:"#E8DFC6",sideText:"#0F172A",sideMuted:"#475569"};
  useEffect(()=>{if(typeof document!=="undefined"){document.documentElement.style.background=TH.bg;document.body.style.background=TH.bg;document.body.style.margin="0";}try{window.localStorage.setItem("ga_intake_mode",mode);}catch(e){}},[mode,TH.bg]);
  const advisorSettings = resolvedSettings || {};
  const services = (advisorSettings.services && advisorSettings.services.length) ? advisorSettings.services : SVCS.map(v=>({id:v.id,icon:v.icon,name:lang==="es"?v.es:v.en,price:v.price,stripeUrl:(advisorSettings.stripeLinks||{})[v.id]||v.payUrl||"",payUrl:(advisorSettings.stripeLinks||{})[v.id]||v.payUrl||"",desc:lang==="es"?v.descEs:v.desc}));
  const selectedService = services.find(sv=>sv.id===selectedServiceId);
  if(!advisorId){return<div style={{minHeight:"100dvh",background:TH.bg,color:TH.text,display:"flex",alignItems:"center",justifyContent:"center",padding:24,flexDirection:"column",gap:14,textAlign:"center",fontFamily:"system-ui,sans-serif"}}><div style={{fontSize:48,color:GOLD}}>⚓</div><div style={{fontSize:16,fontWeight:700,maxWidth:480}}>{t.intakeInvalidLink||"This intake link is invalid or expired."}</div><div style={{fontSize:12,color:TH.muted,maxWidth:480}}>{t.intakeContactAdvisor||"Please contact your advisor directly."}</div></div>;}
  // v0.33.0 — Public intake unified on the Claude Design gold palette regardless
  // of light/dark mode. The advisor-side IntakeFormBody (income/bills/debt/assets
  // sections) used `th.accent` (dark goldenrod #B8860B in light, plain GOLD in dark)
  // and `th.blue` (#2563EB) for some accents — both reading as wrong on the prospect's
  // intake. Force `accent`, `blue`, and a couple of neutral tones onto the brand gold
  // chain so the restored advisor-form chrome matches the welcome/service/engagement
  // stages above it.
  const synthTheme={bg:TH.bg,nav:TH.card,navBorder:TH.cardBorder,card:TH.card,cardBorder:TH.cardBorder,modal:TH.modal,inp:TH.inp,inpBorder:TH.inpBorder,text:TH.text,muted:TH.muted,dim:TH.dim,sideText:TH.text,sideMuted:TH.muted,accent:GOLD,pos:TH.pos,neg:TH.neg,warn:TH.warn,blue:GOLD};
  // Submit fires from the Intake stage's Submit or Pay Now buttons. Done modal
  // (overlay) renders on success — form stays mounted underneath so Esc/back
  // resets cleanly.
  const goSubmit=async(payNow)=>{
    setErr("");
    if(!draft.firstName?.trim()){setErr(t.intakeFirstReq||"First name required.");return;}
    if(!draft.lastName?.trim()){setErr(t.intakeLastReq||"Last name required.");return;}
    if(!draft.email?.trim()||!vEmail(draft.email)){setErr(t.intakeEmailReq||"Valid email required.");return;}
    if(householdType==="couple"&&!String(draft.partnerFirst||"").trim()){setErr(t.intakePartnerFirstReq||"Partner first name required.");return;}
    setSubmitting(true);
    setPayingNow(!!payNow);
    const payload={...draft,monthSnapshots:[],savedCalcs:[],savedCompare:null,savedPortfolio:null,householdType,selectedServiceId,promoCode,engagementLetter:{signedAt:new Date().toISOString(),signature1:sig1,signature2:householdType==="couple"?sig2:null,version:"v1"}};
    delete payload.id;delete payload.archived;delete payload.hideNumbers;delete payload.currentMonthLabel;
    const res=await gaSubmitIntake(advisorId,lang,payload);
    if(res.ok){
      if(inviteToken&&res.submissionId){gaMarkIntakeInviteSubmitted(inviteToken,res.submissionId);}
      setSubmitted(true);
      // v0.31.0 — Fire engagement-copy email in the background. Server picks
      // up advisor settings + this submission and emails the prospect + advisor
      // a copy of the filled letter. Non-blocking — UX continues even if email fails.
      try{
        if(typeof window!=="undefined"&&typeof fetch==="function"){
          fetch("/api/send-engagement-copy",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({advisorId,submissionId:res.submissionId||null,inviteToken:inviteToken||null,lang})}).catch(()=>{});
        }
      }catch{}
      if(payNow){
        const stripeUrl=(selectedService&&(selectedService.payUrl||selectedService.stripeUrl))||"";
        if(stripeUrl){
          try{
            const url=new URL(stripeUrl);
            if(promoCode)url.searchParams.set("prefilled_promo_code",promoCode);
            if(draft.email)url.searchParams.set("prefilled_email",draft.email);
            setTimeout(()=>{window.open(url.toString(),"_blank","noopener,noreferrer");},600);
            setNoPaymentLink(false);
          }catch(e){
            setNoPaymentLink(true);
          }
        }else{
          setNoPaymentLink(true);
        }
      }
    }else{setErr(t.intakeError||"Submission failed. Please try again.");setSubmitting(false);}
  };
  // Step navigation. v0.31.0 — uses goToStep so each transition pushes a history entry.
  const next=()=>{
    setErr("");
    if(step==="welcome"){goToStep("service");return;}
    if(step==="service"){
      if(!selectedServiceId){setErr(t.intakePickService||"Please pick a service.");return;}
      goToStep("engagement");return;
    }
    if(step==="engagement"){
      const sigEmpty=s=>!s||(s.kind==="typed"&&!s.text?.trim())||(s.kind==="drawn"&&!s.dataUrl);
      if(sigEmpty(sig1)){setErr(t.intakeSigRequired||"Your signature is required.");return;}
      if(householdType==="couple"&&sigEmpty(sig2)){setErr(t.intakeSig2Required||"Both signatures are required for a couple.");return;}
      goToStep("intake");return;
    }
  };
  const back=()=>{
    setErr("");
    if(typeof window!=="undefined"&&window.history.length>1){window.history.back();return;}
    if(step==="service")goToStep("welcome");
    else if(step==="engagement")goToStep("service");
    else if(step==="intake")goToStep("engagement");
  };
  const resetFlow=()=>{setSubmitted(false);setSubmitting(false);setPayingNow(false);setNoPaymentLink(false);goToStep("welcome");setSelectedServiceId("");setSig1(null);setSig2(null);setErr("");setDraft(()=>mk({recommendedBy:"",howHeard:"",preferredService:"",contactMethod:"email",householdType:"single",intakeSnapshot:{}}));};
  // Inputs reused across stages
  const showSidebar=!isMobile&&(step==="engagement"||step==="intake")&&!!selectedService;
  return<ThemeCtx.Provider value={synthTheme}>
    <div style={{minHeight:"100dvh",background:TH.bg,color:TH.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",padding:isMobile?"20px 14px":"24px 24px",lineHeight:1.5,WebkitTextSizeAdjust:"100%"}}>
      <div style={{maxWidth:1080,margin:"0 auto"}}>
        {/* Top toolbar — theme + lang toggle */}
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6,gap:6}}>
          <button onClick={()=>setMode(m=>m==="dark"?"light":"dark")} style={{background:"transparent",border:"1px solid "+TH.cardBorder,color:TH.muted,padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>{isDark?"☀️ "+(t.lightMode||"Light"):"🌙 "+(t.darkMode||"Dark")}</button>
          <button onClick={()=>setLang(l=>l==="en"?"es":"en")} style={{background:"transparent",border:"1px solid "+TH.cardBorder,color:TH.muted,padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>🌐 EN | ES</button>
        </div>
        {/* Brand strip (compact on stages after welcome) */}
        {step!=="welcome"&&<div style={{textAlign:"center",marginBottom:14,paddingTop:4}}>
          <div style={{fontSize:18,fontWeight:500,color:GOLD,fontFamily:"'Newsreader',Georgia,serif",letterSpacing:"0.14em",textTransform:"uppercase"}}>{advisorSettings.companyName||"Golden Anchor"}</div>
          <div style={{fontSize:10,fontStyle:"italic",color:GOLD+"BB",fontFamily:"'Newsreader',Georgia,serif",marginTop:4,letterSpacing:"0.02em"}}>{t.taglineSecuring||"Securing Your Health, Anchoring Your Future."}</div>
        </div>}
        {/* Step rail */}
        <IntakeStepRail stage={step} doneActive={submitted} t={t} TH={TH} isMobile={isMobile}/>
        {/* Stage 0 — Welcome (full-bleed; no surrounding card) */}
        {step==="welcome"&&<IntakeWelcomeStage onStart={()=>goToStep("service")} advisorSettings={advisorSettings} lang={lang} t={t} TH={TH} isMobile={isMobile}/>}
        {/* Stage 1+ container — main card + optional sticky sidebar */}
        {step!=="welcome"&&<div style={{display:"grid",gridTemplateColumns:showSidebar?"1fr 340px":"1fr",gap:24,alignItems:"flex-start"}}>
          <div>
            {/* Stage 1 — Service */}
            {step==="service"&&<div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:isMobile?"22px 18px":"32px 28px"}}>
              <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{t.intakeStepNofN?t.intakeStepNofN.replace("{n}","2").replace("{total}","4"):(lang==="es"?"Paso 2 de 4":"Step 2 of 4")}</div>
              <div style={{fontSize:isMobile?22:26,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,lineHeight:1.15,marginBottom:6}}>{t.stepServiceQTitle||(lang==="es"?"Elige un servicio":"Pick a service")}</div>
              <div style={{height:1,width:60,background:GOLD,margin:"4px 0 14px"}}/>
              <div style={{fontSize:13,color:TH.muted,marginBottom:18,lineHeight:1.6,maxWidth:520}}>{t.stepServiceHelp2||(lang==="es"?"Escoge lo que necesitas hoy. El precio es transparente — solo se cobra después de una llamada de descubrimiento.":"Choose what you need today. Pricing is transparent — you'll only be charged after a discovery call.")}</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
                {services.map(svc=>{const sel=selectedServiceId===svc.id;return<button key={svc.id} onClick={()=>setSelectedServiceId(svc.id)} style={{textAlign:"left",padding:"16px 18px",borderRadius:12,border:`1px solid ${sel?GOLD:TH.cardBorder}`,background:sel?GOLD+"11":TH.card,color:TH.text,cursor:"pointer",transition:"border-color 200ms cubic-bezier(0.2,0.8,0.2,1), background 200ms",display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:46,height:46,borderRadius:8,background:GOLD+"22",border:`1px solid ${GOLD}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{svc.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8,marginBottom:4}}>
                      <span style={{fontSize:14,fontWeight:700,lineHeight:1.3}}>{svc.name}</span>
                      <span style={{fontSize:13,fontWeight:800,color:GOLD,fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap"}}>{svc.price}</span>
                    </div>
                    {svc.desc&&<div style={{fontSize:12,color:TH.muted,lineHeight:1.5}}>{svc.desc}</div>}
                  </div>
                </button>;})}
              </div>
            </div>}
            {/* Stage 2 — Engagement */}
            {step==="engagement"&&<div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:isMobile?"22px 18px":"32px 28px"}}>
              <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{t.intakeStepNofN?t.intakeStepNofN.replace("{n}","3").replace("{total}","4"):(lang==="es"?"Paso 3 de 4":"Step 3 of 4")}</div>
              <div style={{fontSize:isMobile?22:26,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,lineHeight:1.15,marginBottom:6}}>{t.stepEngagementTitle2||(lang==="es"?"Carta de compromiso":"Engagement Letter")}</div>
              <div style={{height:1,width:60,background:GOLD,margin:"4px 0 14px"}}/>
              <div style={{fontSize:13,color:TH.muted,marginBottom:18,lineHeight:1.6,maxWidth:560}}>{t.stepEngagementHelp2||(lang==="es"?"Léela y firma antes de continuar. Te enviaremos una copia por correo después de enviar tu intake.":"Please read and acknowledge before continuing. A signed copy will be emailed to you after submission.")}</div>
              {/* Cream-paper letter panel */}
              <div style={{background:"#FBF8F0",border:`1px solid ${TH.cardBorder}`,borderRadius:12,padding:isMobile?"22px 18px":"28px 32px",marginBottom:18}}>
                <EngagementLetter settings={advisorSettings} clientName1={[draft.firstName,draft.lastName].filter(Boolean).join(" ")} clientName2={householdType==="couple"?[draft.partnerFirst,draft.partnerLast].filter(Boolean).join(" "):""} selectedService={selectedService} lang={lang} t={t} theme={{...synthTheme,card:"#FBF8F0",cardBorder:TH.cardBorder}} signatureClient1={sig1} signatureClient2={sig2} onSig1={setSig1} onSig2={setSig2} readOnly={false}/>
              </div>
            </div>}
            {/* Stage 3 — Intake form. v0.31.0 restores the full structured advisor-style
               form (IntakeFormBody) so prospects can add line-item credit cards, income
               streams, debts, accounts, loans, etc. — the same shape the advisor edits
               post-conversion. Contact block is rendered inline above so name/email/phone
               + couple toggle are captured here too (no separate "household" step). */}
            {step==="intake"&&<div style={{background:TH.card,border:`1px solid ${TH.cardBorder}`,borderRadius:16,padding:isMobile?"22px 18px":"32px 28px"}}>
              <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{t.intakeStepNofN?t.intakeStepNofN.replace("{n}","4").replace("{total}","4"):(lang==="es"?"Paso 4 de 4":"Step 4 of 4")}</div>
              <div style={{fontSize:isMobile?22:26,fontWeight:500,fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",color:TH.text,lineHeight:1.15,marginBottom:6}}>{t.stepIntakeTitle||(lang==="es"?"Tu información":"Your information")}</div>
              <div style={{height:1,width:60,background:GOLD,margin:"4px 0 14px"}}/>
              <div style={{fontSize:13,color:TH.muted,marginBottom:18,lineHeight:1.6,maxWidth:560}}>{t.stepIntakeHelpV2||(lang==="es"?"Captura tu información completa — agrega tus tarjetas, ingresos, deudas, cuentas y metas igual que en el reporte mensual. Solo tu asesor lo ve.":"Capture your full picture — add credit cards, income, debts, accounts, and goals just like in a monthly snapshot. Only your advisor sees this.")}</div>
              {/* Contact block (Section 1) — name/email/phone + couple toggle, prefilled from invite */}
              <IntakeFormSection n={1} title={t.intakeSection1Title||(lang==="es"?"Contacto":"Contact")}>
                {!!inviteToken&&<div style={{padding:"10px 14px",background:GOLD+"11",border:`1px solid ${GOLD}33`,borderRadius:10,fontSize:12,color:TH.text,marginBottom:14,lineHeight:1.5}}>✨ {t.intakePrefilledNote||(lang==="es"?"Tu asesor pre-llenó tu nombre, correo y teléfono desde la invitación. Revísalos y ajústalos si hace falta.":"Your advisor pre-filled your name, email, and phone from the invitation. Review them and tweak if needed.")}</div>}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
                  <div><IntakeFieldLabel>{t.firstNameLbl||"First name"} *</IntakeFieldLabel><input style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.firstName||""} onChange={e=>setDraft(d=>({...d,firstName:e.target.value}))}/></div>
                  <div><IntakeFieldLabel>{t.lastNameLbl||"Last name"} *</IntakeFieldLabel><input style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.lastName||""} onChange={e=>setDraft(d=>({...d,lastName:e.target.value}))}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
                  <div><IntakeFieldLabel>{t.emailLbl||"Email"} *</IntakeFieldLabel><input type="email" autoComplete="email" style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.email||""} onChange={e=>setDraft(d=>({...d,email:e.target.value}))}/></div>
                  <div><IntakeFieldLabel>{t.phoneLbl||"Phone"}</IntakeFieldLabel><input type="tel" inputMode="tel" autoComplete="tel" style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.phone||""} onChange={e=>setDraft(d=>({...d,phone:fmtPh?fmtPh(e.target.value):e.target.value}))}/></div>
                </div>
                <div style={{marginBottom:12}}><IntakeFieldLabel>{t.intakeHouseholdLbl||(lang==="es"?"¿Aplicas como individuo o pareja?":"Are you applying as an individual or a couple?")}</IntakeFieldLabel>
                  <div style={{display:"flex",gap:8}}>
                    {[{id:"single",lbl:t.householdSingle||(lang==="es"?"Solo yo":"Just me"),emoji:"👤"},{id:"couple",lbl:t.householdCouple||(lang==="es"?"Mi pareja y yo":"My partner & me"),emoji:"💑"}].map(opt=><button key={opt.id} type="button" onClick={()=>setDraft(d=>({...d,householdType:opt.id}))} style={{flex:1,padding:"12px 16px",borderRadius:8,border:`2px solid ${(draft.householdType||"single")===opt.id?GOLD:TH.cardBorder}`,background:(draft.householdType||"single")===opt.id?GOLD+"22":"transparent",color:TH.text,cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{opt.emoji}</span>{opt.lbl}</button>)}
                  </div>
                </div>
                {(draft.householdType==="couple")&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
                  <div><IntakeFieldLabel>{t.partnerFirstNameLbl||(lang==="es"?"Nombre de tu pareja":"Partner first name")} *</IntakeFieldLabel><input style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.partnerFirst||""} onChange={e=>setDraft(d=>({...d,partnerFirst:e.target.value}))}/></div>
                  <div><IntakeFieldLabel>{t.partnerLastNameLbl||(lang==="es"?"Apellido":"Partner last name")}</IntakeFieldLabel><input style={{width:"100%",padding:"12px 14px",background:TH.inp,border:`1px solid ${TH.inpBorder}`,color:TH.text,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}} value={draft.partnerLast||""} onChange={e=>setDraft(d=>({...d,partnerLast:e.target.value}))}/></div>
                </div>}
              </IntakeFormSection>
              {/* Full structured intake form (line-item rich data — restored from pre-v0.30 behavior) */}
              <IntakeFormBody draft={draft} setDraft={setDraft} t={t} TH={TH} lang={lang}/>
              {/* Sticky footer with Back / Submit / Pay Now */}
              <div style={{marginTop:24,paddingTop:20,borderTop:`1px solid ${TH.cardBorder}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
                <div style={{fontSize:11,color:TH.dim,fontStyle:"italic",lineHeight:1.5,flex:"1 1 200px",maxWidth:360}}>{t.intakeFooterPrivacy||(lang==="es"?"El pago abre en una pestaña nueva. También puedes pagar después de la llamada de descubrimiento.":"Opens secure checkout in a new tab. You can also pay after the discovery call.")}</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button onClick={back} disabled={submitting} style={{padding:"12px 18px",borderRadius:8,background:"transparent",color:TH.muted,fontWeight:700,fontSize:13,border:`1px solid ${TH.cardBorder}`,cursor:"pointer",whiteSpace:"nowrap"}}>← {t.backBtn||"Back"}</button>
                  <button onClick={()=>goSubmit(false)} disabled={submitting} style={{padding:"12px 22px",borderRadius:8,background:"transparent",color:submitting?TH.muted:TH.text,fontWeight:700,fontSize:13,border:`1px solid ${TH.cardBorder}`,cursor:submitting?"default":"pointer",whiteSpace:"nowrap"}}>{submitting&&!payingNow?(t.intakeSubmitting||"Submitting…"):"✓ "+(t.intakeSubmit||"Submit intake")}</button>
                  <button onClick={()=>goSubmit(true)} disabled={submitting||!selectedService} style={{padding:"12px 22px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:800,fontSize:13,border:"none",cursor:(submitting||!selectedService)?"default":"pointer",whiteSpace:"nowrap",opacity:selectedService?1:0.4,boxShadow:selectedService?"0 4px 12px rgba(201,168,76,0.28)":"none"}}>💳 {(t.intakePayNow2||(lang==="es"?"Pagar ahora":"Pay now"))} · {selectedService?.price||"$"} →</button>
                </div>
              </div>
              {/* Promo code field — only render when set */}
              {promoFromUrl&&<div style={{marginTop:14,padding:"10px 12px",background:GOLD+"15",border:`1px solid ${GOLD}44`,borderRadius:8,fontSize:12,color:TH.text}}>🎟️ {t.promoApplied||"Promo code applied:"} <b style={{color:GOLD,fontFamily:"'JetBrains Mono',monospace"}}>{promoCode}</b></div>}
            </div>}
            {/* Error band */}
            {err&&<div role="alert" style={{fontSize:12,color:"#FCA5A5",background:"#EF444422",border:"1px solid #EF444466",borderRadius:8,padding:"10px 14px",marginTop:14}}>⚠️ {err}</div>}
            {/* Back/Continue row — Welcome+Intake hide their own; Service+Engagement use this */}
            {(step==="service"||step==="engagement")&&<div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
              <button onClick={back} style={{padding:"12px 22px",borderRadius:8,background:"transparent",color:TH.text,fontWeight:700,fontSize:13,border:`1px solid ${TH.cardBorder}`,cursor:"pointer"}}>← {t.backBtn||"Back"}</button>
              <button onClick={next} style={{flex:1,padding:"12px 22px",borderRadius:8,background:GOLD,color:"#0D1B2A",fontWeight:800,fontSize:13,border:"none",cursor:"pointer",letterSpacing:"0.02em",boxShadow:"0 4px 12px rgba(201,168,76,0.28)"}}>{t.continueBtn||"Continue"} →</button>
            </div>}
            <div style={{textAlign:"center",fontSize:10,color:TH.dim,marginTop:24,lineHeight:1.6,padding:"0 8px"}}>{t.disclaimer||""}</div>
          </div>
          {/* Sticky service sidebar (web only, engagement + intake) */}
          {showSidebar&&<IntakeSelectedServiceCard service={selectedService} lang={lang} t={t} TH={TH} showChange={step!=="engagement"} onChange={()=>goToStep("service")}/>}
        </div>}
      </div>
      {/* Done modal — overlays the form, doesn't replace it */}
      <IntakeDoneModal open={submitted} onClose={resetFlow} lang={lang} t={t} TH={TH} payingNow={payingNow} noPaymentLink={noPaymentLink}/>
    </div>
  </ThemeCtx.Provider>;
}



/* ── NewInviteModal — v0.29.0 ────────────────────────────────────────────
   Replaces the old "Send invite to a prospect" inline disclosure. Single
   compact modal: language picker + name + email + phone + personal note.
   Calls existing gaSendIntakeInvite server endpoint. On success: flips to
   "✓ Invite sent" briefly, fires onSent so the parent table can refresh,
   then auto-closes. */
function NewInviteModal({open,onClose,onSent,settings,t}){
  const th=useTh();
  const{isMobile}=useViewport();
  const[lang,setLang]=useState("en");
  const[name,setName]=useState("");
  const[email,setEmail]=useState("");
  const[phone,setPhone]=useState("");
  const[note,setNote]=useState("");
  // v0.32.0 — second-person fields. Toggled via the couple option below.
  const[householdType,setHouseholdType]=useState("single");
  const[partnerName,setPartnerName]=useState("");
  const[partnerEmail,setPartnerEmail]=useState("");
  const[partnerPhone,setPartnerPhone]=useState("");
  const[busy,setBusy]=useState(false);
  const[sent,setSent]=useState(false);
  const[err,setErr]=useState("");
  useEffect(()=>{if(!open){setLang("en");setName("");setEmail("");setPhone("");setNote("");setHouseholdType("single");setPartnerName("");setPartnerEmail("");setPartnerPhone("");setBusy(false);setSent(false);setErr("");}},[open]);
  useEffect(()=>{if(!open)return;const h=e=>{if(e.key==="Escape")onClose();};document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[open,onClose]);
  if(!open)return null;
  const submit=async()=>{
    setErr("");
    // v0.32.0 — name required (was: only email). Email still required since
    // it's the channel for delivery.
    if(!name.trim()){setErr(t?.intakeSendNameReq||"Prospect name is required.");return;}
    if(!email){setErr(t?.intakeSendEmailReq||"Enter prospect email first.");return;}
    if(householdType==="couple"&&!partnerName.trim()){setErr(t?.intakeSendPartnerNameReq||"Partner name is required for couple invites.");return;}
    setBusy(true);
    const r=await gaSendIntakeInvite({
      prospectName:name,
      prospectEmail:email,
      prospectPhone:phone,
      lang,
      channelEmail:true,channelSms:false,smsConsent:false,
      advisorName:settings?.advisorName||"",
      advisorEmail:settings?.advisorEmail||"",
      personalNote:note,
      householdType,
      partnerName:householdType==="couple"?partnerName:"",
      partnerEmail:householdType==="couple"?partnerEmail:"",
      partnerPhone:householdType==="couple"?partnerPhone:""
    });
    setBusy(false);
    if(r.ok){setSent(true);if(onSent)onSent();setTimeout(()=>{setSent(false);onClose();},1400);}
    else setErr(r.error||(t?.intakeSendFailed||"Send failed"));
  };
  const lbl=(s)=>({fontSize:10,fontWeight:700,color:th.muted,letterSpacing:".06em",textTransform:"uppercase",marginBottom:4,display:"block"});
  const inp={padding:"10px 12px",fontSize:13,background:th.inp,border:"1px solid "+th.inpBorder,color:th.text,borderRadius:8,outline:"none",width:"100%",boxSizing:"border-box"};
  const segWrap={display:"inline-flex",gap:3,padding:3,borderRadius:999,background:th.inp,border:"1px solid "+th.inpBorder};
  const segBtn=(active)=>({padding:"6px 14px",fontSize:11,borderRadius:999,background:active?GOLD:"transparent",color:active?"#0D1B2A":th.muted,border:"none",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"});
  const notePh=lang==="es"?"Hola, te comparto el link para tu chequeo inicial…":"Hi, here's the intake link for your initial checkup…";
  return<div role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.67)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?12:24}}>
    <div style={{background:th.modal,border:"1px solid "+th.cardBorder,borderRadius:16,padding:24,maxWidth:600,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.55)"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:14}}>
        <div>
          <div style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontSize:22,fontWeight:500,color:GOLD,lineHeight:1.1}}>{t?.intakeNewInviteTitle||"New invite"}</div>
          <div style={{fontSize:12,color:th.muted,marginTop:6,maxWidth:380,lineHeight:1.5}}>{t?.intakeNewInviteSubtitle||"Send a prospect a private intake link. Pick the language they'll fill the form in."}</div>
        </div>
        <button onClick={onClose} aria-label={t?.close||"Close"} style={{background:"transparent",border:"none",color:th.muted,fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>✕</button>
      </div>
      <div style={{height:1,background:th.cardBorder,margin:"14px 0 18px"}}/>
      {/* Lang segmented */}
      <div style={{marginBottom:14}}>
        <label style={lbl()}>{t?.intakeNewInviteLangLbl||"Send invite in"}</label>
        <div style={segWrap}>
          <button onClick={()=>setLang("en")} style={segBtn(lang==="en")}>EN — English</button>
          <button onClick={()=>setLang("es")} style={segBtn(lang==="es")}>ES — Español</button>
        </div>
      </div>
      {/* Individual vs Couple toggle */}
      <div style={{marginBottom:14}}>
        <label style={lbl()}>{t?.intakeHouseholdLbl||"Are you applying as an individual or a couple?"}</label>
        <div style={{display:"flex",gap:8}}>
          {[{id:"single",lbl:t?.householdSingle||"Just me",emoji:"👤"},{id:"couple",lbl:t?.householdCouple||"Partner & me",emoji:"💑"}].map(opt=><button key={opt.id} type="button" onClick={()=>setHouseholdType(opt.id)} style={{flex:1,padding:"10px 14px",borderRadius:8,border:`2px solid ${householdType===opt.id?GOLD:th.cardBorder}`,background:householdType===opt.id?GOLD+"22":"transparent",color:th.text,cursor:"pointer",fontSize:12,fontWeight:600,textAlign:"left",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{opt.emoji}</span>{opt.lbl}</button>)}
        </div>
      </div>
      {/* Prospect Name + Email */}
      <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8,marginTop:4}}>{householdType==="couple"?(t?.intakePrimaryProspect||"Primary prospect"):(t?.intakeProspect||"Prospect")}</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <label style={lbl()}>{(t?.intakeProspectName||"Full name")+" *"}</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t?.intakeProspectNamePh||"Jane Doe"} style={inp}/>
        </div>
        <div>
          <label style={lbl()}>{(t?.email||"Email")+" *"}</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="jane@email.com" style={inp}/>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={lbl()}>{(t?.phone||"Phone")+" ("+(t?.optional||"optional")+")"}</label>
        <input type="tel" value={phone} onChange={e=>setPhone(fmtPh?fmtPh(e.target.value):e.target.value)} placeholder="(305) 555-0000" style={inp} inputMode="tel" autoComplete="tel"/>
      </div>
      {/* Partner block — only when couple */}
      {householdType==="couple"&&<>
        <div style={{height:1,background:th.cardBorder,margin:"4px 0 14px"}}/>
        <div style={{fontSize:10,fontWeight:700,color:GOLD,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>{t?.intakePartner||"Partner"}</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <label style={lbl()}>{(t?.partnerFullNameLbl||"Partner full name")+" *"}</label>
            <input value={partnerName} onChange={e=>setPartnerName(e.target.value)} placeholder={t?.partnerNamePh||"John Doe"} style={inp}/>
          </div>
          <div>
            <label style={lbl()}>{(t?.partnerEmailLbl||"Partner email")+" ("+(t?.optional||"optional")+")"}</label>
            <input type="email" value={partnerEmail} onChange={e=>setPartnerEmail(e.target.value)} placeholder="john@email.com" style={inp}/>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={lbl()}>{(t?.partnerPhoneLbl||"Partner phone")+" ("+(t?.optional||"optional")+")"}</label>
          <input type="tel" value={partnerPhone} onChange={e=>setPartnerPhone(fmtPh?fmtPh(e.target.value):e.target.value)} placeholder="(305) 555-0000" style={inp} inputMode="tel" autoComplete="tel"/>
        </div>
      </>}
      {/* Note */}
      <div style={{marginBottom:18}}>
        <label style={lbl()}>{(t?.intakeNewInviteNoteLbl||"Personal note")+" ("+(t?.optional||"optional")+")"}</label>
        <textarea rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder={notePh} style={{...inp,resize:"vertical",lineHeight:1.5,fontFamily:"inherit"}}/>
      </div>
      {/* Error / Submit */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div style={{fontSize:11,color:th.neg,fontWeight:600,flex:"1 1 200px"}}>{err}</div>
        <button onClick={submit} disabled={busy||sent} style={{padding:"10px 22px",fontSize:12,borderRadius:8,background:sent?th.pos:GOLD,color:sent?"#fff":"#0D1B2A",border:"none",cursor:busy?"default":"pointer",fontWeight:700,whiteSpace:"nowrap",opacity:busy&&!sent?0.6:1}}>
          {sent?("✓ "+(t?.intakeInviteSent||"Invite sent")):busy?(t?.intakeSendBusy||"Sending…"):("📨 "+(lang==="es"?(t?.intakeSendInviteEs||"Enviar invitación"):(t?.intakeSendInviteEn||"Send invite")))}
        </button>
      </div>
    </div>
  </div>;
}

/* ── INTAKE SUBMISSIONS — v0.29.0 admin page rebuild ──────────────────────
   Header with collapsible Public URL toggle + New Invite button.
   Filter pills (All / Pending / Reviewed / Approved).
   Submissions table with row kebab menu (10 items mirroring the modal).
   Old "Send invite" + "Sent invites" disclosures are GONE — the new modal
   covers send, and the kebab covers per-row resend / open / copy / etc. */
function IntakeSubmissionsPage({t,authUser,onConvert,settings}){
  const th=useTh();
  const{isMobile}=useViewport();
  const[subs,setSubs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[sel,setSel]=useState(null);
  const[convertConfirm,setConvertConfirm]=useState(null);
  const[urlCopied,setUrlCopied]=useState("");
  const[editing,setEditing]=useState(null);
  const[deleteConfirm,setDeleteConfirm]=useState(null);
  // v0.29.0 — new UI state
  const[urlOpen,setUrlOpen]=useState(false);              // Public URL toggle (collapsed by default)
  const[inviteOpen,setInviteOpen]=useState(false);        // New Invite modal
  const[filter,setFilter]=useState("all");                // all|pending|reviewed|approved|archived
  const[menuOpenId,setMenuOpenId]=useState(null);         // which row's kebab is open
  // Close kebab on Esc or outside-click
  useEffect(()=>{if(!menuOpenId)return;const h=e=>{if(e.key==="Escape")setMenuOpenId(null);};const c=e=>{if(!e.target.closest||!e.target.closest("[data-row-kebab]"))setMenuOpenId(null);};document.addEventListener("keydown",h);document.addEventListener("mousedown",c);return()=>{document.removeEventListener("keydown",h);document.removeEventListener("mousedown",c);};},[menuOpenId]);
  const publicBase=(typeof window!=="undefined"?window.location.origin:"")+"/intake?advisor="+(authUser?.id||"");
  const publicUrlEs=publicBase+"&lang=es";
  useEffect(()=>{let cancelled=false;(async()=>{const list=await gaLoadIntakeSubmissions(authUser?.id);if(!cancelled){setSubs(list);setLoading(false);}})();return()=>{cancelled=true;};},[authUser?.id]);
  // v0.6.1 — Robust copy: try Clipboard API first, fall back to execCommand on a
  // hidden textarea. If both fail, prompt() so the user can copy manually.
  const copyUrl=async(url,which)=>{
    let ok=false;
    try{if(typeof navigator!=="undefined"&&navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);ok=true;}}catch{}
    if(!ok&&typeof document!=="undefined"){try{const ta=document.createElement("textarea");ta.value=url;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.top="-1000px";ta.style.opacity="0";document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,url.length);ok=document.execCommand("copy");document.body.removeChild(ta);}catch{}}
    if(ok){setUrlCopied(which);setTimeout(()=>setUrlCopied(""),2000);}
    else{try{window.prompt(t.intakeCopyUrl||"Copy",url);}catch{}}
  };
  const setStatus=async(id,status,extras)=>{const patch={status,reviewed_at:new Date().toISOString(),...(extras||{})};const ok=await gaUpdateIntakeStatus(id,patch);if(ok)setSubs(s=>s.map(x=>x.id===id?{...x,...patch}:x));return ok;};
  const doDelete=async(id)=>{const ok=await gaDeleteIntakeSubmission(id);if(ok){setSubs(s=>s.filter(x=>x.id!==id));if(sel&&sel.id===id)setSel(null);}return ok;};
  const doClearByStatus=async(status)=>{const n=await gaDeleteIntakeSubmissionsByStatus(authUser?.id,status);if(n>0){setSubs(s=>s.filter(x=>x.status!==status));if(sel&&sel.status===status)setSel(null);}return n;};
  const saveEdit=async(updatedData)=>{const ok=await gaUpdateIntakeData(editing.id,updatedData);if(ok){setSubs(s=>s.map(x=>x.id===editing.id?{...x,data:updatedData}:x));setEditing(null);}return ok;};
  const doConvert=async(sub)=>{
    const d=sub.data||{};
    const submittedNote="Submitted via public intake on "+new Date(sub.created_at).toLocaleDateString()+".";
    const existingGeneral=(d.notes&&d.notes.general)||"";
    const generalCombined=existingGeneral?existingGeneral+"\n"+submittedNote:submittedNote;
    const legacyNotes=(!d.notes&&(d.goals||d.notes_text))?{shortTerm:"",midTerm:"",longTerm:"",setbacks:"",goals:d.goals||"",general:[d.notes_text||"",d.preferredService?("Requested service: "+d.preferredService):"",d.contactMethod?("Preferred contact: "+d.contactMethod):"",submittedNote].filter(Boolean).join("\n")}:null;
    const baseClient={...d,id:gid(),archived:false,hideNumbers:false,monthSnapshots:[],color1:d.color1||"#4472C4",color2:d.partnerFirst?(d.color2||"#ED7D31"):null,recommendedBy:d.recommendedBy||d.howHeard||"",clientType:d.clientType||(d.preferredService==="insurance-consult"?"financeAndHealth":"financeOnly"),notes:legacyNotes||{shortTerm:"",midTerm:"",longTerm:"",setbacks:"",goals:"",...(d.notes||{}),general:generalCombined}};
    if(!Array.isArray(d.incomeStreams)&&d.monthlyNetIncome&&+d.monthlyNetIncome>0){
      baseClient.incomeStreams=[{id:gid(),person:"p1",label:"Main Job",gross:Math.round(+d.monthlyNetIncome*1.3),net:+d.monthlyNetIncome,freq:"monthly2"}];
    }
    const newClient=mig(baseClient);
    // v0.29.0 — Convert sets status='approved' (the 'converted' value is gone post-migration).
    // We still track converted_at + client_local_id for the audit trail.
    await setStatus(sub.id,"approved",{approved_at:new Date().toISOString(),converted_at:new Date().toISOString(),client_local_id:String(newClient.id)});
    onConvert(newClient);
  };
  // v0.29.0 — derived state
  const pendingCount=subs.filter(s=>s.status==="pending").length;
  const visibleSubs=subs.filter(s=>{if(filter==="all")return s.status!=="archived";return s.status===filter;}).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const statusColor=st=>st==="pending"?th.warn:st==="reviewed"?th.blue:st==="approved"?th.pos:st==="archived"?th.dim:th.muted;
  const statusLabelFor=st=>st==="pending"?(t.intakeStatusPending||"Pending"):st==="reviewed"?(t.intakeStatusReviewed||"Reviewed"):st==="approved"?(t.intakeStatusApproved||"Approved"):st==="archived"?(t.intakeStatusArchived||"Archived"):st;
  const svcName=id=>{const s=SVCS.find(x=>x.id===id);return s?(s[_gaLang()]||s.en):(id||"—");};
  // Per-row resend invite — reuses prospect info from the submission's data
  const resendInvite=async(sub,lng)=>{const d=sub.data||{};const r=await gaSendIntakeInvite({prospectName:((d.firstName||"")+" "+(d.lastName||"")).trim(),prospectEmail:d.email||"",prospectPhone:d.phone||"",lang:lng||sub.lang||"en",channelEmail:true,channelSms:false,smsConsent:false,advisorName:settings?.advisorName||"",advisorEmail:settings?.advisorEmail||""});if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("ga-toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?(t.intakeResentToast||"Invite resent"):(t.intakeSendFailed||"Send failed")}}));setMenuOpenId(null);};
  // Returns the public intake URL for a submission's language
  const copySubmissionLink=async(sub)=>{const url=publicBase+(sub.lang==="es"||sub.data?.lang==="es"?"&lang=es":"");try{await navigator.clipboard.writeText(url);}catch{try{window.prompt("Copy",url);}catch{}}if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("ga-toast",{detail:{kind:"success",msg:t.intakeLinkCopiedToast||"Intake link copied"}}));setMenuOpenId(null);};
  const messageProspect=(sub)=>{const e=sub.data?.email;if(!e){setMenuOpenId(null);return;}window.location.href="mailto:"+e+"?subject="+encodeURIComponent("Golden Anchor — follow-up");setMenuOpenId(null);};
  return<>
    <NewInviteModal open={inviteOpen} onClose={()=>setInviteOpen(false)} settings={settings} t={t} onSent={async()=>{const fresh=await gaLoadIntakeSubmissions(authUser?.id);setSubs(fresh);}}/>
    <div style={{padding:isMobile?"16px 14px":"22px 20px",maxWidth:1280,margin:"0 auto"}}>
    {/* v0.29.0 — Header row: counter + Public-URL toggle pill + New Invite button */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
      <div style={{fontSize:12,fontWeight:600,letterSpacing:"0.04em"}}>
        <span style={{color:GOLD,fontWeight:700}}>{pendingCount} {(t.intakeStatusPending||"pending").toLowerCase()}</span>
        <span style={{color:th.dim,margin:"0 8px"}}>/</span>
        <span style={{color:th.dim}}>{subs.length} {t.totalLbl||"total"}</span>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={()=>setUrlOpen(o=>!o)} aria-expanded={urlOpen} style={{padding:"7px 14px",borderRadius:999,background:urlOpen?GOLD+"1A":"transparent",border:"1px solid "+GOLD+"55",color:GOLD,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6,transition:"background-color 150ms ease"}}>
          <span style={{display:"inline-block",transition:"transform 200ms ease",transform:urlOpen?"rotate(90deg)":"rotate(0)"}}>▶</span>
          📋 {t.publicIntakeUrl||"Public intake URL"}
        </button>
        <BSolid onClick={()=>setInviteOpen(true)}>📨 {t.intakeNewInviteBtn||"New invite"}</BSolid>
      </div>
    </div>
    {/* v0.29.0 — Collapsible URL card (was always-open + had send-invite/sent-invites
        disclosures inline; both removed in favor of NewInviteModal + row kebab) */}
    {urlOpen&&<div style={{...mCARD(th),padding:18,marginBottom:14}}>
      <div style={{fontSize:11,color:th.muted,marginBottom:14,lineHeight:1.6}}>{t.intakeShareUrlHelp||"Anyone with this URL can submit an intake. Submissions land in the table below. Use the ES link for Spanish-speaking prospects."}</div>
      {[{lang:"EN",url:publicBase,k:"en"},{lang:"ES",url:publicUrlEs,k:"es"}].map(row=><div key={row.k} style={{display:"flex",gap:8,marginBottom:row.k==="en"?8:0,alignItems:"center"}}>
        <div style={{width:32,height:26,display:"flex",alignItems:"center",justifyContent:"center",background:GOLD+"1A",border:"1px solid "+GOLD+"44",borderRadius:6,color:GOLD,fontWeight:800,fontSize:10,letterSpacing:"0.06em",flexShrink:0}}>{row.lang}</div>
        <input value={row.url} readOnly onClick={e=>e.target.select()} title={row.url} style={{flex:1,minWidth:0,padding:"8px 10px",fontSize:11,fontFamily:"'JetBrains Mono',monospace",background:th.inp,border:"1px solid "+th.inpBorder,color:th.text,borderRadius:6,cursor:"text",textOverflow:"ellipsis"}}/>
        <button onClick={()=>copyUrl(row.url,row.k)} style={{padding:"8px 16px",fontSize:11,borderRadius:8,background:urlCopied===row.k?th.pos+"1A":"transparent",color:urlCopied===row.k?th.pos:GOLD,border:"1px solid "+(urlCopied===row.k?th.pos+"66":GOLD+"55"),cursor:"pointer",fontWeight:700,whiteSpace:"nowrap",flexShrink:0,transition:"all 150ms ease"}}>{urlCopied===row.k?"✓ "+(t.intakeCopiedShort||"Copied"):(t.intakeCopyUrl||"Copy")}</button>
      </div>)}
    </div>}
    {/* v0.29.0 — Filter pills */}
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      {[["all",t.allLbl||"All",subs.filter(x=>x.status!=="archived").length],["pending",t.intakeStatusPending||"Pending",subs.filter(x=>x.status==="pending").length],["reviewed",t.intakeStatusReviewed||"Reviewed",subs.filter(x=>x.status==="reviewed").length],["approved",t.intakeStatusApproved||"Approved",subs.filter(x=>x.status==="approved").length],["archived",t.intakeStatusArchived||"Archived",subs.filter(x=>x.status==="archived").length]].map(([k,l,n])=>{const active=filter===k;return<button key={k} onClick={()=>setFilter(k)} style={{padding:"6px 14px",borderRadius:999,background:active?GOLD+"1A":"transparent",color:active?GOLD:th.muted,border:"1px solid "+(active?GOLD+"44":th.cardBorder),cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{l} <span style={{opacity:0.7,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>({n})</span></button>;})}
    </div>
    {/* v0.29.0 — Submissions table */}
    {loading?<div style={{textAlign:"center",color:th.muted,padding:40,fontSize:13}}>{t.loadingClients||"Loading…"}</div>:
     visibleSubs.length===0?<div style={{...mCARD(th),padding:32,textAlign:"center"}}>
       <div style={{fontSize:36,marginBottom:10}}>📭</div>
       <div style={{fontSize:14,color:th.text,marginBottom:6,fontWeight:600}}>{t.intakeNoSubmissions||"No intake submissions yet."}</div>
       <div style={{fontSize:11,color:th.muted,lineHeight:1.6,maxWidth:380,margin:"0 auto"}}>{filter==="all"?(t.intakeNoSubmissionsHelp||"Share your public intake URL with prospects to receive submissions here."):(t.intakeNoMatching||"No submissions match this filter.")}</div>
     </div>:
     <div style={{...mCARD(th),padding:0,overflow:"visible"}}>
       <div style={{overflowX:"auto"}}>
       <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,tableLayout:"auto"}}>
         <thead><tr style={{borderBottom:"1px solid "+th.cardBorder}}>
           <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:th.muted,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{t.intakeColSubmitted||"Submitted"}</th>
           <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:th.muted,letterSpacing:"0.05em",textTransform:"uppercase"}}>{t.intakeColProspect||"Prospect"}</th>
           <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:th.muted,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{t.intakeColService||"Service"}</th>
           <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:th.muted,letterSpacing:"0.05em",textTransform:"uppercase"}}>{t.intakeColLang||"Lang"}</th>
           <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:th.muted,letterSpacing:"0.05em",textTransform:"uppercase"}}>{t.intakeColStatus||"Status"}</th>
           <th style={{padding:"12px 16px"}}/>
         </tr></thead>
         <tbody>
         {visibleSubs.map((s,idx)=>{
           const d=s.data||{};
           const fullName=((d.firstName||"")+" "+(d.lastName||"")).trim()||"(no name)";
           const rowLang=(s.lang||d.lang||"en").toLowerCase();
           const isMenu=menuOpenId===s.id;
           const cellSt={padding:"14px 16px",borderTop:idx===0?"none":"1px solid "+th.cardBorder,verticalAlign:"middle"};
           return<tr key={s.id}>
             <td style={{...cellSt,whiteSpace:"nowrap",color:th.muted,fontSize:11}}>{new Date(s.created_at).toLocaleDateString()}</td>
             <td style={cellSt}>
               <div style={{fontSize:13,fontWeight:700,color:th.text}}>{fullName}</div>
               <div style={{fontSize:11,color:th.muted,marginTop:2}}>{d.email||""}</div>
             </td>
             <td style={{...cellSt,color:th.muted,fontSize:12}}>{svcName(d.preferredService)}</td>
             <td style={cellSt}><Pill color={rowLang==="es"?GOLD:th.blue}>{rowLang.toUpperCase()}</Pill></td>
             <td style={cellSt}><Pill color={statusColor(s.status)}>{statusLabelFor(s.status)}</Pill></td>
             <td style={{...cellSt,textAlign:"right",whiteSpace:"nowrap",position:"relative"}} data-row-kebab>
               <Btn small onClick={()=>setSel(sel?.id===s.id?null:s)}>{t.intakeOpenBtn||"Open"}</Btn>
               <button onClick={e=>{e.stopPropagation();setMenuOpenId(isMenu?null:s.id);}} aria-label={t.openMenu||"Open menu"} aria-haspopup="menu" aria-expanded={isMenu} style={{width:28,height:28,padding:0,marginLeft:6,borderRadius:8,background:"transparent",border:"1px solid "+th.cardBorder,color:th.muted,cursor:"pointer",fontSize:14,verticalAlign:"middle"}}>⋯</button>
               {isMenu&&<div role="menu" style={{position:"absolute",top:42,right:14,minWidth:240,background:th.modal,border:"1px solid "+th.cardBorder,borderRadius:12,padding:6,boxShadow:"0 8px 24px rgba(0,0,0,0.25)",zIndex:"var(--ga-z-dropdown, 70)",textAlign:"left"}}>
                 {[
                   {key:"open",l:"👁️ "+(t.intakeMenuOpen||"Open submission"),fn:()=>{setSel(s);setMenuOpenId(null);}},
                   {key:"resend",l:"📨 "+(rowLang==="es"?(t.intakeMenuResendEs||"Resend invite (ES)"):(t.intakeMenuResendEn||"Resend invite (EN)")),fn:()=>resendInvite(s,rowLang)},
                   {key:"copylink",l:"🔗 "+(t.intakeMenuCopyLink||"Copy intake link"),fn:()=>copySubmissionLink(s)},
                   {key:"message",l:"💬 "+(t.intakeMenuMessage||"Message prospect"),fn:()=>messageProspect(s),disabled:!d.email},
                   {divider:true,key:"d1"},
                   ...(s.status!=="reviewed"&&s.status!=="approved"?[{key:"review",l:"✓ "+(t.intakeMarkReviewed||"Mark as reviewed"),fn:async()=>{await setStatus(s.id,"reviewed");setMenuOpenId(null);}}]:[]),
                   ...(s.status!=="approved"?[{key:"approve",l:"⭐ "+(t.intakeMarkApproved||"Mark as approved"),fn:async()=>{await setStatus(s.id,"approved",{approved_at:new Date().toISOString()});setMenuOpenId(null);}}]:[]),
                   {key:"convert",l:"➕ "+(t.intakeConvertBtn||"Convert to client"),fn:()=>{setConvertConfirm(s);setMenuOpenId(null);}},
                   {divider:true,key:"d2"},
                   {key:"archive",l:"🗑 "+(t.intakeMenuArchive||"Archive"),fn:async()=>{await setStatus(s.id,"archived",{archived_at:new Date().toISOString()});setMenuOpenId(null);},danger:true},
                 ].map(it=>it.divider?<div key={it.key} style={{height:1,background:th.cardBorder,margin:"4px 4px"}}/>:<button key={it.key} onClick={it.fn} disabled={it.disabled} style={{display:"block",width:"100%",padding:"8px 10px",borderRadius:8,fontSize:12,fontWeight:600,background:"transparent",color:it.disabled?th.dim:(it.danger?th.neg:th.text),border:"none",cursor:it.disabled?"not-allowed":"pointer",textAlign:"left",whiteSpace:"nowrap"}} onMouseEnter={e=>{if(!it.disabled)e.currentTarget.style.background=th.accent+"14";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>{it.l}</button>)}
               </div>}
             </td>
           </tr>;
         })}
         </tbody>
       </table>
       </div>
     </div>
    }
    {sel&&<div style={{...mCARD(th),padding:isMobile?16:20,marginTop:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700,color:th.text}}>{((sel.data?.firstName||"")+" "+(sel.data?.lastName||"")).trim()}</div>
        <button onClick={()=>setSel(null)} aria-label={t?.close||"Close"} title={t?.close||"Close"} style={{background:"none",border:"none",color:th.muted,fontSize:22,cursor:"pointer",minWidth:36,minHeight:36}}>×</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(220px,1fr))",gap:8,marginBottom:18,fontSize:12}}>
        {Object.entries(sel.data||{}).map(([k,v])=>{
          let val=v;if(typeof val==="boolean")val=val?"✓":"";
          if(val===null||val===undefined||val==="")return null;
          return<div key={k} style={{padding:"6px 0",borderBottom:"1px solid "+th.cardBorder}}><span style={{color:th.dim,fontSize:10,textTransform:"uppercase",letterSpacing:"0.05em",marginRight:6}}>{k}:</span><span style={{color:th.text,wordBreak:"break-word"}}>{String(val)}</span></div>;
        })}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <BSolid onClick={()=>setConvertConfirm(sel)}>↪ {t.intakeConvertBtn||"Convert to Client"}</BSolid>
        <Btn onClick={()=>setEditing(sel)} color={th.blue}>✏️ {t.intakeEditBtn||"Edit Intake"}</Btn>
        {sel.status==="pending"&&<Btn onClick={async()=>{await setStatus(sel.id,"reviewed");}}>{t.intakeMarkReviewed||"Mark Reviewed"}</Btn>}
        {sel.status!=="approved"&&<Btn onClick={async()=>{await setStatus(sel.id,"approved",{approved_at:new Date().toISOString()});}}>⭐ {t.intakeMarkApproved||"Mark Approved"}</Btn>}
        {sel.status!=="archived"&&<Btn color={th.dim} onClick={async()=>{await setStatus(sel.id,"archived",{archived_at:new Date().toISOString()});setSel(null);}}>🗑 {t.intakeMenuArchive||"Archive"}</Btn>}
        <Btn onClick={()=>setDeleteConfirm(sel)} color={th.neg}>🗑️ {t.intakeDeleteBtn||"Delete"}</Btn>
      </div>
    </div>}
    {convertConfirm&&<Modal title={t.intakeConvertBtn||"Convert to Client"} onClose={()=>setConvertConfirm(null)} width={420}>
      <div style={{fontSize:13,color:th.text,marginBottom:8}}>{t.intakeConfirmConvert||"Convert this submission into a new client?"}</div>
      <div style={{fontSize:11,color:th.muted,marginBottom:18}}>{t.firstName}: <b style={{color:th.text}}>{((convertConfirm.data?.firstName||"")+" "+(convertConfirm.data?.lastName||"")).trim()}</b></div>
      <SaveBar onSave={async()=>{await doConvert(convertConfirm);setConvertConfirm(null);}} onCancel={()=>setConvertConfirm(null)} t={t} saveLabel={t.intakeConvertBtn||"Convert"}/>
    </Modal>}
    {deleteConfirm&&<Modal title={t.intakeDeleteBtn||"Delete Submission"} onClose={()=>setDeleteConfirm(null)} width={420}>
      <div style={{fontSize:13,color:th.text,marginBottom:8}}>{t.intakeConfirmDelete||"Delete this submission? This cannot be undone."}</div>
      <div style={{fontSize:11,color:th.muted,marginBottom:18}}>{t.firstName}: <b style={{color:th.text}}>{((deleteConfirm.data?.firstName||"")+" "+(deleteConfirm.data?.lastName||"")).trim()}</b></div>
      <SaveBar onSave={async()=>{await doDelete(deleteConfirm.id);setDeleteConfirm(null);}} onCancel={()=>setDeleteConfirm(null)} t={t} saveLabel={t.intakeDeleteBtn||"Delete"}/>
    </Modal>}
    {editing&&<IntakeSubmissionEditor submission={editing} onSave={saveEdit} onCancel={()=>setEditing(null)} t={t}/>}
    </div>
  </>;
}

/* ── IntakeSubmissionEditor (v0.7.1) ─────────────────────────────────────── */
function IntakeSubmissionEditor({submission,onSave,onCancel,t}){
  const th=useTh();
  const[draft,setDraft]=useState(()=>mig({...mk(),...(submission.data||{}),id:gid(),monthSnapshots:[]}));
  const[saving,setSaving]=useState(false);
  const TH={bg:th.bg,text:th.text,muted:th.muted,dim:th.dim,pos:th.pos,neg:th.neg,accent:th.accent,card:th.card,cardBorder:th.cardBorder,inp:th.inp,inpBorder:th.inpBorder||th.cardBorder,modal:th.modal,warn:th.warn,blue:th.blue};
  const lang=_gaLang();
  const handleSave=async()=>{
    setSaving(true);
    const payload={...draft,monthSnapshots:[],savedCalcs:[],savedCompare:null,savedPortfolio:null};
    delete payload.id;delete payload.archived;delete payload.hideNumbers;delete payload.currentMonthLabel;
    const ok=await onSave(payload);
    if(!ok)setSaving(false);
  };
  return<Modal title={"✏️ "+((t.intakeEditBtn||"Edit Intake")+" — "+((submission.data?.firstName||"")+" "+(submission.data?.lastName||"")).trim())} onClose={onCancel} width={800}>
    <div style={{maxHeight:"70vh",overflowY:"auto",paddingRight:6}}>
      <IntakeFormBody draft={draft} setDraft={setDraft} t={t} TH={TH} lang={lang}/>
    </div>
    <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${th.cardBorder}`,display:"flex",gap:8,justifyContent:"flex-end"}}>
      <Btn onClick={onCancel}>{t.cancel||"Cancel"}</Btn>
      <BSolid onClick={handleSave} disabled={saving}>{saving?"…":(t.save||"Save")}</BSolid>
    </div>
  </Modal>;
}

// v0.13.0 — Deep-linkable URLs. Maps in-app navigation state {nav, selectedId,
// selectedTab} to a real URL path so refresh / bookmark / share / browser
// Back-Forward all work. The /intake route stays under D-28 (handled by
// isPublicIntakeRoute) and is not parsed here.

export { IntakeCurrencyInput, IntakeDoneModal, IntakeFieldLabel, IntakeFormBody, IntakeFormSection, IntakeSelectedServiceCard, IntakeStepRail, IntakeSubmissionEditor, IntakeSubmissionsPage, IntakeWelcomeStage, NewInviteModal, PublicIntake, isMobileViewport };
