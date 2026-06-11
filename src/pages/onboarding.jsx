// OnboardingWizard — first-login welcome flow for client accounts (MD-D, v0.73).
// Shown once (gated on client.onboardedAt in App). 4 steps: welcome/name → goals →
// insurance interest (owner-specified health + car checkboxes) → done.
// Bilingual inline (Login/PublicIntake precedent). Honors reduced motion.
import { useState } from "react";
import { Home, ShieldCheck, PiggyBank, GraduationCap, Plane, TrendingUp, CreditCard, HeartPulse, Car, Check } from "lucide-react";
import { GOLD } from "../styles/theme";
import { useReducedMotion } from "../hooks/anim";

const GOAL_OPTS=[
  {id:"own-home",icon:Home,en:"Own a home",es:"Comprar casa"},
  {id:"payoff-debt",icon:CreditCard,en:"Pay off debt",es:"Pagar deudas"},
  {id:"emergency-fund",icon:ShieldCheck,en:"Emergency fund",es:"Fondo de emergencia"},
  {id:"retirement",icon:PiggyBank,en:"Save for retirement",es:"Ahorrar para el retiro"},
  {id:"education",icon:GraduationCap,en:"Kids' education",es:"Educación de los hijos"},
  {id:"travel",icon:Plane,en:"Travel more",es:"Viajar más"},
  {id:"grow-savings",icon:TrendingUp,en:"Grow my savings",es:"Crecer mis ahorros"},
];

