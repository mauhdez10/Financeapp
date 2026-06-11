// Extracted from App.jsx in Phase 2a of docs/ARCHITECTURE-PLAN.md (D-37, 2026-06-10).
// Code is verbatim from the single-file era; comments may reference old App.jsx line numbers.
import { useState, useEffect, useRef } from "react";
import { Anchor } from "lucide-react";
import { useReducedMotion } from "../hooks/anim";
import { supabase } from "../services/supabase";

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

function Login({onLogin,t,isDark,onToggle,lang,onLangToggle,onShowPricing}){
  const reducedMotion=useReducedMotion();
  const[em,setEm]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");const[busy,setBusy]=useState(false);const[mode,setMode]=useState("signin");const[info,setInfo]=useState("");const[showPw,setShowPw]=useState(false);const[signupRole,setSignupRole]=useState("client");
  // Detect Supabase password-recovery callback (URL hash contains type=recovery)
  useEffect(()=>{if(typeof window==="undefined")return;const h=window.location.hash||"";if(h.includes("type=recovery")){setMode("setNew");setInfo(t.resetSetNewIntro||"Enter your new password below.");}},[]);
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
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:34,height:34,borderRadius:10,...glass,display:"flex",alignItems:"center",justifyContent:"center"}}><img src="/anchor-monogram.svg" alt="" style={{width:20,height:20}}/></div>
          <div>
            <div style={{fontWeight:700,fontSize:15,letterSpacing:"-0.01em",color:P.text,lineHeight:1}}>Golden Anchor</div>
            <div style={{fontSize:8,color:P.dim,marginTop:3,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.14em"}}>{lang==="es"?"Asesoría Financiera":"Financial Advisory"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onShowPricing&&<button onClick={onShowPricing} style={pillTog}>{lang==="es"?"Precios":"Pricing"}</button>}{onLangToggle&&<button onClick={onLangToggle} aria-label="Toggle language" style={pillTog}>{lang==="es"?"EN":"ES"}</button>}
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
            {mode==="signup"&&<p style={{fontSize:12,color:P.muted,margin:"-6px 0 18px",lineHeight:1.55}}>{lang==="es"?"Empieza gratis. Acceso inmediato a tu tablero, sin tarjeta.":"Start free. Instant access to your dashboard, no card required."}</p>}
            {mode==="verify"&&<p style={{fontSize:12.5,color:P.muted,margin:"-6px 0 18px",lineHeight:1.6}}>{lang==="es"?<>Te enviamos un enlace de confirmación{em?<> a <b style={{color:P.text}}>{em}</b></>:null}. Ábrelo para activar tu cuenta y entrar — revisa también la carpeta de spam.</>:<>We sent a confirmation link{em?<> to <b style={{color:P.text}}>{em}</b></>:null}. Open it to activate your account and sign in — check your spam folder too.</>}</p>}{mode==="signup"&&<div style={{marginBottom:16}}><label style={LBL}>{lang==="es"?"Tipo de cuenta":"Account type"}</label><div style={{display:"flex",gap:8}}>{[["client",lang==="es"?"Personal":"Personal",lang==="es"?"Mis finanzas":"My finances"],["advisor",lang==="es"?"Asesor":"Advisor",lang==="es"?"Gestiono clientes":"I manage clients"]].map(([v,tt,sub])=><button key={v} type="button" onClick={()=>setSignupRole(v)} style={{flex:1,textAlign:"left",padding:"10px 12px",borderRadius:11,cursor:"pointer",background:signupRole===v?P.gold+"1A":P.inp,border:"1px solid "+(signupRole===v?P.gold:P.border),color:P.text}}><div style={{fontSize:12.5,fontWeight:700}}>{tt}</div><div style={{fontSize:10.5,color:P.muted,marginTop:2}}>{sub}</div></button>)}</div></div>}
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

export { HeroVisual, LOTTIE_HERO_URL, Login };
