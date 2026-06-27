// Extracted from App.jsx in Phase 2a of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-10).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState, useEffect, useRef } from "react";
import { Anchor } from "lucide-react";
import { useReducedMotion } from "../hooks/anim";
import { supabase } from "../services/supabase";
import { Donut, SmoothAreaLine, RadialGauge } from "../components/charts";

const LOTTIE_HERO_URL = ""; // <- paste LottieFiles JSON URL here to enable Lottie hero
function HeroVisual({palette,reducedMotion}){
  const [LottieComp,setLottieComp]=useState(null);
  const [lottieData,setLottieData]=useState(null);
  useEffect(()=>{
    if(!LOTTIE_HERO_URL||reducedMotion)return;
    let cancelled=false;
    import("lottie-react").then(m=>{if(!cancelled)setLottieComp(()=>m.default);}).catch(()=>{});
    fetch(LOTTIE_HERO_URL).then(r=>r.ok?r.json():null).then(j=>{if(!cancelled&&j)setLottieData(j);}).catch(()=>{});
    return()=>{cancelled=true;};
  },[reducedMotion]);
  // Pause animations when tab is hidden — saves battery on idle.
  const[visible,setVisible]=useState(true);
  useEffect(()=>{const h=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",h);return()=>document.removeEventListener("visibilitychange",h);},[]);
  if(LottieComp&&lottieData&&!reducedMotion){
    return<LottieComp animationData={lottieData} loop autoplay={visible} style={{width:"100%",height:"100%"}}/>;
  }
  // SVG fallback — animated gold rings + anchor monogram + drifting particles.
  const animate=!reducedMotion&&visible;
  return<svg viewBox="0 0 400 400" style={{width:"100%",height:"100%",overflow:"visible"}} aria-hidden="true">
    <defs>
      <radialGradient id="hero-glow-r" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={palette.amber} stopOpacity="0.35"/>
        <stop offset="60%" stopColor={palette.gold} stopOpacity="0.10"/>
        <stop offset="100%" stopColor={palette.gold} stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="hero-arc-l" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={palette.gold}/>
        <stop offset="50%" stopColor={palette.amber}/>
        <stop offset="100%" stopColor={palette.gold}/>
      </linearGradient>
    </defs>
    <circle cx="200" cy="200" r="180" fill="url(#hero-glow-r)"/>
    <circle cx="200" cy="200" r="160" fill="none" stroke="url(#hero-arc-l)" strokeWidth="0.75" strokeOpacity="0.55" strokeDasharray="4 6">
      {animate&&<animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="60s" repeatCount="indefinite"/>}
    </circle>
    <circle cx="200" cy="200" r="128" fill="none" stroke={palette.amber} strokeWidth="0.5" strokeOpacity="0.45" strokeDasharray="2 8">
      {animate&&<animateTransform attributeName="transform" type="rotate" from="360 200 200" to="0 200 200" dur="45s" repeatCount="indefinite"/>}
    </circle>
    <g>
      <path d="M 200 80 A 120 120 0 0 1 320 200" fill="none" stroke="url(#hero-arc-l)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
      {animate&&<animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="18s" repeatCount="indefinite"/>}
    </g>
    <image href="/anchor-monogram.svg" x="155" y="155" width="90" height="90" opacity="0.95"/>
    {animate&&[0,1,2,3,4,5].map(i=>{
      const angle=(i/6)*Math.PI*2;
      const cx=200+Math.cos(angle)*145;
      const cy=200+Math.sin(angle)*145;
      return<g key={i}><circle cx={cx} cy={cy} r="2.5" fill={palette.gold} opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3.5s" begin={`${i*0.5}s`} repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="30s" repeatCount="indefinite"/>
      </circle></g>;
    })}
  </svg>;
}

function Login({onLogin,t,isDark,onToggle,lang,onLangToggle,onShowPricing,onBackToLanding}){
  const reducedMotion=useReducedMotion();
  const[em,setEm]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");const[busy,setBusy]=useState(false);const[mode,setMode]=useState("signin");const[info,setInfo]=useState("");const[showPw,setShowPw]=useState(false);const[signupRole,setSignupRole]=useState("client");
  // Detect Supabase password-recovery callback (URL hash contains type=recovery)
  useEffect(()=>{if(typeof window==="undefined")return;const h=window.location.hash||"";if(h.includes("type=recovery")){setMode("setNew");setInfo(t.resetSetNewIntro||"Enter your new password below.");}},[]);
  // v0.78 — hero email-capture handoff: land directly in signup with the email prefilled
  useEffect(()=>{try{const e=sessionStorage.getItem("ga_signup_email");if(e!=null){sessionStorage.removeItem("ga_signup_email");setMode("signup");if(e)setEm(e);}}catch(_e){}},[]);
  const go=async()=>{
    setErr("");setInfo("");
    if(!supabase){setErr((t.supabaseError||"Connection error. Please reload.")+" (env vars missing)");return;}
    setBusy(true);
    try{
      if(mode==="signin"){
        const{data,error}=await supabase.auth.signInWithPassword({email:em,password:pw});
        if(error){const m=error.message||"";if(/confirm/i.test(m)){setMode("verify");setInfo("");setBusy(false);return;}setErr(m||"Invalid credentials.");setBusy(false);return;}
        if(data?.session?.user){onLogin(data.session.user);}else{setErr("No session.");setBusy(false);}
      }else if(mode==="forgot"){
        if(!em){setErr(t.emailRequired||"Email required.");setBusy(false);return;}
        const redirectTo=(typeof window!=="undefined")?window.location.origin:undefined;
        const{error}=await supabase.auth.resetPasswordForEmail(em,{redirectTo});
        if(error){setErr(error.message||"Reset failed.");setBusy(false);return;}
        setInfo(t.resetEmailSent||"If that email exists in our system, a reset link has been sent. Check your inbox.");
        setBusy(false);
      }else if(mode==="setNew"){
        if(!pw||pw.length<8){setErr(t.passwordMin8||"Password must be at least 8 characters.");setBusy(false);return;}
        const{data,error}=await supabase.auth.updateUser({password:pw});
        if(error){setErr(error.message||"Password update failed.");setBusy(false);return;}
        setInfo(t.resetDone||"Password updated. Signing you in…");
        if(data?.user){setTimeout(()=>{if(typeof window!=="undefined"&&window.location.hash)window.location.hash="";onLogin(data.user);},700);}else{setBusy(false);}
      }else if(mode==="signup"){
        if(!em||em.indexOf("@")<0){setErr(t.emailRequired||"Valid email required.");setBusy(false);return;}
        if(!pw||pw.length<8){setErr(t.passwordMin8||"Password must be at least 8 characters.");setBusy(false);return;}
        const redirectTo=(typeof window!=="undefined")?window.location.origin:undefined;
        const{data,error}=await supabase.auth.signUp({email:em,password:pw,options:{emailRedirectTo:redirectTo,data:{role:signupRole}}});
        if(error){setErr(error.message||"Sign-up failed.");setBusy(false);return;}
        if(data?.session?.user){onLogin(data.session.user);}else{setMode("verify");setInfo("");setBusy(false);}
      }else if(mode==="verify"){
        if(!em){setErr(t.emailRequired||"Email required.");setBusy(false);return;}
        const redirectTo=(typeof window!=="undefined")?window.location.origin:undefined;
        const{error}=await supabase.auth.resend({type:"signup",email:em,options:{emailRedirectTo:redirectTo}});
        if(error){setErr(error.message||"Resend failed.");setBusy(false);return;}
        setInfo(lang==="es"?"Correo de confirmación reenviado. Revisa tu bandeja (y spam).":"Confirmation email re-sent. Check your inbox (and spam).");
        setBusy(false);
      }
    }catch(e){setErr(e?.message||"Operation failed.");setBusy(false);}
  };
  const INP={background:isDark?"#111827":"#F0F7FF",border:`1px solid ${isDark?"#4B5563":"#CBD5E1"}`,color:isDark?"#F1F5F9":"#0F172A",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"};
  const switchMode=(m)=>{setMode(m);setErr("");setInfo("");setPw("");};
  const title=mode==="forgot"?(t.resetPassword||"Reset Password"):mode==="setNew"?(t.setNewPassword||"Set New Password"):mode==="signup"?(lang==="es"?"Crear cuenta":"Create account"):mode==="verify"?(lang==="es"?"Confirma tu correo":"Confirm your email"):(t.signIn||"Sign In");
  const btnLabel=mode==="forgot"?(t.sendResetLink||"Send Reset Link"):mode==="setNew"?(t.updatePassword||"Update Password"):mode==="signup"?(lang==="es"?"Crear cuenta":"Create account"):mode==="verify"?(lang==="es"?"Reenviar correo de confirmación":"Resend confirmation email"):(t.signIn||"Sign In");
  // v0.54.0 (PR 1 from HANDOFF-v0.46) — landing page rework:
  //   - Personal credentials stripped (no MBA/FPWMP/FL0215/Mauricio name).
  //     The hero is about the product, not the advisor.
  //   - Theme toggle actually toggles the landing now (PAL is theme-aware).
  //   - Hero headline replaced with the spec line + amber "advisor" accent.
  //   - Footer disclaimer reworded to product-only, no personal name.
  // v0.60 — MODERN redesign (Origin-inspired): near-black/off-white glass, clean
  // sans + mono micro-labels, thin reactive line-field, restrained gold. Auth
  // handlers (go/mode/em/pw/recovery) are unchanged above — only palette + render.
  const P = isDark ? {
    bg:"#0A0C10", glowA:"rgba(203,168,90,0.12)", card:"rgba(255,255,255,0.045)", border:"rgba(255,255,255,0.09)",
    text:"#EDEFF2", muted:"#9AA3AF", dim:"#626B78", gold:"#CBA85A", accent:"#E2C375", inp:"rgba(255,255,255,0.05)",
    blur:"blur(16px)", shadow:"none", line:[203,168,90],
  } : {
    bg:"#FAFAF7", glowA:"rgba(184,144,30,0.08)", card:"#FFFFFF", border:"#ECEAE3",
    text:"#16181C", muted:"#5A6270", dim:"#9AA0A8", gold:"#B8901E", accent:"#8A6B1E", inp:"#FFFFFF",
    blur:"blur(0px)", shadow:"0 1px 2px rgba(20,20,16,0.04), 0 12px 34px rgba(20,20,16,0.04)", line:[150,116,40],
  };
  const glass = {background:P.card,border:`1px solid ${P.border}`,backdropFilter:P.blur,WebkitBackdropFilter:P.blur,boxShadow:P.shadow};
  const MONO = "'JetBrains Mono',monospace";
  const INP_L = {background:P.inp,border:`1px solid ${P.border}`,color:P.text,borderRadius:11,padding:"11px 13px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"};
  const LBL = {fontSize:9.5,color:P.dim,display:"block",marginBottom:7,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.13em"};
  const pillTog = {fontSize:12,padding:"10px 15px",minHeight:42,minWidth:52,borderRadius:99,...glass,color:P.muted,cursor:"pointer",fontWeight:600};
  // thin reactive gold line-field (follows cursor, drifts when idle, reduced-motion-safe)
  const fieldRef = useRef(null);
  useEffect(()=>{
    const c=fieldRef.current; if(!c) return; const ctx=c.getContext("2d");
    const DPR=Math.min(2,window.devicePixelRatio||1); const dark=isDark;
    const E={friction:0.5,trails:48,size:38,dampening:0.025,tension:0.99}; const pos={x:0,y:0};
    let lines=[],raf,running=true,phase=1.3,drift=0,lastMoveT=-1e9;
    const resize=()=>{c.width=c.clientWidth*DPR;c.height=c.clientHeight*DPR;pos.x=c.width*0.64;pos.y=c.height*0.42;};
    const Node=function(){this.x=pos.x;this.y=pos.y;this.vx=0;this.vy=0;};
    const build=()=>{lines=[];for(let i=0;i<E.trails;i++){const l={spring:0.4+(i/E.trails)*0.025,friction:E.friction+(Math.random()*0.01-0.005),nodes:[]};for(let j=0;j<E.size;j++)l.nodes.push(new Node());lines.push(l);}};
    const upd=(l)=>{let e=l.spring,t=l.nodes[0];t.vx+=(pos.x-t.x)*e;t.vy+=(pos.y-t.y)*e;for(let i=0;i<l.nodes.length;i++){t=l.nodes[i];if(i>0){const n=l.nodes[i-1];t.vx+=(n.x-t.x)*e;t.vy+=(n.y-t.y)*e;t.vx+=n.vx*E.dampening;t.vy+=n.vy*E.dampening;}t.vx*=l.friction;t.vy*=l.friction;t.x+=t.vx;t.y+=t.vy;e*=E.tension;}};
    const draw=(l)=>{ctx.beginPath();ctx.moveTo(l.nodes[0].x,l.nodes[0].y);let i;for(i=1;i<l.nodes.length-2;i++){const a=l.nodes[i],b=l.nodes[i+1];ctx.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);}const a=l.nodes[i],b=l.nodes[i+1];ctx.quadraticCurveTo(a.x,a.y,b.x,b.y);ctx.stroke();};
    const render=()=>{if(!running)return;if(performance.now()-lastMoveT>1200){drift+=0.01;pos.x=c.width*(0.62+0.26*Math.sin(drift*0.7));pos.y=c.height*(0.42+0.22*Math.cos(drift*0.9));}ctx.globalCompositeOperation="source-over";ctx.clearRect(0,0,c.width,c.height);phase+=0.0016;const sh=0.5+Math.sin(phase)*0.5;ctx.globalCompositeOperation=dark?"lighter":"source-over";const a=dark?(0.05+sh*0.06):(0.09+sh*0.09);ctx.strokeStyle=`rgba(${P.line[0]},${P.line[1]},${P.line[2]},${a})`;ctx.lineWidth=DPR*(dark?6:4.5);for(const l of lines){upd(l);draw(l);}raf=requestAnimationFrame(render);};
    const move=(e)=>{lastMoveT=performance.now();const r=c.getBoundingClientRect();const cx=e.touches?e.touches[0].clientX:e.clientX,cy=e.touches?e.touches[0].clientY:e.clientY;pos.x=(cx-r.left)*DPR;pos.y=(cy-r.top)*DPR;};
    const onR=()=>{resize();build();};
    resize();build();window.addEventListener("resize",onR);
    if(reducedMotion){for(let k=0;k<70;k++)for(const l of lines)upd(l);ctx.globalCompositeOperation=dark?"lighter":"source-over";ctx.strokeStyle=`rgba(${P.line[0]},${P.line[1]},${P.line[2]},${dark?0.06:0.09})`;ctx.lineWidth=DPR*5;for(const l of lines)draw(l);}
    else{window.addEventListener("mousemove",move);window.addEventListener("touchmove",move,{passive:true});render();}
    return ()=>{running=false;cancelAnimationFrame(raf);window.removeEventListener("resize",onR);window.removeEventListener("mousemove",move);window.removeEventListener("touchmove",move);};
  },[isDark]);
  const fIcon=(name)=>{const C={width:19,height:19,viewBox:"0 0 24 24",fill:"none",stroke:P.gold,strokeWidth:1.4,strokeLinecap:"round",strokeLinejoin:"round"};
    if(name==="flow")return <svg {...C}><path d="M3 7h4c4 0 4 10 8 10h6"/><path d="M3 17h4c4 0 4-10 8-10h6"/></svg>;
    if(name==="gauge")return <svg {...C}><path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/><circle cx="12" cy="14" r="1" fill={P.gold} stroke="none"/></svg>;
    return <svg {...C}><path d="M14 3v5h5"/><path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7z"/><path d="M9 13h6M9 17h4"/></svg>;};
  const FEATS = lang==="es"?[
    {icon:"flow",t:"A dónde va cada dólar",b:"Un flujo en vivo muestra el ingreso moviéndose hacia gastos, deuda y ahorro, al instante."},
    {icon:"gauge",t:"Salud, medida",b:"Razón de deuda, tasa de ahorro y meses de fondo de emergencia como metas claras, sin jerga."},
    {icon:"report",t:"Reportes que parecen reportes",b:"Un PDF de calidad profesional, cada sección en su página. Listo para revisar o compartir."},
  ]:[
    {icon:"flow",t:"Where every dollar goes",b:"A live flow shows income moving into bills, debt, and savings, at a glance."},
    {icon:"gauge",t:"Health, scored",b:"Debt ratio, savings rate, and emergency-fund months as clear targets, no jargon."},
    {icon:"report",t:"Reports that look like reports",b:"A designer-grade PDF, each section on its own page. Ready to review or share."},
  ];
  return<div style={{minHeight:"100vh",background:P.bg,color:P.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",position:"relative",overflowX:"hidden"}}>
    <div aria-hidden style={{position:"absolute",inset:0,zIndex:0,pointerEvents:"none"}}><canvas ref={fieldRef} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/></div>
    <div aria-hidden style={{position:"fixed",top:-180,right:80,width:560,height:560,borderRadius:"50%",background:`radial-gradient(circle,${P.glowA},transparent 70%)`,filter:"blur(50px)",pointerEvents:"none",zIndex:0}}/>

    <div style={{position:"relative",zIndex:2}}>
      <header style={{padding:"24px 40px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={onBackToLanding} title={lang==="es"?"Volver al inicio":"Back to home"} style={{display:"flex",alignItems:"center",gap:11,background:"transparent",border:"none",cursor:onBackToLanding?"pointer":"default",padding:0,textAlign:"left",fontFamily:"inherit"}}>
          <div style={{width:34,height:34,borderRadius:10,...glass,display:"flex",alignItems:"center",justifyContent:"center"}}><img src="/anchor-monogram.svg" alt="" style={{width:20,height:20}}/></div>
          <div>
            <div style={{fontWeight:700,fontSize:15,letterSpacing:"-0.01em",color:P.text,lineHeight:1}}>Golden Anchor</div>
            <div style={{fontSize:8,color:P.dim,marginTop:3,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.14em"}}>{lang==="es"?"Asesoría Financiera":"Financial Advisory"}</div>
          </div>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onBackToLanding&&<button onClick={onBackToLanding} style={pillTog}>← {lang==="es"?"Inicio":"Home"}</button>}
          {onShowPricing&&<button onClick={onShowPricing} style={pillTog}>{lang==="es"?"Precios":"Pricing"}</button>}{onLangToggle&&<button onClick={onLangToggle} aria-label={lang==="es"?"Cambiar idioma":"Toggle language"} style={pillTog}>{lang==="es"?"EN":"ES"}</button>}
          <button onClick={onToggle} aria-label={isDark?(t.switchToLight||"Switch to light mode"):(t.switchToDark||"Switch to dark mode")} style={pillTog}>{isDark?(t.lightMode||"Light"):(t.darkMode||"Dark")}</button>
        </div>
      </header>

      <section style={{maxWidth:1240,margin:"0 auto",padding:"40px 40px 30px",display:"grid",gridTemplateColumns:"minmax(0,1.5fr) minmax(0,1fr)",gap:60,alignItems:"center"}} className="ga-login-hero">
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:9,fontSize:9.5,color:P.gold,marginBottom:22,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.14em"}}>
            <span style={{width:6,height:6,borderRadius:99,background:P.gold}}/>{lang==="es"?"Plataforma de asesoría financiera":"Financial coaching platform"}
          </div>
          <h1 style={{fontWeight:500,fontSize:"clamp(2.6rem,5.6vw,4.6rem)",color:P.text,lineHeight:1.04,letterSpacing:"-0.032em",margin:"0 0 26px"}}>{lang==="es"?<>El tablero que tu <span style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontWeight:400,color:P.accent}}>asesor</span> lleva a cada reunión.</>:<>The dashboard your <span style={{fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontWeight:400,color:P.accent}}>advisor</span> brings to every meeting.</>}</h1>
          <p style={{fontSize:17,lineHeight:1.62,color:P.muted,maxWidth:520,margin:"0 0 30px"}}>{lang==="es"?"Una imagen completa de tus ingresos, gastos, deudas y ahorros, actualizada en cada sesión y resumida en un reporte mensual.":"A complete picture of your income, bills, debt, and savings, updated each session and summarized in a monthly report."}</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {(lang==="es"?["Resumen mensual","Modelos de deuda y flujo"]:["Monthly snapshot","Debt & cash-flow models"]).map((s,i)=><span key={i} style={{fontSize:9.5,padding:"7px 13px",borderRadius:99,...glass,color:P.muted,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.13em"}}>{s}</span>)}
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <div style={{...glass,borderRadius:18,padding:26,position:"relative",maxWidth:380,width:"100%"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{fontWeight:600,fontSize:19,color:P.text,margin:0,letterSpacing:"-0.01em"}}>{title}</h2>
              {mode==="signin"&&<span style={{fontSize:8.5,color:P.dim,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.13em"}}>{lang==="es"?"Portal seguro":"Secure portal"}</span>}
            </div>
            {mode==="signup"&&<p style={{fontSize:12,color:P.muted,margin:"-6px 0 18px",lineHeight:1.55}}>{lang==="es"?"Empieza gratis. Sin tarjeta. Una cuenta por correo — para un rol distinto usa otro correo.":"Start free. No card required. One account per email — use a different email for a second role."}</p>}
            {mode==="verify"&&<p style={{fontSize:12.5,color:P.muted,margin:"-6px 0 18px",lineHeight:1.6}}>{lang==="es"?<>Te enviamos un enlace de confirmación{em?<> a <b style={{color:P.text}}>{em}</b></>:null}. Ábrelo para activar tu cuenta y entrar — revisa también la carpeta de spam. <span style={{color:P.dim}}>¿Ya tenías una cuenta con este correo? No llegará un correo nuevo — simplemente inicia sesión (cada correo admite UNA cuenta; usa otro correo para un segundo rol).</span></>:<>We sent a confirmation link{em?<> to <b style={{color:P.text}}>{em}</b></>:null}. Open it to activate your account and sign in — check your spam folder too. <span style={{color:P.dim}}>Already had an account with this email? No new email will arrive — just sign in (each email supports ONE account; use a different email for a second role).</span></>}</p>}{mode==="signup"&&<div style={{marginBottom:16}}><label style={LBL}>{lang==="es"?"Tipo de cuenta":"Account type"}</label><div style={{display:"flex",gap:8}}>{[["client",lang==="es"?"Personal":"Personal",lang==="es"?"Mis finanzas":"My finances"],["advisor",lang==="es"?"Asesor":"Advisor",lang==="es"?"Gestiono clientes":"I manage clients"]].map(([v,tt,sub])=><button key={v} type="button" onClick={()=>setSignupRole(v)} style={{flex:1,textAlign:"left",padding:"10px 12px",borderRadius:11,cursor:"pointer",background:signupRole===v?P.gold+"1A":P.inp,border:"1px solid "+(signupRole===v?P.gold:P.border),color:P.text}}><div style={{fontSize:12.5,fontWeight:700}}>{tt}</div><div style={{fontSize:10.5,color:P.muted,marginTop:2}}>{sub}</div></button>)}</div></div>}
            {mode!=="setNew"&&<div style={{marginBottom:14}}>
              <label style={LBL}>{t.email||"Email"}</label>
              <input type="email" inputMode="email" value={em} onChange={ev=>setEm(ev.target.value)} style={INP_L} onKeyDown={ev=>ev.key==="Enter"&&!busy&&go()} autoComplete="email" placeholder="you@email.com"/>
            </div>}
            {mode!=="forgot"&&mode!=="verify"&&<div style={{marginBottom:(mode==="signup"||mode==="setNew")?16:18}}>
              <label style={LBL}>{mode==="setNew"?(t.newPassword||"New Password"):t.password||"Password"}</label>
              <div style={{position:"relative"}}>
                <input type={showPw?"text":"password"} value={pw} onChange={ev=>setPw(ev.target.value)} style={{...INP_L,paddingRight:62}} onKeyDown={ev=>ev.key==="Enter"&&!busy&&go()} autoComplete={(mode==="setNew"||mode==="signup")?"new-password":"current-password"} placeholder="••••••••"/>
                <button type="button" onClick={()=>setShowPw(v=>!v)} aria-label={showPw?(lang==="es"?"Ocultar contraseña":"Hide password"):(lang==="es"?"Mostrar contraseña":"Show password")} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:P.dim,cursor:"pointer",padding:"7px 9px",fontSize:9.5,fontFamily:MONO,fontWeight:600,letterSpacing:"0.1em"}}>{showPw?(lang==="es"?"OCULTAR":"HIDE"):(lang==="es"?"VER":"SHOW")}</button>
              </div>
              {(mode==="signup"||mode==="setNew")&&(()=>{const sc=pw.length===0?0:(pw.length>=12&&/[^A-Za-z0-9]/.test(pw)&&/[0-9]/.test(pw))?3:(pw.length>=8&&/[0-9]/.test(pw))?2:1;const labs=lang==="es"?["","Débil","Aceptable","Fuerte"]:["","Weak","Fair","Strong"];const cols=["","#E0795F","#E0A23A","#5BBF7B"];return<div style={{marginTop:10}}><div style={{display:"flex",gap:4}}>{[1,2,3].map(n=><div key={n} style={{flex:1,height:3,borderRadius:99,background:sc>=n?cols[sc]:P.border,transition:"background .2s"}}/>)}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:7}}><span style={{fontSize:9.5,color:P.dim,fontFamily:MONO,letterSpacing:"0.06em"}}>{lang==="es"?"Mín. 8 caracteres":"Min. 8 characters"}</span>{sc>0&&<span style={{fontSize:9.5,color:cols[sc],fontFamily:MONO,fontWeight:600,letterSpacing:"0.06em"}}>{labs[sc]}</span>}</div></div>;})()}
            </div>}
            {err&&<div role="alert" style={{fontSize:11,color:"#F2766B",marginBottom:12,padding:"9px 12px",background:"#F2766B18",border:"1px solid #F2766B44",borderRadius:9,lineHeight:1.5}}>{err}</div>}
            {info&&<div role="status" style={{fontSize:11,color:P.gold,marginBottom:12,padding:"9px 12px",background:`${P.gold}18`,border:`1px solid ${P.gold}44`,borderRadius:9,lineHeight:1.5}}>{info}</div>}
            <button onClick={go} disabled={busy} style={{width:"100%",padding:"13px 16px",minHeight:46,borderRadius:11,fontWeight:600,fontSize:13,cursor:busy?"wait":"pointer",background:P.gold,color:"#1A1208",border:"none",letterSpacing:"0.01em",opacity:busy?0.7:1,transition:"transform 150ms ease,filter 150ms ease"}}>{busy?"…":btnLabel}</button>
            {mode==="signin"&&<div style={{textAlign:"center",marginTop:15}}>
              <button onClick={()=>switchMode("forgot")} style={{background:"transparent",border:"none",color:P.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:"8px 12px",minHeight:40,borderBottom:`1px solid ${P.border}`}}>{t.forgotPassword||"Forgot password?"}</button>
            </div>}
            {mode==="forgot"&&<div style={{textAlign:"center",marginTop:15}}>
              <button onClick={()=>switchMode("signin")} style={{background:"transparent",border:"none",color:P.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:"8px 12px",minHeight:40}}>← {t.backToSignIn||"Back to Sign In"}</button>
            </div>}
            <div style={{marginTop:18,paddingTop:15,borderTop:`1px solid ${P.border}`,fontSize:11,color:P.dim,textAlign:"center"}}>{mode==="signup"?<>{lang==="es"?"¿Ya tienes cuenta? ":"Already have an account? "}<a onClick={()=>switchMode("signin")} style={{color:P.accent,fontWeight:600,textDecoration:"none",cursor:"pointer"}}>{lang==="es"?"Iniciar sesión":"Sign in"}</a></>:mode==="signin"?<>{lang==="es"?"¿Sin cuenta? ":"No account yet? "}<a onClick={()=>switchMode("signup")} style={{color:P.accent,fontWeight:600,textDecoration:"none",cursor:"pointer"}}>{lang==="es"?"Crear cuenta":"Create account"}</a></>:mode==="verify"?<>{lang==="es"?"¿Ya confirmaste? ":"Already confirmed? "}<a onClick={()=>switchMode("signin")} style={{color:P.accent,fontWeight:600,textDecoration:"none",cursor:"pointer"}}>{lang==="es"?"Iniciar sesión":"Sign in"}</a></>:null}</div>
          </div>
        </div>
      </section>

      <section style={{maxWidth:1240,margin:"0 auto",padding:"8px 40px 24px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>
        {FEATS.map((f,i)=><div key={i} style={{...glass,borderRadius:16,padding:22}}>
          <div style={{width:40,height:40,borderRadius:11,...glass,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>{fIcon(f.icon)}</div>
          <h3 style={{fontWeight:600,fontSize:15.5,color:P.text,margin:"0 0 8px",letterSpacing:"-0.01em"}}>{f.t}</h3>
          <p style={{fontSize:13,lineHeight:1.6,color:P.muted,margin:0}}>{f.b}</p>
        </div>)}
      </section>

      <footer style={{maxWidth:1240,margin:"6px auto 0",padding:"16px 40px 30px",borderTop:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div style={{fontSize:11.5,color:P.dim,lineHeight:1.6,maxWidth:640}}>{lang==="es"?"Asesoría financiera educativa — no constituye asesoría de inversión, fiscal, o legal.":"Educational financial coaching — not investment, tax, or legal advice."}</div>
        <div style={{display:"flex",gap:16,fontSize:9.5,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.13em"}}>
          <a href="mailto:mauricio@goldenanchor.life" style={{color:P.muted,textDecoration:"none"}}>Email</a>
          <a href="https://goldenanchor.life" target="_blank" rel="noreferrer" style={{color:P.muted,textDecoration:"none"}}>Site</a>
        </div>
      </footer>
    </div>
  </div>;
}

/* ── APP ─────────────────────────────────────────────────────────────────── */

// === DEPLOY MARKER — confirms this build is the latest ===

/* ── LogoImg — renders settings logo or brand asset (size-aware per HANDOFF Phase 1) ──
   v0.15.0: when no settings logo is uploaded, falls back to /anchor-monogram.svg at small
   sizes (≤48px — crisp at favicon/sidebar scale) and /logo-anchor.png at larger sizes
   (photographic anchor, looks right at hero/login scale). ⚓ emoji is the final fallback
   only if the asset itself fails to load. */

/* ── GoldenTides (v0.77) — the cinematic hero canvas, built from the owner's two
   Mux references (Lithos-style glowing dark terrain / immersive ambient scene):
   layered golden wave-ridgelines drifting slowly out of deep navy-black, ember
   particles rising, subtle mouse parallax. The anchor/ocean metaphor in brand gold.
   Reduced motion → one static frame. Pauses when the tab is hidden.             */
function GoldenTides({reducedMotion}){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;const ctx=c.getContext("2d");
    const DPR=Math.min(2,window.devicePixelRatio||1);
    let raf,running=true,t=Math.PI*0.7,mx=0,targetMx=0;
    const LAYERS=7;
    let layers=[];
    const resize=()=>{c.width=c.clientWidth*DPR;c.height=c.clientHeight*DPR;};
    const build=()=>{
      layers=[];
      for(let i=0;i<LAYERS;i++){
        const d=i/(LAYERS-1); // 0 = far, 1 = near
        layers.push({
          d,
          base:0.46+d*0.50,                 // ridge baseline (fraction of height)
          amp1:(18+34*d),amp2:(7+14*d),     // wave amplitudes (px @DPR=1)
          k1:(1.1+0.5*d),k2:(2.6+1.1*d),    // spatial frequencies
          p1:i*1.7+0.9,p2:i*2.9+0.2,        // phases
          s1:(0.05+0.05*d)*(i%2?1:-1),s2:(0.085+0.06*d), // drift speeds
          a:0.22+0.78*d,                    // line alpha by depth (near ridges burn brighter)
        });
      }
    };
    const emberN=26;
    let embers=[];
    const seedEmbers=()=>{embers=Array.from({length:emberN},(_,i)=>({x:(i*97%100)/100,y:0.45+((i*53%100)/100)*0.5,v:0.0007+((i*31%10)/10)*0.0012,r:(0.8+(i*7%10)/10*1.4),tw:i*0.7}));};
    const draw=()=>{
      const W=c.width,H=c.height;
      ctx.clearRect(0,0,W,H);
      // night sky: near-black with a faint gold horizon glow
      const sky=ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,"#06080C");sky.addColorStop(0.55,"#090B10");sky.addColorStop(1,"#0E0D0A");
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
      const glow=ctx.createRadialGradient(W*0.68,H*0.52,0,W*0.68,H*0.52,W*0.55);
      glow.addColorStop(0,"rgba(201,168,76,0.10)");glow.addColorStop(1,"rgba(201,168,76,0)");
      ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
      const STEP=Math.max(3,Math.round(6*DPR));
      for(const L of layers){
        const px=mx*14*DPR*(L.d-0.4); // parallax by depth
        const baseY=H*L.base;
        ctx.beginPath();
        for(let x=-20*DPR;x<=W+20*DPR;x+=STEP){
          const u=x/(W||1)*Math.PI*2;
          const y=baseY
            +Math.sin(u*L.k1+L.p1+t*L.s1)*L.amp1*DPR
            +Math.sin(u*L.k2+L.p2+t*L.s2)*L.amp2*DPR;
          x<=-20*DPR+STEP?ctx.moveTo(x+px,y):ctx.lineTo(x+px,y);
        }
        // occluding fill below the ridge (terrain layering like the reference)
        ctx.lineTo(W+20*DPR,H+20*DPR);ctx.lineTo(-20*DPR,H+20*DPR);ctx.closePath();
        const fill=ctx.createLinearGradient(0,baseY-40*DPR,0,H);
        fill.addColorStop(0,`rgba(13,12,8,${0.92})`);
        fill.addColorStop(0.25,`rgba(9,9,8,${0.97})`);
        fill.addColorStop(1,"#07080B");
        ctx.fillStyle=fill;ctx.fill();
        // the glowing gold ridgeline
        ctx.beginPath();
        for(let x=-20*DPR;x<=W+20*DPR;x+=STEP){
          const u=x/(W||1)*Math.PI*2;
          const y=baseY
            +Math.sin(u*L.k1+L.p1+t*L.s1)*L.amp1*DPR
            +Math.sin(u*L.k2+L.p2+t*L.s2)*L.amp2*DPR;
          x<=-20*DPR+STEP?ctx.moveTo(x+px,y):ctx.lineTo(x+px,y);
        }
        const lg=ctx.createLinearGradient(0,0,W,0);
        lg.addColorStop(0,`rgba(160,120,40,${L.a*0.55})`);
        lg.addColorStop(0.45,`rgba(235,200,120,${L.a})`);
        lg.addColorStop(0.75,`rgba(201,168,76,${L.a*0.8})`);
        lg.addColorStop(1,`rgba(140,100,35,${L.a*0.45})`);
        ctx.strokeStyle=lg;
        ctx.lineWidth=(0.8+2.0*L.d)*DPR;
        ctx.shadowColor="rgba(226,190,100,0.65)";
        ctx.shadowBlur=(8+16*L.d)*DPR;
        ctx.stroke();
        ctx.shadowBlur=0;
      }
      // rising embers
      for(const e of embers){
        const ex=e.x*W+Math.sin(t*0.6+e.tw)*8*DPR;
        const ey=e.y*H;
        const tw=0.35+0.65*Math.abs(Math.sin(t*0.9+e.tw));
        ctx.beginPath();ctx.arc(ex,ey,e.r*DPR,0,Math.PI*2);
        ctx.fillStyle=`rgba(235,205,130,${0.5*tw})`;
        ctx.shadowColor="rgba(235,205,130,0.8)";ctx.shadowBlur=6*DPR;
        ctx.fill();ctx.shadowBlur=0;
      }
    };
    const tick=()=>{
      if(!running)return;
      t+=0.016;
      mx+=(targetMx-mx)*0.04;
      for(const e of embers){e.y-=e.v;if(e.y<0.40)e.y=0.96;}
      draw();
      raf=requestAnimationFrame(tick);
    };
    const onMove=(ev)=>{const r=c.getBoundingClientRect();targetMx=((ev.clientX-r.left)/(r.width||1))*2-1;};
    const onVis=()=>{const hid=document.hidden;running=!hid&&!reducedMotion;if(running){cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}};
    const onR=()=>{resize();draw();};
    resize();build();seedEmbers();
    // first frame paints SYNCHRONOUSLY — rAF can be throttled (hidden/occluded tab)
    // and the hero must never flash blank.
    if(reducedMotion){t=4.2;draw();}
    else{draw();window.addEventListener("mousemove",onMove);document.addEventListener("visibilitychange",onVis);raf=requestAnimationFrame(tick);}
    window.addEventListener("resize",onR);
    return()=>{running=false;cancelAnimationFrame(raf);window.removeEventListener("resize",onR);window.removeEventListener("mousemove",onMove);document.removeEventListener("visibilitychange",onVis);};
  },[reducedMotion]);
  return <canvas ref={ref} aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>;
}

/* ── HeroVideo (v0.78) — full-screen looping background video with the owner's
   exact rAF fade system: 500ms fade-in on load/loop start, 500ms fade-out when
   0.55s remain, reset+replay on end; each new fade cancels the previous frame
   and resumes from current opacity. Falls back to GoldenTides if the video
   errors. /public/hero-bg.mp4 = "Golden Particles in Water" (Pexels 10296179,
   free license, commercial use, no attribution required).                      */
function HeroVideo({reducedMotion,onFail}){
  const ref=useRef(null);
  useEffect(()=>{
    const v=ref.current;if(!v)return;
    if(reducedMotion){v.pause();v.style.opacity=0.6;return;}
    let rafId=null;const fadingOutRef={current:false};
    const fadeTo=(target,ms)=>{
      if(rafId)cancelAnimationFrame(rafId);
      const from=parseFloat(v.style.opacity||"0");const t0=performance.now();
      const step=(now)=>{
        const k=Math.min(1,(now-t0)/ms);
        v.style.opacity=String(from+(target-from)*k);
        if(k<1)rafId=requestAnimationFrame(step);
      };
      rafId=requestAnimationFrame(step);
    };
    const onPlaying=()=>{fadingOutRef.current=false;fadeTo(0.6,500);};
    const onTime=()=>{
      if(fadingOutRef.current)return;
      if(v.duration&&v.duration-v.currentTime<=0.55){fadingOutRef.current=true;fadeTo(0,500);}
    };
    const onEnded=()=>{
      v.style.opacity="0";
      setTimeout(()=>{v.currentTime=0;const p=v.play();if(p&&p.catch)p.catch(()=>{});},100);
    };
    v.style.opacity="0";
    v.addEventListener("playing",onPlaying);
    v.addEventListener("timeupdate",onTime);
    v.addEventListener("ended",onEnded);
    const p=v.play();if(p&&p.catch)p.catch(()=>{});
    // resilience: if playback can't start (low-power mode, hidden tab), still show a
    // static frame rather than black — fade in once data exists.
    const still=setTimeout(()=>{if(parseFloat(v.style.opacity||"0")<0.05&&v.readyState>=2)fadeTo(0.6,500);},1600);
    return()=>{clearTimeout(still);if(rafId)cancelAnimationFrame(rafId);v.removeEventListener("playing",onPlaying);v.removeEventListener("timeupdate",onTime);v.removeEventListener("ended",onEnded);};
  },[reducedMotion]);
  return <video ref={ref} muted playsInline autoPlay preload="auto" onError={onFail} aria-hidden="true"
    src="/hero-bg.mp4"
    style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0}}/>;
}

/* ── GoldSmoke (v0.80) — A4 from the hero lab: 34 radial-gradient blobs drifting
   on a noise field, mouse-reactive gentle push, gold on near-black.             */
function GoldSmoke({reducedMotion,isDark}){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext("2d");
    const DPR=Math.min(2,window.devicePixelRatio||1);
    let raf=null,running=true,et=8;
    const mouse={x:-9999,y:-9999};
    /* seeded noise */
    const P8=new Uint8Array(512);
    (()=>{const p=[];let s=1234;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
      for(let i=0;i<256;i++)p[i]=i;
      for(let j=255;j>0;j--){const k=Math.floor(r()*(j+1));[p[j],p[k]]=[p[k],p[j]];}
      for(let m=0;m<512;m++)P8[m]=p[m&255];})();
    const n2=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
      const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
      const h=(a,b)=>P8[(P8[a&255]+(b&255))&255]/255;
      return h(xi,yi)+(h(xi+1,yi)-h(xi,yi))*u+(h(xi,yi+1)-h(xi,yi)+(h(xi+1,yi+1)-h(xi+1,yi)-h(xi,yi+1)+h(xi,yi))*u)*v;};
    /* blobs */
    const blobs=Array.from({length:34},()=>({ax:Math.random(),ay:Math.random(),n1:Math.random()*80,n2:Math.random()*80,r:60+Math.random()*60,ph:Math.random()*6.28,px:0,py:0}));
    const resize=()=>{c.width=c.clientWidth*DPR;c.height=c.clientHeight*DPR;};
    const draw=()=>{
      const W=c.width,H=c.height,dark=isDark!==false;
      ctx.fillStyle=dark?"#08090B":"#F8F7F2";ctx.fillRect(0,0,W,H);
      const rot=et*Math.PI*2/120;
      for(const b of blobs){
        const dxv=(n2(b.n1+et*0.05,b.n2)-0.5)*W*0.34;
        const dyv=(n2(b.n2+et*0.045,b.n1)-0.5)*H*0.42;
        const x=b.ax*W+dxv*Math.cos(rot)-dyv*Math.sin(rot)+b.px;
        const y=b.ay*H+dxv*Math.sin(rot)+dyv*Math.cos(rot)+b.py;
        const mdx=x-mouse.x,mdy=y-mouse.y,md=Math.hypot(mdx,mdy);
        if(md<200*DPR&&md>1){b.px+=(mdx/md)*0.35*DPR;b.py+=(mdy/md)*0.35*DPR;}
        b.px*=0.985;b.py*=0.985;
        const rad=b.r*DPR*(0.9+0.15*Math.sin(et*0.3+b.ph));
        const a=dark?0.058:0.052;
        const g=ctx.createRadialGradient(x,y,0,x,y,rad);
        g.addColorStop(0,dark?`rgba(214,180,100,${a})`:`rgba(160,120,40,${a})`);
        g.addColorStop(1,dark?"rgba(214,180,100,0)":"rgba(160,120,40,0)");
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();
      }
    };
    resize();draw();
    if(!reducedMotion){
      const loop=()=>{if(!running)return;et+=1/60;draw();raf=requestAnimationFrame(loop);};
      raf=requestAnimationFrame(loop);
    }
    const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(()=>{resize();draw();}):null;
    if(ro)ro.observe(c);
    c._smokePointer=(x,y)=>{mouse.x=x*DPR;mouse.y=y*DPR;};
    c._smokePointerOut=()=>{mouse.x=-9999;mouse.y=-9999;};
    return()=>{running=false;if(raf)cancelAnimationFrame(raf);if(ro)ro.disconnect();};
  },[isDark,reducedMotion]);
  return <canvas ref={ref} aria-hidden="true"
    style={{position:"absolute",inset:0,width:"100%",height:"100%"}}
    onPointerMove={e=>{const c=e.currentTarget;if(c._smokePointer)c._smokePointer(e.clientX,e.clientY);}}
    onPointerLeave={e=>{const c=e.currentTarget;if(c._smokePointerOut)c._smokePointerOut();}}/>;
}

/* ── GoldCube (v0.79) — the hero object, from the owner's Resend reference:
   a Rubik's-style cube of gold and dark-glass tiles tumbling slowly in space.
   Pure CSS 3D (no libs): 6 faces × 9 tiles, deterministic tile pattern so the
   look is stable. Reduced motion → static angle (CSS handles it).             */
function GoldCube({size=240}){
  const s=size;const half=s/2;
  // deterministic tile mix per face: g=gold, d=dark glass, h=glowing gold
  const PATTERNS=[
    ["g","d","d","d","h","g","d","g","d"],
    ["d","g","d","g","d","d","d","d","g"],
    ["d","d","g","d","g","d","h","d","d"],
    ["g","d","h","d","d","g","d","g","d"],
    ["d","h","d","g","d","d","g","d","g"],
    ["d","g","d","d","g","h","d","d","g"],
  ];
  const tileStyle=(k)=>k==="g"
    ?{background:"linear-gradient(145deg,#E8CC85 0%,#C9A84C 55%,#9C7B2C 100%)",boxShadow:"inset 0 1px 1px rgba(255,255,255,0.35)"}
    :k==="h"
    ?{background:"linear-gradient(145deg,#F5E0A6 0%,#E2C375 60%,#C9A84C 100%)",boxShadow:"0 0 18px rgba(226,195,117,0.55), inset 0 1px 1px rgba(255,255,255,0.5)"}
    :{background:"rgba(255,255,255,0.05)",backdropFilter:"blur(2px)",boxShadow:"inset 0 1px 1px rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.07)"};
  const faceTf=[`translateZ(${half}px)`,`rotateY(180deg) translateZ(${half}px)`,`rotateY(90deg) translateZ(${half}px)`,`rotateY(-90deg) translateZ(${half}px)`,`rotateX(90deg) translateZ(${half}px)`,`rotateX(-90deg) translateZ(${half}px)`];
  return <div className="ga-cube-wrap" style={{width:s,height:s,position:"relative"}} aria-hidden="true">
    <div className="ga-cube" style={{width:s,height:s,position:"relative"}}>
      {faceTf.map((tf,f)=><div key={f} style={{position:"absolute",inset:0,transform:tf,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gridTemplateRows:"1fr 1fr 1fr",gap:5,padding:5,boxSizing:"border-box",background:"rgba(5,6,8,0.92)",borderRadius:10,backfaceVisibility:"hidden"}}>
        {PATTERNS[f].map((k,i)=><div key={i} style={{borderRadius:5,...tileStyle(k)}}/>)}
      </div>)}
    </div>
    <div style={{position:"absolute",left:"50%",bottom:-s*0.42,transform:"translateX(-50%)",width:s*1.5,height:s*0.34,borderRadius:"50%",background:"radial-gradient(ellipse, rgba(201,168,76,0.18) 0%, rgba(0,0,0,0) 65%)",filter:"blur(8px)",pointerEvents:"none"}}/>
  </div>;
}

/* ── LandingPage — hero v0.79 (owner-picked direction: Resend's cube + Letter's
   luminous dark): near-black canvas, soft light from above, ONE object (the
   gold cube) and the minimal text stack. Video/canvas heroes from v0.77–78
   remain in this file for instant revert. Sections below follow the user's
   theme; compliance stays one quiet footer line (D-17).                       */
function LandingPage({lang,isDark,onToggle,onLangToggle,onSignIn,onPricing,onNav}){
  const reducedMotion=useReducedMotion();
  const es=lang==="es";
  const MONO="'JetBrains Mono',monospace";
  const P = isDark ? {
    bg:"#0A0C10", glowA:"rgba(203,168,90,0.12)", card:"rgba(255,255,255,0.045)", border:"rgba(255,255,255,0.09)",
    text:"#EDEFF2", muted:"#9AA3AF", dim:"#626B78", gold:"#CBA85A", accent:"#E2C375", inp:"rgba(255,255,255,0.05)",
    blur:"blur(16px)", shadow:"none", pos:"#34D399", neg:"#F87171",
  } : {
    bg:"#FAFAF7", glowA:"rgba(184,144,30,0.08)", card:"#FFFFFF", border:"#ECEAE3",
    text:"#16181C", muted:"#5A6270", dim:"#9AA0A8", gold:"#B8901E", accent:"#8A6B1E", inp:"#FFFFFF",
    blur:"blur(0px)", shadow:"0 1px 2px rgba(20,20,16,0.04), 0 12px 34px rgba(20,20,16,0.04)", pos:"#1F9D67", neg:"#DC5B5B",
  };
  const glass={background:P.card,border:`1px solid ${P.border}`,backdropFilter:P.blur,WebkitBackdropFilter:P.blur,boxShadow:P.shadow};
  const pill={fontSize:12,padding:"10px 15px",minHeight:42,minWidth:52,borderRadius:99,...glass,color:P.muted,cursor:"pointer",fontWeight:600,fontFamily:"inherit"};
  const goldBtn={display:"inline-block",fontSize:13.5,fontWeight:700,padding:"13px 26px",borderRadius:11,background:"linear-gradient(180deg,#EBD089 0%,#C9A84C 52%,#B58E1C 100%)",color:"#16120A",border:"none",cursor:"pointer",fontFamily:"inherit",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.32), 0 8px 22px rgba(201,168,76,0.25)",letterSpacing:"0.01em"};
  const ghostBtn={display:"inline-block",fontSize:13.5,fontWeight:600,padding:"13px 24px",borderRadius:11,background:"transparent",color:P.text,border:`1px solid ${P.border}`,cursor:"pointer",fontFamily:"inherit"};
  const eyebrow={fontSize:9.5,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.14em",color:P.gold};
  const h2={fontFamily:"'Newsreader',Georgia,serif",fontStyle:"italic",fontWeight:500,fontSize:"clamp(1.7rem,3.4vw,2.4rem)",color:P.text,lineHeight:1.12,letterSpacing:"-0.015em",margin:"10px 0 12px"};
  // scroll-reveal: tag sections data-reveal; observer adds the rise. Reduced motion → instant.
  const rootRef=useRef(null);
  useEffect(()=>{
    const root=rootRef.current;if(!root)return;
    const els=[...root.querySelectorAll("[data-reveal]")];
    if(reducedMotion||typeof IntersectionObserver==="undefined"){els.forEach(el=>{el.style.opacity=1;el.style.transform="none";});return;}
    els.forEach(el=>{el.style.opacity=0;el.style.transform="translateY(14px)";el.style.transition="opacity .5s cubic-bezier(.23,1,.32,1), transform .5s cubic-bezier(.23,1,.32,1)";});
    const io=new IntersectionObserver(entries=>{entries.forEach(en=>{if(en.isIntersecting){en.target.style.opacity=1;en.target.style.transform="none";io.unobserve(en.target);}});},{threshold:0.12});
    els.forEach(el=>io.observe(el));
    return()=>io.disconnect();
  },[lang,isDark,reducedMotion]);
  // sample product data (realistic, stable — not lorem)
  const trend=[{label:es?"Ene":"Jan",debt:24800,savings:6200},{label:"Feb",debt:24100,savings:7400},{label:"Mar",debt:23500,savings:8500},{label:"Abr"+(es?"":""),debt:22900,savings:9600},{label:"May",debt:22300,savings:10700},{label:"Jun",debt:21600,savings:11900}].map(x=>({...x,label:x.label}));
  const donutData=[{label:es?"Efectivo":"Cash",value:11900,color:P.gold},{label:es?"Retiro":"Retirement",value:38400,color:isDark?"#7FA7D9":"#4A6FA5"},{label:es?"Inversiones":"Investments",value:21200,color:P.pos},{label:es?"Bienes":"Property",value:14900,color:isDark?"#B59ADB":"#7E5FA8"}];
  const kpi=(label,val,delta,up)=><div style={{...glass,borderRadius:13,padding:"13px 15px",flex:1,minWidth:118}}>
    <div style={{fontSize:8.5,color:P.dim,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>{label}</div>
    <div style={{fontSize:19,fontWeight:600,color:P.text,fontFamily:MONO,letterSpacing:"-0.5px",fontVariantNumeric:"tabular-nums"}}>{val}</div>
    <div style={{display:"inline-block",marginTop:6,fontSize:9.5,fontWeight:700,fontFamily:MONO,padding:"2px 8px",borderRadius:99,background:(up?P.pos:P.neg)+"1A",color:up?P.pos:P.neg}}>{delta}</div>
  </div>;
  const steps=es?[
    {n:"01",t:"Crea tu cuenta gratis",b:"Dos minutos, sin tarjeta. Responde unas preguntas sencillas sobre tus metas."},
    {n:"02",t:"Mira tu panorama completo",b:"Ingresos, gastos, deudas y ahorros en un solo tablero — números claros, sin jerga."},
    {n:"03",t:"Avanza con o sin asesor",b:"Sigue tu plan por tu cuenta, o agrega un asesor bilingüe cuando lo necesites."},
  ]:[
    {n:"01",t:"Create your free account",b:"Two minutes, no card. Answer a few simple questions about your goals."},
    {n:"02",t:"See your complete picture",b:"Income, bills, debt, and savings on one dashboard — clear numbers, no jargon."},
    {n:"03",t:"Move forward, with or without an advisor",b:"Follow your plan on your own, or add a bilingual advisor whenever you need one."},
  ];
  const feats=es?[
    {t:"A dónde va cada dólar",b:"Flujo de efectivo en vivo: ingreso entrando, gastos, deuda y ahorro saliendo — de un vistazo."},
    {t:"Salud financiera, medida",b:"Razón de deuda, tasa de ahorro y fondo de emergencia como metas claras que puedes seguir."},
    {t:"Reportes de calidad profesional",b:"Reportes completos listos para revisar, comparar mes a mes, y compartir en PDF."},
    {t:"Calculadoras que usan TUS números",b:"Retiro, intereses, deudas, casa y auto — con tu información real, no ejemplos."},
    {t:"En tu idioma",b:"Todo en inglés y español — la app, los reportes y el asesor."},
    {t:"Recursos para cada situación",b:"Un directorio curado de ayuda real: programas, créditos justos y herramientas confiables."},
  ]:[
    {t:"Where every dollar goes",b:"Live cash flow: income in, bills, debt, and savings out — at a glance."},
    {t:"Financial health, scored",b:"Debt ratio, savings rate, and emergency fund as clear targets you can track."},
    {t:"Designer-grade reports",b:"Complete reports ready to review, compare month over month, and share as PDF."},
    {t:"Calculators that use YOUR numbers",b:"Retirement, interest, debt, home, and car — with your real information, not examples."},
    {t:"In your language",b:"Everything in English and Spanish — the app, the reports, and the advisor."},
    {t:"Resources for every situation",b:"A curated directory of real help: programs, fair credit, and trusted tools."},
  ];
  const plans=[
    {name:es?"Gratis":"Free",price:"$0",sub:es?"Perfil + calculadoras públicas + recursos":"Profile + public calculators + resources"},
    {name:"Premium",price:"$3+",sub:es?"Todo desbloqueado — paga lo que elijas":"Everything unlocked — choose what you pay",hot:true},
    {name:es?"Con asesor":"With an advisor",price:"$49+",sub:es?"Acompañamiento mensual bilingüe":"Bilingual monthly coaching"},
  ];
  // v0.78 — liquid-glass video hero state (video falls back to GoldenTides on error)
  const[videoOk,setVideoOk]=useState(true);
  const[heroEmail,setHeroEmail]=useState("");
  // v0.80.1 — default video; ?hero=smoke|cube|tides for comparison
  const heroMode=(()=>{try{const m=new URLSearchParams(window.location.search).get("hero");return["smoke","cube","tides"].includes(m)?m:"video";}catch(_e){return"video";}})();
  return <div ref={rootRef} style={{minHeight:"100vh",background:P.bg,color:P.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",position:"relative",overflowX:"hidden"}}>
    <div style={{position:"relative",zIndex:2}}>

      {/* ── CUBE HERO (v0.79 — Resend's object + Letter's luminous dark) ─────── */}
      <section style={{position:"relative",minHeight:"100vh",display:"flex",flexDirection:"column",background:"#08090B",overflow:"hidden"}}>
        {/* ?hero= comparison backgrounds (under the gradient overlays) */}
        {heroMode==="smoke"&&<GoldSmoke reducedMotion={reducedMotion} isDark={true}/>}
        {heroMode==="tides"&&<GoldenTides reducedMotion={reducedMotion}/>}
        {heroMode==="video"&&(videoOk
          ?<HeroVideo reducedMotion={reducedMotion} onFail={()=>setVideoOk(false)}/>
          :<GoldenTides reducedMotion={reducedMotion}/>)}
        {/* Letter-style "dark but light": soft warm light bleeding from above */}
        <div aria-hidden style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 120% 60% at 50% -12%, rgba(250,244,230,0.10) 0%, rgba(226,195,117,0.05) 38%, rgba(0,0,0,0) 70%)",pointerEvents:"none"}}/>
        {/* bottom melt — dark mode only (light mode has no fade) */}
        {isDark&&<div aria-hidden style={{position:"absolute",inset:0,background:"linear-gradient(0deg, #0A0C10 0%, rgba(8,9,11,0.4) 16%, rgba(8,9,11,0) 38%)",pointerEvents:"none"}}/>}

        {/* capsule glass nav */}
        <header style={{position:"relative",zIndex:4,padding:"22px 24px"}}>
          <div className="ga-liquid" style={{borderRadius:999,padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,maxWidth:1040,margin:"0 auto",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <img src="/anchor-monogram.svg" alt="" style={{width:22,height:22}}/>
              <span style={{fontWeight:600,fontSize:16,letterSpacing:"-0.01em",color:"#F2EFE6"}}>Golden Anchor</span>
            </div>
            <nav style={{display:"flex",alignItems:"center",gap:22,flexWrap:"wrap"}}>
              {onNav&&[["about",es?"Nosotros":"About"],["faq","Q&A"],["contact",es?"Contacto":"Contact"]].map(([id,l])=><button key={id} onClick={()=>onNav(id)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.8)",fontSize:13.5,fontWeight:500,fontFamily:"inherit",padding:"6px 2px"}} onMouseEnter={e=>e.currentTarget.style.color="#E2C375"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.8)"}>{l}</button>)}
              <button onClick={onPricing} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.8)",fontSize:13.5,fontWeight:500,fontFamily:"inherit",padding:"6px 2px"}} onMouseEnter={e=>e.currentTarget.style.color="#E2C375"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.8)"}>{es?"Precios":"Pricing"}</button>
            </nav>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <button onClick={onLangToggle} className="ga-liquid" style={{borderRadius:999,padding:"8px 14px",color:"rgba(255,255,255,0.85)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:"rgba(255,255,255,0.01)"}}>{es?"EN":"ES"}</button>
              <button onClick={onToggle} aria-label={es?"Cambiar tema":"Toggle theme"} className="ga-liquid" style={{borderRadius:999,padding:"8px 14px",color:"rgba(255,255,255,0.85)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:"rgba(255,255,255,0.01)"}}>{isDark?(es?"Claro":"Light"):(es?"Oscuro":"Dark")}</button>
              <button onClick={onSignIn} className="ga-liquid ga-press" style={{borderRadius:999,padding:"8px 20px",color:"#fff",fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:"rgba(255,255,255,0.01)"}}>{es?"Iniciar sesión":"Sign in"}</button>
            </div>
          </div>
        </header>

        {/* hero content — the cube, then the minimal stack (badge, headline,
            one line, one action). Nothing else on the first screen. */}
        <div style={{position:"relative",zIndex:4,flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 24px 7vh",textAlign:"center"}}>
          {heroMode==="cube"&&<div style={{marginBottom:58,marginTop:8}}><GoldCube size={Math.min(220,typeof window!=="undefined"?window.innerWidth*0.42:220)}/></div>}

          <div className="ga-liquid" style={{borderRadius:999,padding:"7px 16px",marginBottom:24,background:"rgba(255,255,255,0.01)"}}>
            <span style={{fontSize:10.5,fontWeight:600,color:"#E2C375",fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.16em"}}>{es?"Gratis para empezar":"Free to start"}</span>
          </div>
          <h1 style={{margin:"0 0 18px",fontFamily:"'Instrument Serif',serif",fontWeight:400,fontSize:"clamp(2.9rem,7.2vw,5.4rem)",lineHeight:1.04,letterSpacing:"-0.01em",color:"#F4F1E8",textShadow:"0 2px 50px rgba(0,0,0,0.5)"}}>
            {es?<><em style={{fontStyle:"italic"}}>Tu dinero,</em> claro por fin<span style={{color:"#C9A84C"}}>.</span></>
               :<><em style={{fontStyle:"italic"}}>Your money,</em> finally clear<span style={{color:"#C9A84C"}}>.</span></>}
          </h1>
          <p style={{fontSize:14.5,lineHeight:1.65,color:"rgba(255,255,255,0.72)",maxWidth:440,margin:"0 0 30px"}}>
            {es?"Mira a dónde va cada dólar — y el siguiente paso — con un asesor bilingüe cuando lo necesites.":"See where every dollar goes — and what to do next — with a bilingual advisor whenever you need one."}
          </p>
          <form onSubmit={e=>{e.preventDefault();try{sessionStorage.setItem("ga_signup_email",heroEmail.trim());}catch(_e){}onSignIn();}} style={{width:"100%",maxWidth:460}}>
            <div className="ga-liquid" style={{borderRadius:999,padding:"6px 6px 6px 22px",display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.01)"}}>
              <input value={heroEmail} onChange={e=>setHeroEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder={es?"Tu correo electrónico":"Enter your email"} style={{flex:1,minWidth:0,background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:14.5,fontFamily:"inherit"}}/>
              <button type="submit" className="ga-press" style={{flexShrink:0,borderRadius:999,border:"none",cursor:"pointer",background:"linear-gradient(180deg,#EBD089 0%,#C9A84C 52%,#B58E1C 100%)",color:"#16120A",padding:"12px 24px",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.32)",fontSize:13,fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>{es?"Empezar":"Get started"}</button>
            </div>
          </form>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:14}}>{es?"Sin tarjeta. Cancela cuando sea.":"No card required. Cancel anytime."}</div>
        </div>
      </section>

      {/* ── THE PRODUCT, staged (was the hero right column) ─────────────────── */}
      <section data-reveal style={{maxWidth:1240,margin:"0 auto",padding:"64px 40px 8px"}}>
        <div style={{textAlign:"center",maxWidth:560,margin:"0 auto 30px"}}>
          <div style={eyebrow}>{es?"Tu tablero":"Your dashboard"}</div>
          <h2 style={h2}>{es?"Todo tu panorama, en vivo.":"Your whole picture, live."}</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:13,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:13,minWidth:0}}>
            <div style={{display:"flex",gap:13,flexWrap:"wrap"}}>
              {kpi(es?"Patrimonio neto":"Net worth","$86,400","+4.2%",true)}
              {kpi(es?"Tasa de ahorro":"Savings rate","18%","+2pt",true)}
            </div>
            <div style={{display:"flex",gap:13,flexWrap:"wrap"}}>
              <div style={{...glass,borderRadius:16,padding:14,flex:1,minWidth:170,display:"flex",justifyContent:"center"}}>
                <Donut data={donutData} size={142} centerLabel={es?"Activos":"Assets"} centerValue="$86.4k" centerColor={P.text}/>
              </div>
              <div style={{...glass,borderRadius:16,padding:14,flex:1,minWidth:170,display:"flex",justifyContent:"center"}}>
                <RadialGauge value={11900} max={15000} label={es?"Ahorrado":"Saved"} subLabel={es?"meta 3 meses":"3-mo target"} color={P.pos} fmt={v=>"$"+Math.round(v/100)/10+"k"}/>
              </div>
            </div>
          </div>
          <div style={{...glass,borderRadius:16,padding:"16px 16px 8px",minWidth:0}}>
            <div style={{fontSize:8.5,color:P.dim,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>{es?"Deuda ↓ vs Ahorro ↑ — 6 meses":"Debt ↓ vs Savings ↑ — 6 months"}</div>
            <SmoothAreaLine data={trend} height={232} debtColor={P.neg} savingsColor={P.pos} legendDebt={es?"Deuda":"Debt"} legendSav={es?"Ahorro":"Savings"}/>
          </div>
        </div>
      </section>

      <section data-reveal style={{maxWidth:1240,margin:"0 auto",padding:"56px 40px 8px"}}>
        <div style={{textAlign:"center",maxWidth:560,margin:"0 auto 34px"}}>
          <div style={eyebrow}>{es?"Cómo funciona":"How it works"}</div>
          <h2 style={h2}>{es?"Tres pasos, cero jerga.":"Three steps, zero jargon."}</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16}}>
          {steps.map((s,i)=><div key={i} style={{...glass,borderRadius:16,padding:"22px 22px 20px"}}>
            <div style={{...eyebrow,color:P.dim,marginBottom:12}}>{s.n}</div>
            <h3 style={{fontWeight:600,fontSize:15.5,color:P.text,margin:"0 0 8px",letterSpacing:"-0.01em"}}>{s.t}</h3>
            <p style={{fontSize:13,lineHeight:1.6,color:P.muted,margin:0}}>{s.b}</p>
          </div>)}
        </div>
      </section>

      <section data-reveal style={{maxWidth:1240,margin:"0 auto",padding:"56px 40px 8px"}}>
        <div style={{textAlign:"center",maxWidth:560,margin:"0 auto 34px"}}>
          <div style={eyebrow}>{es?"Lo que obtienes":"What you get"}</div>
          <h2 style={h2}>{es?"Hecho para familias reales.":"Built for real families."}</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
          {feats.map((f,i)=><div key={i} style={{padding:"20px 22px",borderTop:`1px solid ${P.border}`}}>
            <h3 style={{fontWeight:600,fontSize:15,color:P.text,margin:"0 0 7px",letterSpacing:"-0.01em"}}>{f.t}</h3>
            <p style={{fontSize:13,lineHeight:1.6,color:P.muted,margin:0}}>{f.b}</p>
          </div>)}
        </div>
      </section>

      <section data-reveal style={{maxWidth:1240,margin:"0 auto",padding:"56px 40px 8px"}}>
        <div style={{...glass,borderRadius:20,padding:"clamp(24px,4vw,44px)",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:28,alignItems:"center"}}>
          <div>
            <div style={eyebrow}>{es?"Tú decides":"Your call"}</div>
            <h2 style={h2}>{es?"Con asesor, o por tu cuenta.":"With an advisor, or on your own."}</h2>
            <p style={{fontSize:13.5,lineHeight:1.65,color:P.muted,margin:0,maxWidth:440}}>
              {es?"La app completa funciona sin asesor. Y cuando quieras una mano — para entender tus números, armar un plan, o revisar tu seguro — un asesor bilingüe está a un clic, desde una consulta gratis.":"The full app works without an advisor. And when you want a hand — understanding your numbers, building a plan, or reviewing your insurance — a bilingual advisor is one click away, starting with a free consult."}
            </p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {plans.map((p,i)=><button key={i} className="ga-press" onClick={onPricing} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"14px 18px",borderRadius:13,background:P.inp,border:`1px solid ${p.hot?P.gold+"88":P.border}`,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
              <span><span style={{display:"block",fontSize:13.5,fontWeight:700,color:P.text}}>{p.name}</span><span style={{display:"block",fontSize:11,color:P.muted,marginTop:2}}>{p.sub}</span></span>
              <span style={{fontSize:16,fontWeight:600,color:p.hot?P.gold:P.text,fontFamily:MONO,letterSpacing:"-0.02em",flexShrink:0}}>{p.price}</span>
            </button>)}
          </div>
        </div>
      </section>

      <section data-reveal style={{maxWidth:1240,margin:"0 auto",padding:"64px 40px 70px",textAlign:"center"}}>
        <h2 style={{...h2,fontSize:"clamp(1.9rem,4vw,2.8rem)"}}>{es?"Empieza hoy. Es gratis.":"Start today. It's free."}</h2>
        <p style={{fontSize:14,color:P.muted,margin:"0 0 24px"}}>{es?"Dos minutos para crear tu cuenta. Sin tarjeta, sin compromiso.":"Two minutes to create your account. No card, no commitment."}</p>
        <button className="ga-press" onClick={onSignIn} style={{...goldBtn,fontSize:14.5,padding:"15px 34px"}}>{es?"Crear mi cuenta gratis":"Create my free account"}</button>
      </section>

      <footer style={{maxWidth:1240,margin:"0 auto",padding:"18px 40px 32px",borderTop:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div style={{fontSize:11,color:P.dim,lineHeight:1.6,maxWidth:640}}>© Golden Anchor · {es?"Asesoría financiera educativa — no constituye asesoría de inversión, fiscal o legal.":"Educational financial coaching — not investment, tax, or legal advice."}</div>
        <div style={{display:"flex",gap:16,fontSize:9.5,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.13em",flexWrap:"wrap"}}>
          {[["about",es?"Nosotros":"About"],["pricing",es?"Precios":"Pricing"],["faq","Q&A"],["contact",es?"Contacto":"Contact"]].map(([id,l])=><button key={id} onClick={()=>id==="pricing"?onPricing():(onNav&&onNav(id))} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontFamily:"inherit",fontSize:"inherit",letterSpacing:"inherit",textTransform:"inherit",padding:0}}>{l}</button>)}
        </div>
      </footer>
    </div>
  </div>;
}

export { HeroVisual, LOTTIE_HERO_URL, Login, LandingPage };