function OnboardingWizard({client,lang,theme,onComplete}){
  const th=theme;const es=lang==="es";const rm=useReducedMotion();
  const[step,setStep]=useState(0);
  const[first,setFirst]=useState(client.firstName||"");
  const[last,setLast]=useState(client.lastName||"");
  const[goals,setGoals]=useState([]);
  const[goalNote,setGoalNote]=useState("");
  const[insHealth,setInsHealth]=useState(false);
  const[insCar,setInsCar]=useState(false);
  const[busy,setBusy]=useState(false);
  const MONO="'JetBrains Mono',monospace";
  const INP={background:th.inp,border:"1px solid "+th.cardBorder,color:th.text,borderRadius:10,padding:"12px 13px",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"};
  const LBL={fontSize:9.5,color:th.dim,display:"block",marginBottom:7,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.13em"};
  const finish=async(skipped)=>{
    if(busy)return;setBusy(true);
    const composedGoals=(goals.length||goalNote.trim())?[goals.map(id=>{const g=GOAL_OPTS.find(x=>x.id===id);return g?(es?g.es:g.en):id;}).join(", "),goalNote.trim()].filter(Boolean).join(" — "):"";
    const prevNotes=(client.notes&&typeof client.notes==="object")?client.notes:{};
    const patch={...client,firstName:first.trim()||client.firstName||"",lastName:last.trim()||client.lastName||"",
      notes:composedGoals?{...prevNotes,goals:prevNotes.goals?prevNotes.goals+"\n"+composedGoals:composedGoals}:prevNotes,
      insuranceInterests:{health:insHealth,car:insCar},
      onboardedAt:new Date().toISOString().slice(0,10),...(skipped?{onboardingSkipped:true}:{})};
    try{await onComplete(patch,{health:insHealth,car:insCar,skipped:!!skipped});}finally{setBusy(false);}
  };
  const canNext=step!==0||!!(first.trim());
  const steps=4;
  const Dot=({i})=><span style={{width:i===step?22:7,height:7,borderRadius:99,background:i<=step?th.accent:th.cardBorder,transition:rm?"none":"all .25s cubic-bezier(.23,1,.32,1)",display:"inline-block"}}/>;
  const chip=(on)=>({display:"flex",alignItems:"center",gap:9,padding:"11px 14px",borderRadius:11,cursor:"pointer",userSelect:"none",
    background:on?th.accent+"1A":th.inp,border:"1px solid "+(on?th.accent:th.cardBorder),color:th.text,fontSize:13,fontWeight:600,transition:rm?"none":"border-color .15s,background .15s"});
  const checkCard=(on)=>({display:"flex",gap:13,alignItems:"flex-start",padding:"15px 16px",borderRadius:13,cursor:"pointer",userSelect:"none",
    background:on?th.accent+"14":th.inp,border:"1px solid "+(on?th.accent:th.cardBorder),transition:rm?"none":"border-color .15s,background .15s"});
  const Box=({on})=><span style={{width:21,height:21,borderRadius:6,flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",background:on?th.accent:"transparent",border:"1px solid "+(on?th.accent:th.dim)}}>{on&&<Check size={14} strokeWidth={3} color="#1A1405"/>}</span>;
  return <div style={{position:"fixed",inset:0,zIndex:9999,background:th.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"18px 14px",overflowY:"auto",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
    <div style={{width:"100%",maxWidth:560,background:th.card,border:"1px solid "+th.cardBorder,borderRadius:18,padding:"26px 26px 22px",boxShadow:"0 24px 70px rgba(0,0,0,0.35)",position:"relative"}} className={rm?undefined:"ga-rise"}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>{Array.from({length:steps},(_,i)=><Dot key={i} i={i}/>)}</div>
        <button onClick={()=>finish(true)} disabled={busy} style={{background:"transparent",border:"none",color:th.dim,fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:"6px 8px"}}>{es?"Saltar por ahora":"Skip for now"}</button>
      </div>

      {step===0&&<div>
        <div style={{fontSize:9.5,color:th.accent,fontWeight:500,fontFamily:MONO,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:12}}>{es?"Bienvenido a Golden Anchor":"Welcome to Golden Anchor"}</div>
        <h2 style={{fontSize:23,fontWeight:600,color:th.text,letterSpacing:"-0.02em",margin:"0 0 8px",lineHeight:1.2}}>{es?"Empecemos con lo básico.":"Let's start with the basics."}</h2>
        <p style={{fontSize:13,color:th.muted,lineHeight:1.6,margin:"0 0 20px"}}>{es?"Tu cuenta es gratis. Esto toma menos de un minuto y puedes cambiarlo después en Configuración.":"Your account is free. This takes under a minute and you can change it later in Settings."}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><label style={LBL}>{es?"Nombre":"First name"}</label><input value={first} onChange={e=>setFirst(e.target.value)} style={INP} autoFocus placeholder={es?"María":"Maria"}/></div>
          <div><label style={LBL}>{es?"Apellido":"Last name"}</label><input value={last} onChange={e=>setLast(e.target.value)} style={INP} placeholder={es?"García":"Garcia"}/></div>
        </div>
      </div>}

      {step===1&&<div>
        <h2 style={{fontSize:21,fontWeight:600,color:th.text,letterSpacing:"-0.02em",margin:"0 0 8px",lineHeight:1.25}}>{es?"¿Qué quieres lograr?":"What do you want to achieve?"}</h2>
        <p style={{fontSize:13,color:th.muted,lineHeight:1.6,margin:"0 0 18px"}}>{es?"Elige todas las que apliquen — esto nos ayuda a guiarte.":"Pick all that apply — this helps us guide you."}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:9,marginBottom:16}}>
          {GOAL_OPTS.map(g=>{const on=goals.includes(g.id);const I=g.icon;return<button key={g.id} type="button" onClick={()=>setGoals(p=>on?p.filter(x=>x!==g.id):[...p,g.id])} style={chip(on)}><I size={15} strokeWidth={1.8} color={on?th.accent:th.dim}/>{es?g.es:g.en}</button>;})}
        </div>
        <label style={LBL}>{es?"Algo más en mente? (opcional)":"Anything else on your mind? (optional)"}</label>
        <input value={goalNote} onChange={e=>setGoalNote(e.target.value)} style={INP} placeholder={es?"Ej.: salir de un préstamo de auto caro":"E.g., get out of an expensive car loan"}/>
      </div>}

      {step===2&&<div>
        <h2 style={{fontSize:21,fontWeight:600,color:th.text,letterSpacing:"-0.02em",margin:"0 0 8px",lineHeight:1.25}}>{es?"¿Te interesa alguno de estos?":"Interested in either of these?"}</h2>
        <p style={{fontSize:13,color:th.muted,lineHeight:1.6,margin:"0 0 18px"}}>{es?"Opcional, sin compromiso. Un asesor con licencia te contactará.":"Optional, no obligation. A licensed advisor will reach out."}</p>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <div onClick={()=>setInsHealth(v=>!v)} style={checkCard(insHealth)}>
            <Box on={insHealth}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13.5,fontWeight:700,color:th.text}}><HeartPulse size={16} strokeWidth={1.8} color={th.accent}/>{es?"Consulta GRATIS de seguro de salud":"FREE health-insurance consultation"}</div>
              <div style={{fontSize:12,color:th.muted,lineHeight:1.5,marginTop:4}}>{es?"Revisamos tus opciones de seguro de salud, vida y suplementario — la primera consulta es gratis.":"We review your health, life, and supplemental insurance options — the first consult is free."}</div>
            </div>
          </div>
          <div onClick={()=>setInsCar(v=>!v)} style={checkCard(insCar)}>
            <Box on={insCar}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13.5,fontWeight:700,color:th.text}}><Car size={16} strokeWidth={1.8} color={th.accent}/>{es?"Seguro de auto":"Car insurance"}</div>
              <div style={{fontSize:12,color:th.muted,lineHeight:1.5,marginTop:4}}>{es?"Ayuda para revisar o cotizar tu seguro de auto.":"Help reviewing or quoting your car insurance."}</div>
            </div>
          </div>
        </div>
      </div>}

      {step===3&&<div style={{textAlign:"center",padding:"8px 0 4px"}}>
        <div style={{width:54,height:54,borderRadius:16,margin:"0 auto 16px",background:th.accent+"14",border:"1px solid "+th.accent+"33",display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={26} strokeWidth={2.2} color={th.accent}/></div>
        <h2 style={{fontSize:22,fontWeight:600,color:th.text,letterSpacing:"-0.02em",margin:"0 0 8px"}}>{es?`Listo${first?", "+first.trim():""}.`:`You're set${first?", "+first.trim():""}.`}</h2>
        <p style={{fontSize:13,color:th.muted,lineHeight:1.65,margin:"0 auto 6px",maxWidth:400}}>{es?"Explora tu panel: calculadoras, recursos y tu perfil financiero. Todo lo de hoy es gratis — y cuando quieras más, ahí estaremos.":"Explore your dashboard: calculators, resources, and your financial profile. Everything here today is free — and when you want more, we'll be here."}</p>
        {(insHealth||insCar)&&<p style={{fontSize:12,color:th.accent,lineHeight:1.5,margin:"10px auto 0",maxWidth:400}}>{es?"Te contactaremos pronto sobre tu consulta de seguros.":"We'll reach out soon about your insurance consult."}</p>}
      </div>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:26}}>
        <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0||busy} style={{background:"transparent",border:"1px solid "+th.cardBorder,color:step===0?th.dim:th.muted,fontSize:12.5,fontWeight:600,borderRadius:10,padding:"11px 18px",cursor:step===0?"default":"pointer",opacity:step===0?0.4:1,fontFamily:"inherit"}}>{es?"Atrás":"Back"}</button>
        {step<steps-1
          ?<button className="ga-press" onClick={()=>canNext&&setStep(s=>s+1)} disabled={!canNext||busy} style={{background:"linear-gradient(180deg,#EBD089 0%,#C9A84C 52%,#B58E1C 100%)",color:"#1A1405",border:"none",fontSize:13,fontWeight:700,borderRadius:10,padding:"11px 26px",cursor:canNext?"pointer":"not-allowed",opacity:canNext?1:0.55,fontFamily:"inherit",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.32)"}}>{es?"Siguiente":"Next"}</button>
          :<button className="ga-press" onClick={()=>finish(false)} disabled={busy} style={{background:"linear-gradient(180deg,#EBD089 0%,#C9A84C 52%,#B58E1C 100%)",color:"#1A1405",border:"none",fontSize:13,fontWeight:700,borderRadius:10,padding:"11px 26px",cursor:busy?"wait":"pointer",opacity:busy?0.7:1,fontFamily:"inherit",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.32)"}}>{busy?"…":(es?"Ir a mi panel":"Go to my dashboard")}</button>}
      </div>
    </div>
  </div>;
}

export { OnboardingWizard, GOAL_OPTS };
